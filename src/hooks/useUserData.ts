
import { useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useUserCache } from './useUserCache';
import { useUserFetching } from './useUserFetching';
import { UserData } from '@/types/userData';

export const useUserData = () => {
  const { user } = useAuth();
  const {
    userCache,
    addToCache,
    addMultipleToCache,
    isInCache,
    getCachedUser,
    initializeCache
  } = useUserCache();
  const { loading, fetchSingleUser, fetchMultipleUsers } = useUserFetching();

  // Initialize cache with current user
  useEffect(() => {
    if (user) {
      initializeCache(user.id, {
        id: user.id,
        name: user.user_metadata?.full_name || null,
        email: user.email,
        full_name: null,
        username: null,
        avatar_url: null
      });
      
      // Fetch current user's profile data
      fetchUserData(user.id);
    }
  }, [user]);

  // Fetch user data by ID using Supabase profiles table
  const fetchUserData = useCallback(async (userId: string) => {
    // If already in cache, don't fetch again
    if (isInCache(userId)) return getCachedUser(userId);

    try {
      const userData = await fetchSingleUser(userId);
      addToCache(userId, userData);
      return userData;
    } catch (error) {
      console.error('Error in fetchUserData:', error);
      const fallbackData: UserData = {
        id: userId,
        name: `User ${userId.substring(0, 4)}`,
        email: null,
        full_name: null,
        username: null,
        avatar_url: null
      };
      addToCache(userId, fallbackData);
      return fallbackData;
    }
  }, [isInCache, getCachedUser, fetchSingleUser, addToCache]);

  // Fetch multiple users at once
  const fetchMultipleUsersData = useCallback(async (userIds: string[]) => {
    // Filter out IDs that are already in cache
    const idsToFetch = userIds.filter(id => !isInCache(id));
    
    if (idsToFetch.length === 0) return;

    try {
      const newCache = await fetchMultipleUsers(idsToFetch);
      addMultipleToCache(newCache);
    } catch (error) {
      console.error('Error in fetchMultipleUsersData:', error);
    }
  }, [isInCache, fetchMultipleUsers, addMultipleToCache]);

  // Get user name with fallbacks
  const getUserNameById = useCallback((userId: string): string => {
    // If it's the current user, use the auth context function
    if (user && user.id === userId) {
      return user.user_metadata?.full_name || user.email?.split('@')[0] || 'User';
    }

    // If in cache, use cached data
    const cachedUser = getCachedUser(userId);
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
    if (!isInCache(userId)) {
      // Use setTimeout to break the render cycle
      setTimeout(() => {
        fetchUserData(userId);
      }, 0);
    }
    
    // Use a more user-friendly display name instead of showing the ID
    return `User ${userId.substring(0, 4)}`;
  }, [user, getCachedUser, isInCache, fetchUserData]);

  return {
    userCache,
    loading,
    fetchUserData,
    fetchMultipleUsers: fetchMultipleUsersData,
    getUserNameById
  };
};
