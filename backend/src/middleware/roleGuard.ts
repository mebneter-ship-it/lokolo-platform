import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from './auth';
import { getPool } from '../config/database';

/**
 * Middleware to verify user owns a specific business
 */
export const requireBusinessOwner = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Not authenticated' });
      return;
    }

    const businessId = req.params.id || req.body.business_id;

    if (!businessId) {
      res.status(400).json({ error: 'Business ID is required' });
      return;
    }

    const pool = getPool();
    const result = await pool.query(
      'SELECT owner_id FROM businesses WHERE id = $1',
      [businessId]
    );

    if (result.rows.length === 0) {
      res.status(404).json({ error: 'Business not found' });
      return;
    }

    const business = result.rows[0];

    // Allow if user is owner OR admin
    if (business.owner_id !== req.user.id && req.user.role !== 'admin') {
      res.status(403).json({ error: 'You do not have permission to access this business' });
      return;
    }

    next();
  } catch (error) {
    console.error('Business ownership check error:', error);
    res.status(500).json({ error: 'Failed to verify business ownership' });
    return;
  }
};
