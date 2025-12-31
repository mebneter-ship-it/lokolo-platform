/**
 * Lokolo Analytics Tracking Utility
 * 
 * Usage:
 *   import { trackEvent, trackPageView, trackContactClick } from '@/lib/analytics'
 *   
 *   // Track page view
 *   trackPageView(businessId)
 *   
 *   // Track contact click
 *   trackContactClick(businessId, 'whatsapp')
 *   
 *   // Track generic event
 *   trackEvent('favorite_add', businessId, { source: 'business_page' })
 */

const API_URL = process.env.NEXT_PUBLIC_API_URL;

// Generate or get session ID
const getSessionId = (): string => {
  if (typeof window === 'undefined') return '';
  
  let sessionId = sessionStorage.getItem('lokolo_session_id');
  if (!sessionId) {
    sessionId = `${Date.now()}-${Math.random().toString(36).substring(2, 15)}`;
    sessionStorage.setItem('lokolo_session_id', sessionId);
  }
  return sessionId;
};

// Get auth token if available
const getAuthToken = async (): Promise<string | null> => {
  try {
    // Try to get token from Firebase if user is logged in
    const { getAuth } = await import('firebase/auth');
    const auth = getAuth();
    const user = auth.currentUser;
    if (user) {
      return await user.getIdToken();
    }
  } catch (e) {
    // User not logged in or Firebase not initialized
  }
  return null;
};

type EventType = 
  | 'page_view'
  | 'contact_click_phone'
  | 'contact_click_whatsapp'
  | 'contact_click_website'
  | 'contact_click_email'
  | 'search_impression'
  | 'map_pin_click'
  | 'favorite_add'
  | 'favorite_remove'
  | 'share';

/**
 * Track a single event
 */
export const trackEvent = async (
  eventType: EventType,
  businessId?: string,
  metadata?: Record<string, any>
): Promise<void> => {
  try {
    const token = await getAuthToken();
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    
    // Fire and forget - don't await
    fetch(`${API_URL}/api/v1/analytics/track`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        event_type: eventType,
        business_id: businessId,
        session_id: getSessionId(),
        metadata,
      }),
    }).catch(() => {
      // Silently fail - analytics should never break the app
    });
  } catch (e) {
    // Silently fail
  }
};

/**
 * Track page view (business profile)
 */
export const trackPageView = (businessId: string, source?: string): void => {
  trackEvent('page_view', businessId, { source: source || 'direct' });
};

/**
 * Track contact click
 */
export const trackContactClick = (
  businessId: string,
  contactType: 'phone' | 'whatsapp' | 'website' | 'email'
): void => {
  const eventType = `contact_click_${contactType}` as EventType;
  trackEvent(eventType, businessId);
};

/**
 * Track map pin click
 */
export const trackMapPinClick = (businessId: string): void => {
  trackEvent('map_pin_click', businessId);
};

/**
 * Track favorite add/remove
 */
export const trackFavorite = (businessId: string, action: 'add' | 'remove'): void => {
  const eventType = action === 'add' ? 'favorite_add' : 'favorite_remove';
  trackEvent(eventType, businessId);
};

/**
 * Track share
 */
export const trackShare = (businessId: string, platform?: string): void => {
  trackEvent('share', businessId, { platform });
};

/**
 * Track search impressions (batch)
 */
export const trackSearchImpressions = async (
  businessIds: string[],
  searchQuery?: string
): Promise<void> => {
  if (businessIds.length === 0) return;
  
  try {
    const token = await getAuthToken();
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    
    const events = businessIds.map(id => ({
      event_type: 'search_impression',
      business_id: id,
      session_id: getSessionId(),
      metadata: { search_query: searchQuery },
    }));
    
    fetch(`${API_URL}/api/v1/analytics/track-batch`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ events }),
    }).catch(() => {});
  } catch (e) {
    // Silently fail
  }
};
