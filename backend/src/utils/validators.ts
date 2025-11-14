/**
 * Input validation helpers
 */

export const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/;
  return emailRegex.test(email);
};

export const isValidPhoneNumber = (phone: string): boolean => {
  // Basic validation for international phone numbers
  const phoneRegex = /^\+?[1-9]\d{1,14}$/;
  return phoneRegex.test(phone);
};

export const isValidUrl = (url: string): boolean => {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
};

export const isValidUUID = (uuid: string): boolean => {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidRegex.test(uuid);
};

export const isValidLatitude = (lat: number): boolean => {
  return lat >= -90 && lat <= 90;
};

export const isValidLongitude = (lng: number): boolean => {
  return lng >= -180 && lng <= 180;
};

export const isValidCoordinates = (lat: number, lng: number): boolean => {
  return isValidLatitude(lat) && isValidLongitude(lng);
};

export const sanitizeString = (str: string): string => {
  return str.trim().replace(/\s+/g, ' ');
};

export const isValidYear = (year: number): boolean => {
  const currentYear = new Date().getFullYear();
  return year >= 1800 && year <= currentYear;
};

export const isValidPostalCode = (postalCode: string, country: string = 'ZA'): boolean => {
  // South African postal code format: 4 digits
  if (country === 'ZA') {
    return /^\d{4}$/.test(postalCode);
  }
  // Add more country-specific validations as needed
  return true;
};

export const validatePagination = (page?: number, limit?: number): { page: number; limit: number } => {
  const validPage = Math.max(1, page || 1);
  const validLimit = Math.min(100, Math.max(1, limit || 20));
  
  return { page: validPage, limit: validLimit };
};

export const validateSearchRadius = (radius?: number): number => {
  // Default to 50km, max 500km
  if (!radius) return 50;
  return Math.min(500, Math.max(1, radius));
};

/**
 * Validate business name
 */
export const isValidBusinessName = (name: string): boolean => {
  const trimmed = name.trim();
  return trimmed.length >= 2 && trimmed.length <= 255;
};

/**
 * Validate message text
 */
export const isValidMessageText = (text: string): boolean => {
  const trimmed = text.trim();
  return trimmed.length >= 1 && trimmed.length <= 5000;
};

/**
 * Validate file upload
 */
export interface FileValidationOptions {
  maxSizeBytes: number;
  allowedMimeTypes: string[];
}

export const validateFile = (
  file: { size: number; mimetype: string },
  options: FileValidationOptions
): { valid: boolean; error?: string } => {
  if (file.size > options.maxSizeBytes) {
    return {
      valid: false,
      error: `File size exceeds maximum allowed size of ${options.maxSizeBytes} bytes`,
    };
  }

  if (!options.allowedMimeTypes.includes(file.mimetype)) {
    return {
      valid: false,
      error: `File type ${file.mimetype} is not allowed. Allowed types: ${options.allowedMimeTypes.join(', ')}`,
    };
  }

  return { valid: true };
};

/**
 * Common file validation presets
 */
export const FileValidationPresets = {
  IMAGE: {
    maxSizeBytes: 5 * 1024 * 1024, // 5MB
    allowedMimeTypes: ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'],
  },
  DOCUMENT: {
    maxSizeBytes: 10 * 1024 * 1024, // 10MB
    allowedMimeTypes: ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png'],
  },
};
