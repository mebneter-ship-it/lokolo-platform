import { getPool } from '../config/database';
import { getBucket } from '../config/storage';
import { BusinessMedia, MediaType } from '../models/types';
import * as crypto from 'crypto';
import * as path from 'path';

/**
 * Generate signed URL for file upload
 */
export const generateUploadUrl = async (
  businessId: string,
  fileName: string,
  contentType: string,
  mediaType: MediaType
): Promise<{ uploadUrl: string; storagePath: string }> => {
  const bucket = getBucket();
  
  // Generate unique file name
  const fileExtension = path.extname(fileName);
  const uniqueId = crypto.randomBytes(16).toString('hex');
  const storagePath = `businesses/${businessId}/${mediaType}/${uniqueId}${fileExtension}`;
  
  const file = bucket.file(storagePath);
  
  // Generate signed URL for upload (valid for 15 minutes)
  const [uploadUrl] = await file.getSignedUrl({
    version: 'v4',
    action: 'write',
    expires: Date.now() + 15 * 60 * 1000,
    contentType,
  });
  
  return { uploadUrl, storagePath };
};

/**
 * Generate signed URL for file download/view
 */
export const generateDownloadUrl = async (storagePath: string): Promise<string> => {
  const bucket = getBucket();
  const file = bucket.file(storagePath);
  
  // Generate signed URL for read (valid for 1 hour)
  const [downloadUrl] = await file.getSignedUrl({
    version: 'v4',
    action: 'read',
    expires: Date.now() + 60 * 60 * 1000,
  });
  
  return downloadUrl;
};

/**
 * Save media record to database
 */
export const saveMediaRecord = async (data: {
  business_id: string;
  media_type: MediaType;
  storage_path: string;
  file_name: string;
  file_size_bytes?: number;
  mime_type?: string;
  display_order?: number;
  alt_text?: string;
}): Promise<BusinessMedia> => {
  const pool = getPool();
  
  const result = await pool.query(
    `INSERT INTO business_media (
      business_id, media_type, storage_path, file_name, 
      file_size_bytes, mime_type, display_order, alt_text
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
    RETURNING *`,
    [
      data.business_id,
      data.media_type,
      data.storage_path,
      data.file_name,
      data.file_size_bytes || null,
      data.mime_type || null,
      data.display_order || 0,
      data.alt_text || null,
    ]
  );
  
  return result.rows[0];
};

/**
 * Get business media
 */
export const getBusinessMedia = async (businessId: string): Promise<BusinessMedia[]> => {
  const pool = getPool();
  
  const result = await pool.query(
    `SELECT * FROM business_media 
     WHERE business_id = $1 
     ORDER BY media_type, display_order, uploaded_at`,
    [businessId]
  );
  
  return result.rows;
};

/**
 * Get business logo
 */
export const getBusinessLogo = async (businessId: string): Promise<BusinessMedia | null> => {
  const pool = getPool();
  
  const result = await pool.query(
    `SELECT * FROM business_media 
     WHERE business_id = $1 AND media_type = 'logo'
     LIMIT 1`,
    [businessId]
  );
  
  return result.rows[0] || null;
};

/**
 * Get business photos
 */
export const getBusinessPhotos = async (businessId: string): Promise<BusinessMedia[]> => {
  const pool = getPool();
  
  const result = await pool.query(
    `SELECT * FROM business_media 
     WHERE business_id = $1 AND media_type = 'photo'
     ORDER BY display_order, uploaded_at`,
    [businessId]
  );
  
  return result.rows;
};

/**
 * Delete media
 */
export const deleteMedia = async (mediaId: string): Promise<void> => {
  const pool = getPool();
  
  // Get storage path before deleting
  const mediaResult = await pool.query(
    'SELECT storage_path FROM business_media WHERE id = $1',
    [mediaId]
  );
  
  if (mediaResult.rows.length === 0) {
    throw new Error('Media not found');
  }
  
  const storagePath = mediaResult.rows[0].storage_path;
  
  // Delete from database
  await pool.query('DELETE FROM business_media WHERE id = $1', [mediaId]);
  
  // Delete from Cloud Storage
  try {
    const bucket = getBucket();
    await bucket.file(storagePath).delete();
  } catch (error) {
    console.error('Failed to delete file from storage:', error);
    // Don't throw - DB record is already deleted
  }
};

/**
 * Update media display order
 */
export const updateMediaOrder = async (mediaId: string, displayOrder: number): Promise<void> => {
  const pool = getPool();
  await pool.query(
    'UPDATE business_media SET display_order = $1 WHERE id = $2',
    [displayOrder, mediaId]
  );
};
