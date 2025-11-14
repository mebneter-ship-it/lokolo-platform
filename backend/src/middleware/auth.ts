import { Request, Response, NextFunction } from 'express';
import { verifyIdToken } from '../config/firebase';
import { getPool } from '../config/database';
import { DecodedIdToken } from 'firebase-admin/auth';

// Extend Express Request to include user info
export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    firebase_uid: string;
    email: string;
    role: 'consumer' | 'supplier' | 'admin';
    decodedToken: DecodedIdToken;
  };
}

/**
 * Middleware to verify Firebase token and load/create user
 */
export const authenticate = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // Extract token from Authorization header
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({ error: 'No token provided' });
      return;
    }

    const idToken = authHeader.split('Bearer ')[1];

    // Verify Firebase token
    const decodedToken = await verifyIdToken(idToken);

    // Get or create user in database
    const pool = getPool();
    
    // Check if user exists
    let userResult = await pool.query(
      'SELECT id, firebase_uid, email, role FROM users WHERE firebase_uid = $1',
      [decodedToken.uid]
    );

    let user;

    if (userResult.rows.length === 0) {
      // User doesn't exist, create new user
      const insertResult = await pool.query(
        `INSERT INTO users (firebase_uid, email, display_name, profile_photo_url, role)
         VALUES ($1, $2, $3, $4, $5)
         RETURNING id, firebase_uid, email, role`,
        [
          decodedToken.uid,
          decodedToken.email || '',
          decodedToken.name || null,
          decodedToken.picture || null,
          'consumer' // Default role
        ]
      );
      user = insertResult.rows[0];
      console.log(`✅ Created new user: ${user.email}`);
    } else {
      user = userResult.rows[0];
      
      // Update last_login_at
      await pool.query(
        'UPDATE users SET last_login_at = CURRENT_TIMESTAMP WHERE id = $1',
        [user.id]
      );
    }

    // Attach user info to request
    req.user = {
      id: user.id,
      firebase_uid: user.firebase_uid,
      email: user.email,
      role: user.role,
      decodedToken,
    };

    next();
  } catch (error) {
    console.error('Authentication error:', error);
    res.status(401).json({ error: 'Authentication failed' });
    return;
  }
};

/**
 * Middleware to require specific role(s)
 */
export const requireRole = (...allowedRoles: Array<'consumer' | 'supplier' | 'admin'>) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ error: 'Not authenticated' });
      return;
    }

    if (!allowedRoles.includes(req.user.role)) {
      res.status(403).json({ 
        error: 'Forbidden',
        message: `This endpoint requires one of the following roles: ${allowedRoles.join(', ')}` 
      });
      return;
    }

    next();
  };
};

/**
 * Optional authentication - doesn't fail if no token provided
 */
export const optionalAuth = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      // No token provided, continue without user
      next();
      return;
    }

    // Token provided, try to authenticate
    await authenticate(req, res, next);
  } catch (error) {
    // Authentication failed, but continue without user
    console.warn('Optional auth failed:', error);
    next();
  }
};
