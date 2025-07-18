/**
 * Custom Hook for Authentication with Enhanced Validation and Error Handling
 * Provides comprehensive auth logic with validation, rate limiting, and user-friendly error messages
 */

import { useState, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';
import { 
  validateEmail, 
  validatePassword, 
  validatePasswordConfirmation,
  authRateLimit,
  sanitizeInput,
  ValidationResult
} from '@/utils/authValidation';
import { mapAuthError, logAuthError } from '@/utils/authErrors';

interface AuthValidationState {
  emailValidation: ValidationResult | null;
  passwordValidation: ValidationResult | null;
  confirmPasswordValidation: ValidationResult | null;
  isValidating: boolean;
  isRateLimited: boolean;
  remainingTime: number;
}

interface UseAuthValidationReturn {
  // State
  validationState: AuthValidationState;
  loading: boolean;
  
  // Validation functions
  validateEmailInput: (email: string) => ValidationResult;
  validatePasswordInput: (password: string, email?: string) => ValidationResult;
  validatePasswordConfirmationInput: (password: string, confirmPassword: string) => ValidationResult;
  
  // Auth functions with validation
  signInWithValidation: (email: string, password: string) => Promise<boolean>;
  signUpWithValidation: (email: string, password: string, confirmPassword: string) => Promise<boolean>;
  resetPasswordWithValidation: (email: string) => Promise<boolean>;
  
  // Utility functions
  clearValidation: () => void;
  checkRateLimit: (email: string) => boolean;
}

export const useAuthValidation = (): UseAuthValidationReturn => {
  const { signIn, signUp } = useAuth();
  const [loading, setLoading] = useState(false);
  const [validationState, setValidationState] = useState<AuthValidationState>({
    emailValidation: null,
    passwordValidation: null,
    confirmPasswordValidation: null,
    isValidating: false,
    isRateLimited: false,
    remainingTime: 0
  });

  /**
   * Validates email input and updates state
   */
  const validateEmailInput = useCallback((email: string): ValidationResult => {
    const sanitizedEmail = sanitizeInput(email);
    const validation = validateEmail(sanitizedEmail);
    
    setValidationState(prev => ({
      ...prev,
      emailValidation: validation
    }));
    
    return validation;
  }, []);

  /**
   * Validates password input and updates state
   */
  const validatePasswordInput = useCallback((password: string, email?: string): ValidationResult => {
    const validation = validatePassword(password, email);
    
    setValidationState(prev => ({
      ...prev,
      passwordValidation: validation
    }));
    
    return validation;
  }, []);

  /**
   * Validates password confirmation and updates state
   */
  const validatePasswordConfirmationInput = useCallback((password: string, confirmPassword: string): ValidationResult => {
    const validation = validatePasswordConfirmation(password, confirmPassword);
    
    setValidationState(prev => ({
      ...prev,
      confirmPasswordValidation: validation
    }));
    
    return validation;
  }, []);

  /**
   * Checks if user is rate limited
   */
  const checkRateLimit = useCallback((email: string): boolean => {
    const isLimited = authRateLimit.isRateLimited(email);
    const remainingTime = authRateLimit.getRemainingTime(email);
    
    setValidationState(prev => ({
      ...prev,
      isRateLimited: isLimited,
      remainingTime
    }));
    
    if (isLimited) {
      const minutes = Math.ceil(remainingTime / (1000 * 60));
      toast({
        title: "Too Many Attempts",
        description: `Please wait ${minutes} minute(s) before trying again.`,
        variant: "destructive",
      });
    }
    
    return isLimited;
  }, []);

  /**
   * Sign in with comprehensive validation
   */
  const signInWithValidation = useCallback(async (email: string, password: string): Promise<boolean> => {
    try {
      setLoading(true);
      setValidationState(prev => ({ ...prev, isValidating: true }));
      
      // Sanitize inputs
      const sanitizedEmail = sanitizeInput(email);
      const sanitizedPassword = password; // Don't sanitize password as it may contain special chars
      
      // Validate inputs
      const emailValidation = validateEmailInput(sanitizedEmail);
      const passwordValidation = validatePasswordInput(sanitizedPassword, sanitizedEmail);
      
      // Check for validation errors
      if (!emailValidation.isValid) {
        toast({
          title: "Invalid Email",
          description: emailValidation.errors[0],
          variant: "destructive",
        });
        return false;
      }
      
      if (!passwordValidation.isValid) {
        toast({
          title: "Invalid Password",
          description: passwordValidation.errors[0],
          variant: "destructive",
        });
        return false;
      }
      
      // Check rate limiting
      if (checkRateLimit(sanitizedEmail)) {
        return false;
      }
      
      // Attempt sign in
      await signIn(sanitizedEmail, sanitizedPassword);
      
      // Clear rate limit on successful sign in
      authRateLimit.clearAttempts(sanitizedEmail);
      
      toast({
        title: "Welcome Back!",
        description: "You have successfully signed in.",
      });
      
      return true;
      
    } catch (error: any) {
      // Record failed attempt
      authRateLimit.recordAttempt(sanitizeInput(email));
      
      // Log error for debugging
      logAuthError(error, 'signIn');
      
      // Show user-friendly error message
      const errorMessage = mapAuthError(error);
      toast({
        title: errorMessage.title,
        description: errorMessage.description,
        variant: "destructive",
      });
      
      return false;
    } finally {
      setLoading(false);
      setValidationState(prev => ({ ...prev, isValidating: false }));
    }
  }, [signIn, validateEmailInput, validatePasswordInput, checkRateLimit]);

  /**
   * Sign up with comprehensive validation
   */
  const signUpWithValidation = useCallback(async (email: string, password: string, confirmPassword: string): Promise<boolean> => {
    try {
      setLoading(true);
      setValidationState(prev => ({ ...prev, isValidating: true }));
      
      // Sanitize inputs
      const sanitizedEmail = sanitizeInput(email);
      const sanitizedPassword = password;
      
      // Validate inputs
      const emailValidation = validateEmailInput(sanitizedEmail);
      const passwordValidation = validatePasswordInput(sanitizedPassword, sanitizedEmail);
      const confirmPasswordValidation = validatePasswordConfirmationInput(sanitizedPassword, confirmPassword);
      
      // Check for validation errors
      if (!emailValidation.isValid) {
        toast({
          title: "Invalid Email",
          description: emailValidation.errors[0],
          variant: "destructive",
        });
        return false;
      }
      
      if (!passwordValidation.isValid) {
        toast({
          title: "Invalid Password",
          description: passwordValidation.errors[0],
          variant: "destructive",
        });
        return false;
      }
      
      if (!confirmPasswordValidation.isValid) {
        toast({
          title: "Password Mismatch",
          description: confirmPasswordValidation.errors[0],
          variant: "destructive",
        });
        return false;
      }
      
      // Show warnings for password strength
      if (passwordValidation.warnings && passwordValidation.warnings.length > 0) {
        toast({
          title: "Password Warning",
          description: passwordValidation.warnings[0],
          variant: "default",
        });
      }
      
      // Check rate limiting
      if (checkRateLimit(sanitizedEmail)) {
        return false;
      }
      
      // Attempt sign up
      await signUp(sanitizedEmail, sanitizedPassword);
      
      toast({
        title: "Account Created!",
        description: "Please check your email to verify your account before signing in.",
      });
      
      return true;
      
    } catch (error: any) {
      // Record failed attempt
      authRateLimit.recordAttempt(sanitizeInput(email));
      
      // Log error for debugging
      logAuthError(error, 'signUp');
      
      // Show user-friendly error message
      const errorMessage = mapAuthError(error);
      toast({
        title: errorMessage.title,
        description: errorMessage.description,
        variant: "destructive",
      });
      
      return false;
    } finally {
      setLoading(false);
      setValidationState(prev => ({ ...prev, isValidating: false }));
    }
  }, [signUp, validateEmailInput, validatePasswordInput, validatePasswordConfirmationInput, checkRateLimit]);

  /**
   * Reset password with validation
   */
  const resetPasswordWithValidation = useCallback(async (email: string): Promise<boolean> => {
    try {
      setLoading(true);
      
      // Sanitize and validate email
      const sanitizedEmail = sanitizeInput(email);
      const emailValidation = validateEmailInput(sanitizedEmail);
      
      if (!emailValidation.isValid) {
        toast({
          title: "Invalid Email",
          description: emailValidation.errors[0],
          variant: "destructive",
        });
        return false;
      }
      
      // Check rate limiting
      if (checkRateLimit(sanitizedEmail)) {
        return false;
      }
      
      // Import supabase client for password reset
      const { supabase } = await import('@/integrations/supabase/client');
      
      const { error } = await supabase.auth.resetPasswordForEmail(sanitizedEmail, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      
      if (error) {
        throw error;
      }
      
      toast({
        title: "Reset Email Sent",
        description: "Please check your email for password reset instructions.",
      });
      
      return true;
      
    } catch (error: any) {
      // Record failed attempt
      authRateLimit.recordAttempt(sanitizeInput(email));
      
      // Log error for debugging
      logAuthError(error, 'resetPassword');
      
      // Show user-friendly error message
      const errorMessage = mapAuthError(error);
      toast({
        title: errorMessage.title,
        description: errorMessage.description,
        variant: "destructive",
      });
      
      return false;
    } finally {
      setLoading(false);
    }
  }, [validateEmailInput, checkRateLimit]);

  /**
   * Clear all validation state
   */
  const clearValidation = useCallback(() => {
    setValidationState({
      emailValidation: null,
      passwordValidation: null,
      confirmPasswordValidation: null,
      isValidating: false,
      isRateLimited: false,
      remainingTime: 0
    });
  }, []);

  return {
    validationState,
    loading,
    validateEmailInput,
    validatePasswordInput,
    validatePasswordConfirmationInput,
    signInWithValidation,
    signUpWithValidation,
    resetPasswordWithValidation,
    clearValidation,
    checkRateLimit
  };
};