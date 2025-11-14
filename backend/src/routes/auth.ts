import { Router } from 'express';
import { authenticate, AuthenticatedRequest } from '../middleware/auth';
import { sendSuccess } from '../utils/responses';

const router = Router();

/**
 * GET /api/v1/auth/verify
 * Verify authentication token
 */
router.get('/verify', authenticate, (req: AuthenticatedRequest, res) => {
  sendSuccess(res, {
    user: req.user,
    authenticated: true,
  });
});

export default router;
