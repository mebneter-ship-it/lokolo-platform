// API service for Lokolo backend

import { Business, BusinessListResponse, SearchParams } from '@/lib/types';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

class ApiService {
  private baseUrl: string;

  constructor() {
    this.baseUrl = `${API_URL}/api/v1`;
  }

  /**
   * Transform backend business to frontend format
   */
  private transformBusiness(backendBusiness: any): Business {
    const latitude = backendBusiness.latitude || -26.2041;
    const longitude = backendBusiness.longitude || 28.0473;
    
    return {
      id: backendBusiness.id,
      name: backendBusiness.name,
      category: this.inferCategory(backendBusiness.tagline || backendBusiness.description),
      short_description: backendBusiness.tagline || backendBusiness.description?.substring(0, 100),
      status: backendBusiness.status,
      is_verified: backendBusiness.verification_status === 'approved',
      is_featured: backendBusiness.metadata?.featured === true,
      rating: 4.5,
      logo_url: backendBusiness.logo_url,
      distance: backendBusiness.distance_km,
      latitude: latitude,
      longitude: longitude,
      location: {
        latitude: latitude,
        longitude: longitude,
        address_text: `${backendBusiness.address_line1}, ${backendBusiness.city}`,
      },
      contacts: {
        phone: backendBusiness.phone_number,
        email: backendBusiness.email,
        website_url: backendBusiness.website_url,
      },
      created_at: backendBusiness.created_at,
      updated_at: backendBusiness.updated_at,
    };
  }

  /**
   * Infer category from business description
   */
  private inferCategory(text: string): string {
    const lower = text.toLowerCase();
    if (lower.includes('coffee') || lower.includes('café')) return 'Coffee';
    if (lower.includes('bakery') || lower.includes('bread')) return 'Bakery';
    if (lower.includes('kitchen') || lower.includes('cuisine') || lower.includes('food')) return 'Restaurant';
    if (lower.includes('hair') || lower.includes('beauty') || lower.includes('salon')) return 'Beauty';
    if (lower.includes('fashion') || lower.includes('clothing')) return 'Fashion';
    if (lower.includes('tech')) return 'Technology';
    return 'Other';
  }

  /**
   * Search for nearby businesses
   */
  async searchBusinesses(params: SearchParams): Promise<BusinessListResponse> {
    const queryParams = new URLSearchParams();
    
    queryParams.append('latitude', params.latitude.toString());
    queryParams.append('longitude', params.longitude.toString());
    
    if (params.radius) queryParams.append('radius', params.radius.toString());
    if (params.category) queryParams.append('category', params.category);
    if (params.verified_only) queryParams.append('verified_only', 'true');
    if (params.page) queryParams.append('page', params.page.toString());
    if (params.limit) queryParams.append('limit', params.limit.toString());

    const response = await fetch(`${this.baseUrl}/businesses/search?${queryParams}`);
    
    if (!response.ok) {
      throw new Error(`Failed to search businesses: ${response.statusText}`);
    }

    const result = await response.json();
    
    if (result.success && result.data) {
      const transformedBusinesses = result.data.businesses.map((b: any) => 
        this.transformBusiness(b)
      );

      return {
        businesses: transformedBusinesses,
        total: transformedBusinesses.length,
        page: result.data.pagination?.page || 1,
        limit: result.data.pagination?.limit || 20,
      };
    }

    return {
      businesses: [],
      total: 0,
      page: 1,
      limit: 20,
    };
  }

  /**
   * Get a single business by ID
   */
  async getBusinessById(id: string): Promise<Business> {
    const response = await fetch(`${this.baseUrl}/businesses/${id}`);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch business: ${response.statusText}`);
    }

    const result = await response.json();
    return this.transformBusiness(result.data);
  }
}

export const apiService = new ApiService();
