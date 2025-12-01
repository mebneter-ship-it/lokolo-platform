import { Router } from 'express';
import { optionalAuth, authenticate, requireRole, AuthenticatedRequest } from '../middleware/auth';
import { sendSuccess, sendError, sendCreated, sendNoContent } from '../utils/responses';
import * as businessService from '../services/businessService';
import * as mediaService from '../services/mediaService';
import * as favoriteService from '../services/favoriteService';
import * as ratingService from '../services/ratingService';
import { validatePagination, validateSearchRadius, isValidCoordinates } from '../utils/validators';
import { BusinessWithDistance } from '../models/types';

const router = Router();

/**
 * GET /api/v1/businesses/search
 * Search for businesses with filters
 */
router.get('/search', optionalAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const { query, latitude, longitude, radius_km, city, category, page, limit } = req.query;
    
    // Validate coordinates if provided
    if (latitude && longitude) {
      const lat = parseFloat(latitude as string);
      const lng = parseFloat(longitude as string);
      
      if (!isValidCoordinates(lat, lng)) {
        sendError(res, 'Invalid coordinates', 400);
        return;
      }
    }
    
    const { page: validPage, limit: validLimit } = validatePagination(
      Number(page),
      Number(limit)
    );
    
    const validRadius = validateSearchRadius(Number(radius_km));
    
    const filters = {
      query: query as string,
      latitude: latitude ? parseFloat(latitude as string) : undefined,
      longitude: longitude ? parseFloat(longitude as string) : undefined,
      radius_km: validRadius,
      city: city as string,
      category: category as string,
      page: validPage,
      limit: validLimit,
    };
    
    const businesses = await businessService.searchBusinesses(filters);
    
    // Get all business IDs for batch rating fetch
    const businessIds = businesses.map((b: BusinessWithDistance) => b.id);
    const ratingsMap = await ratingService.getBusinessesRatings(businessIds);
    
    // Fetch logo URLs for all businesses
    const businessesWithLogos = await Promise.all(
      businesses.map(async (business: BusinessWithDistance) => {
        try {
          const media = await mediaService.getBusinessMedia(business.id);
          const logo = media.find((m: any) => m.media_type === 'logo');
          const logoUrl = logo ? await mediaService.generateDownloadUrl(logo.storage_path) : null;
          const ratingData = ratingsMap.get(business.id);
          
          return {
            ...business,
            logo_url: logoUrl,
            rating: ratingData?.average_rating || 0,
            total_ratings: ratingData?.total_ratings || 0,
          };
        } catch (error) {
          console.error(`❌ Error fetching data for ${business.name}:`, error);
          return {
            ...business,
            logo_url: null,
            rating: 0,
            total_ratings: 0,
          };
        }
      })
    );
    
    // If user is authenticated, check which businesses are favorited
    if (req.user) {
      const businessesWithFavorites = await Promise.all(
        businessesWithLogos.map(async (business) => ({
          ...business,
          is_favorited: await favoriteService.isFavorited(req.user!.id, business.id),
        }))
      );
      
      sendSuccess(res, {
        businesses: businessesWithFavorites,
        pagination: {
          page: validPage,
          limit: validLimit,
        },
      });
    } else {
      sendSuccess(res, {
        businesses: businessesWithLogos,
        pagination: {
          page: validPage,
          limit: validLimit,
        },
      });
    }
  } catch (error) {
    console.error('Search error:', error);
    sendError(res, 'Failed to search businesses', 500);
  }
});

/**
 * GET /api/v1/businesses/nearby
 * Get businesses near a location
 */
router.get('/nearby', optionalAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const { lat, lng, radius, limit, page } = req.query;
    
    const latitude = parseFloat(lat as string);
    const longitude = parseFloat(lng as string);
    
    if (!isValidCoordinates(latitude, longitude)) {
      sendError(res, 'Invalid coordinates. Please provide valid lat and lng parameters.', 400);
      return;
    }
    
    const radiusKm = radius ? parseFloat(radius as string) / 1000 : 10; // Convert meters to km, default 10km
    const validRadius = validateSearchRadius(radiusKm);
    const { page: validPage, limit: validLimit } = validatePagination(
      Number(page) || 1,
      Number(limit) || 20
    );
    
    const filters = {
      latitude,
      longitude,
      radius_km: validRadius,
      page: validPage,
      limit: validLimit,
    };
    
    const businesses = await businessService.searchBusinesses(filters);
    
    // Get all business IDs for batch rating fetch
    const businessIds = businesses.map((b: BusinessWithDistance) => b.id);
    const ratingsMap = await ratingService.getBusinessesRatings(businessIds);
    
    // Fetch logo URLs for all businesses
    const businessesWithLogos = await Promise.all(
      businesses.map(async (business: BusinessWithDistance) => {
        const media = await mediaService.getBusinessMedia(business.id);
        const logo = media.find((m: any) => m.media_type === 'logo');
        const ratingData = ratingsMap.get(business.id);
        
        return {
          ...business,
          logo_url: logo ? await mediaService.generateDownloadUrl(logo.storage_path) : null,
          rating: ratingData?.average_rating || 0,
          total_ratings: ratingData?.total_ratings || 0,
        };
      })
    );
    
    // If user is authenticated, check which businesses are favorited
    if (req.user) {
      const businessesWithFavorites = await Promise.all(
        businessesWithLogos.map(async (business) => ({
          ...business,
          is_favorited: await favoriteService.isFavorited(req.user!.id, business.id),
        }))
      );
      
      sendSuccess(res, {
        businesses: businessesWithFavorites,
        pagination: {
          page: validPage,
          limit: validLimit,
        },
      });
    } else {
      sendSuccess(res, {
        businesses: businessesWithLogos,
        pagination: {
          page: validPage,
          limit: validLimit,
        },
      });
    }
  } catch (error) {
    console.error('Nearby search error:', error);
    sendError(res, 'Failed to fetch nearby businesses', 500);
  }
});

/**
 * GET /api/v1/businesses/:id
 * Get business details by ID
 */
router.get('/:id', optionalAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const { id } = req.params;
    
    const business = await businessService.getBusinessById(id);
    
    if (!business) {
      sendError(res, 'Business not found', 404);
      return;
    }
    
    // Only show active businesses (unless owner/admin)
    if (business.status !== 'active' && 
        (!req.user || (req.user.id !== business.owner_id && req.user.role !== 'admin'))) {
      sendError(res, 'Business not found', 404);
      return;
    }
    
    // Get media
    const media = await mediaService.getBusinessMedia(id);
    
    // Generate URLs for media and extract logo
    const mediaWithUrls = await Promise.all(
      media.map(async (item: any) => ({
        ...item,
        url: await mediaService.generateDownloadUrl(item.storage_path),
      }))
    );
    
    const logo = mediaWithUrls.find((m: any) => m.media_type === 'logo');
    const photos = mediaWithUrls.filter((m: any) => m.media_type === 'photo');
    
    // Check if favorited (if authenticated)
    let isFavorited = false;
    if (req.user) {
      isFavorited = await favoriteService.isFavorited(req.user.id, id);
    }
    
    // Get favorite count
    const favoriteCount = await favoriteService.getBusinessFavoriteCount(id);
    
    // Get business hours
    const pool = require('../config/database').getPool();
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
    
    // Get categories
    const categoriesResult = await pool.query(
      'SELECT category_name FROM business_categories WHERE business_id = $1',
      [id]
    );
    
    // Get rating summary
    const ratingSummary = await ratingService.getBusinessRatingSummary(id);
    
    // Get user's own rating if authenticated
    let userRating = null;
    if (req.user) {
      userRating = await ratingService.getUserRating(id, req.user.id);
    }
    
    sendSuccess(res, {
      ...business,
      logo_url: logo?.url || null,
      photos: photos,
      media: mediaWithUrls,
      business_hours: hoursResult.rows,
      categories: categoriesResult.rows.map((r: any) => r.category_name),
      is_favorited: isFavorited,
      favorite_count: favoriteCount,
      rating: ratingSummary.average_rating,
      total_ratings: ratingSummary.total_ratings,
      rating_distribution: ratingSummary.rating_distribution,
      user_rating: userRating,
    });
  } catch (error) {
    console.error('Get business error:', error);
    sendError(res, 'Failed to fetch business', 500);
  }
});

/**
 * GET /api/v1/businesses/:id/media
 * Get business media (photos and logo)
 */
router.get('/:id/media', async (req: AuthenticatedRequest, res) => {
  try {
    const { id } = req.params;
    
    const business = await businessService.getBusinessById(id);
    if (!business) {
      sendError(res, 'Business not found', 404);
      return;
    }
    
    const media = await mediaService.getBusinessMedia(id);
    
    // Generate download URLs for each media item
    const mediaWithUrls = await Promise.all(
      media.map(async (item) => ({
        ...item,
        url: await mediaService.generateDownloadUrl(item.storage_path),
      }))
    );
    
    sendSuccess(res, { media: mediaWithUrls });
  } catch (error) {
    console.error('Get media error:', error);
    sendError(res, 'Failed to fetch media', 500);
  }
});

/**
 * GET /api/v1/businesses/:id/categories
 * Get business categories
 */
router.get('/:id/categories', async (req: AuthenticatedRequest, res) => {
  try {
    const { id } = req.params;
    
    const business = await businessService.getBusinessById(id);
    if (!business) {
      sendError(res, 'Business not found', 404);
      return;
    }
    
    const pool = require('../config/database').getPool();
    const result = await pool.query(
      'SELECT id, category_name, created_at FROM business_categories WHERE business_id = $1',
      [id]
    );
    
    sendSuccess(res, result.rows);
  } catch (error) {
    console.error('Get categories error:', error);
    sendError(res, 'Failed to fetch categories', 500);
  }
});

/**
 * GET /api/v1/businesses/:id/hours
 * Get business hours
 */
router.get('/:id/hours', async (req: AuthenticatedRequest, res) => {
  try {
    const { id } = req.params;
    
    const business = await businessService.getBusinessById(id);
    if (!business) {
      sendError(res, 'Business not found', 404);
      return;
    }
    
    const pool = require('../config/database').getPool();
    const result = await pool.query(
      `SELECT id, day_of_week, opens_at, closes_at, is_closed 
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
    
    sendSuccess(res, result.rows);
  } catch (error) {
    console.error('Get hours error:', error);
    sendError(res, 'Failed to fetch business hours', 500);
  }
});

// =============================================================================
// RATINGS ENDPOINTS - Consumer Only
// =============================================================================

/**
 * GET /api/v1/businesses/:id/ratings
 * Get all ratings for a business with summary
 */
router.get('/:id/ratings', async (req: AuthenticatedRequest, res) => {
  try {
    const { id } = req.params;
    const { page, limit } = validatePagination(
      Number(req.query.page),
      Number(req.query.limit)
    );
    
    const business = await businessService.getBusinessById(id);
    if (!business) {
      sendError(res, 'Business not found', 404);
      return;
    }
    
    const summary = await ratingService.getBusinessRatingSummary(id);
    const ratings = await ratingService.getBusinessRatings(id, limit, (page - 1) * limit);
    
    sendSuccess(res, {
      summary,
      ratings,
      pagination: {
        page,
        limit,
        total: summary.total_ratings,
        totalPages: Math.ceil(summary.total_ratings / limit),
      },
    });
  } catch (error) {
    console.error('Get ratings error:', error);
    sendError(res, 'Failed to fetch ratings', 500);
  }
});

/**
 * POST /api/v1/businesses/:id/ratings
 * Submit or update a rating (consumers only)
 */
router.post('/:id/ratings', authenticate, requireRole('consumer'), async (req: AuthenticatedRequest, res) => {
  try {
    const { id } = req.params;
    const { rating, review_text } = req.body;
    
    // Validate rating
    if (!rating || rating < 1 || rating > 5 || !Number.isInteger(rating)) {
      sendError(res, 'Rating must be an integer between 1 and 5', 400);
      return;
    }
    
    // Check business exists
    const business = await businessService.getBusinessById(id);
    if (!business) {
      sendError(res, 'Business not found', 404);
      return;
    }
    
    // Check user is not the business owner
    if (business.owner_id === req.user!.id) {
      sendError(res, 'You cannot rate your own business', 403);
      return;
    }
    
    const result = await ratingService.upsertRating({
      business_id: id,
      user_id: req.user!.id,
      rating,
      review_text,
    });
    
    // Get updated summary
    const summary = await ratingService.getBusinessRatingSummary(id);
    
    sendCreated(res, {
      rating: result,
      new_average: summary.average_rating,
      total_ratings: summary.total_ratings,
    }, 'Rating submitted successfully');
  } catch (error) {
    console.error('Submit rating error:', error);
    sendError(res, 'Failed to submit rating', 500);
  }
});

/**
 * DELETE /api/v1/businesses/:id/ratings
 * Delete user's rating for a business (consumers only)
 */
router.delete('/:id/ratings', authenticate, requireRole('consumer'), async (req: AuthenticatedRequest, res) => {
  try {
    const { id } = req.params;
    
    const deleted = await ratingService.deleteRating(id, req.user!.id);
    
    if (!deleted) {
      sendError(res, 'Rating not found', 404);
      return;
    }
    
    sendNoContent(res);
  } catch (error) {
    console.error('Delete rating error:', error);
    sendError(res, 'Failed to delete rating', 500);
  }
});

export default router;