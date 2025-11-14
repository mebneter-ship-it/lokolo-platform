import { getPool } from '../config/database';
import { Business, BusinessStatus, BusinessSearchFilters, BusinessWithDistance } from '../models/types';

/**
 * Get business by ID
 */
export const getBusinessById = async (businessId: string): Promise<Business | null> => {
  const pool = getPool();
  const result = await pool.query('SELECT * FROM businesses WHERE id = $1', [businessId]);
  return result.rows[0] || null;
};

/**
 * Create new business
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
  
  const location = `POINT(${data.longitude} ${data.latitude})`;
  
  const result = await pool.query(
    `INSERT INTO businesses (
      owner_id, name, tagline, description, email, phone_number, whatsapp_number, 
      website_url, location, address_line1, address_line2, city, province_state, 
      postal_code, country, year_established, employee_count_range, status
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, ST_GeographyFromText($9), $10, $11, $12, $13, $14, $15, $16, $17, $18)
    RETURNING *`,
    [
      data.owner_id, data.name, data.tagline || null, data.description || null,
      data.email || null, data.phone_number || null, data.whatsapp_number || null,
      data.website_url || null, location, data.address_line1 || null, 
      data.address_line2 || null, data.city, data.province_state || null,
      data.postal_code || null, data.country || 'ZA', data.year_established || null,
      data.employee_count_range || null, 'draft'
    ]
  );
  
  return result.rows[0];
};

/**
 * Update business
 */
export const updateBusiness = async (businessId: string, data: Partial<{
  name: string;
  tagline: string;
  description: string;
  email: string;
  phone_number: string;
  whatsapp_number: string;
  website_url: string;
  latitude: number;
  longitude: number;
  address_line1: string;
  address_line2: string;
  city: string;
  province_state: string;
  postal_code: string;
  country: string;
  year_established: number;
  employee_count_range: string;
  status: BusinessStatus;
}>): Promise<Business> => {
  const pool = getPool();
  const updates: string[] = [];
  const values: any[] = [];
  let paramIndex = 1;

  if (data.latitude !== undefined && data.longitude !== undefined) {
    const location = `POINT(${data.longitude} ${data.latitude})`;
    updates.push(`location = ST_GeographyFromText($${paramIndex++})`);
    values.push(location);
  }

  const simpleFields = [
    'name', 'tagline', 'description', 'email', 'phone_number', 'whatsapp_number',
    'website_url', 'address_line1', 'address_line2', 'city', 'province_state',
    'postal_code', 'country', 'year_established', 'employee_count_range', 'status'
  ];

  simpleFields.forEach(field => {
    if (data[field as keyof typeof data] !== undefined) {
      updates.push(`${field} = $${paramIndex++}`);
      values.push(data[field as keyof typeof data]);
    }
  });

  values.push(businessId);

  const result = await pool.query(
    `UPDATE businesses SET ${updates.join(', ')}, updated_at = CURRENT_TIMESTAMP
     WHERE id = $${paramIndex} RETURNING *`,
    values
  );

  return result.rows[0];
};

/**
 * Search businesses with geospatial filtering
 */
export const searchBusinesses = async (filters: BusinessSearchFilters): Promise<BusinessWithDistance[]> => {
  const pool = getPool();
  const conditions: string[] = ['status = $1'];
  const values: any[] = ['active'];
  let paramIndex = 2;

  if (filters.query) {
    conditions.push(`(name ILIKE $${paramIndex} OR description ILIKE $${paramIndex})`);
    values.push(`%${filters.query}%`);
    paramIndex++;
  }

  if (filters.city) {
    conditions.push(`city ILIKE $${paramIndex}`);
    values.push(`%${filters.city}%`);
    paramIndex++;
  }

  let categoryJoin = '';
  if (filters.category) {
    categoryJoin = 'INNER JOIN business_categories bc ON businesses.id = bc.business_id';
    conditions.push(`bc.category_name = $${paramIndex}`);
    values.push(filters.category);
    paramIndex++;
  }

  let distanceSelect = 'NULL as distance_km';
  let coordinatesSelect = 'NULL as latitude, NULL as longitude';
  
  if (filters.latitude && filters.longitude) {
    const userLocation = `POINT(${filters.longitude} ${filters.latitude})`;
    const radiusKm = filters.radius_km || 50;
    
    distanceSelect = `ST_Distance(location, ST_GeographyFromText($${paramIndex})) / 1000 as distance_km`;
    coordinatesSelect = `ST_Y(location::geometry) as latitude, ST_X(location::geometry) as longitude`;
    conditions.push(`ST_DWithin(location, ST_GeographyFromText($${paramIndex}), $${paramIndex + 1})`);
    values.push(userLocation, radiusKm * 1000);
    paramIndex += 2;
  }

  const page = filters.page || 1;
  const limit = filters.limit || 20;
  const offset = (page - 1) * limit;

  const query = `
    SELECT DISTINCT businesses.*, ${distanceSelect}, ${coordinatesSelect}
    FROM businesses
    ${categoryJoin}
    WHERE ${conditions.join(' AND ')}
    ORDER BY ${filters.latitude ? 'distance_km ASC' : 'created_at DESC'}
    LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
  `;

  values.push(limit, offset);

  const result = await pool.query(query, values);
  return result.rows;
};

/**
 * Publish business
 */
export const publishBusiness = async (businessId: string): Promise<Business> => {
  const pool = getPool();
  const result = await pool.query(
    `UPDATE businesses 
     SET status = 'active', published_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
     WHERE id = $1 RETURNING *`,
    [businessId]
  );
  return result.rows[0];
};

/**
 * Delete business
 */
export const deleteBusiness = async (businessId: string): Promise<void> => {
  const pool = getPool();
  await pool.query('DELETE FROM businesses WHERE id = $1', [businessId]);
};
