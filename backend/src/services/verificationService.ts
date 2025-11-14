import { getPool } from '../config/database';
import { getBucket } from '../config/storage';
import { VerificationRequest, VerificationDocument, VerificationStatus } from '../models/types';
import * as crypto from 'crypto';
import * as path from 'path';

/**
 * Submit verification request
 */
export const submitVerificationRequest = async (
  businessId: string,
  requesterId: string,
  requestNotes?: string
): Promise<VerificationRequest> => {
  const pool = getPool();
  
  const result = await pool.query(
    `INSERT INTO verification_requests (business_id, requester_id, request_notes, status)
     VALUES ($1, $2, $3, 'pending')
     RETURNING *`,
    [businessId, requesterId, requestNotes || null]
  );
  
  return result.rows[0];
};

/**
 * Get verification request by ID
 */
export const getVerificationRequestById = async (requestId: string): Promise<VerificationRequest | null> => {
  const pool = getPool();
  const result = await pool.query(
    'SELECT * FROM verification_requests WHERE id = $1',
    [requestId]
  );
  return result.rows[0] || null;
};

/**
 * Get verification request for business
 */
export const getBusinessVerificationRequest = async (businessId: string): Promise<VerificationRequest | null> => {
  const pool = getPool();
  const result = await pool.query(
    `SELECT * FROM verification_requests 
     WHERE business_id = $1 
     ORDER BY created_at DESC 
     LIMIT 1`,
    [businessId]
  );
  return result.rows[0] || null;
};

/**
 * Get all pending verification requests (admin)
 */
export const getPendingVerificationRequests = async (
  page: number = 1,
  limit: number = 20
): Promise<{ requests: any[]; total: number }> => {
  const pool = getPool();
  const offset = (page - 1) * limit;
  
  const result = await pool.query(
    `SELECT 
      vr.*,
      b.name as business_name,
      u.display_name as requester_name,
      u.email as requester_email
     FROM verification_requests vr
     INNER JOIN businesses b ON vr.business_id = b.id
     INNER JOIN users u ON vr.requester_id = u.id
     WHERE vr.status = 'pending'
     ORDER BY vr.created_at ASC
     LIMIT $1 OFFSET $2`,
    [limit, offset]
  );
  
  const countResult = await pool.query(
    "SELECT COUNT(*) FROM verification_requests WHERE status = 'pending'"
  );
  
  return {
    requests: result.rows,
    total: parseInt(countResult.rows[0].count),
  };
};

/**
 * Review verification request (admin)
 */
export const reviewVerificationRequest = async (
  requestId: string,
  reviewerId: string,
  status: VerificationStatus,
  reviewNotes?: string
): Promise<VerificationRequest> => {
  const pool = getPool();
  
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    // Update verification request
    const requestResult = await client.query(
      `UPDATE verification_requests 
       SET status = $1, reviewed_by = $2, reviewed_at = CURRENT_TIMESTAMP, review_notes = $3
       WHERE id = $4
       RETURNING *`,
      [status, reviewerId, reviewNotes || null, requestId]
    );
    
    const request = requestResult.rows[0];
    
    // If approved, update business verification status
    if (status === 'approved') {
      await client.query(
        `UPDATE businesses 
         SET verification_status = 'approved', verified_at = CURRENT_TIMESTAMP
         WHERE id = $1`,
        [request.business_id]
      );
    } else if (status === 'rejected') {
      await client.query(
        `UPDATE businesses 
         SET verification_status = 'rejected'
         WHERE id = $1`,
        [request.business_id]
      );
    }
    
    await client.query('COMMIT');
    return request;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
};

/**
 * Generate signed URL for document upload
 */
export const generateDocumentUploadUrl = async (
  verificationRequestId: string,
  fileName: string,
  contentType: string,
  documentType: string
): Promise<{ uploadUrl: string; storagePath: string }> => {
  const bucket = getBucket();
  
  const fileExtension = path.extname(fileName);
  const uniqueId = crypto.randomBytes(16).toString('hex');
  const storagePath = `verification/${verificationRequestId}/${documentType}/${uniqueId}${fileExtension}`;
  
  const file = bucket.file(storagePath);
  
  const [uploadUrl] = await file.getSignedUrl({
    version: 'v4',
    action: 'write',
    expires: Date.now() + 15 * 60 * 1000,
    contentType,
  });
  
  return { uploadUrl, storagePath };
};

/**
 * Save verification document record
 */
export const saveVerificationDocument = async (data: {
  verification_request_id: string;
  document_type: string;
  storage_path: string;
  file_name: string;
  file_size_bytes?: number;
  mime_type?: string;
}): Promise<VerificationDocument> => {
  const pool = getPool();
  
  const result = await pool.query(
    `INSERT INTO verification_documents (
      verification_request_id, document_type, storage_path, 
      file_name, file_size_bytes, mime_type
    ) VALUES ($1, $2, $3, $4, $5, $6)
    RETURNING *`,
    [
      data.verification_request_id,
      data.document_type,
      data.storage_path,
      data.file_name,
      data.file_size_bytes || null,
      data.mime_type || null,
    ]
  );
  
  return result.rows[0];
};

/**
 * Get verification documents
 */
export const getVerificationDocuments = async (
  verificationRequestId: string
): Promise<VerificationDocument[]> => {
  const pool = getPool();
  
  const result = await pool.query(
    `SELECT * FROM verification_documents 
     WHERE verification_request_id = $1 
     ORDER BY uploaded_at`,
    [verificationRequestId]
  );
  
  return result.rows;
};

/**
 * Generate download URL for verification document
 */
export const generateDocumentDownloadUrl = async (storagePath: string): Promise<string> => {
  const bucket = getBucket();
  const file = bucket.file(storagePath);
  
  const [downloadUrl] = await file.getSignedUrl({
    version: 'v4',
    action: 'read',
    expires: Date.now() + 60 * 60 * 1000,
  });
  
  return downloadUrl;
};
