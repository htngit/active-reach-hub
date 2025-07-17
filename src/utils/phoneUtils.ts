/**
 * Utility functions for phone number handling
 */

/**
 * Normalizes phone number by removing all non-digit characters
 * and standardizing format for consistent comparison
 * @param phoneNumber - Raw phone number string
 * @returns Normalized phone number string
 */
export const normalizePhoneNumber = (phoneNumber: string): string => {
  if (!phoneNumber) return '';
  
  // Remove all non-digit characters
  const digitsOnly = phoneNumber.replace(/\D/g, '');
  
  // Handle Indonesian phone numbers
  if (digitsOnly.startsWith('62')) {
    return digitsOnly;
  } else if (digitsOnly.startsWith('0')) {
    return '62' + digitsOnly.substring(1);
  } else if (digitsOnly.length >= 8) {
    // Assume it's a local number without country code
    return '62' + digitsOnly;
  }
  
  return digitsOnly;
};

/**
 * Validates if phone number has minimum required length
 * @param phoneNumber - Phone number to validate
 * @returns Boolean indicating if phone number is valid
 */
export const isValidPhoneNumber = (phoneNumber: string): boolean => {
  const normalized = normalizePhoneNumber(phoneNumber);
  return normalized.length >= 10; // Minimum 10 digits for valid phone
};

/**
 * Formats phone number for display
 * @param phoneNumber - Raw phone number
 * @returns Formatted phone number for display
 */
export const formatPhoneNumber = (phoneNumber: string): string => {
  const normalized = normalizePhoneNumber(phoneNumber);
  
  if (normalized.startsWith('62')) {
    return '+' + normalized;
  }
  
  return phoneNumber; // Return original if can't format
};