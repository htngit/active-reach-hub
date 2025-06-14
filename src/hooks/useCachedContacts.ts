
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

      console.log('Fetching fresh contacts data with updated RLS policies...');

      // Fetch all contacts - RLS will now properly handle team owner access
      const { data, error: fetchError } = await supabase
        .from('contacts')
        .select(`
          *,
          teams:team_id (
            name,
            owner_id
          )
        `)
        .order('created_at', { ascending: false });

      if (fetchError) {
        throw fetchError;
      }

      console.log('Fresh contacts fetched:', data?.length || 0);
      console.log('User ID:', user.id);
      console.log('Sample contacts with ownership info:', data?.slice(0, 3).map(c => ({
        id: c.id,
        name: c.name,
        owner_id: c.owner_id,
        user_id: c.user_id,
        team_id: c.team_id,
        is_mine: c.user_id === user.id,
        is_owned_by_me: c.owner_id === user.id
      })));

      setContacts(data || []);
      setCacheInfo(`Fresh data loaded at ${new Date().toLocaleString()} - ${data?.length || 0} contacts accessible`);

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
    // Clear cache first to ensure fresh data
    if (user) {
      localStorage.removeItem(`contacts_cache_${user.id}`);
    }
    fetchContacts(true);
  }, [fetchContacts, user]);

  // Clear cache
  const clearCache = useCallback(() => {
    if (user) {
      localStorage.removeItem(`contacts_cache_${user.id}`);
      setCacheInfo('Cache cleared - will fetch fresh data on next load');
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
