/**
 * useUserMetadata Hook
 * 
 * Manages user metadata for real-time data integrity and cache validation.
 * Provides functions to validate contact access, refresh metadata, and check cache freshness.
 * 
 * Features:
 * - Real-time metadata validation
 * - Cache invalidation based on metadata timestamps
 * - Contact access validation
 * - Automatic metadata refresh
 * - Performance monitoring
 */

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

interface UserMetadata {
  id: string;
  user_id: string;
  contact_ids: string[];
  contact_count: number;
  activity_count: number;
  last_activity_at: string | null;
  team_ids: string[];
  permissions: Record<string, any>;
  data_checksum: string;
  cache_version: number;
  last_contact_update: string;
  last_activity_update: string;
  created_at: string;
  updated_at: string;
}

interface MetadataValidationResult {
  isValid: boolean;
  hasAccess: boolean;
  isCacheStale: boolean;
  metadata: UserMetadata | null;
  error?: string;
}

interface UseUserMetadataReturn {
  metadata: UserMetadata | null;
  isLoading: boolean;
  error: string | null;
  validateContactAccess: (contactId: string) => Promise<MetadataValidationResult>;
  refreshMetadata: () => Promise<boolean>;
  checkCacheValidity: (cacheTimestamp: string) => boolean;
  getMetadataAge: () => number;
  isMetadataStale: (maxAgeMinutes?: number) => boolean;
}

/**
 * Custom hook for managing user metadata and cache validation
 */
export const useUserMetadata = (): UseUserMetadataReturn => {
  const [metadata, setMetadata] = useState<UserMetadata | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  /**
   * Fetches user metadata from database
   */
  const fetchMetadata = useCallback(async (): Promise<UserMetadata | null> => {
    if (!user?.id) {
      setError('User not authenticated');
      return null;
    }

    try {
      setIsLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from('user_metadata')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (fetchError) {
        // If metadata doesn't exist, create it
        if (fetchError.code === 'PGRST116') {
          console.log('Metadata not found, refreshing...');
          const refreshed = await refreshMetadata();
          if (refreshed) {
            return await fetchMetadata();
          }
        }
        throw fetchError;
      }

      setMetadata(data);
      return data;
    } catch (err: any) {
      const errorMessage = `Failed to fetch metadata: ${err.message}`;
      setError(errorMessage);
      console.error('Metadata fetch error:', err);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [user?.id]);

  /**
   * Refreshes user metadata by calling the database function
   */
  const refreshMetadata = useCallback(async (): Promise<boolean> => {
    if (!user?.id) {
      setError('User not authenticated');
      return false;
    }

    try {
      setIsLoading(true);
      console.log('🔄 Refreshing user metadata...');

      const { error: refreshError } = await supabase.rpc('refresh_user_metadata', {
        p_user_id: user.id
      });

      if (refreshError) {
        throw refreshError;
      }

      // Fetch updated metadata
      const updatedMetadata = await fetchMetadata();
      console.log('✅ Metadata refreshed successfully');
      
      return updatedMetadata !== null;
    } catch (err: any) {
      const errorMessage = `Failed to refresh metadata: ${err.message}`;
      setError(errorMessage);
      console.error('Metadata refresh error:', err);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [user?.id, fetchMetadata]);

  /**
   * Validates contact access using metadata
   */
  const validateContactAccess = useCallback(async (contactId: string): Promise<MetadataValidationResult> => {
    const startTime = performance.now();
    
    try {
      if (!user?.id) {
        return {
          isValid: false,
          hasAccess: false,
          isCacheStale: false,
          metadata: null,
          error: 'User not authenticated'
        };
      }

      if (!contactId) {
        return {
          isValid: false,
          hasAccess: false,
          isCacheStale: false,
          metadata: null,
          error: 'Contact ID is required'
        };
      }

      // Get current metadata
      let currentMetadata = metadata;
      if (!currentMetadata) {
        currentMetadata = await fetchMetadata();
      }

      if (!currentMetadata) {
        return {
          isValid: false,
          hasAccess: false,
          isCacheStale: false,
          metadata: null,
          error: 'Failed to load metadata'
        };
      }

      // Check if metadata is stale (older than 5 minutes)
      const metadataAge = Date.now() - new Date(currentMetadata.updated_at).getTime();
      const isStale = metadataAge > 5 * 60 * 1000; // 5 minutes

      // If stale, refresh metadata
      if (isStale) {
        console.log('⚠️ Metadata is stale, refreshing...');
        const refreshed = await refreshMetadata();
        if (refreshed) {
          currentMetadata = await fetchMetadata();
        }
      }

      // Validate contact access
      const hasAccess = currentMetadata?.contact_ids?.includes(contactId) || false;

      const endTime = performance.now();
      console.log(`🔍 Contact access validation completed in ${(endTime - startTime).toFixed(2)}ms`);

      return {
        isValid: true,
        hasAccess,
        isCacheStale: isStale,
        metadata: currentMetadata,
        error: hasAccess ? undefined : 'Contact access denied'
      };
    } catch (err: any) {
      console.error('Contact access validation error:', err);
      return {
        isValid: false,
        hasAccess: false,
        isCacheStale: false,
        metadata: null,
        error: err.message
      };
    }
  }, [user?.id, metadata, fetchMetadata, refreshMetadata]);

  /**
   * Checks if cache is valid based on metadata timestamp
   */
  const checkCacheValidity = useCallback((cacheTimestamp: string): boolean => {
    if (!metadata) return false;
    
    const cacheTime = new Date(cacheTimestamp).getTime();
    const metadataTime = new Date(metadata.updated_at).getTime();
    
    return cacheTime >= metadataTime;
  }, [metadata]);

  /**
   * Gets metadata age in milliseconds
   */
  const getMetadataAge = useCallback((): number => {
    if (!metadata) return Infinity;
    
    return Date.now() - new Date(metadata.updated_at).getTime();
  }, [metadata]);

  /**
   * Checks if metadata is stale based on age
   */
  const isMetadataStale = useCallback((maxAgeMinutes: number = 5): boolean => {
    const age = getMetadataAge();
    return age > maxAgeMinutes * 60 * 1000;
  }, [getMetadataAge]);

  // Load metadata on mount and user change
  useEffect(() => {
    if (user?.id) {
      fetchMetadata();
    } else {
      setMetadata(null);
      setError(null);
    }
  }, [user?.id, fetchMetadata]);

  // Set up real-time subscription for metadata changes
  useEffect(() => {
    if (!user?.id) return;

    const subscription = supabase
      .channel('user_metadata_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'user_metadata',
          filter: `user_id=eq.${user.id}`
        },
        (payload) => {
          console.log('📡 Metadata changed:', payload);
          if (payload.new) {
            setMetadata(payload.new as UserMetadata);
          }
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [user?.id]);

  return {
    metadata,
    isLoading,
    error,
    validateContactAccess,
    refreshMetadata,
    checkCacheValidity,
    getMetadataAge,
    isMetadataStale
  };
};

export default useUserMetadata;