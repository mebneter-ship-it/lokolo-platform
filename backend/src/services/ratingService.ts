import { getPool } from '../config/database';

export interface Rating {
  id: string;
  business_id: string;
  user_id: string;
  rating: number;
  review_text?: string;
  created_at: Date;
  updated_at: Date;
}

export interface RatingWithUser extends Rating {
  user_name?: string;
}

export interface BusinessRatingSummary {
  average_rating: number;
  total_ratings: number;
  rating_distribution: {
    1: number;
    2: number;
    3: number;
    4: number;
    5: number;
  };
}

/**
 * Add or update a rating for a business
 * Uses UPSERT to handle both new ratings and updates
 */
export const upsertRating = async (data: {
  business_id: string;
  user_id: string;
  rating: number;
  review_text?: string;
}): Promise<Rating> => {
  const pool = getPool();
  
  const result = await pool.query(
    `INSERT INTO business_ratings (business_id, user_id, rating, review_text)
     VALUES ($1, $2, $3, $4)
     ON CONFLICT (user_id, business_id) 
     DO UPDATE SET 
       rating = EXCLUDED.rating,
       review_text = EXCLUDED.review_text,
       updated_at = CURRENT_TIMESTAMP
     RETURNING *`,
    [data.business_id, data.user_id, data.rating, data.review_text || null]
  );
  
  return result.rows[0];
};

/**
 * Get a user's rating for a specific business
 */
export const getUserRating = async (
  businessId: string,
  userId: string
): Promise<Rating | null> => {
  const pool = getPool();
  
  const result = await pool.query(
    `SELECT * FROM business_ratings 
     WHERE business_id = $1 AND user_id = $2`,
    [businessId, userId]
  );
  
  return result.rows[0] || null;
};

/**
 * Delete a user's rating for a business
 */
export const deleteRating = async (
  businessId: string,
  userId: string
): Promise<boolean> => {
  const pool = getPool();
  
  const result = await pool.query(
    `DELETE FROM business_ratings 
     WHERE business_id = $1 AND user_id = $2
     RETURNING id`,
    [businessId, userId]
  );
  
  return (result.rowCount ?? 0) > 0;
};

/**
 * Get rating summary for a business (average + count + distribution)
 */
export const getBusinessRatingSummary = async (
  businessId: string
): Promise<BusinessRatingSummary> => {
  const pool = getPool();
  
  const result = await pool.query(
    `SELECT 
       COALESCE(AVG(rating), 0) as average_rating,
       COUNT(*) as total_ratings,
       COUNT(*) FILTER (WHERE rating = 1) as rating_1,
       COUNT(*) FILTER (WHERE rating = 2) as rating_2,
       COUNT(*) FILTER (WHERE rating = 3) as rating_3,
       COUNT(*) FILTER (WHERE rating = 4) as rating_4,
       COUNT(*) FILTER (WHERE rating = 5) as rating_5
     FROM business_ratings 
     WHERE business_id = $1`,
    [businessId]
  );
  
  const row = result.rows[0];
  
  return {
    average_rating: parseFloat(row.average_rating) || 0,
    total_ratings: parseInt(row.total_ratings) || 0,
    rating_distribution: {
      1: parseInt(row.rating_1) || 0,
      2: parseInt(row.rating_2) || 0,
      3: parseInt(row.rating_3) || 0,
      4: parseInt(row.rating_4) || 0,
      5: parseInt(row.rating_5) || 0,
    },
  };
};

/**
 * Get all ratings for a business with user info
 */
export const getBusinessRatings = async (
  businessId: string,
  limit: number = 20,
  offset: number = 0
): Promise<RatingWithUser[]> => {
  const pool = getPool();
  
  const result = await pool.query(
    `SELECT 
       r.*,
       u.display_name as user_name
     FROM business_ratings r
     LEFT JOIN users u ON r.user_id = u.id
     WHERE r.business_id = $1
     ORDER BY r.created_at DESC
     LIMIT $2 OFFSET $3`,
    [businessId, limit, offset]
  );
  
  return result.rows;
};

/**
 * Get average rating for multiple businesses at once (for list views)
 */
export const getBusinessesRatings = async (
  businessIds: string[]
): Promise<Map<string, { average_rating: number; total_ratings: number }>> => {
  const pool = getPool();
  
  if (businessIds.length === 0) {
    return new Map();
  }
  
  const result = await pool.query(
    `SELECT 
       business_id,
       COALESCE(AVG(rating), 0) as average_rating,
       COUNT(*) as total_ratings
     FROM business_ratings 
     WHERE business_id = ANY($1)
     GROUP BY business_id`,
    [businessIds]
  );
  
  const map = new Map<string, { average_rating: number; total_ratings: number }>();
  
  for (const row of result.rows) {
    map.set(row.business_id, {
      average_rating: parseFloat(row.average_rating) || 0,
      total_ratings: parseInt(row.total_ratings) || 0,
    });
  }
  
  return map;
};
