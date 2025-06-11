
import React, { createContext, useContext, useEffect, useState } from 'react';
import { User } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

interface AuthContextType {
  user: User | null;
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
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setUser(session?.user ?? null);
        setLoading(false);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) throw error;
  };

  const signUp = async (email: string, password: string) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
    });
    if (error) throw error;
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
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
    <AuthContext.Provider value={{ user, loading, signIn, signUp, signOut, getUserName, updateUserName }}>
      {children}
    </AuthContext.Provider>
  );
};
