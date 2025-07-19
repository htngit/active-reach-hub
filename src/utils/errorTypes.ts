/**
 * Error type utilities for consistent error handling across the application
 * Replaces 'any' type usage in catch blocks with proper type safety
 */

/**
 * Type guard to check if an error is an Error instance
 */
export const isError = (error: unknown): error is Error => {
  return error instanceof Error;
};

/**
 * Type guard to check if an error has a message property
 */
export const hasMessage = (error: unknown): error is { message: string } => {
  return typeof error === 'object' && error !== null && 'message' in error;
};

/**
 * Safely extracts error message from unknown error type
 */
export const getErrorMessage = (error: unknown): string => {
  if (isError(error)) {
    return error.message;
  }
  
  if (hasMessage(error)) {
    return error.message;
  }
  
  if (typeof error === 'string') {
    return error;
  }
  
  return 'An unknown error occurred';
};

/**
 * Safely logs error with context
 */
export const logError = (error: unknown, context: string): void => {
  const message = getErrorMessage(error);
  console.error(`${context}:`, message, error);
};

/**
 * Common error type for catch blocks - replaces 'any'
 */
export type CatchError = unknown;

/**
 * Error handler function type
 */
export type ErrorHandler = (error: CatchError, context?: string) => void;

/**
 * Default error handler that logs and optionally shows toast
 */
export const defaultErrorHandler: ErrorHandler = (error: CatchError, context = 'Operation') => {
  logError(error, context);
};