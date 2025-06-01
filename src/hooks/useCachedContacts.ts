
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface Contact {
  id: string;
  name: string;
  phone_number: string;
  email?: string;
  company?: string;
  address?: string;
  notes?: string;
  labels?: string[];
  status: string;
  potential_product?: string[];
  created_at: string;
}

interface CacheData {
  contacts: Contact[];
  etag: string;
  lastModified: string;
  cachedAt: string;
}

export const useCachedContacts = () => {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [cacheInfo, setCacheInfo] = useState<string>('');
  const { user } = useAuth();

  // Get cache from localStorage
  const getCachedData = useCallback((): CacheData | null => {
    if (!user) return null;
    
    try {
      const cached = localStorage.getItem(`contacts_cache_${user.id}`);
      return cached ? JSON.parse(cached) : null;
    } catch {
      return null;
    }
  }, [user]);

  // Save cache to localStorage
  const setCachedData = useCallback((data: CacheData) => {
    if (!user) return;
    
    try {
      localStorage.setItem(`contacts_cache_${user.id}`, JSON.stringify(data));
    } catch (error) {
      console.warn('Failed to cache data:', error);
    }
  }, [user]);

  // Fetch contacts with cache validation
  const fetchContacts = useCallback(async (skipCache = false) => {
    if (!user) return;

    setLoading(true);
    setError(null);

    try {
      const cachedData = getCachedData();
      const headers: Record<string, string> = {};

      // Add cache headers if we have cached data and not skipping cache
      if (cachedData && !skipCache) {
        headers['If-None-Match'] = cachedData.etag;
        headers['If-Modified-Since'] = cachedData.lastModified;
      }

      // Get auth token
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('No session found');
      }

      headers['Authorization'] = `Bearer ${session.access_token}`;

      // Call edge function with cache headers
      const { data, error: functionError } = await supabase.functions.invoke('cached-contacts', {
        headers,
      });

      if (functionError) {
        // Check if it's a 304 Not Modified response
        if (functionError.message?.includes('304') && cachedData) {
          setContacts(cachedData.contacts);
          setCacheInfo(`Using cached data from ${new Date(cachedData.cachedAt).toLocaleString()}`);
          console.log('Using cached contacts data');
          return;
        }
        throw functionError;
      }

      // Fresh data received
      if (data?.data) {
        setContacts(data.data);
        setCacheInfo(`Fresh data loaded at ${new Date().toLocaleString()}`);

        // Cache the fresh data if we have cache headers
        const response = data;
        if (response.cached_at) {
          const newCacheData: CacheData = {
            contacts: data.data,
            etag: '', // Will be set by edge function response headers
            lastModified: '', // Will be set by edge function response headers
            cachedAt: response.cached_at,
          };
          setCachedData(newCacheData);
        }
      }

    } catch (err: any) {
      console.error('Error fetching contacts:', err);
      
      // Fallback to cached data if available
      const cachedData = getCachedData();
      if (cachedData) {
        setContacts(cachedData.contacts);
        setCacheInfo(`Using cached data (network error) from ${new Date(cachedData.cachedAt).toLocaleString()}`);
        setError('Using cached data due to network error');
      } else {
        setError(err.message || 'Failed to fetch contacts');
      }
    } finally {
      setLoading(false);
    }
  }, [user, getCachedData, setCachedData]);

  // Force refresh (skip cache)
  const refreshContacts = useCallback(() => {
    fetchContacts(true);
  }, [fetchContacts]);

  // Clear cache
  const clearCache = useCallback(() => {
    if (user) {
      localStorage.removeItem(`contacts_cache_${user.id}`);
      setCacheInfo('Cache cleared');
    }
  }, [user]);

  useEffect(() => {
    fetchContacts();
  }, [fetchContacts]);

  return {
    contacts,
    loading,
    error,
    cacheInfo,
    refreshContacts,
    clearCache,
    refetch: fetchContacts,
  };
};
