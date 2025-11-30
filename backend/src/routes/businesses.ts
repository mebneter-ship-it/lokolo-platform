import { Router } from 'express';
import { optionalAuth, AuthenticatedRequest } from '../middleware/auth';
import { sendSuccess, sendError } from '../utils/responses';
import * as businessService from '../services/businessService';
import * as mediaService from '../services/mediaService';
import * as favoriteService from '../services/favoriteService';
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
    
    // If user is authenticated, check which businesses are favorited
    if (req.user) {
      const businessesWithFavorites = await Promise.all(
        businesses.map(async (business: BusinessWithDistance) => ({
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
        businesses,
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
    
    // Check if favorited (if authenticated)
    let isFavorited = false;
    if (req.user) {
      isFavorited = await favoriteService.isFavorited(req.user.id, id);
    }
    
    // Get favorite count
    const favoriteCount = await favoriteService.getBusinessFavoriteCount(id);
    
    sendSuccess(res, {
      ...business,
      media,
      is_favorited: isFavorited,
      favorite_count: favoriteCount,
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

export default router;