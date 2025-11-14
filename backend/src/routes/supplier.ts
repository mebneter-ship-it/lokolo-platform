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

const router = Router();

// All routes require authentication as supplier
router.use(authenticate);
router.use(requireRole('supplier', 'admin'));

/**
 * GET /api/v1/supplier/businesses
 * Get supplier's businesses
 */
router.get('/businesses', async (req: AuthenticatedRequest, res) => {
  try {
    const businesses = await userService.getUserBusinesses(req.user!.id);
    sendSuccess(res, { businesses });
  } catch (error) {
    sendError(res, 'Failed to fetch businesses', 500);
  }
});

/**
 * POST /api/v1/supplier/businesses
 * Create new business
 */
router.post('/businesses', async (req: AuthenticatedRequest, res) => {
  try {
    const {
      name,
      tagline,
      description,
      email,
      phone_number,
      whatsapp_number,
      website_url,
      latitude,
      longitude,
      address_line1,
      address_line2,
      city,
      province_state,
      postal_code,
      country,
      year_established,
      employee_count_range,
    } = req.body;
    
    // Validate required fields
    if (!name || !isValidBusinessName(name)) {
      sendError(res, 'Valid business name is required (2-255 characters)', 400);
      return;
    }
    
    if (!city) {
      sendError(res, 'City is required', 400);
      return;
    }
    
    if (!latitude || !longitude || !isValidCoordinates(latitude, longitude)) {
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
    
    const business = await businessService.createBusiness({
      owner_id: req.user!.id,
      name,
      tagline,
      description,
      email,
      phone_number,
      whatsapp_number,
      website_url,
      latitude,
      longitude,
      address_line1,
      address_line2,
      city,
      province_state,
      postal_code,
      country,
      year_established,
      employee_count_range,
    });
    
    sendCreated(res, business, 'Business created successfully');
  } catch (error) {
    console.error('Create business error:', error);
    sendError(res, 'Failed to create business', 500);
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
    sendError(res, 'Failed to fetch business', 500);
  }
});

/**
 * PATCH /api/v1/supplier/businesses/:id
 * Update business details
 */
router.patch('/businesses/:id', requireBusinessOwner, async (req: AuthenticatedRequest, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;
    
    // Validate fields if provided
    if (updateData.name && !isValidBusinessName(updateData.name)) {
      sendError(res, 'Invalid business name', 400);
      return;
    }
    
    if (updateData.email && !isValidEmail(updateData.email)) {
      sendError(res, 'Invalid email format', 400);
      return;
    }
    
    if (updateData.latitude && updateData.longitude && 
        !isValidCoordinates(updateData.latitude, updateData.longitude)) {
      sendError(res, 'Invalid coordinates', 400);
      return;
    }
    
    const updatedBusiness = await businessService.updateBusiness(id, updateData);
    sendSuccess(res, updatedBusiness, 'Business updated successfully');
  } catch (error) {
    console.error('Update business error:', error);
    sendError(res, 'Failed to update business', 500);
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
    sendError(res, 'Failed to publish business', 500);
  }
});

/**
 * DELETE /api/v1/supplier/businesses/:id
 * Delete business
 */
router.delete('/businesses/:id', requireBusinessOwner, async (req: AuthenticatedRequest, res) => {
  try {
    const { id } = req.params;
    await businessService.deleteBusiness(id);
    sendNoContent(res);
  } catch (error) {
    sendError(res, 'Failed to delete business', 500);
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
 * DELETE /api/v1/supplier/businesses/:id/media/:mediaId
 * Delete media
 */
router.delete('/businesses/:id/media/:mediaId', requireBusinessOwner, async (req: AuthenticatedRequest, res) => {
  try {
    const { mediaId } = req.params;
    await mediaService.deleteMedia(mediaId);
    sendNoContent(res);
  } catch (error) {
    sendError(res, 'Failed to delete media', 500);
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
    sendError(res, 'Failed to submit verification request', 500);
  }
});

export default router;
