import { getPool } from '../config/database';

// Event types
export type EventType = 
  | 'page_view'           // Viewed business profile
  | 'contact_click_phone' // Clicked phone number
  | 'contact_click_whatsapp' // Clicked WhatsApp
  | 'contact_click_website'  // Clicked website
  | 'contact_click_email'    // Clicked email
  | 'search_impression'      // Business appeared in search results
  | 'map_pin_click'          // Clicked pin on map
  | 'favorite_add'           // Added to favorites
  | 'favorite_remove'        // Removed from favorites
  | 'share';                 // Shared business

interface TrackEventParams {
  eventType: EventType;
  businessId?: string;
  userId?: string;
  sessionId?: string;
  metadata?: Record<string, any>;
}

/**
 * Track an analytics event
 */
export const trackEvent = async (params: TrackEventParams): Promise<void> => {
  const pool = getPool();
  
  try {
    await pool.query(
      `INSERT INTO analytics_events (event_type, business_id, user_id, session_id, metadata)
       VALUES ($1, $2, $3, $4, $5)`,
      [
        params.eventType,
        params.businessId || null,
        params.userId || null,
        params.sessionId || null,
        JSON.stringify(params.metadata || {}),
      ]
    );
  } catch (error) {
    // Don't throw - analytics should never break the app
    console.error('Failed to track event:', error);
  }
};

/**
 * Track multiple events (batch insert for search impressions)
 */
export const trackBatchEvents = async (events: TrackEventParams[]): Promise<void> => {
  if (events.length === 0) return;
  
  const pool = getPool();
  
  try {
    const values: any[] = [];
    const placeholders: string[] = [];
    let paramIndex = 1;
    
    for (const event of events) {
      placeholders.push(`($${paramIndex}, $${paramIndex + 1}, $${paramIndex + 2}, $${paramIndex + 3}, $${paramIndex + 4})`);
      values.push(
        event.eventType,
        event.businessId || null,
        event.userId || null,
        event.sessionId || null,
        JSON.stringify(event.metadata || {})
      );
      paramIndex += 5;
    }
    
    await pool.query(
      `INSERT INTO analytics_events (event_type, business_id, user_id, session_id, metadata)
       VALUES ${placeholders.join(', ')}`,
      values
    );
  } catch (error) {
    console.error('Failed to track batch events:', error);
  }
};

/**
 * Get business stats (for supplier dashboard)
 */
export const getBusinessStats = async (
  businessId: string,
  days: number = 30
): Promise<{
  total_views: number;
  total_contact_clicks: number;
  total_favorites: number;
  views_by_day: { date: string; count: number }[];
}> => {
  const pool = getPool();
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);
  
  // Total views
  const viewsResult = await pool.query(
    `SELECT COUNT(*) FROM analytics_events 
     WHERE business_id = $1 AND event_type = 'page_view' AND created_at >= $2`,
    [businessId, startDate]
  );
  
  // Total contact clicks (all types)
  const contactsResult = await pool.query(
    `SELECT COUNT(*) FROM analytics_events 
     WHERE business_id = $1 
     AND event_type IN ('contact_click_phone', 'contact_click_whatsapp', 'contact_click_website', 'contact_click_email')
     AND created_at >= $2`,
    [businessId, startDate]
  );
  
  // Total favorites (current count from favorites table)
  const favoritesResult = await pool.query(
    `SELECT COUNT(*) FROM favorites WHERE business_id = $1`,
    [businessId]
  );
  
  // Views by day
  const viewsByDayResult = await pool.query(
    `SELECT DATE(created_at) as date, COUNT(*) as count
     FROM analytics_events
     WHERE business_id = $1 AND event_type = 'page_view' AND created_at >= $2
     GROUP BY DATE(created_at)
     ORDER BY date`,
    [businessId, startDate]
  );
  
  return {
    total_views: parseInt(viewsResult.rows[0].count),
    total_contact_clicks: parseInt(contactsResult.rows[0].count),
    total_favorites: parseInt(favoritesResult.rows[0].count),
    views_by_day: viewsByDayResult.rows.map(row => ({
      date: row.date.toISOString().split('T')[0],
      count: parseInt(row.count),
    })),
  };
};

/**
 * Get detailed business analytics (for supplier)
 */
export const getBusinessAnalytics = async (
  businessId: string,
  days: number = 30
): Promise<{
  summary: {
    total_views: number;
    total_contact_clicks: number;
    phone_clicks: number;
    whatsapp_clicks: number;
    website_clicks: number;
    email_clicks: number;
    favorites_added: number;
    favorites_removed: number;
    search_impressions: number;
    map_clicks: number;
  };
  daily: { date: string; views: number; contacts: number }[];
}> => {
  const pool = getPool();
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);
  
  // Get all event counts by type
  const summaryResult = await pool.query(
    `SELECT event_type, COUNT(*) as count
     FROM analytics_events
     WHERE business_id = $1 AND created_at >= $2
     GROUP BY event_type`,
    [businessId, startDate]
  );
  
  const counts: Record<string, number> = {};
  for (const row of summaryResult.rows) {
    counts[row.event_type] = parseInt(row.count);
  }
  
  // Daily breakdown
  const dailyResult = await pool.query(
    `SELECT 
       DATE(created_at) as date,
       COUNT(*) FILTER (WHERE event_type = 'page_view') as views,
       COUNT(*) FILTER (WHERE event_type IN ('contact_click_phone', 'contact_click_whatsapp', 'contact_click_website', 'contact_click_email')) as contacts
     FROM analytics_events
     WHERE business_id = $1 AND created_at >= $2
     GROUP BY DATE(created_at)
     ORDER BY date`,
    [businessId, startDate]
  );
  
  return {
    summary: {
      total_views: counts['page_view'] || 0,
      total_contact_clicks: (counts['contact_click_phone'] || 0) + 
                           (counts['contact_click_whatsapp'] || 0) + 
                           (counts['contact_click_website'] || 0) + 
                           (counts['contact_click_email'] || 0),
      phone_clicks: counts['contact_click_phone'] || 0,
      whatsapp_clicks: counts['contact_click_whatsapp'] || 0,
      website_clicks: counts['contact_click_website'] || 0,
      email_clicks: counts['contact_click_email'] || 0,
      favorites_added: counts['favorite_add'] || 0,
      favorites_removed: counts['favorite_remove'] || 0,
      search_impressions: counts['search_impression'] || 0,
      map_clicks: counts['map_pin_click'] || 0,
    },
    daily: dailyResult.rows.map(row => ({
      date: row.date.toISOString().split('T')[0],
      views: parseInt(row.views),
      contacts: parseInt(row.contacts),
    })),
  };
};

/**
 * Get platform-wide stats (for admin)
 */
export const getPlatformAnalytics = async (
  days: number = 30
): Promise<{
  total_events: number;
  total_page_views: number;
  total_contact_clicks: number;
  top_businesses: { business_id: string; business_name: string; views: number }[];
  events_by_day: { date: string; count: number }[];
}> => {
  const pool = getPool();
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);
  
  // Total events
  const totalResult = await pool.query(
    `SELECT COUNT(*) FROM analytics_events WHERE created_at >= $1`,
    [startDate]
  );
  
  // Total page views
  const viewsResult = await pool.query(
    `SELECT COUNT(*) FROM analytics_events WHERE event_type = 'page_view' AND created_at >= $1`,
    [startDate]
  );
  
  // Total contact clicks
  const contactsResult = await pool.query(
    `SELECT COUNT(*) FROM analytics_events 
     WHERE event_type IN ('contact_click_phone', 'contact_click_whatsapp', 'contact_click_website', 'contact_click_email')
     AND created_at >= $1`,
    [startDate]
  );
  
  // Top businesses by views
  const topResult = await pool.query(
    `SELECT ae.business_id, b.name as business_name, COUNT(*) as views
     FROM analytics_events ae
     JOIN businesses b ON b.id = ae.business_id
     WHERE ae.event_type = 'page_view' AND ae.created_at >= $1
     GROUP BY ae.business_id, b.name
     ORDER BY views DESC
     LIMIT 10`,
    [startDate]
  );
  
  // Events by day
  const dailyResult = await pool.query(
    `SELECT DATE(created_at) as date, COUNT(*) as count
     FROM analytics_events
     WHERE created_at >= $1
     GROUP BY DATE(created_at)
     ORDER BY date`,
    [startDate]
  );
  
  return {
    total_events: parseInt(totalResult.rows[0].count),
    total_page_views: parseInt(viewsResult.rows[0].count),
    total_contact_clicks: parseInt(contactsResult.rows[0].count),
    top_businesses: topResult.rows.map(row => ({
      business_id: row.business_id,
      business_name: row.business_name,
      views: parseInt(row.views),
    })),
    events_by_day: dailyResult.rows.map(row => ({
      date: row.date.toISOString().split('T')[0],
      count: parseInt(row.count),
    })),
  };
};
