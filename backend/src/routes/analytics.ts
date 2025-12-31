import { Router, Request, Response } from 'express';
import { authenticate, optionalAuth, AuthenticatedRequest, requireRole } from '../middleware/auth';
import { sendSuccess, sendError } from '../utils/responses';
import * as analyticsService from '../services/analyticsService';

const router = Router();

/**
 * POST /api/v1/analytics/track
 * Track a single event (public - no auth required, but captures user if logged in)
 */
router.post('/track', optionalAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { event_type, business_id, session_id, metadata } = req.body;
    
    if (!event_type) {
      sendError(res, 'event_type is required', 400);
      return;
    }
    
    await analyticsService.trackEvent({
      eventType: event_type,
      businessId: business_id,
      userId: req.user?.id,
      sessionId: session_id,
      metadata,
    });
    
    sendSuccess(res, { tracked: true });
  } catch (error) {
    // Don't fail the request - analytics should be silent
    console.error('Track event error:', error);
    sendSuccess(res, { tracked: false });
  }
});

/**
 * POST /api/v1/analytics/track-batch
 * Track multiple events (for search impressions)
 */
router.post('/track-batch', optionalAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { events } = req.body;
    
    if (!Array.isArray(events)) {
      sendError(res, 'events must be an array', 400);
      return;
    }
    
    const mappedEvents = events.map((e: any) => ({
      eventType: e.event_type,
      businessId: e.business_id,
      userId: req.user?.id,
      sessionId: e.session_id,
      metadata: e.metadata,
    }));
    
    await analyticsService.trackBatchEvents(mappedEvents);
    
    sendSuccess(res, { tracked: true, count: events.length });
  } catch (error) {
    console.error('Track batch error:', error);
    sendSuccess(res, { tracked: false });
  }
});

/**
 * GET /api/v1/analytics/business/:id
 * Get analytics for a business (supplier must own the business)
 */
router.get('/business/:id', authenticate, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const days = parseInt(req.query.days as string) || 30;
    
    // TODO: Verify user owns this business (for now, just check if supplier)
    // This should be enhanced with proper ownership check
    
    const analytics = await analyticsService.getBusinessAnalytics(id, days);
    
    sendSuccess(res, analytics);
  } catch (error) {
    console.error('Get business analytics error:', error);
    sendError(res, 'Failed to get analytics', 500);
  }
});

/**
 * GET /api/v1/analytics/business/:id/stats
 * Get simple stats for supplier dashboard
 */
router.get('/business/:id/stats', authenticate, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const days = parseInt(req.query.days as string) || 30;
    
    const stats = await analyticsService.getBusinessStats(id, days);
    
    sendSuccess(res, stats);
  } catch (error) {
    console.error('Get business stats error:', error);
    sendError(res, 'Failed to get stats', 500);
  }
});

/**
 * GET /api/v1/analytics/platform
 * Get platform-wide analytics (admin only)
 */
router.get('/platform', authenticate, requireRole('admin'), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const days = parseInt(req.query.days as string) || 30;
    
    const analytics = await analyticsService.getPlatformAnalytics(days);
    
    sendSuccess(res, analytics);
  } catch (error) {
    console.error('Get platform analytics error:', error);
    sendError(res, 'Failed to get platform analytics', 500);
  }
});

/**
 * GET /api/v1/admin/analytics/events
 * Get recent events with details (admin only)
 */
router.get('/admin/events', authenticate, requireRole('admin'), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const limit = Math.min(parseInt(req.query.limit as string) || 100, 5000);
    const days = parseInt(req.query.days as string) || 30;
    
    const { getPool } = require('../config/database');
    const pool = getPool();
    
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    
    const result = await pool.query(
      `SELECT 
        ae.id, ae.event_type, ae.business_id, ae.user_id, ae.session_id, ae.metadata, ae.created_at,
        b.name as business_name,
        u.email as user_email
       FROM analytics_events ae
       LEFT JOIN businesses b ON ae.business_id = b.id
       LEFT JOIN users u ON ae.user_id = u.id
       WHERE ae.created_at >= $1
       ORDER BY ae.created_at DESC
       LIMIT $2`,
      [startDate, limit]
    );
    
    sendSuccess(res, { events: result.rows });
  } catch (error) {
    console.error('Get analytics events error:', error);
    sendError(res, 'Failed to get analytics events', 500);
  }
});

export default router;
