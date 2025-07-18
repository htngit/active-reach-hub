import { supabase } from '@/integrations/supabase/client';
import { mapAuthError, logAuthError } from '@/utils/authErrors';
import { validateEmail, validatePassword, sanitizeInput } from '@/utils/authValidation';

export interface AuthUser {
  id: string;
  email: string;
  user_metadata?: {
    full_name?: string;
    avatar_url?: string;
  };
}

export interface AuthResponse {
  success: boolean;
  user?: AuthUser;
  error?: string;
}

export interface SignUpResponse extends AuthResponse {
  needsEmailConfirmation?: boolean;
}

/**
 * Centralized Authentication Service
 * Provides a unified interface for all authentication operations
 */
export class AuthService {
  /**
   * Sign in with email and password
   */
  static async signIn(email: string, password: string): Promise<AuthResponse> {
    try {
      // Sanitize inputs
      const sanitizedEmail = sanitizeInput(email.trim().toLowerCase());
      const sanitizedPassword = sanitizeInput(password);

      // Basic validation
      const emailValidation = validateEmail(sanitizedEmail);
      if (!emailValidation.isValid) {
        return {
          success: false,
          error: emailValidation.errors[0] || 'Invalid email address'
        };
      }

      // Attempt sign in
      const { data, error } = await supabase.auth.signInWithPassword({
        email: sanitizedEmail,
        password: sanitizedPassword,
      });

      if (error) {
        logAuthError('signIn', error, { email: sanitizedEmail });
        return {
          success: false,
          error: mapAuthError(error)
        };
      }

      if (!data.user) {
        return {
          success: false,
          error: 'Authentication failed. Please try again.'
        };
      }

      return {
        success: true,
        user: {
          id: data.user.id,
          email: data.user.email!,
          user_metadata: data.user.user_metadata
        }
      };
    } catch (error: any) {
      logAuthError('signIn', error, { email });
      return {
        success: false,
        error: 'An unexpected error occurred. Please try again.'
      };
    }
  }

  /**
   * Sign up with email and password
   */
  static async signUp(email: string, password: string): Promise<SignUpResponse> {
    try {
      // Sanitize inputs
      const sanitizedEmail = sanitizeInput(email.trim().toLowerCase());
      const sanitizedPassword = sanitizeInput(password);

      // Validate email
      const emailValidation = validateEmail(sanitizedEmail);
      if (!emailValidation.isValid) {
        return {
          success: false,
          error: emailValidation.errors[0] || 'Invalid email address'
        };
      }

      // Validate password
      const passwordValidation = validatePassword(sanitizedPassword, sanitizedEmail);
      if (!passwordValidation.isValid) {
        return {
          success: false,
          error: passwordValidation.errors[0] || 'Password does not meet requirements'
        };
      }

      // Attempt sign up
      const { data, error } = await supabase.auth.signUp({
        email: sanitizedEmail,
        password: sanitizedPassword,
        options: {
          emailRedirectTo: `${window.location.origin}/`,
        },
      });

      if (error) {
        logAuthError('signUp', error, { email: sanitizedEmail });
        return {
          success: false,
          error: mapAuthError(error)
        };
      }

      // Check if email confirmation is needed
      const needsEmailConfirmation = !data.session && data.user && !data.user.email_confirmed_at;

      return {
        success: true,
        user: data.user ? {
          id: data.user.id,
          email: data.user.email!,
          user_metadata: data.user.user_metadata
        } : undefined,
        needsEmailConfirmation
      };
    } catch (error: any) {
      logAuthError('signUp', error, { email });
      return {
        success: false,
        error: 'An unexpected error occurred. Please try again.'
      };
    }
  }

  /**
   * Sign out current user
   */
  static async signOut(): Promise<AuthResponse> {
    try {
      const { error } = await supabase.auth.signOut();

      if (error) {
        logAuthError('signOut', error);
        return {
          success: false,
          error: mapAuthError(error)
        };
      }

      return { success: true };
    } catch (error: any) {
      logAuthError('signOut', error);
      return {
        success: false,
        error: 'Failed to sign out. Please try again.'
      };
    }
  }

  /**
   * Reset password for email
   */
  static async resetPasswordForEmail(email: string): Promise<AuthResponse> {
    try {
      // Sanitize input
      const sanitizedEmail = sanitizeInput(email.trim().toLowerCase());

      // Validate email
      const emailValidation = validateEmail(sanitizedEmail);
      if (!emailValidation.isValid) {
        return {
          success: false,
          error: emailValidation.errors[0] || 'Invalid email address'
        };
      }

      const { error } = await supabase.auth.resetPasswordForEmail(sanitizedEmail, {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (error) {
        logAuthError('resetPasswordForEmail', error, { email: sanitizedEmail });
        return {
          success: false,
          error: mapAuthError(error)
        };
      }

      return { success: true };
    } catch (error: any) {
      logAuthError('resetPasswordForEmail', error, { email });
      return {
        success: false,
        error: 'Failed to send reset email. Please try again.'
      };
    }
  }

  /**
   * Update user password
   */
  static async updatePassword(newPassword: string): Promise<AuthResponse> {
    try {
      // Sanitize input
      const sanitizedPassword = sanitizeInput(newPassword);

      // Validate password
      const passwordValidation = validatePassword(sanitizedPassword);
      if (!passwordValidation.isValid) {
        return {
          success: false,
          error: passwordValidation.errors[0] || 'Password does not meet requirements'
        };
      }

      const { data, error } = await supabase.auth.updateUser({
        password: sanitizedPassword
      });

      if (error) {
        logAuthError('updatePassword', error);
        return {
          success: false,
          error: mapAuthError(error)
        };
      }

      return {
        success: true,
        user: data.user ? {
          id: data.user.id,
          email: data.user.email!,
          user_metadata: data.user.user_metadata
        } : undefined
      };
    } catch (error: any) {
      logAuthError('updatePassword', error);
      return {
        success: false,
        error: 'Failed to update password. Please try again.'
      };
    }
  }

  /**
   * Get current user session
   */
  static async getCurrentUser(): Promise<AuthUser | null> {
    try {
      const { data: { user }, error } = await supabase.auth.getUser();

      if (error || !user) {
        return null;
      }

      return {
        id: user.id,
        email: user.email!,
        user_metadata: user.user_metadata
      };
    } catch (error: any) {
      logAuthError('getCurrentUser', error);
      return null;
    }
  }

  /**
   * Get current session
   */
  static async getCurrentSession() {
    try {
      const { data: { session }, error } = await supabase.auth.getSession();

      if (error) {
        logAuthError('getCurrentSession', error);
        return null;
      }

      return session;
    } catch (error: any) {
      logAuthError('getCurrentSession', error);
      return null;
    }
  }

  /**
   * Listen to auth state changes
   */
  static onAuthStateChange(callback: (event: string, session: any) => void) {
    return supabase.auth.onAuthStateChange(callback);
  }

  /**
   * Update user metadata
   */
  static async updateUserMetadata(metadata: Record<string, any>): Promise<AuthResponse> {
    try {
      // Sanitize metadata
      const sanitizedMetadata: Record<string, any> = {};
      for (const [key, value] of Object.entries(metadata)) {
        if (typeof value === 'string') {
          sanitizedMetadata[key] = sanitizeInput(value);
        } else {
          sanitizedMetadata[key] = value;
        }
      }

      const { data, error } = await supabase.auth.updateUser({
        data: sanitizedMetadata
      });

      if (error) {
        logAuthError('updateUserMetadata', error);
        return {
          success: false,
          error: mapAuthError(error)
        };
      }

      return {
        success: true,
        user: data.user ? {
          id: data.user.id,
          email: data.user.email!,
          user_metadata: data.user.user_metadata
        } : undefined
      };
    } catch (error: any) {
      logAuthError('updateUserMetadata', error);
      return {
        success: false,
        error: 'Failed to update user information. Please try again.'
      };
    }
  }
}

export default AuthService;