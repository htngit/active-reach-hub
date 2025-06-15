
import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { UserData } from '@/types/userData';

export const useUserFetching = () => {
  const [loading, setLoading] = useState(false);

  const createFallbackUserData = useCallback((userId: string): UserData => {
    return {
      id: userId,
      name: `User ${userId.substring(0, 4)}`,
      email: null,
      full_name: null,
      username: null,
      avatar_url: null
    };
  }, []);

  const generateDisplayName = useCallback((userId: string, profileData: any): string => {
    let displayName = `User ${userId.substring(0, 4)}`; // Default fallback
    
    if (profileData) {
      if (profileData.full_name) displayName = profileData.full_name;
      else if (profileData.username) displayName = profileData.username;
    }
    
    return displayName;
  }, []);

  const fetchSingleUser = useCallback(async (userId: string): Promise<UserData> => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, full_name, username, avatar_url')
        .eq('id', userId)
        .single();

      if (error) {
        console.error('Error fetching profile data:', error);
        throw error;
      }
      
      const displayName = generateDisplayName(userId, data);
      
      const userData: UserData = {
        id: userId,
        name: displayName,
        email: null,
        full_name: data?.full_name || null,
        username: data?.username || null,
        avatar_url: data?.avatar_url || null
      };

      return userData;
    } catch (error) {
      console.error('Error fetching user data:', error);
      return createFallbackUserData(userId);
    } finally {
      setLoading(false);
    }
  }, [generateDisplayName, createFallbackUserData]);

  const fetchMultipleUsers = useCallback(async (userIds: string[]) => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, full_name, username, avatar_url')
        .in('id', userIds);

      if (error) {
        console.error('Error fetching multiple profiles:', error);
        throw error;
      }

      const newCache: { [key: string]: UserData } = {};
      
      // Process fetched profiles
      if (data && data.length > 0) {
        data.forEach(profile => {
          const displayName = generateDisplayName(profile.id, profile);
          
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
      const missingIds = userIds.filter(id => !fetchedIds.includes(id));
      
      missingIds.forEach(userId => {
        newCache[userId] = createFallbackUserData(userId);
      });

      return newCache;
    } catch (error) {
      console.error('Error fetching multiple users:', error);
      
      // Create fallback entries for all IDs that were supposed to be fetched
      const fallbackCache: { [key: string]: UserData } = {};
      userIds.forEach(userId => {
        fallbackCache[userId] = createFallbackUserData(userId);
      });
      
      return fallbackCache;
    } finally {
      setLoading(false);
    }
  }, [generateDisplayName, createFallbackUserData]);

  return {
    loading,
    fetchSingleUser,
    fetchMultipleUsers
  };
};
