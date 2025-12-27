import { getPool } from '../config/database';

/**
 * Get platform statistics for admin dashboard
 */
export const getStats = async () => {
  const pool = getPool();
  
  // Get all stats in parallel
  const [
    usersResult,
    businessesResult,
    businessStatusResult,
    verificationResult,
    ratingsResult,
    favoritesResult
  ] = await Promise.all([
    // Total users by role
    pool.query(`
      SELECT role, COUNT(*) as count 
      FROM users 
      GROUP BY role
    `),
    
    // Total businesses
    pool.query(`SELECT COUNT(*) as count FROM businesses`),
    
    // Businesses by status
    pool.query(`
      SELECT status, COUNT(*) as count 
      FROM businesses 
      GROUP BY status
    `),
    
    // Verification status counts
    pool.query(`
      SELECT verification_status, COUNT(*) as count 
      FROM businesses 
      GROUP BY verification_status
    `),
    
    // Total ratings
    pool.query(`SELECT COUNT(*) as count FROM business_ratings`),
    
    // Total favorites
    pool.query(`SELECT COUNT(*) as count FROM favorites`),
  ]);
  
  // Parse user counts by role
  const usersByRole: Record<string, number> = {};
  let totalUsers = 0;
  for (const row of usersResult.rows) {
    usersByRole[row.role] = parseInt(row.count);
    totalUsers += parseInt(row.count);
  }
  
  // Parse business status counts
  const businessesByStatus: Record<string, number> = {};
  for (const row of businessStatusResult.rows) {
    businessesByStatus[row.status] = parseInt(row.count);
  }
  
  // Parse verification status counts
  const businessesByVerification: Record<string, number> = {};
  for (const row of verificationResult.rows) {
    businessesByVerification[row.verification_status] = parseInt(row.count);
  }
  
  return {
    users: {
      total: totalUsers,
      consumers: usersByRole['consumer'] || 0,
      suppliers: usersByRole['supplier'] || 0,
      admins: usersByRole['admin'] || 0,
    },
    businesses: {
      total: parseInt(businessesResult.rows[0].count),
      active: businessesByStatus['active'] || 0,
      draft: businessesByStatus['draft'] || 0,
      suspended: businessesByStatus['suspended'] || 0,
      archived: businessesByStatus['archived'] || 0,
    },
    verification: {
      pending: businessesByVerification['pending'] || 0,
      approved: businessesByVerification['approved'] || 0,
      rejected: businessesByVerification['rejected'] || 0,
    },
    engagement: {
      total_ratings: parseInt(ratingsResult.rows[0].count),
      total_favorites: parseInt(favoritesResult.rows[0].count),
    }
  };
};

/**
 * Get all users with pagination
 */
export const getUsers = async (page: number = 1, limit: number = 20, filters?: {
  role?: string;
  search?: string;
}) => {
  const pool = getPool();
  const offset = (page - 1) * limit;
  
  let whereClause = '';
  const params: any[] = [];
  let paramIndex = 1;
  
  if (filters?.role) {
    whereClause += ` WHERE role = $${paramIndex++}`;
    params.push(filters.role);
  }
  
  if (filters?.search) {
    const searchCondition = whereClause ? ' AND' : ' WHERE';
    whereClause += `${searchCondition} (email ILIKE $${paramIndex++} OR display_name ILIKE $${paramIndex++})`;
    params.push(`%${filters.search}%`, `%${filters.search}%`);
  }
  
  // Get users
  const usersQuery = `
    SELECT id, firebase_uid, email, display_name, role, created_at, updated_at
    FROM users
    ${whereClause}
    ORDER BY created_at DESC
    LIMIT $${paramIndex++} OFFSET $${paramIndex++}
  `;
  params.push(limit, offset);
  
  const usersResult = await pool.query(usersQuery, params);
  
  // Get total count
  const countParams = params.slice(0, -2); // Remove limit and offset
  const countResult = await pool.query(
    `SELECT COUNT(*) FROM users ${whereClause}`,
    countParams
  );
  
  return {
    users: usersResult.rows,
    total: parseInt(countResult.rows[0].count),
  };
};

/**
 * Get recent activity for admin dashboard
 */
export const getRecentActivity = async (limit: number = 10) => {
  const pool = getPool();
  
  // Get recent businesses
  const recentBusinesses = await pool.query(`
    SELECT b.id, b.name, b.status, b.verification_status, b.created_at,
           u.display_name as owner_name, u.email as owner_email
    FROM businesses b
    JOIN users u ON b.owner_id = u.id
    ORDER BY b.created_at DESC
    LIMIT $1
  `, [limit]);
  
  // Get recent users
  const recentUsers = await pool.query(`
    SELECT id, email, display_name, role, created_at
    FROM users
    ORDER BY created_at DESC
    LIMIT $1
  `, [limit]);
  
  return {
    recent_businesses: recentBusinesses.rows,
    recent_users: recentUsers.rows,
  };
};
