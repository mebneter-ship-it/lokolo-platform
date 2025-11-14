import { getPool } from '../config/database';
import { User, UserRole } from '../models/types';

/**
 * Get user by ID
 */
export const getUserById = async (userId: string): Promise<User | null> => {
  const pool = getPool();
  const result = await pool.query('SELECT * FROM users WHERE id = $1', [userId]);
  return result.rows[0] || null;
};

/**
 * Get user by Firebase UID
 */
export const getUserByFirebaseUid = async (firebaseUid: string): Promise<User | null> => {
  const pool = getPool();
  const result = await pool.query('SELECT * FROM users WHERE firebase_uid = $1', [firebaseUid]);
  return result.rows[0] || null;
};

/**
 * Create new user
 */
export const createUser = async (data: {
  firebase_uid: string;
  email: string;
  display_name?: string;
  profile_photo_url?: string;
  phone_number?: string;
  role?: UserRole;
}): Promise<User> => {
  const pool = getPool();
  const result = await pool.query(
    `INSERT INTO users (firebase_uid, email, display_name, profile_photo_url, phone_number, role)
     VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
    [data.firebase_uid, data.email, data.display_name || null, data.profile_photo_url || null, 
     data.phone_number || null, data.role || 'consumer']
  );
  return result.rows[0];
};

/**
 * Update user profile
 */
export const updateUser = async (userId: string, data: {
  display_name?: string;
  phone_number?: string;
  profile_photo_url?: string;
}): Promise<User> => {
  const pool = getPool();
  const updates: string[] = [];
  const values: any[] = [];
  let paramIndex = 1;

  if (data.display_name !== undefined) {
    updates.push(`display_name = $${paramIndex++}`);
    values.push(data.display_name);
  }
  if (data.phone_number !== undefined) {
    updates.push(`phone_number = $${paramIndex++}`);
    values.push(data.phone_number);
  }
  if (data.profile_photo_url !== undefined) {
    updates.push(`profile_photo_url = $${paramIndex++}`);
    values.push(data.profile_photo_url);
  }

  values.push(userId);
  const result = await pool.query(
    `UPDATE users SET ${updates.join(', ')}, updated_at = CURRENT_TIMESTAMP
     WHERE id = $${paramIndex} RETURNING *`,
    values
  );
  return result.rows[0];
};

/**
 * Update user role (admin only)
 */
export const updateUserRole = async (userId: string, role: UserRole): Promise<User> => {
  const pool = getPool();
  const result = await pool.query(
    `UPDATE users SET role = $1, updated_at = CURRENT_TIMESTAMP
     WHERE id = $2
     RETURNING *`,
    [role, userId]
  );
  return result.rows[0];
};

/**
 * Get user's businesses (for suppliers)
 */
export const getUserBusinesses = async (userId: string) => {
  const pool = getPool();
  const result = await pool.query(
    'SELECT * FROM businesses WHERE owner_id = $1 ORDER BY created_at DESC',
    [userId]
  );
  return result.rows;
};
