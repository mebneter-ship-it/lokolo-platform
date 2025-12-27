import { Router } from 'express';
import { authenticate, requireRole, AuthenticatedRequest } from '../middleware/auth';
import { sendSuccess, sendError } from '../utils/responses';
import * as verificationService from '../services/verificationService';
import * as userService from '../services/userService';
import * as businessService from '../services/businessService';
import * as adminService from '../services/adminService';
import { validatePagination } from '../utils/validators';
import { UserRole, VerificationStatus } from '../models/types';

const router = Router();

// All routes require admin authentication
router.use(authenticate);
router.use(requireRole('admin'));

/**
 * GET /api/v1/admin/verification-requests
 * Get all pending verification requests
 */
router.get('/verification-requests', async (req: AuthenticatedRequest, res) => {
  try {
    const { page, limit } = validatePagination(
      Number(req.query.page),
      Number(req.query.limit)
    );
    
    const { requests, total } = await verificationService.getPendingVerificationRequests(
      page,
      limit
    );
    
    sendSuccess(res, {
      requests,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    sendError(res, 'Failed to fetch verification requests', 500);
  }
});

/**
 * GET /api/v1/admin/verification-requests/:id
 * Get verification request details
 */
router.get('/verification-requests/:id', async (req: AuthenticatedRequest, res) => {
  try {
    const { id } = req.params;
    
    const request = await verificationService.getVerificationRequestById(id);
    
    if (!request) {
      sendError(res, 'Verification request not found', 404);
      return;
    }
    
    // Get documents
    const documents = await verificationService.getVerificationDocuments(id);
    
    // Generate download URLs for documents
    const documentsWithUrls = await Promise.all(
      documents.map(async (doc) => ({
        ...doc,
        url: await verificationService.generateDocumentDownloadUrl(doc.storage_path),
      }))
    );
    
    // Get business details
    const business = await businessService.getBusinessById(request.business_id);
    
    sendSuccess(res, {
      ...request,
      documents: documentsWithUrls,
      business,
    });
  } catch (error) {
    sendError(res, 'Failed to fetch verification request', 500);
  }
});

/**
 * POST /api/v1/admin/verification-requests/:id/review
 * Approve or reject verification request
 */
router.post('/verification-requests/:id/review', async (req: AuthenticatedRequest, res) => {
  try {
    const { id } = req.params;
    const { status, review_notes } = req.body;
    
    if (!status || !['approved', 'rejected'].includes(status)) {
      sendError(res, 'Status must be "approved" or "rejected"', 400);
      return;
    }
    
    const updatedRequest = await verificationService.reviewVerificationRequest(
      id,
      req.user!.id,
      status as VerificationStatus,
      review_notes
    );
    
    sendSuccess(res, updatedRequest, `Verification request ${status}`);
  } catch (error) {
    console.error('Review verification error:', error);
    sendError(res, 'Failed to review verification request', 500);
  }
});

/**
 * GET /api/v1/admin/users
 * Get all users (with pagination)
 */
router.get('/users', async (req: AuthenticatedRequest, res) => {
  try {
    const { page, limit } = validatePagination(
      Number(req.query.page),
      Number(req.query.limit)
    );
    
    const { role, search } = req.query;
    
    const { users, total } = await adminService.getUsers(page, limit, {
      role: role as string,
      search: search as string,
    });
    
    sendSuccess(res, {
      users,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Failed to fetch users:', error);
    sendError(res, 'Failed to fetch users', 500);
  }
});

/**
 * PATCH /api/v1/admin/users/:id/role
 * Update user role
 */
router.patch('/users/:id/role', async (req: AuthenticatedRequest, res) => {
  try {
    const { id } = req.params;
    const { role } = req.body;
    
    if (!role || !['consumer', 'supplier', 'admin'].includes(role)) {
      sendError(res, 'Invalid role. Must be consumer, supplier, or admin', 400);
      return;
    }
    
    const updatedUser = await userService.updateUserRole(id, role as UserRole);
    sendSuccess(res, updatedUser, 'User role updated');
  } catch (error) {
    sendError(res, 'Failed to update user role', 500);
  }
});

/**
 * GET /api/v1/admin/businesses
 * Get all businesses (with filters)
 */
router.get('/businesses', async (req: AuthenticatedRequest, res) => {
  try {
    const { status, verification_status, page, limit } = req.query;
    
    const { page: validPage, limit: validLimit } = validatePagination(
      Number(page),
      Number(limit)
    );
    
    // Use search with admin-specific filters
    // Pass status: null to get ALL statuses (not just active)
    const businesses = await businessService.searchBusinesses({
      status: status ? (status as any) : null,  // null = all statuses for admin
      verification_status: verification_status as any,
      page: validPage,
      limit: validLimit,
    });
    
    sendSuccess(res, {
      businesses,
      pagination: {
        page: validPage,
        limit: validLimit,
      },
    });
  } catch (error) {
    sendError(res, 'Failed to fetch businesses', 500);
  }
});

/**
 * PATCH /api/v1/admin/businesses/:id/status
 * Update business status (suspend, archive, etc.)
 */
router.patch('/businesses/:id/status', async (req: AuthenticatedRequest, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    
    if (!status || !['draft', 'pending', 'active', 'suspended', 'archived', 'rejected'].includes(status)) {
      sendError(res, 'Invalid status', 400);
      return;
    }
    
    const updatedBusiness = await businessService.updateBusiness(id, { status });
    sendSuccess(res, updatedBusiness, 'Business status updated');
  } catch (error) {
    sendError(res, 'Failed to update business status', 500);
  }
});

/**
 * POST /api/v1/admin/businesses/:id/approve
 * Approve a pending business submission (makes it active and visible)
 */
router.post('/businesses/:id/approve', async (req: AuthenticatedRequest, res) => {
  try {
    const { id } = req.params;
    
    const updatedBusiness = await businessService.approveBusiness(id);
    sendSuccess(res, updatedBusiness, 'Business approved and published');
  } catch (error) {
    console.error('Failed to approve business:', error);
    sendError(res, 'Failed to approve business', 500);
  }
});

/**
 * POST /api/v1/admin/businesses/:id/reject
 * Reject a pending business submission
 */
router.post('/businesses/:id/reject', async (req: AuthenticatedRequest, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;
    
    const updatedBusiness = await businessService.rejectBusinessSubmission(id, reason);
    sendSuccess(res, updatedBusiness, 'Business submission rejected');
  } catch (error) {
    console.error('Failed to reject business:', error);
    sendError(res, 'Failed to reject business', 500);
  }
});

/**
 * PATCH /api/v1/admin/businesses/:id/verification
 * Update business verification status (approve, reject Black ownership)
 */
router.patch('/businesses/:id/verification', async (req: AuthenticatedRequest, res) => {
  try {
    const { id } = req.params;
    const { verification_status } = req.body;
    
    if (!verification_status || !['pending', 'approved', 'rejected'].includes(verification_status)) {
      sendError(res, 'Invalid verification status. Must be pending, approved, or rejected', 400);
      return;
    }
    
    const updatedBusiness = await businessService.updateBusiness(id, { verification_status });
    sendSuccess(res, updatedBusiness, `Business verification ${verification_status}`);
  } catch (error) {
    sendError(res, 'Failed to update verification status', 500);
  }
});

/**
 * GET /api/v1/admin/stats
 * Get platform statistics
 */
router.get('/stats', async (req: AuthenticatedRequest, res) => {
  try {
    const stats = await adminService.getStats();
    sendSuccess(res, stats);
  } catch (error) {
    console.error('Failed to fetch statistics:', error);
    sendError(res, 'Failed to fetch statistics', 500);
  }
});

/**
 * GET /api/v1/admin/activity
 * Get recent platform activity
 */
router.get('/activity', async (req: AuthenticatedRequest, res) => {
  try {
    const limit = Math.min(Number(req.query.limit) || 10, 50);
    const activity = await adminService.getRecentActivity(limit);
    sendSuccess(res, activity);
  } catch (error) {
    console.error('Failed to fetch activity:', error);
    sendError(res, 'Failed to fetch activity', 500);
  }
});

export default router;
