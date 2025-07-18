import React, { createContext, useContext, useEffect, useState } from 'react';
import { User } from '@supabase/supabase-js';
import { AuthService, AuthUser } from '@/services/authService';
import { toast } from '@/hooks/use-toast';

interface AuthContextType {
  user: AuthUser | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<boolean>;
  signUp: (email: string, password: string) => Promise<boolean>;
  signOut: () => Promise<boolean>;
  getUserName: () => string;
  updateUserName: (name: string) => Promise<boolean>;
  resetPassword: (email: string) => Promise<boolean>;
  updatePassword: (newPassword: string) => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Get initial session
    const initializeAuth = async () => {
      try {
        const currentUser = await AuthService.getCurrentUser();
        setUser(currentUser);
      } catch (error) {
        console.error('Failed to initialize auth:', error);
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    initializeAuth();

    // Listen for auth changes
    const { data: { subscription } } = AuthService.onAuthStateChange(async (event, session) => {
      console.log('Auth state changed:', event, session?.user?.email);
      
      if (session?.user) {
        setUser({
          id: session.user.id,
          email: session.user.email!,
          user_metadata: session.user.user_metadata
        });
      } else {
        setUser(null);
      }
      
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signIn = async (email: string, password: string): Promise<boolean> => {
    setLoading(true);
    try {
      const response = await AuthService.signIn(email, password);
      
      if (response.success) {
        toast({
          title: "Welcome back!",
          description: "You have been signed in successfully.",
        });
        return true;
      } else {
        toast({
          title: "Sign In Failed",
          description: response.error || "Please check your credentials and try again.",
          variant: "destructive",
        });
        return false;
      }
    } catch (error: any) {
      console.error('Sign in error:', error);
      toast({
        title: "Sign In Error",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive",
      });
      return false;
    } finally {
      setLoading(false);
    }
  };

  const signUp = async (email: string, password: string): Promise<boolean> => {
    setLoading(true);
    try {
      const response = await AuthService.signUp(email, password);
      
      if (response.success) {
        if (response.needsEmailConfirmation) {
          toast({
            title: "Account Created!",
            description: "Please check your email to verify your account before signing in.",
          });
        } else {
          toast({
            title: "Welcome!",
            description: "Your account has been created successfully.",
          });
        }
        return true;
      } else {
        toast({
          title: "Sign Up Failed",
          description: response.error || "Please check your information and try again.",
          variant: "destructive",
        });
        return false;
      }
    } catch (error: any) {
      console.error('Sign up error:', error);
      toast({
        title: "Sign Up Error",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive",
      });
      return false;
    } finally {
      setLoading(false);
    }
  };

  const signOut = async (): Promise<boolean> => {
    setLoading(true);
    try {
      const response = await AuthService.signOut();
      
      if (response.success) {
        toast({
          title: "Signed Out",
          description: "You have been signed out successfully.",
        });
        return true;
      } else {
        toast({
          title: "Sign Out Failed",
          description: response.error || "Failed to sign out. Please try again.",
          variant: "destructive",
        });
        return false;
      }
    } catch (error: any) {
      console.error('Sign out error:', error);
      toast({
        title: "Sign Out Error",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive",
      });
      return false;
    } finally {
      setLoading(false);
    }
  };

  const getUserName = () => {
    if (user?.user_metadata?.full_name) {
      return user.user_metadata.full_name;
    }
    if (user?.email) {
      return user.email.split('@')[0];
    }
    return user?.id || 'User';
  };

  const updateUserName = async (name: string): Promise<boolean> => {
    setLoading(true);
    try {
      const response = await AuthService.updateUserMetadata({ full_name: name });
      
      if (response.success) {
        toast({
          title: "Profile Updated",
          description: "Your name has been updated successfully.",
        });
        return true;
      } else {
        toast({
          title: "Update Failed",
          description: response.error || "Failed to update your name. Please try again.",
          variant: "destructive",
        });
        return false;
      }
    } catch (error: any) {
      console.error('Update user name error:', error);
      toast({
        title: "Update Error",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive",
      });
      return false;
    } finally {
      setLoading(false);
    }
  };

  const resetPassword = async (email: string): Promise<boolean> => {
    setLoading(true);
    try {
      const response = await AuthService.resetPasswordForEmail(email);
      
      if (response.success) {
        toast({
          title: "Reset Link Sent",
          description: "Check your email for the password reset link.",
        });
        return true;
      } else {
        toast({
          title: "Reset Failed",
          description: response.error || "Failed to send reset email. Please try again.",
          variant: "destructive",
        });
        return false;
      }
    } catch (error: any) {
      console.error('Reset password error:', error);
      toast({
        title: "Reset Error",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive",
      });
      return false;
    } finally {
      setLoading(false);
    }
  };

  const updatePassword = async (newPassword: string): Promise<boolean> => {
    setLoading(true);
    try {
      const response = await AuthService.updatePassword(newPassword);
      
      if (response.success) {
        toast({
          title: "Password Updated",
          description: "Your password has been updated successfully.",
        });
        return true;
      } else {
        toast({
          title: "Update Failed",
          description: response.error || "Failed to update password. Please try again.",
          variant: "destructive",
        });
        return false;
      }
    } catch (error: any) {
      console.error('Update password error:', error);
      toast({
        title: "Update Error",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive",
      });
      return false;
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      loading, 
      signIn, 
      signUp, 
      signOut, 
      getUserName, 
      updateUserName,
      resetPassword,
      updatePassword 
    }}>
      {children}
    </AuthContext.Provider>
  );
};
