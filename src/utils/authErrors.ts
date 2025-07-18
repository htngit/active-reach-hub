/**
 * Authentication Error Handling Utilities
 * Provides standardized error messages and validation for auth processes
 */

// Auth Error Types
export const AUTH_ERROR_CODES = {
  INVALID_CREDENTIALS: 'invalid_login_credentials',
  USER_NOT_FOUND: 'user_not_found',
  INVALID_EMAIL: 'invalid_email',
  WEAK_PASSWORD: 'weak_password',
  EMAIL_NOT_CONFIRMED: 'email_not_confirmed',
  TOO_MANY_REQUESTS: 'too_many_requests',
  NETWORK_ERROR: 'network_error',
  SESSION_EXPIRED: 'session_expired',
  EMAIL_ALREADY_EXISTS: 'email_address_already_exists',
  SIGNUP_DISABLED: 'signup_disabled',
  PASSWORD_RECOVERY_FAILED: 'password_recovery_failed'
} as const;

// User-friendly error messages
export const AUTH_ERROR_MESSAGES = {
  [AUTH_ERROR_CODES.INVALID_CREDENTIALS]: {
    title: 'Login Failed',
    description: 'Invalid email or password. Please check your credentials and try again.'
  },
  [AUTH_ERROR_CODES.USER_NOT_FOUND]: {
    title: 'Account Not Found',
    description: 'No account found with this email address. Please check your email or create a new account.'
  },
  [AUTH_ERROR_CODES.INVALID_EMAIL]: {
    title: 'Invalid Email',
    description: 'Please enter a valid email address.'
  },
  [AUTH_ERROR_CODES.WEAK_PASSWORD]: {
    title: 'Weak Password',
    description: 'Password must be at least 8 characters long and contain uppercase, lowercase, numbers, and special characters.'
  },
  [AUTH_ERROR_CODES.EMAIL_NOT_CONFIRMED]: {
    title: 'Email Not Verified',
    description: 'Please check your email and click the verification link before signing in.'
  },
  [AUTH_ERROR_CODES.TOO_MANY_REQUESTS]: {
    title: 'Too Many Attempts',
    description: 'Too many login attempts. Please wait a few minutes before trying again.'
  },
  [AUTH_ERROR_CODES.NETWORK_ERROR]: {
    title: 'Connection Error',
    description: 'Unable to connect to the server. Please check your internet connection and try again.'
  },
  [AUTH_ERROR_CODES.SESSION_EXPIRED]: {
    title: 'Session Expired',
    description: 'Your session has expired. Please sign in again.'
  },
  [AUTH_ERROR_CODES.EMAIL_ALREADY_EXISTS]: {
    title: 'Email Already Registered',
    description: 'An account with this email already exists. Please sign in or use a different email.'
  },
  [AUTH_ERROR_CODES.SIGNUP_DISABLED]: {
    title: 'Registration Unavailable',
    description: 'New account registration is currently disabled. Please contact support.'
  },
  [AUTH_ERROR_CODES.PASSWORD_RECOVERY_FAILED]: {
    title: 'Password Reset Failed',
    description: 'Unable to send password reset email. Please try again or contact support.'
  }
};

// Default error message for unknown errors
export const DEFAULT_ERROR_MESSAGE = {
  title: 'Something Went Wrong',
  description: 'An unexpected error occurred. Please try again or contact support if the problem persists.'
};

/**
 * Maps Supabase auth errors to user-friendly messages
 * @param error - The error object from Supabase
 * @returns User-friendly error message object
 */
export const mapAuthError = (error: any): { title: string; description: string } => {
  if (!error) return DEFAULT_ERROR_MESSAGE;

  const errorMessage = error.message?.toLowerCase() || '';
  const errorCode = error.code || '';

  // Map specific error messages
  if (errorMessage.includes('invalid login credentials') || 
      errorMessage.includes('invalid email or password')) {
    return AUTH_ERROR_MESSAGES[AUTH_ERROR_CODES.INVALID_CREDENTIALS];
  }

  if (errorMessage.includes('user not found')) {
    return AUTH_ERROR_MESSAGES[AUTH_ERROR_CODES.USER_NOT_FOUND];
  }

  if (errorMessage.includes('invalid email') || 
      errorMessage.includes('unable to validate email address')) {
    return AUTH_ERROR_MESSAGES[AUTH_ERROR_CODES.INVALID_EMAIL];
  }

  if (errorMessage.includes('password') && 
      (errorMessage.includes('weak') || errorMessage.includes('short'))) {
    return AUTH_ERROR_MESSAGES[AUTH_ERROR_CODES.WEAK_PASSWORD];
  }

  if (errorMessage.includes('email not confirmed') || 
      errorMessage.includes('email address not confirmed')) {
    return AUTH_ERROR_MESSAGES[AUTH_ERROR_CODES.EMAIL_NOT_CONFIRMED];
  }

  if (errorMessage.includes('too many requests') || 
      errorMessage.includes('rate limit')) {
    return AUTH_ERROR_MESSAGES[AUTH_ERROR_CODES.TOO_MANY_REQUESTS];
  }

  if (errorMessage.includes('network') || 
      errorMessage.includes('fetch') || 
      errorMessage.includes('connection')) {
    return AUTH_ERROR_MESSAGES[AUTH_ERROR_CODES.NETWORK_ERROR];
  }

  if (errorMessage.includes('session') && 
      (errorMessage.includes('expired') || errorMessage.includes('invalid'))) {
    return AUTH_ERROR_MESSAGES[AUTH_ERROR_CODES.SESSION_EXPIRED];
  }

  if (errorMessage.includes('user already registered') || 
      errorMessage.includes('email address already exists')) {
    return AUTH_ERROR_MESSAGES[AUTH_ERROR_CODES.EMAIL_ALREADY_EXISTS];
  }

  if (errorMessage.includes('signup') && errorMessage.includes('disabled')) {
    return AUTH_ERROR_MESSAGES[AUTH_ERROR_CODES.SIGNUP_DISABLED];
  }

  // Return default error message for unknown errors
  return DEFAULT_ERROR_MESSAGE;
};

/**
 * Logs auth errors for debugging while protecting sensitive information
 * @param error - The error object
 * @param context - Additional context about where the error occurred
 */
export const logAuthError = (error: any, context: string) => {
  const sanitizedError = {
    message: error?.message,
    code: error?.code,
    status: error?.status,
    context
  };
  
  console.error(`Auth Error [${context}]:`, sanitizedError);
};