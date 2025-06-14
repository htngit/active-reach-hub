
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Contact } from '@/types/contact';

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

  // Fetch contacts with proper RLS handling
  const fetchContacts = useCallback(async (skipCache = false) => {
    if (!user) return;

    setLoading(true);
    setError(null);

    try {
      const cachedData = getCachedData();

      // If we have cached data and not forcing refresh, use it
      if (cachedData && !skipCache) {
        setContacts(cachedData.contacts);
        setCacheInfo(`Using cached data from ${new Date(cachedData.cachedAt).toLocaleString()}`);
        setLoading(false);
        return;
      }

      console.log('Fetching fresh contacts data...');

      // Fetch contacts with RLS policies in place
      // This will automatically filter based on the user's permissions
      const { data, error: fetchError } = await supabase
        .from('contacts')
        .select('*')
        .order('created_at', { ascending: false });

      if (fetchError) {
        throw fetchError;
      }

      console.log('Fresh contacts fetched:', data?.length || 0);
      setContacts(data || []);
      setCacheInfo(`Fresh data loaded at ${new Date().toLocaleString()}`);

      // Cache the fresh data
      const newCacheData: CacheData = {
        contacts: data || [],
        etag: '', 
        lastModified: '',
        cachedAt: new Date().toISOString(),
      };
      setCachedData(newCacheData);

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
