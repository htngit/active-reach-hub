import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  getUserName: (userId?: string) => string;
  updateUserName: (name: string) => Promise<void>;
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
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    console.log('Setting up auth state listener...');
    
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state change event:', event, 'Session:', !!session);
        
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);
        
        // Log auth events for debugging
        if (event === 'SIGNED_IN') {
          console.log('User signed in:', session?.user?.email);
        } else if (event === 'SIGNED_OUT') {
          console.log('User signed out');
        } else if (event === 'TOKEN_REFRESHED') {
          console.log('Token refreshed for user:', session?.user?.email);
        }
      }
    );

    // THEN check for existing session
    const checkInitialSession = async () => {
      try {
        const { data: { session: initialSession }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('Error getting initial session:', error);
        }
        
        console.log('Initial session check:', !!initialSession);
        setSession(initialSession);
        setUser(initialSession?.user ?? null);
      } catch (error) {
        console.error('Error during initial session check:', error);
      } finally {
        setLoading(false);
      }
    };

    checkInitialSession();

    return () => {
      console.log('Cleaning up auth subscription');
      subscription.unsubscribe();
    };
  }, []);

  const signIn = async (email: string, password: string) => {
    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      
      if (error) {
        console.error('Sign in error:', error);
        throw error;
      }
      
      console.log('Sign in successful for:', email);
    } finally {
      setLoading(false);
    }
  };

  const signUp = async (email: string, password: string) => {
    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/`
        }
      });
      
      if (error) {
        console.error('Sign up error:', error);
        throw error;
      }
      
      console.log('Sign up successful for:', email);
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    setLoading(true);
    try {
      // Check if we have a session before trying to sign out
      if (!session) {
        console.log('No session to sign out, clearing state manually');
        // Manually clear state if no session exists
        setSession(null);
        setUser(null);
        return;
      }

      const { error } = await supabase.auth.signOut();
      if (error) {
        // Handle specific auth session missing error
        if (error.message === 'Auth session missing!') {
          console.log('Session already missing, clearing state manually');
          // Manually clear state since session is already gone
          setSession(null);
          setUser(null);
          return;
        }
        console.error('Sign out error:', error);
        throw error;
      }
      
      console.log('Sign out successful');
      
      // Manually clear state to ensure immediate UI update
      setSession(null);
      setUser(null);
    } catch (error: any) {
      // Handle auth session missing error gracefully
      if (error.message === 'Auth session missing!') {
        console.log('Session already missing during sign out, clearing state');
        setSession(null);
        setUser(null);
        return;
      }
      console.error('Unexpected sign out error:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const getUserName = (userId?: string) => {
    // If no userId is provided, use the current user
    const targetUser = userId ? undefined : user;
    
    if (targetUser) {
      // Try to get name from user metadata
      const metadata = targetUser.user_metadata;
      if (metadata && metadata.name) {
        return metadata.name;
      }
      // Fallback to email
      if (targetUser.email) {
        return targetUser.email.split('@')[0];
      }
    }
    
    // For other users or if current user has no name/email
    if (userId) {
      // Return a shortened version of the ID for now
      // This will be replaced by the useUserData hook
      return `User ${userId.substring(0, 8)}...`;
    }
    
    // Final fallback
    return 'Unknown User';
  };

  const updateUserName = async (name: string) => {
    if (!user) throw new Error('No user logged in');
    
    const { error } = await supabase.auth.updateUser({
      data: { name }
    });
    
    if (error) throw error;
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      session, 
      loading, 
      signIn, 
      signUp, 
      signOut, 
      getUserName, 
      updateUserName 
    }}>
      {children}
    </AuthContext.Provider>
  );
};
