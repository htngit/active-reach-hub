
import { useState, useCallback } from 'react';
import { UserCache, UserData } from '@/types/userData';

export const useUserCache = () => {
  const [userCache, setUserCache] = useState<UserCache>({});

  const addToCache = useCallback((userId: string, userData: UserData) => {
    setUserCache(prev => ({
      ...prev,
      [userId]: userData
    }));
  }, []);

  const addMultipleToCache = useCallback((newCache: UserCache) => {
    setUserCache(prev => ({
      ...prev,
      ...newCache
    }));
  }, []);

  const isInCache = useCallback((userId: string) => {
    return userCache.hasOwnProperty(userId);
  }, [userCache]);

  const getCachedUser = useCallback((userId: string) => {
    return userCache[userId];
  }, [userCache]);

  const initializeCache = useCallback((userId: string, userData: UserData) => {
    setUserCache(prev => ({
      ...prev,
      [userId]: userData
    }));
  }, []);

  return {
    userCache,
    addToCache,
    addMultipleToCache,
    isInCache,
    getCachedUser,
    initializeCache
  };
};
