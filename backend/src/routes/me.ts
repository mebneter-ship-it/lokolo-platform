import { Router } from 'express';
import { authenticate, requireRole, AuthenticatedRequest } from '../middleware/auth';
import { sendSuccess, sendError, sendCreated, sendNoContent } from '../utils/responses';
import * as userService from '../services/userService';
import * as favoriteService from '../services/favoriteService';
import * as threadService from '../services/threadService';
import { validatePagination } from '../utils/validators';

const router = Router();

// All routes require authentication
router.use(authenticate);

/**
 * GET /api/v1/me
 * Get current user profile
 */
router.get('/', async (req: AuthenticatedRequest, res) => {
  try {
    const user = await userService.getUserById(req.user!.id);
    sendSuccess(res, user);
  } catch (error) {
    sendError(res, 'Failed to fetch user profile', 500);
  }
});

/**
 * PATCH /api/v1/me
 * Update current user profile
 * FIXED: Now accepts role parameter for signup flow
 */
router.patch('/', async (req: AuthenticatedRequest, res) => {
  try {
    const { display_name, phone_number, profile_photo_url, role } = req.body;
    
    const updatedUser = await userService.updateUser(req.user!.id, {
      display_name,
      phone_number,
      profile_photo_url,
      role, // ADDED: Allow updating role during signup
    });
    
    sendSuccess(res, updatedUser);
  } catch (error) {
    sendError(res, 'Failed to update profile', 500);
  }
});

/**
 * DELETE /api/v1/me
 * Delete user account and all related data
 */
router.delete('/', async (req: AuthenticatedRequest, res) => {
  try {
    const user = await userService.getUserById(req.user!.id);
    
    if (!user) {
      sendError(res, 'User not found', 404);
      return;
    }
    
    // Delete all user data
    await userService.deleteUser(req.user!.id);
    
    sendSuccess(res, { message: 'Account deleted successfully' });
  } catch (error) {
    console.error('Failed to delete account:', error);
    sendError(res, 'Failed to delete account', 500);
  }
});

/**
 * GET /api/v1/me/favorites
 * Get user's favorite businesses
 */
router.get('/favorites', requireRole('consumer'), async (req: AuthenticatedRequest, res) => {
  try {
    const { page, limit } = validatePagination(
      Number(req.query.page),
      Number(req.query.limit)
    );
    
    const { favorites, total } = await favoriteService.getUserFavorites(
      req.user!.id,
      page,
      limit
    );
    
    sendSuccess(res, {
      favorites,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    sendError(res, 'Failed to fetch favorites', 500);
  }
});

/**
 * POST /api/v1/me/favorites/:businessId
 * Add business to favorites
 */
router.post('/favorites/:businessId', requireRole('consumer'), async (req: AuthenticatedRequest, res) => {
  try {
    const { businessId } = req.params;
    const favorite = await favoriteService.addFavorite(req.user!.id, businessId);
    sendCreated(res, favorite, 'Business added to favorites');
  } catch (error) {
    sendError(res, 'Failed to add favorite', 500);
  }
});

/**
 * DELETE /api/v1/me/favorites/:businessId
 * Remove business from favorites
 */
router.delete('/favorites/:businessId', requireRole('consumer'), async (req: AuthenticatedRequest, res) => {
  try {
    const { businessId } = req.params;
    await favoriteService.removeFavorite(req.user!.id, businessId);
    sendNoContent(res);
  } catch (error) {
    sendError(res, 'Failed to remove favorite', 500);
  }
});

/**
 * GET /api/v1/me/threads
 * Get user's message threads
 */
router.get('/threads', async (req: AuthenticatedRequest, res) => {
  try {
    const { page, limit } = validatePagination(
      Number(req.query.page),
      Number(req.query.limit)
    );
    
    const role = req.user!.role === 'consumer' ? 'consumer' : 'supplier';
    const { threads, total } = await threadService.getUserThreads(
      req.user!.id,
      role,
      page,
      limit
    );
    
    sendSuccess(res, {
      threads,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    sendError(res, 'Failed to fetch threads', 500);
  }
});

/**
 * GET /api/v1/me/threads/:threadId/messages
 * Get messages in a thread
 */
router.get('/threads/:threadId/messages', async (req: AuthenticatedRequest, res) => {
  try {
    const { threadId } = req.params;
    const { page, limit } = validatePagination(
      Number(req.query.page),
      Number(req.query.limit)
    );
    
    // Verify user has access to this thread
    const thread = await threadService.getThreadById(threadId);
    if (!thread || (thread.consumer_id !== req.user!.id && thread.supplier_id !== req.user!.id)) {
      sendError(res, 'Thread not found', 404);
      return;
    }
    
    const { messages, total } = await threadService.getThreadMessages(threadId, page, limit);
    
    // Mark messages as read
    await threadService.markMessagesAsRead(threadId, req.user!.id);
    
    sendSuccess(res, {
      messages,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    sendError(res, 'Failed to fetch messages', 500);
  }
});

/**
 * POST /api/v1/me/threads/:threadId/messages
 * Send a message in a thread
 */
router.post('/threads/:threadId/messages', async (req: AuthenticatedRequest, res) => {
  try {
    const { threadId } = req.params;
    const { message_text } = req.body;
    
    if (!message_text || message_text.trim().length === 0) {
      sendError(res, 'Message text is required', 400);
      return;
    }
    
    // Verify user has access to this thread
    const thread = await threadService.getThreadById(threadId);
    if (!thread || (thread.consumer_id !== req.user!.id && thread.supplier_id !== req.user!.id)) {
      sendError(res, 'Thread not found', 404);
      return;
    }
    
    const message = await threadService.sendMessage(threadId, req.user!.id, message_text);
    sendCreated(res, message, 'Message sent');
  } catch (error) {
    sendError(res, 'Failed to send message', 500);
  }
});

export default router;
