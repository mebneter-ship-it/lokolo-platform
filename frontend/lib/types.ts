// Type definitions for Lokolo platform

export interface Business {
  id: string;
  name: string;
  category: string;
  short_description: string;
  status: 'draft' | 'pending' | 'live' | 'rejected' | 'suspended' | 'active';
  is_verified: boolean;
  is_featured: boolean;
  rating?: number;
  logo_url?: string;
  distance?: number;
  location: {
    latitude: number;
    longitude: number;
    address_text: string;
  };
  contacts?: {
    phone?: string;
    email?: string;
    website_url?: string;
  };
  created_at: string;
  updated_at: string;
}

export interface BusinessListResponse {
  businesses: Business[];
  total: number;
  page: number;
  limit: number;
}

export interface SearchParams {
  latitude: number;
  longitude: number;
  radius?: number;
  category?: string;
  verified_only?: boolean;
  open_now?: boolean;
  featured?: boolean;
  page?: number;
  limit?: number;
}

export interface MapBounds {
  north: number;
  south: number;
  east: number;
  west: number;
}