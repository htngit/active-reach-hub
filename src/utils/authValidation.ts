/**
 * Authentication Validation Utilities
 * Provides comprehensive validation for email, password, and other auth inputs
 */

// Password validation configuration
export const PASSWORD_CONFIG = {
  minLength: 8,
  maxLength: 128,
  requireUppercase: true,
  requireLowercase: true,
  requireNumbers: true,
  requireSpecialChars: true,
  forbiddenPatterns: [
    /password/i,
    /123456/,
    /qwerty/i,
    /admin/i,
    /letmein/i
  ]
};

// Email validation regex (RFC 5322 compliant)
const EMAIL_REGEX = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;

// Validation result interface
export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings?: string[];
  strength?: 'weak' | 'fair' | 'good' | 'strong';
}

/**
 * Validates email address format and common issues
 * @param email - Email address to validate
 * @returns Validation result with errors and warnings
 */
export const validateEmail = (email: string): ValidationResult => {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Basic checks
  if (!email) {
    errors.push('Email is required');
    return { isValid: false, errors, warnings };
  }

  if (email.length > 254) {
    errors.push('Email address is too long');
  }

  // Format validation
  if (!EMAIL_REGEX.test(email)) {
    errors.push('Please enter a valid email address');
  }

  // Common issues
  if (email.includes('..')) {
    errors.push('Email cannot contain consecutive dots');
  }

  if (email.startsWith('.') || email.endsWith('.')) {
    errors.push('Email cannot start or end with a dot');
  }

  // Warnings for suspicious patterns
  if (email.includes('+')) {
    warnings.push('Email contains plus sign - ensure this is intentional');
  }

  const disposableEmailDomains = [
    '10minutemail.com', 'tempmail.org', 'guerrillamail.com',
    'mailinator.com', 'throwaway.email'
  ];
  
  const domain = email.split('@')[1]?.toLowerCase();
  if (domain && disposableEmailDomains.includes(domain)) {
    warnings.push('Disposable email detected - consider using a permanent email');
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
};

/**
 * Validates password strength and security requirements
 * @param password - Password to validate
 * @param email - User's email (to check for similarity)
 * @returns Validation result with strength assessment
 */
export const validatePassword = (password: string, email?: string): ValidationResult => {
  const errors: string[] = [];
  const warnings: string[] = [];
  let strengthScore = 0;

  // Basic checks
  if (!password) {
    errors.push('Password is required');
    return { isValid: false, errors, warnings, strength: 'weak' };
  }

  // Length validation
  if (password.length < PASSWORD_CONFIG.minLength) {
    errors.push(`Password must be at least ${PASSWORD_CONFIG.minLength} characters long`);
  } else {
    strengthScore += 1;
  }

  if (password.length > PASSWORD_CONFIG.maxLength) {
    errors.push(`Password cannot exceed ${PASSWORD_CONFIG.maxLength} characters`);
  }

  // Character requirements
  if (PASSWORD_CONFIG.requireUppercase && !/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter');
  } else if (/[A-Z]/.test(password)) {
    strengthScore += 1;
  }

  if (PASSWORD_CONFIG.requireLowercase && !/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter');
  } else if (/[a-z]/.test(password)) {
    strengthScore += 1;
  }

  if (PASSWORD_CONFIG.requireNumbers && !/\d/.test(password)) {
    errors.push('Password must contain at least one number');
  } else if (/\d/.test(password)) {
    strengthScore += 1;
  }

  if (PASSWORD_CONFIG.requireSpecialChars && !/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
    errors.push('Password must contain at least one special character');
  } else if (/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
    strengthScore += 1;
  }

  // Forbidden patterns
  for (const pattern of PASSWORD_CONFIG.forbiddenPatterns) {
    if (pattern.test(password)) {
      errors.push('Password contains common words or patterns that are not secure');
      break;
    }
  }

  // Check for email similarity
  if (email) {
    const emailLocal = email.split('@')[0].toLowerCase();
    if (password.toLowerCase().includes(emailLocal) || emailLocal.includes(password.toLowerCase())) {
      warnings.push('Password should not be similar to your email address');
      strengthScore -= 1;
    }
  }

  // Check for repeated characters
  if (/(..).*\1/.test(password)) {
    warnings.push('Avoid repeating character patterns for better security');
  }

  // Check for sequential characters
  if (/(?:abc|bcd|cde|def|efg|fgh|ghi|hij|ijk|jkl|klm|lmn|mno|nop|opq|pqr|qrs|rst|stu|tuv|uvw|vwx|wxy|xyz|012|123|234|345|456|567|678|789)/i.test(password)) {
    warnings.push('Avoid sequential characters for better security');
  }

  // Additional strength bonuses
  if (password.length >= 12) strengthScore += 1;
  if (password.length >= 16) strengthScore += 1;
  if (/[^a-zA-Z0-9!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) strengthScore += 1; // Unicode chars

  // Determine strength
  let strength: 'weak' | 'fair' | 'good' | 'strong';
  if (strengthScore <= 2) strength = 'weak';
  else if (strengthScore <= 4) strength = 'fair';
  else if (strengthScore <= 6) strength = 'good';
  else strength = 'strong';

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
    strength
  };
};

/**
 * Validates password confirmation match
 * @param password - Original password
 * @param confirmPassword - Confirmation password
 * @returns Validation result
 */
export const validatePasswordConfirmation = (password: string, confirmPassword: string): ValidationResult => {
  const errors: string[] = [];

  if (!confirmPassword) {
    errors.push('Please confirm your password');
  } else if (password !== confirmPassword) {
    errors.push('Passwords do not match');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};

/**
 * Rate limiting utility for auth attempts
 */
export class AuthRateLimit {
  private attempts: Map<string, { count: number; lastAttempt: number }> = new Map();
  private readonly maxAttempts: number;
  private readonly windowMs: number;

  constructor(maxAttempts = 5, windowMs = 15 * 60 * 1000) { // 5 attempts per 15 minutes
    this.maxAttempts = maxAttempts;
    this.windowMs = windowMs;
  }

  /**
   * Check if an identifier (email/IP) is rate limited
   * @param identifier - Unique identifier (email or IP)
   * @returns Whether the identifier is rate limited
   */
  isRateLimited(identifier: string): boolean {
    const now = Date.now();
    const attempt = this.attempts.get(identifier);

    if (!attempt) {
      return false;
    }

    // Reset if window has passed
    if (now - attempt.lastAttempt > this.windowMs) {
      this.attempts.delete(identifier);
      return false;
    }

    return attempt.count >= this.maxAttempts;
  }

  /**
   * Record a failed attempt
   * @param identifier - Unique identifier
   */
  recordAttempt(identifier: string): void {
    const now = Date.now();
    const attempt = this.attempts.get(identifier);

    if (!attempt || now - attempt.lastAttempt > this.windowMs) {
      this.attempts.set(identifier, { count: 1, lastAttempt: now });
    } else {
      attempt.count++;
      attempt.lastAttempt = now;
    }
  }

  /**
   * Clear attempts for an identifier (on successful auth)
   * @param identifier - Unique identifier
   */
  clearAttempts(identifier: string): void {
    this.attempts.delete(identifier);
  }

  /**
   * Get remaining time until rate limit resets
   * @param identifier - Unique identifier
   * @returns Remaining time in milliseconds
   */
  getRemainingTime(identifier: string): number {
    const attempt = this.attempts.get(identifier);
    if (!attempt) return 0;

    const elapsed = Date.now() - attempt.lastAttempt;
    return Math.max(0, this.windowMs - elapsed);
  }
}

// Global rate limiter instance
export const authRateLimit = new AuthRateLimit();

/**
 * Sanitizes user input to prevent XSS and injection attacks
 * @param input - User input string
 * @returns Sanitized string
 */
export const sanitizeInput = (input: string): string => {
  if (!input) return '';
  
  return input
    .trim()
    .replace(/[<>"'&]/g, (char) => {
      const entities: { [key: string]: string } = {
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#x27;',
        '&': '&amp;'
      };
      return entities[char] || char;
    });
};