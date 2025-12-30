import { Router } from 'express';
import { authenticate, requireRole, AuthenticatedRequest } from '../middleware/auth';
import { requireBusinessOwner } from '../middleware/roleGuard';
import { sendSuccess, sendError, sendCreated, sendNoContent } from '../utils/responses';
import * as businessService from '../services/businessService';
import * as mediaService from '../services/mediaService';
import * as verificationService from '../services/verificationService';
import * as userService from '../services/userService';
import { 
  isValidBusinessName, 
  isValidCoordinates, 
  isValidEmail,
  isValidPhoneNumber,
  validateFile,
  FileValidationPresets,
} from '../utils/validators';
import multer from 'multer';
import { getPool } from '../config/database';

const router = Router();

// Configure multer for photo uploads
const upload = multer({ 
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB per file
    files: 3, // Max 3 photos
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'));
    }
  }
});

// All routes require authentication as supplier
router.use(authenticate);
router.use(requireRole('supplier', 'admin'));

/**
 * GET /api/v1/supplier/businesses
 * Get supplier's businesses with logo URLs
 */
router.get('/businesses', async (req: AuthenticatedRequest, res) => {
  try {
    const businesses = await userService.getUserBusinesses(req.user!.id);
    
    // Fetch logo URLs for all businesses
    const businessesWithLogos = await Promise.all(
      businesses.map(async (business: any) => {
        const media = await mediaService.getBusinessMedia(business.id);
        const logo = media.find((m: any) => m.media_type === 'logo');
        return {
          ...business,
          logo_url: logo ? await mediaService.generateDownloadUrl(logo.storage_path) : null,
        };
      })
    );
    
    sendSuccess(res, { businesses: businessesWithLogos });
  } catch (error) {
    console.error("Publish error:", error);
    console.error("Publish error:", error);
    console.error('Error fetching businesses:', error);
    sendError(res, 'Failed to fetch businesses', 500);
  }
});

/**
 * POST /api/v1/supplier/businesses
 * Create new business with category, hours, social media, photos, and logo
 * FIXED: Now handles both logo and photos separately
 */
router.post('/businesses', upload.fields([
  { name: 'logo', maxCount: 1 },
  { name: 'photos', maxCount: 3 }
]), async (req: AuthenticatedRequest, res) => {
  try {
    console.log('📦 Received registration data:', {
      name: req.body.name,
      city: req.body.city,
      latitude: req.body.latitude,
      longitude: req.body.longitude,
      category: req.body.category,
      hasLogo: !!(req.files as any)?.logo,
      hasPhotos: !!(req.files as any)?.photos,
    });
    
    const {
      name, tagline, description, category,
      email, phone_number, whatsapp_number, website_url,
      facebook_url, instagram_url, twitter_url, linkedin_url, tiktok_url,
      latitude, longitude, address_line1, address_line2,
      city, province_state, postal_code, country,
      business_hours, year_established, employee_count_range,
    } = req.body;
    
    // Validate required fields
    if (!name || !isValidBusinessName(name)) {
      console.log('❌ Validation failed: Business name');
      sendError(res, 'Valid business name is required (2-255 characters)', 400);
      return;
    }
    
    if (!city) {
      console.log('❌ Validation failed: City missing');
      sendError(res, 'City is required', 400);
      return;
    }
    
    if (!latitude || !longitude || !isValidCoordinates(parseFloat(latitude), parseFloat(longitude))) {
      console.log('❌ Validation failed: Coordinates', { latitude, longitude });
      sendError(res, 'Valid coordinates are required', 400);
      return;
    }
    
    // Validate optional email
    if (email && !isValidEmail(email)) {
      sendError(res, 'Invalid email format', 400);
      return;
    }
    
    // Validate optional phone
    if (phone_number && !isValidPhoneNumber(phone_number)) {
      sendError(res, 'Invalid phone number format', 400);
      return;
    }
    
    const pool = getPool();
    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');
      
      // 1. Create business (social media URLs go into businesses table)
      const business = await businessService.createBusiness({
        owner_id: req.user!.id,
        name,
        tagline,
        description,
        email,
        phone_number,
        whatsapp_number,
        website_url,
        facebook_url,
        instagram_url,
        twitter_url,
        linkedin_url,
        tiktok_url,
        latitude: parseFloat(latitude),
        longitude: parseFloat(longitude),
        address_line1,
        address_line2,
        city,
        province_state,
        postal_code,
        country,
        year_established: year_established ? parseInt(year_established) : undefined,
        employee_count_range,
      });
      
      // 2. Add category to business_categories table
      if (category) {
        await client.query(
          `INSERT INTO business_categories (business_id, category_name) VALUES ($1, $2)`,
          [business.id, category]
        );
      }
      
      // 3. Add business hours to business_hours table
      if (business_hours) {
        const hours = typeof business_hours === 'string' ? JSON.parse(business_hours) : business_hours;
        const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
        
        for (const day of days) {
          if (hours[day]) {
            await client.query(
              `INSERT INTO business_hours (business_id, day_of_week, opens_at, closes_at, is_closed)
               VALUES ($1, $2, $3, $4, $5)`,
              [
                business.id,
                day,
                hours[day].closed ? null : hours[day].open,
                hours[day].closed ? null : hours[day].close,
                hours[day].closed || false,
              ]
            );
          }
        }
      }
      
      // 4. Upload logo if provided
      const filesObject = req.files as { [fieldname: string]: Express.Multer.File[] };
      
      if (filesObject && filesObject.logo && filesObject.logo.length > 0) {
        const logoFile = filesObject.logo[0];
        console.log(`📷 Uploading logo: ${logoFile.originalname} (${logoFile.size} bytes)`);
        
        // Generate upload URL and upload to Cloud Storage
        const { uploadUrl, storagePath } = await mediaService.generateUploadUrl(
          business.id,
          logoFile.originalname,
          logoFile.mimetype,
          'logo'
        );
        
        console.log(`Generated logo storage path: ${storagePath}`);
        
        // Upload file to Cloud Storage using the signed URL
        const uploadResponse = await fetch(uploadUrl, {
          method: 'PUT',
          headers: {
            'Content-Type': logoFile.mimetype,
          },
          body: logoFile.buffer,
        });
        
        console.log(`Logo upload response status: ${uploadResponse.status}`);
        
        if (!uploadResponse.ok) {
          const errorText = await uploadResponse.text();
          console.error(`Logo upload failed:`, errorText);
          throw new Error(`Failed to upload logo: ${uploadResponse.status} - ${errorText}`);
        }
        
        console.log(`✅ Logo uploaded to Cloud Storage`);
        
        // Save media record
        await mediaService.saveMediaRecord({
          business_id: business.id,
          media_type: 'logo',
          storage_path: storagePath,
          file_name: logoFile.originalname,
          file_size_bytes: logoFile.size,
          mime_type: logoFile.mimetype,
          display_order: 0,
        });
        
        console.log(`✅ Logo record saved to database`);
      }
      
      // 5. Upload photos to business_media table
      if (filesObject && filesObject.photos && filesObject.photos.length > 0) {
        const photoFiles = filesObject.photos;
        console.log(`📸 Processing ${photoFiles.length} photo(s)`);
        
        for (let i = 0; i < Math.min(photoFiles.length, 3); i++) {
          const file = photoFiles[i];
          console.log(`Uploading photo ${i + 1}: ${file.originalname} (${file.size} bytes)`);
          
          // Generate upload URL and upload to Cloud Storage
          const { uploadUrl, storagePath } = await mediaService.generateUploadUrl(
            business.id,
            file.originalname,
            file.mimetype,
            'photo'
          );
          
          console.log(`Generated storage path: ${storagePath}`);
          
          // Upload file to Cloud Storage using the signed URL
          const uploadResponse = await fetch(uploadUrl, {
            method: 'PUT',
            headers: {
              'Content-Type': file.mimetype,
            },
            body: file.buffer,
          });
          
          console.log(`Upload response status: ${uploadResponse.status}`);
          
          if (!uploadResponse.ok) {
            const errorText = await uploadResponse.text();
            console.error(`Upload failed for photo ${i + 1}:`, errorText);
            throw new Error(`Failed to upload photo ${i + 1}: ${uploadResponse.status} - ${errorText}`);
          }
          
          console.log(`✅ Photo ${i + 1} uploaded to Cloud Storage`);
          
          // Save media record
          await mediaService.saveMediaRecord({
            business_id: business.id,
            media_type: 'photo',
            storage_path: storagePath,
            file_name: file.originalname,
            file_size_bytes: file.size,
            mime_type: file.mimetype,
            display_order: i,
          });
          
          console.log(`✅ Photo ${i + 1} record saved to database`);
        }
      }
      
      await client.query('COMMIT');
      
      sendCreated(res, business, 'Business created successfully');
    } catch (error) {
    console.error("Publish error:", error);
    console.error("Publish error:", error);
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error("Publish error:", error);
    console.error("Publish error:", error);
    console.error('Create business error:', error);
    sendError(res, error instanceof Error ? error.message : 'Failed to create business', 500);
  }
});

/**
 * PATCH /api/v1/supplier/businesses/:id
 * Update business details
 */
router.patch('/businesses/:id', requireBusinessOwner, async (req: AuthenticatedRequest, res) => {
  try {
    const { id } = req.params;
    const {
      name, tagline, description, category,
      email, phone_number, whatsapp_number, website_url,
      facebook_url, instagram_url, twitter_url, linkedin_url, tiktok_url,
      latitude, longitude, address_line1, address_line2,
      city, province_state, postal_code, country,
      business_hours, status,
    } = req.body;

    // Verify ownership
    const existing = await businessService.getBusinessById(id);
    if (!existing) {
      sendError(res, 'Business not found', 404);
      return;
    }
    if (existing.owner_id !== req.user!.id && req.user!.role !== 'admin') {
      sendError(res, 'Unauthorized', 403);
      return;
    }

    // Validate if fields are provided
    if (name && !isValidBusinessName(name)) {
      sendError(res, 'Invalid business name', 400);
      return;
    }
    if (email && !isValidEmail(email)) {
      sendError(res, 'Invalid email format', 400);
      return;
    }
    if (phone_number && !isValidPhoneNumber(phone_number)) {
      sendError(res, 'Invalid phone number format', 400);
      return;
    }
    if (latitude && longitude && !isValidCoordinates(parseFloat(latitude), parseFloat(longitude))) {
      sendError(res, 'Invalid coordinates', 400);
      return;
    }

    const pool = getPool();
    const client = await pool.connect();

    try {
      await client.query('BEGIN');

      // Update business
      const updated = await businessService.updateBusiness(id, {
        name, tagline, description,
        email, phone_number, whatsapp_number, website_url,
        facebook_url, instagram_url, twitter_url, linkedin_url, tiktok_url,
        address_line1, address_line2, city, province_state, postal_code, country,
        status,
      });

      // Update location if coordinates provided
      if (latitude && longitude) {
        await client.query(
          `UPDATE businesses 
           SET location = ST_GeographyFromText('POINT(' || $1 || ' ' || $2 || ')')
           WHERE id = $3`,
          [longitude, latitude, id]
        );
      }

      // Update business hours if provided
      if (business_hours) {
        const hours = typeof business_hours === 'string' ? JSON.parse(business_hours) : business_hours;
        const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];

        // Delete existing hours
        await client.query('DELETE FROM business_hours WHERE business_id = $1', [id]);

        // Insert new hours
        for (const day of days) {
          if (hours[day]) {
            await client.query(
              `INSERT INTO business_hours (business_id, day_of_week, opens_at, closes_at, is_closed)
               VALUES ($1, $2, $3, $4, $5)`,
              [
                id,
                day,
                hours[day].closed ? null : hours[day].open,
                hours[day].closed ? null : hours[day].close,
                hours[day].closed || false,
              ]
            );
          }
        }
      }

      // Update category if provided
      if (category) {
        // Delete existing category
        await client.query('DELETE FROM business_categories WHERE business_id = $1', [id]);
        
        // Insert new category
        await client.query(
          `INSERT INTO business_categories (business_id, category_name) VALUES ($1, $2)`,
          [id, category]
        );
      }

      await client.query('COMMIT');

      sendSuccess(res, updated, 'Business updated successfully');
    } catch (error) {
    console.error("Publish error:", error);
    console.error("Publish error:", error);
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error("Publish error:", error);
    console.error("Publish error:", error);
    console.error('Update business error:', error);
    sendError(res, 'Failed to update business', 500);
  }
});

/**
 * DELETE /api/v1/supplier/businesses/:id
 * Delete business (soft delete)
 */
router.delete('/businesses/:id', requireBusinessOwner, async (req: AuthenticatedRequest, res) => {
  try {
    const { id } = req.params;

    // Verify ownership
    const existing = await businessService.getBusinessById(id);
    if (!existing) {
      sendError(res, 'Business not found', 404);
      return;
    }
    if (existing.owner_id !== req.user!.id && req.user!.role !== 'admin') {
      sendError(res, 'Unauthorized', 403);
      return;
    }

    // Soft delete by setting status to 'archived'
    await businessService.updateBusiness(id, { status: 'archived' });

    sendSuccess(res, null, 'Business deleted successfully');
  } catch (error) {
    console.error("Publish error:", error);
    console.error("Publish error:", error);
    console.error('Delete business error:', error);
    sendError(res, 'Failed to delete business', 500);
  }
});

/**
 * POST /api/v1/supplier/businesses/:id/logo
 * Upload or replace business logo
 */
router.post('/businesses/:id/logo', requireBusinessOwner, upload.single('logo'), async (req: AuthenticatedRequest, res) => {
  try {
    const { id } = req.params;
    const file = req.file;

    if (!file) {
      sendError(res, 'No logo file provided', 400);
      return;
    }

    // Verify ownership
    const business = await businessService.getBusinessById(id);
    if (!business) {
      sendError(res, 'Business not found', 404);
      return;
    }
    if (business.owner_id !== req.user!.id && req.user!.role !== 'admin') {
      sendError(res, 'Unauthorized', 403);
      return;
    }

    console.log(`📷 Uploading new logo for business ${id}: ${file.originalname}`);

    // Delete existing logo if any
    const existingLogo = await mediaService.getBusinessLogo(id);
    if (existingLogo) {
      console.log('Deleting existing logo');
      await mediaService.deleteMedia(existingLogo.id);
    }

    // Upload new logo
    const { uploadUrl, storagePath } = await mediaService.generateUploadUrl(
      id,
      file.originalname,
      file.mimetype,
      'logo'
    );

    const uploadResponse = await fetch(uploadUrl, {
      method: 'PUT',
      headers: {
        'Content-Type': file.mimetype,
      },
      body: file.buffer,
    });

    if (!uploadResponse.ok) {
      const errorText = await uploadResponse.text();
      console.error('Logo upload failed:', errorText);
      throw new Error(`Failed to upload logo: ${uploadResponse.status}`);
    }

    console.log('✅ Logo uploaded to Cloud Storage');

    // Save media record
    const media = await mediaService.saveMediaRecord({
      business_id: id,
      media_type: 'logo',
      storage_path: storagePath,
      file_name: file.originalname,
      file_size_bytes: file.size,
      mime_type: file.mimetype,
      display_order: 0,
    });

    console.log('✅ Logo record saved to database');

    sendSuccess(res, media, 'Logo uploaded successfully');
  } catch (error) {
    console.error("Publish error:", error);
    console.error("Publish error:", error);
    console.error('Upload logo error:', error);
    sendError(res, 'Failed to upload logo', 500);
  }
});

/**
 * POST /api/v1/supplier/businesses/:id/photos
 * Add photos to business (up to 3 total)
 */
router.post('/businesses/:id/photos', requireBusinessOwner, upload.array('photos', 3), async (req: AuthenticatedRequest, res) => {
  try {
    const { id } = req.params;
    const files = req.files as Express.Multer.File[];

    if (!files || files.length === 0) {
      sendError(res, 'No photo files provided', 400);
      return;
    }

    // Verify ownership
    const business = await businessService.getBusinessById(id);
    if (!business) {
      sendError(res, 'Business not found', 404);
      return;
    }
    if (business.owner_id !== req.user!.id && req.user!.role !== 'admin') {
      sendError(res, 'Unauthorized', 403);
      return;
    }

    // Check existing photo count
    const existingPhotos = await mediaService.getBusinessPhotos(id);
    if (existingPhotos.length + files.length > 3) {
      sendError(res, `Cannot upload ${files.length} photos. Maximum 3 photos total (you have ${existingPhotos.length})`, 400);
      return;
    }

    console.log(`📸 Uploading ${files.length} photo(s) for business ${id}`);

    const uploadedMedia = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      console.log(`Uploading photo ${i + 1}: ${file.originalname}`);

      // Upload to Cloud Storage
      const { uploadUrl, storagePath } = await mediaService.generateUploadUrl(
        id,
        file.originalname,
        file.mimetype,
        'photo'
      );

      const uploadResponse = await fetch(uploadUrl, {
        method: 'PUT',
        headers: {
          'Content-Type': file.mimetype,
        },
        body: file.buffer,
      });

      if (!uploadResponse.ok) {
        const errorText = await uploadResponse.text();
        console.error(`Photo ${i + 1} upload failed:`, errorText);
        throw new Error(`Failed to upload photo ${i + 1}`);
      }

      console.log(`✅ Photo ${i + 1} uploaded to Cloud Storage`);

      // Save media record
      const media = await mediaService.saveMediaRecord({
        business_id: id,
        media_type: 'photo',
        storage_path: storagePath,
        file_name: file.originalname,
        file_size_bytes: file.size,
        mime_type: file.mimetype,
        display_order: existingPhotos.length + i,
      });

      uploadedMedia.push(media);
      console.log(`✅ Photo ${i + 1} record saved to database`);
    }

    sendSuccess(res, { photos: uploadedMedia }, 'Photos uploaded successfully');
  } catch (error) {
    console.error("Publish error:", error);
    console.error("Publish error:", error);
    console.error('Upload photos error:', error);
    sendError(res, 'Failed to upload photos', 500);
  }
});

/**
 * DELETE /api/v1/supplier/businesses/:id/media/:mediaId
 * Delete a specific photo or logo
 */
router.delete('/businesses/:id/media/:mediaId', requireBusinessOwner, async (req: AuthenticatedRequest, res) => {
  try {
    const { id, mediaId } = req.params;

    // Verify ownership
    const business = await businessService.getBusinessById(id);
    if (!business) {
      sendError(res, 'Business not found', 404);
      return;
    }
    if (business.owner_id !== req.user!.id && req.user!.role !== 'admin') {
      sendError(res, 'Unauthorized', 403);
      return;
    }

    console.log(`🗑️ Deleting media ${mediaId} from business ${id}`);

    await mediaService.deleteMedia(mediaId);

    console.log('✅ Media deleted successfully');

    sendNoContent(res);
  } catch (error) {
    console.error("Publish error:", error);
    console.error("Publish error:", error);
    console.error('Delete media error:', error);
    sendError(res, 'Failed to delete media', 500);
  }
});

/**
 * GET /api/v1/supplier/businesses/:id
 * Get business details (owner only)
 */
router.get('/businesses/:id', requireBusinessOwner, async (req: AuthenticatedRequest, res) => {
  try {
    const { id } = req.params;
    const business = await businessService.getBusinessById(id);
    
    if (!business) {
      sendError(res, 'Business not found', 404);
      return;
    }
    
    // Get media
    const media = await mediaService.getBusinessMedia(id);
    
    sendSuccess(res, { ...business, media });
  } catch (error) {
    console.error("Publish error:", error);
    console.error("Publish error:", error);
    sendError(res, 'Failed to fetch business', 500);
  }
});

/**
 * POST /api/v1/supplier/businesses/:id/publish
 * Publish business (change status to active)
 */
router.post('/businesses/:id/publish', requireBusinessOwner, async (req: AuthenticatedRequest, res) => {
  try {
    const { id } = req.params;
    const business = await businessService.publishBusiness(id);
    sendSuccess(res, business, 'Business published successfully');
  } catch (error) {
    console.error("Publish error:", error);
    console.error("Publish error:", error);
    sendError(res, 'Failed to publish business', 500);
  }
});

/**
 * POST /api/v1/supplier/businesses/:id/media/upload-url
 * Generate signed URL for media upload
 */
router.post('/businesses/:id/media/upload-url', requireBusinessOwner, async (req: AuthenticatedRequest, res) => {
  try {
    const { id } = req.params;
    const { file_name, content_type, media_type } = req.body;
    
    if (!file_name || !content_type || !media_type) {
      sendError(res, 'file_name, content_type, and media_type are required', 400);
      return;
    }
    
    if (!['logo', 'photo'].includes(media_type)) {
      sendError(res, 'media_type must be "logo" or "photo"', 400);
      return;
    }
    
    const { uploadUrl, storagePath } = await mediaService.generateUploadUrl(
      id,
      file_name,
      content_type,
      media_type
    );
    
    sendSuccess(res, {
      upload_url: uploadUrl,
      storage_path: storagePath,
    });
  } catch (error) {
    console.error("Publish error:", error);
    console.error("Publish error:", error);
    console.error('Generate upload URL error:', error);
    sendError(res, 'Failed to generate upload URL', 500);
  }
});

/**
 * POST /api/v1/supplier/businesses/:id/media
 * Save media record after upload
 */
router.post('/businesses/:id/media', requireBusinessOwner, async (req: AuthenticatedRequest, res) => {
  try {
    const { id } = req.params;
    const { media_type, storage_path, file_name, file_size_bytes, mime_type, alt_text } = req.body;
    
    if (!media_type || !storage_path || !file_name) {
      sendError(res, 'media_type, storage_path, and file_name are required', 400);
      return;
    }
    
    const media = await mediaService.saveMediaRecord({
      business_id: id,
      media_type,
      storage_path,
      file_name,
      file_size_bytes,
      mime_type,
      alt_text,
    });
    
    sendCreated(res, media, 'Media saved successfully');
  } catch (error: any) {
    if (error.message && error.message.includes('more than 3 photos')) {
      sendError(res, 'Cannot add more than 3 photos per business', 400);
    } else {
      console.error('Save media error:', error);
      sendError(res, 'Failed to save media', 500);
    }
  }
});

/**
 * POST /api/v1/supplier/businesses/:id/verification
 * Submit verification request
 */
router.post('/businesses/:id/verification', requireBusinessOwner, async (req: AuthenticatedRequest, res) => {
  try {
    const { id } = req.params;
    const { request_notes } = req.body;
    
    const verificationRequest = await verificationService.submitVerificationRequest(
      id,
      req.user!.id,
      request_notes
    );
    
    sendCreated(res, verificationRequest, 'Verification request submitted');
  } catch (error) {
    console.error("Publish error:", error);
    console.error("Publish error:", error);
    sendError(res, 'Failed to submit verification request', 500);
  }
});

// ============================================================
// NEW VERIFICATION DOCUMENT ROUTES (Added for document upload)
// ============================================================

/**
 * GET /api/v1/supplier/businesses/:id/verification
 * Get verification status and documents for a business
 */
router.get('/businesses/:id/verification', requireBusinessOwner, async (req: AuthenticatedRequest, res) => {
  try {
    const { id } = req.params;
    
    // Get verification request
    const request = await verificationService.getBusinessVerificationRequest(id);
    
    if (!request) {
      sendSuccess(res, null);
      return;
    }
    
    // Get documents with download URLs
    const documents = await verificationService.getVerificationDocuments(request.id);
    const documentsWithUrls = await Promise.all(
      documents.map(async (doc: any) => ({
        ...doc,
        download_url: await verificationService.generateDocumentDownloadUrl(doc.storage_path),
      }))
    );
    
    sendSuccess(res, { ...request, documents: documentsWithUrls });
  } catch (error: any) {
    console.error('Error getting verification status:', error);
    sendError(res, error.message || 'Failed to get verification status', 500);
  }
});

/**
 * POST /api/v1/supplier/businesses/:id/verification/documents/upload-url
 * Get signed URL for document upload
 */
router.post('/businesses/:id/verification/documents/upload-url', requireBusinessOwner, async (req: AuthenticatedRequest, res) => {
  try {
    const { id } = req.params;
    const { file_name, content_type, document_type } = req.body;
    
    if (!file_name || !content_type || !document_type) {
      sendError(res, 'file_name, content_type, and document_type are required', 400);
      return;
    }
    
    const validDocTypes = ['id_document', 'business_registration', 'ownership_proof', 'bbbee_certificate', 'other'];
    if (!validDocTypes.includes(document_type)) {
      sendError(res, `Invalid document_type. Must be: ${validDocTypes.join(', ')}`, 400);
      return;
    }
    
    const validContentTypes = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];
    if (!validContentTypes.includes(content_type)) {
      sendError(res, 'Invalid content_type. Must be JPEG, PNG, WebP, or PDF', 400);
      return;
    }
    
    const request = await verificationService.getBusinessVerificationRequest(id);
    if (!request) {
      sendError(res, 'No verification request found. Create one first.', 400);
      return;
    }
    if (request.status !== 'pending') {
      sendError(res, 'Cannot upload to a reviewed request', 400);
      return;
    }
    
    const existingDocs = await verificationService.getVerificationDocuments(request.id);
    if (existingDocs.length >= 5) {
      sendError(res, 'Maximum 5 documents allowed', 400);
      return;
    }
    
    const { uploadUrl, storagePath } = await verificationService.generateDocumentUploadUrl(
      request.id, file_name, content_type, document_type
    );
    
    sendSuccess(res, { upload_url: uploadUrl, storage_path: storagePath });
  } catch (error: any) {
    console.error('Error generating upload URL:', error);
    sendError(res, error.message || 'Failed to generate upload URL', 500);
  }
});

/**
 * POST /api/v1/supplier/businesses/:id/verification/documents
 * Save document record after upload to Cloud Storage
 */
router.post('/businesses/:id/verification/documents', requireBusinessOwner, async (req: AuthenticatedRequest, res) => {
  try {
    const { id } = req.params;
    const { document_type, storage_path, file_name, file_size_bytes, mime_type } = req.body;
    
    if (!document_type || !storage_path || !file_name) {
      sendError(res, 'document_type, storage_path, and file_name are required', 400);
      return;
    }
    
    const request = await verificationService.getBusinessVerificationRequest(id);
    if (!request || request.status !== 'pending') {
      sendError(res, 'No pending verification request found', 400);
      return;
    }
    
    const document = await verificationService.saveVerificationDocument({
      verification_request_id: request.id,
      document_type, storage_path, file_name, file_size_bytes, mime_type,
    });
    
    sendCreated(res, document, 'Document saved');
  } catch (error: any) {
    console.error('Error saving document:', error);
    sendError(res, error.message || 'Failed to save document', 500);
  }
});

/**
 * DELETE /api/v1/supplier/businesses/:id/verification/documents/:documentId
 * Delete a verification document
 */
router.delete('/businesses/:id/verification/documents/:documentId', requireBusinessOwner, async (req: AuthenticatedRequest, res) => {
  try {
    const { id, documentId } = req.params;
    await verificationService.deleteVerificationDocument(documentId, id, req.user!.id);
    sendNoContent(res);
  } catch (error: any) {
    console.error('Error deleting document:', error);
    sendError(res, error.message || 'Failed to delete document', 400);
  }
});

export default router;
