/**
 * Simplified authService
 */

export interface AuthUser {
  id: string;
  email: string;
  user_metadata?: any;
}

export const AuthService = {
  signIn: async (email: string, password: string) => {
    return { data: null, error: null };
  },
  signUp: async (email: string, password: string) => {
    return { data: null, error: null };
  },
  signOut: async () => {
    return { error: null };
  },
  resetPassword: async (email: string) => {
    return { error: null };
  }
};

export const signIn = async (email: string, password: string) => {
  return { data: null, error: null };
};

export const signUp = async (email: string, password: string) => {
  return { data: null, error: null };
};

export const signOut = async () => {
  return { error: null };
};

export const resetPassword = async (email: string) => {
  return { error: null };
};