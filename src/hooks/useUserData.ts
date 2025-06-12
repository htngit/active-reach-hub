import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';

interface UserData {
  id: string;
  name: string | null;
  email: string | null;
  full_name: string | null; // Added from profiles table
  username: string | null; // Added from profiles table
  avatar_url: string | null; // Added from profiles table
}

interface UserCache {
  [userId: string]: UserData;
}

export const useUserData = () => {
  const { user, getUserName } = useAuth();
  const [userCache, setUserCache] = useState<UserCache>({});
  const [loading, setLoading] = useState(false);

  // Initialize cache with current user
  useEffect(() => {
    if (user) {
      setUserCache(prev => ({
        ...prev,
        [user.id]: {
          id: user.id,
          name: user.user_metadata?.name || null,
          email: user.email,
          full_name: null,
          username: null,
          avatar_url: null
        }
      }));
      
      // Fetch current user's profile data
      fetchUserData(user.id);
    }
  }, [user]);

  // Fetch user data by ID using Supabase profiles table
  const fetchUserData = useCallback(async (userId: string) => {
    // If already in cache, don't fetch again
    if (userCache[userId]) return userCache[userId];

    setLoading(true);
    try {
      // Fetch user profile from profiles table
      const { data, error } = await supabase
        .from('profiles')
        .select('id, full_name, username, avatar_url')
        .eq('id', userId)
        .single();

      if (error) {
        console.error('Error fetching profile data:', error);
        throw error;
      }
      
      // Generate a user-friendly name based on available data
      let displayName = `User ${userId.substring(0, 4)}`; // Default fallback
      
      if (data) {
        // Use full_name or username from profiles if available
        if (data.full_name) displayName = data.full_name;
        else if (data.username) displayName = data.username;
      }
      
      // Create or update user data in cache
      const userData: UserData = {
        id: userId,
        name: displayName,
        email: null,
        full_name: data?.full_name || null,
        username: data?.username || null,
        avatar_url: data?.avatar_url || null
      };

      setUserCache(prev => ({
        ...prev,
        [userId]: userData
      }));

      return userData;
    } catch (error) {
      console.error('Error fetching user data:', error);
      
      // Create a fallback entry with a placeholder name
      const fallbackData: UserData = {
        id: userId,
        name: `User ${userId.substring(0, 4)}`,
        email: null,
        full_name: null,
        username: null,
        avatar_url: null
      };
      
      setUserCache(prev => ({
        ...prev,
        [userId]: fallbackData
      }));
      
      return fallbackData;
    } finally {
      setLoading(false);
    }
  }, []); // Remove userCache from dependency array

  // Fetch multiple users at once
  const fetchMultipleUsers = useCallback(async (userIds: string[]) => {
    // Filter out IDs that are already in cache
    const idsToFetch = userIds.filter(id => !userCache[id]);
    
    if (idsToFetch.length === 0) return;

    setLoading(true);
    try {
      // Fetch profiles for all IDs in one query
      const { data, error } = await supabase
        .from('profiles')
        .select('id, full_name, username, avatar_url')
        .in('id', idsToFetch);

      if (error) {
        console.error('Error fetching multiple profiles:', error);
        throw error;
      }

      // Create a new cache with the fetched data
      const newCache = { ...userCache };
      
      // Process fetched profiles
      if (data && data.length > 0) {
        data.forEach(profile => {
          // Determine display name based on available data
          let displayName = `User ${profile.id.substring(0, 4)}`; // Default fallback
          
          if (profile.full_name) displayName = profile.full_name;
          else if (profile.username) displayName = profile.username;
          
          newCache[profile.id] = {
            id: profile.id,
            name: displayName,
            email: null,
            full_name: profile.full_name || null,
            username: profile.username || null,
            avatar_url: profile.avatar_url || null
          };
        });
      }
      
      // Create fallback entries for any IDs that weren't found
      const fetchedIds = data ? data.map(profile => profile.id) : [];
      const missingIds = idsToFetch.filter(id => !fetchedIds.includes(id));
      
      missingIds.forEach(userId => {
        newCache[userId] = {
          id: userId,
          name: `User ${userId.substring(0, 4)}`,
          email: null,
          full_name: null,
          username: null,
          avatar_url: null
        };
      });

      setUserCache(newCache);
    } catch (error) {
      console.error('Error fetching multiple users:', error);
      
      // Create fallback entries for all IDs that were supposed to be fetched
      const newCache = { ...userCache };
      
      idsToFetch.forEach(userId => {
        newCache[userId] = {
          id: userId,
          name: `User ${userId.substring(0, 4)}`,
          email: null,
          full_name: null,
          username: null,
          avatar_url: null
        };
      });
      
      setUserCache(newCache);
    } finally {
      setLoading(false);
    }
  }, []); // Remove userCache from dependency array

  // Get user name with fallbacks
  const getUserNameById = useCallback((userId: string): string => {
    // If it's the current user, use the auth context function
    if (user && user.id === userId) {
      return getUserName();
    }

    // If in cache, use cached data
    const cachedUser = userCache[userId];
    if (cachedUser) {
      // Prioritize name from cache
      if (cachedUser.name) return cachedUser.name;
      // Then try full_name from profiles
      if (cachedUser.full_name) return cachedUser.full_name;
      // Then try username from profiles
      if (cachedUser.username) return cachedUser.username;
      // Then try email
      if (cachedUser.email) return cachedUser.email.split('@')[0];
    }

    // Fetch user data if not in cache
    if (!userCache[userId]) {
      // Use setTimeout to break the render cycle
      setTimeout(() => {
        fetchUserData(userId);
      }, 0);
    }
    
    // Use a more user-friendly display name instead of showing the ID
    return `User ${userId.substring(0, 4)}`;
  }, [user, userCache, getUserName, fetchUserData]);

  return {
    userCache,
    loading,
    fetchUserData,
    fetchMultipleUsers,
    getUserNameById
  };
};