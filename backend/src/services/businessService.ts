import { getPool } from '../config/database';
import { Business, BusinessWithDistance, BusinessSearchFilters } from '../models/types';

/**
 * Create a new business
 */
export const createBusiness = async (data: {
  owner_id: string;
  name: string;
  tagline?: string;
  description?: string;
  email?: string;
  phone_number?: string;
  whatsapp_number?: string;
  website_url?: string;
  facebook_url?: string;
  instagram_url?: string;
  twitter_url?: string;
  linkedin_url?: string;
  tiktok_url?: string;
  latitude: number;
  longitude: number;
  address_line1?: string;
  address_line2?: string;
  city: string;
  province_state?: string;
  postal_code?: string;
  country?: string;
  year_established?: number;
  employee_count_range?: string;
}): Promise<Business> => {
  const pool = getPool();
  
  // Create PostGIS POINT from lat/long
  const location = `POINT(${data.longitude} ${data.latitude})`;
  
  const result = await pool.query(
    `INSERT INTO businesses (
      owner_id, name, tagline, description, email, phone_number, whatsapp_number, 
      website_url, facebook_url, instagram_url, twitter_url, linkedin_url, tiktok_url,
      location, address_line1, address_line2, city, province_state, 
      postal_code, country, year_established, employee_count_range, status, verification_status
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, ST_GeographyFromText($14), $15, $16, $17, $18, $19, $20, $21, $22, $23, $24)
    RETURNING *`,
    [
      data.owner_id,
      data.name,
      data.tagline || null,
      data.description || null,
      data.email || null,
      data.phone_number || null,
      data.whatsapp_number || null,
      data.website_url || null,
      data.facebook_url || null,
      data.instagram_url || null,
      data.twitter_url || null,
      data.linkedin_url || null,
      data.tiktok_url || null,
      location,
      data.address_line1 || null,
      data.address_line2 || null,
      data.city,
      data.province_state || null,
      data.postal_code || null,
      data.country || 'ZA',
      data.year_established || null,
      data.employee_count_range || null,
      'draft',
      'pending'
    ]
  );
  
  return result.rows[0];
};

/**
 * Get business by ID
 */
export const getBusinessById = async (id: string): Promise<Business | null> => {
  const pool = getPool();
  
  const result = await pool.query(
    `SELECT 
      id, owner_id, name, tagline, description, email, phone_number, whatsapp_number,
      website_url, facebook_url, instagram_url, twitter_url, linkedin_url, tiktok_url,
      ST_AsText(location) as location,
      ST_Y(location::geometry) as latitude,
      ST_X(location::geometry) as longitude,
      address_line1, address_line2, city, province_state, postal_code, country,
      year_established, employee_count_range, status, verification_status,
      verified_at, created_at, updated_at, published_at, metadata
    FROM businesses 
    WHERE id = $1`,
    [id]
  );
  
  return result.rows[0] || null;
};

/**
 * Update business
 */
export const updateBusiness = async (
  id: string, 
  data: Partial<Omit<Business, 'id' | 'owner_id' | 'created_at' | 'updated_at'>>
): Promise<Business> => {
  const pool = getPool();
  
  // Build dynamic update query
  const updateFields: string[] = [];
  const values: any[] = [];
  let paramIndex = 1;
  
  Object.entries(data).forEach(([key, value]) => {
    if (value !== undefined && key !== 'id' && key !== 'owner_id' && key !== 'created_at' && key !== 'updated_at') {
      updateFields.push(`${key} = $${paramIndex}`);
      values.push(value);
      paramIndex++;
    }
  });
  
  if (updateFields.length === 0) {
    throw new Error('No fields to update');
  }
  
  // Add updated_at
  updateFields.push(`updated_at = CURRENT_TIMESTAMP`);
  
  // Add id for WHERE clause
  values.push(id);
  
  const result = await pool.query(
    `UPDATE businesses 
     SET ${updateFields.join(', ')}
     WHERE id = $${paramIndex}
     RETURNING *`,
    values
  );
  
  if (result.rows.length === 0) {
    throw new Error('Business not found');
  }
  
  return result.rows[0];
};

/**
 * Delete business
 */
export const deleteBusiness = async (id: string): Promise<void> => {
  const pool = getPool();
  
  await pool.query('DELETE FROM businesses WHERE id = $1', [id]);
};

/**
 * Publish business (change status to pending for admin review)
 */
export const publishBusiness = async (id: string): Promise<Business> => {
  const pool = getPool();
  
  const result = await pool.query(
    `UPDATE businesses 
     SET status = 'pending', updated_at = CURRENT_TIMESTAMP
     WHERE id = $1
     RETURNING *`,
    [id]
  );
  
  if (result.rows.length === 0) {
    throw new Error('Business not found');
  }
  
  return result.rows[0];
};

/**
 * Approve business (admin sets status to active)
 */
export const approveBusiness = async (id: string): Promise<Business> => {
  const pool = getPool();
  
  const result = await pool.query(
    `UPDATE businesses 
     SET status = 'active', published_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
     WHERE id = $1
     RETURNING *`,
    [id]
  );
  
  if (result.rows.length === 0) {
    throw new Error('Business not found');
  }
  
  return result.rows[0];
};

/**
 * Reject business submission (admin rejects)
 */
export const rejectBusinessSubmission = async (id: string, reason?: string): Promise<Business> => {
  const pool = getPool();
  
  const result = await pool.query(
    `UPDATE businesses 
     SET status = 'rejected', rejection_reason = $2, updated_at = CURRENT_TIMESTAMP
     WHERE id = $1
     RETURNING *`,
    [id, reason || null]
  );
  
  if (result.rows.length === 0) {
    throw new Error('Business not found');
  }
  
  return result.rows[0];
};

/**
 * Search businesses by location and filters
 */
export const searchBusinesses = async (filters: BusinessSearchFilters): Promise<BusinessWithDistance[]> => {
  const pool = getPool();
  
  const conditions: string[] = [];
  const values: any[] = [];
  let paramIndex = 1;
  
  // Status filter - default to 'active' only if no status specified
  if (filters.status) {
    conditions.push(`status = $${paramIndex}`);
    values.push(filters.status);
    paramIndex++;
  } else if (filters.status !== null) {
    // Default to active for consumer search (when status is undefined)
    // Pass status=null to get all statuses (admin use)
    conditions.push(`status = 'active'`);
  }
  
  // Location-based search
  if (filters.latitude && filters.longitude) {
    const radiusMeters = (filters.radius_km || 10) * 1000;
    conditions.push(`ST_DWithin(location, ST_GeographyFromText('POINT(${filters.longitude} ${filters.latitude})'), ${radiusMeters})`);
  }
  
  // City filter
  if (filters.city) {
    conditions.push(`LOWER(city) = LOWER($${paramIndex})`);
    values.push(filters.city);
    paramIndex++;
  }
  
  // Category filter
  if (filters.category) {
    conditions.push(`id IN (SELECT business_id FROM business_categories WHERE category_name = $${paramIndex})`);
    values.push(filters.category);
    paramIndex++;
  }
  
  // Verification status filter
  if (filters.verification_status) {
    conditions.push(`verification_status = $${paramIndex}`);
    values.push(filters.verification_status);
    paramIndex++;
  }
  
  const limit = filters.limit || 20;
  const offset = filters.page ? (filters.page - 1) * limit : 0;
  
  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
  
  const query = `
    SELECT 
      id, owner_id, name, tagline, description, email, phone_number, whatsapp_number,
      website_url, facebook_url, instagram_url, twitter_url, linkedin_url, tiktok_url,
      location,
      ST_Y(location::geometry) as latitude,
      ST_X(location::geometry) as longitude,
      ${filters.latitude && filters.longitude ? `ST_Distance(location, ST_GeographyFromText('POINT(${filters.longitude} ${filters.latitude})')) / 1000 as distance_km,` : ''}
      address_line1, address_line2, city, province_state, postal_code, country,
      year_established, employee_count_range, status, verification_status,
      verified_at, created_at, updated_at, published_at, metadata
    FROM businesses 
    ${whereClause}
    ${filters.latitude && filters.longitude ? 'ORDER BY distance_km ASC' : 'ORDER BY created_at DESC'}
    LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
  `;
  
  values.push(limit, offset);
  
  const result = await pool.query(query, values);
  return result.rows;
};

/**
 * Get businesses by owner
 */
export const getBusinessesByOwner = async (ownerId: string): Promise<Business[]> => {
  const pool = getPool();
  
  const result = await pool.query(
    `SELECT 
      id, owner_id, name, tagline, description, email, phone_number, whatsapp_number,
      website_url, facebook_url, instagram_url, twitter_url, linkedin_url, tiktok_url,
      location,
      ST_Y(location::geometry) as latitude,
      ST_X(location::geometry) as longitude,
      address_line1, address_line2, city, province_state, postal_code, country,
      year_established, employee_count_range, status, verification_status,
      verified_at, created_at, updated_at, published_at, metadata
    FROM businesses 
    WHERE owner_id = $1
    ORDER BY created_at DESC`,
    [ownerId]
  );
  
  return result.rows;
};

/**
 * Get business with full details (including categories, hours, media)
 */
export const getBusinessWithDetails = async (id: string): Promise<any> => {
  const pool = getPool();
  
  const business = await getBusinessById(id);
  if (!business) return null;
  
  // Get categories
  const categoriesResult = await pool.query(
    'SELECT category_name FROM business_categories WHERE business_id = $1',
    [id]
  );
  
  // Get business hours
  const hoursResult = await pool.query(
    `SELECT day_of_week, opens_at, closes_at, is_closed 
     FROM business_hours 
     WHERE business_id = $1 
     ORDER BY CASE day_of_week 
       WHEN 'monday' THEN 1 
       WHEN 'tuesday' THEN 2 
       WHEN 'wednesday' THEN 3 
       WHEN 'thursday' THEN 4 
       WHEN 'friday' THEN 5 
       WHEN 'saturday' THEN 6 
       WHEN 'sunday' THEN 7 
     END`,
    [id]
  );
  
  return {
    ...business,
    categories: categoriesResult.rows.map(r => r.category_name),
    business_hours: hoursResult.rows,
  };
};
// ADD THIS METHOD TO backend/src/services/businessService.ts

/**
 * Update business
 */
