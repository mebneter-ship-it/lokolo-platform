import { getPool } from '../config/database';
import { Favorite } from '../models/types';

/**
 * Add business to user's favorites
 */
export const addFavorite = async (userId: string, businessId: string): Promise<Favorite> => {
  const pool = getPool();
  
  try {
    const result = await pool.query(
      `INSERT INTO favorites (user_id, business_id)
       VALUES ($1, $2)
       RETURNING *`,
      [userId, businessId]
    );
    return result.rows[0];
  } catch (error: any) {
    // Handle duplicate favorite (already exists)
    if (error.code === '23505') {
      const existing = await pool.query(
        'SELECT * FROM favorites WHERE user_id = $1 AND business_id = $2',
        [userId, businessId]
      );
      return existing.rows[0];
    }
    throw error;
  }
};

/**
 * Remove business from user's favorites
 */
export const removeFavorite = async (userId: string, businessId: string): Promise<void> => {
  const pool = getPool();
  await pool.query(
    'DELETE FROM favorites WHERE user_id = $1 AND business_id = $2',
    [userId, businessId]
  );
};

/**
 * Check if business is favorited by user
 */
export const isFavorited = async (userId: string, businessId: string): Promise<boolean> => {
  const pool = getPool();
  const result = await pool.query(
    'SELECT 1 FROM favorites WHERE user_id = $1 AND business_id = $2',
    [userId, businessId]
  );
  return result.rows.length > 0;
};

/**
 * Get user's favorite businesses
 */
export const getUserFavorites = async (userId: string, page: number = 1, limit: number = 20) => {
  const pool = getPool();
  const offset = (page - 1) * limit;
  
  const result = await pool.query(
    `SELECT b.*, f.created_at as favorited_at
     FROM favorites f
     INNER JOIN businesses b ON f.business_id = b.id
     WHERE f.user_id = $1 AND b.status = 'active'
     ORDER BY f.created_at DESC
     LIMIT $2 OFFSET $3`,
    [userId, limit, offset]
  );
  
  // Get total count
  const countResult = await pool.query(
    `SELECT COUNT(*) FROM favorites f
     INNER JOIN businesses b ON f.business_id = b.id
     WHERE f.user_id = $1 AND b.status = 'active'`,
    [userId]
  );
  
  return {
    favorites: result.rows,
    total: parseInt(countResult.rows[0].count),
  };
};

/**
 * Get favorite count for a business
 */
export const getBusinessFavoriteCount = async (businessId: string): Promise<number> => {
  const pool = getPool();
  const result = await pool.query(
    'SELECT COUNT(*) FROM favorites WHERE business_id = $1',
    [businessId]
  );
  return parseInt(result.rows[0].count);
};
