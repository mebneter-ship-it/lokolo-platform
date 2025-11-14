/**
 * Lokolo Platform - TypeScript Type Definitions
 * These types match the database schema exactly
 */

// Enum types
export type UserRole = 'consumer' | 'supplier' | 'admin';
export type BusinessStatus = 'draft' | 'active' | 'suspended' | 'archived';
export type VerificationStatus = 'pending' | 'approved' | 'rejected';
export type MediaType = 'logo' | 'photo';
export type DayOfWeek = 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday';

// User
export interface User {
  id: string;
  firebase_uid: string;
  email: string;
  phone_number?: string;
  role: UserRole;
  display_name?: string;
  profile_photo_url?: string;
  created_at: Date;
  updated_at: Date;
  last_login_at?: Date;
  is_active: boolean;
  metadata?: Record<string, any>;
}

// Business
export interface Business {
  id: string;
  owner_id: string;
  name: string;
  tagline?: string;
  description?: string;
  email?: string;
  phone_number?: string;
  whatsapp_number?: string;
  website_url?: string;
  location: string; // PostGIS GEOGRAPHY type (stored as GeoJSON string in queries)
  address_line1?: string;
  address_line2?: string;
  city: string;
  province_state?: string;
  postal_code?: string;
  country: string;
  year_established?: number;
  employee_count_range?: string;
  status: BusinessStatus;
  verification_status: VerificationStatus;
  verified_at?: Date;
  created_at: Date;
  updated_at: Date;
  published_at?: Date;
  metadata?: Record<string, any>;
}

// Business Media
export interface BusinessMedia {
  id: string;
  business_id: string;
  media_type: MediaType;
  storage_path: string;
  file_name: string;
  file_size_bytes?: number;
  mime_type?: string;
  display_order: number;
  alt_text?: string;
  uploaded_at: Date;
  metadata?: Record<string, any>;
}

// Business Hours
export interface BusinessHours {
  id: string;
  business_id: string;
  day_of_week: DayOfWeek;
  opens_at?: string; // TIME type (e.g., "09:00:00")
  closes_at?: string; // TIME type (e.g., "17:00:00")
  is_closed: boolean;
  notes?: string;
  created_at: Date;
  updated_at: Date;
}

// Business Categories
export interface BusinessCategory {
  id: string;
  business_id: string;
  category_name: string;
  created_at: Date;
}

// Favorite
export interface Favorite {
  id: string;
  user_id: string;
  business_id: string;
  created_at: Date;
}

// Thread
export interface Thread {
  id: string;
  consumer_id: string;
  supplier_id: string;
  business_id: string;
  subject?: string;
  last_message_at?: Date;
  is_archived_by_consumer: boolean;
  is_archived_by_supplier: boolean;
  created_at: Date;
  updated_at: Date;
}

// Message
export interface Message {
  id: string;
  thread_id: string;
  sender_id: string;
  message_text: string;
  is_read: boolean;
  read_at?: Date;
  created_at: Date;
}

// Verification Request
export interface VerificationRequest {
  id: string;
  business_id: string;
  requester_id: string;
  request_notes?: string;
  status: VerificationStatus;
  reviewed_by?: string;
  reviewed_at?: Date;
  review_notes?: string;
  created_at: Date;
  updated_at: Date;
}

// Verification Document
export interface VerificationDocument {
  id: string;
  verification_request_id: string;
  document_type: string;
  storage_path: string;
  file_name: string;
  file_size_bytes?: number;
  mime_type?: string;
  uploaded_at: Date;
  metadata?: Record<string, any>;
}

// API Response Types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T = any> {
  success: boolean;
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// Geospatial Types
export interface Coordinates {
  latitude: number;
  longitude: number;
}

export interface GeoPoint {
  type: 'Point';
  coordinates: [number, number]; // [longitude, latitude]
}

// Search/Filter Types
export interface BusinessSearchFilters {
  query?: string;
  latitude?: number;
  longitude?: number;
  radius_km?: number;
  city?: string;
  category?: string;
  status?: BusinessStatus;
  verification_status?: VerificationStatus;
  page?: number;
  limit?: number;
}

export interface BusinessWithDistance extends Business {
  distance_km?: number;
}
