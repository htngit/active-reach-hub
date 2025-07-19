/**
 * useTemplateCacheDB Hook
 * 
 * Database-backed template caching with metadata security triggers.
 * Provides instant UI loading with progressive cache population.
 * 
 * Features:
 * - Database persistent cache storage
 * - Metadata security validation
 * - Lazy loading with instant fallback
 * - Background cache refresh
 * - Auto-invalidation on data changes
 * - Memory efficient
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { Json } from '@/integrations/supabase/types';
import { useAuth } from '@/contexts/AuthContext';
import { useUserMetadata } from './useUserMetadata';
import { toast } from '@/hooks/use-toast';
import { type CatchError, getErrorMessage } from '@/utils/errorTypes';

export interface MessageTemplateSet {
  id: string;
  title: string;
  associated_label_id: string;
  template_variation_1: string;
  template_variation_2: string;
  template_variation_3: string;
  user_id: string;
  created_at: string;
  updated_at: string;
}

export interface Label {
  id: string;
  name: string;
  user_id: string;
}

interface CacheData {
  templates: MessageTemplateSet[];
  labels: Label[];
  timestamp: string;
  contactLabels: string[];
}

interface UseTemplateCacheDBReturn {
  getTemplatesForContact: (contactLabels: string[]) => Promise<{
    templates: MessageTemplateSet[];
    labels: Label[];
    fromCache: boolean;
    loadTime: number;
  }>;
  getAllTemplates: () => Promise<MessageTemplateSet[]>;
  refreshCacheInBackground: () => Promise<void>;
  clearCache: () => Promise<void>;
  getCacheStats: () => Promise<{
    cacheSize: number;
    hitRate: number;
    lastRefresh: string | null;
  }>;
  isLoading: boolean;
}

/**
 * Database-backed template cache hook with instant loading
 */
export const useTemplateCacheDB = (): UseTemplateCacheDBReturn => {
  const [isLoading, setIsLoading] = useState(false);
  const { user } = useAuth();
  const { metadata } = useUserMetadata();
  
  // Stats tracking
  const statsRef = useRef({ hits: 0, misses: 0 });
  const backgroundRefreshRef = useRef<Promise<void> | null>(null);
  
  /**
   * Generates cache key based on contact labels
   */
  const generateCacheKey = useCallback((contactLabels: string[]): string => {
    if (!user?.id) return '';
    const sortedLabels = [...contactLabels].sort().join(',');
    return `templates:${sortedLabels}`;
  }, [user?.id]);
  
  /**
   * Gets cache data from database
   */
  const getCacheFromDB = useCallback(async (cacheKey: string): Promise<CacheData | null> => {
    if (!user?.id) return null;
    
    try {
      const { data, error } = await supabase
        .from('template_cache')
        .select('cache_data, metadata_version, expires_at')
        .eq('user_id', user.id)
        .eq('cache_key', cacheKey)
        .single();
      
      if (error || !data) {
        return null;
      }
      
      // Check if cache is still valid
      const now = new Date();
      const expiresAt = new Date(data.expires_at);
      
      if (now > expiresAt) {
        // Cache expired, delete it
        await supabase
          .from('template_cache')
          .delete()
          .eq('user_id', user.id)
          .eq('cache_key', cacheKey);
        return null;
      }
      
      // Check metadata version
      if (metadata && parseInt(data.metadata_version) < metadata.cache_version) {
        // Cache invalidated by metadata change
        return null;
      }
      
      return data.cache_data as unknown as CacheData;
      
    } catch (error) {
      console.error('Error getting cache from DB:', error);
      return null;
    }
  }, [user?.id, metadata]);
  
  /**
   * Stores cache data to database
   */
  const storeCacheToDB = useCallback(async (cacheKey: string, cacheData: CacheData): Promise<void> => {
    if (!user?.id) return;
    
    try {
      const { error } = await supabase
        .from('template_cache')
        .upsert({
          user_id: user.id,
          cache_key: cacheKey,
          cache_data: cacheData as unknown as Json,
          metadata_version: String(metadata?.cache_version || 1),
          expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() // 24 hours
        });
      
      if (error) {
        console.error('Error storing cache to DB:', error);
      }
      
    } catch (error) {
      console.error('Error storing cache to DB:', error);
    }
  }, [user?.id, metadata?.cache_version]);
  
  /**
   * Fetches templates from database (fallback when cache miss)
   */
  const fetchTemplatesFromDatabase = useCallback(async (contactLabels: string[]): Promise<{
    templates: MessageTemplateSet[];
    labels: Label[];
  }> => {
    if (!user?.id || contactLabels.length === 0) {
      return { templates: [], labels: [] };
    }
    
    try {
      // Fetch labels that match contact labels
      const { data: labelsData, error: labelsError } = await supabase
        .from('labels')
        .select('*')
        .eq('user_id', user.id)
        .in('name', contactLabels);
      
      if (labelsError) throw labelsError;
      
      const matchingLabels = labelsData || [];
      const labelIds = matchingLabels.map(label => label.id);
      
      if (labelIds.length === 0) {
        return { templates: [], labels: [] };
      }
      
      // Fetch templates for matching labels
      const { data: templatesData, error: templatesError } = await supabase
        .from('message_template_sets')
        .select('*')
        .eq('user_id', user.id)
        .in('associated_label_id', labelIds);
      
      if (templatesError) throw templatesError;
      
      return {
        templates: templatesData || [],
        labels: matchingLabels
      };
      
    } catch (error: CatchError) {
      console.error('Error fetching templates from database:', getErrorMessage(error));
      throw error;
    }
  }, [user?.id]);
  
  /**
   * Main function to get templates for contact with smart caching
   */
  const getTemplatesForContact = useCallback(async (contactLabels: string[]): Promise<{
    templates: MessageTemplateSet[];
    labels: Label[];
    fromCache: boolean;
    loadTime: number;
  }> => {
    const startTime = performance.now();
    
    if (!user?.id || contactLabels.length === 0) {
      return { templates: [], labels: [], fromCache: false, loadTime: 0 };
    }
    
    const cacheKey = generateCacheKey(contactLabels);
    
    try {
      // Try to get from cache first
      const cachedData = await getCacheFromDB(cacheKey);
      
      if (cachedData) {
        statsRef.current.hits++;
        const loadTime = performance.now() - startTime;
        
        console.log(`⚡ Cache HIT for labels: ${contactLabels.join(', ')} (${loadTime.toFixed(2)}ms)`);
        
        return {
          templates: cachedData.templates,
          labels: cachedData.labels,
          fromCache: true,
          loadTime
        };
      }
      
      // Cache miss - fetch from database
      statsRef.current.misses++;
      console.log(`💾 Cache MISS for labels: ${contactLabels.join(', ')} - fetching from DB`);
      
      setIsLoading(true);
      const { templates, labels } = await fetchTemplatesFromDatabase(contactLabels);
      
      // Store to cache for next time (background operation)
      const cacheData: CacheData = {
        templates,
        labels,
        timestamp: new Date().toISOString(),
        contactLabels
      };
      
      // Store to cache without waiting (background operation)
      storeCacheToDB(cacheKey, cacheData).catch(error => {
        console.error('Background cache store failed:', error);
      });
      
      const loadTime = performance.now() - startTime;
      console.log(`🔄 Fetched ${templates.length} templates from DB (${loadTime.toFixed(2)}ms)`);
      
      return {
        templates,
        labels,
        fromCache: false,
        loadTime
      };
      
    } catch (error: CatchError) {
      console.error('Error getting templates for contact:', getErrorMessage(error));
      toast({
        title: "Error",
        description: "Failed to load templates",
        variant: "destructive",
      });
      
      return { templates: [], labels: [], fromCache: false, loadTime: 0 };
    } finally {
      setIsLoading(false);
    }
  }, [user?.id, generateCacheKey, getCacheFromDB, fetchTemplatesFromDatabase, storeCacheToDB]);
  
  /**
   * Refreshes cache in background without blocking UI
   */
  const refreshCacheInBackground = useCallback(async (): Promise<void> => {
    if (!user?.id || backgroundRefreshRef.current) {
      return; // Already refreshing
    }
    
    backgroundRefreshRef.current = (async () => {
      try {
        console.log('🔄 Starting background cache refresh...');
        
        // Get all unique label combinations from recent cache entries
        const { data: recentCacheEntries } = await supabase
          .from('template_cache')
          .select('cache_key, cache_data')
          .eq('user_id', user.id)
          .gte('updated_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()) // Last 24 hours
          .limit(20);
        
        if (recentCacheEntries && recentCacheEntries.length > 0) {
          // Refresh the most used cache entries
          for (const entry of recentCacheEntries.slice(0, 5)) {
            const cacheData = entry.cache_data as unknown as CacheData;
            if (cacheData.contactLabels) {
              try {
                const { templates, labels } = await fetchTemplatesFromDatabase(cacheData.contactLabels);
                const newCacheData: CacheData = {
                  templates,
                  labels,
                  timestamp: new Date().toISOString(),
                  contactLabels: cacheData.contactLabels
                };
                await storeCacheToDB(entry.cache_key, newCacheData);
              } catch (error) {
                console.error('Error refreshing cache entry:', error);
              }
            }
          }
        }
        
        console.log('✅ Background cache refresh completed');
        
      } catch (error) {
        console.error('Background cache refresh failed:', error);
      } finally {
        backgroundRefreshRef.current = null;
      }
    })();
    
    return backgroundRefreshRef.current;
  }, [user?.id, fetchTemplatesFromDatabase, storeCacheToDB]);
  
  /**
   * Clears all cache for current user
   */
  const clearCache = useCallback(async (): Promise<void> => {
    if (!user?.id) return;
    
    try {
      const { error } = await supabase
        .from('template_cache')
        .delete()
        .eq('user_id', user.id);
      
      if (error) throw error;
      
      // Reset stats
      statsRef.current = { hits: 0, misses: 0 };
      
      console.log('🗑️ Template cache cleared');
      
    } catch (error) {
      console.error('Error clearing cache:', error);
    }
  }, [user?.id]);
  
  /**
   * Gets all user templates for preloading
   */
  const getAllTemplates = useCallback(async (): Promise<MessageTemplateSet[]> => {
    if (!user?.id) return [];

    try {
      const { data, error } = await supabase
        .from('message_template_sets')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching all templates:', error);
      return [];
    }
  }, [user?.id]);

  /**
   * Gets cache statistics
   */
  const getCacheStats = useCallback(async (): Promise<{
    cacheSize: number;
    hitRate: number;
    lastRefresh: string | null;
  }> => {
    if (!user?.id) {
      return { cacheSize: 0, hitRate: 0, lastRefresh: null };
    }
    
    try {
      const { data, error } = await supabase
        .from('template_cache')
        .select('updated_at')
        .eq('user_id', user.id);
      
      if (error) throw error;
      
      const cacheSize = data?.length || 0;
      const totalRequests = statsRef.current.hits + statsRef.current.misses;
      const hitRate = totalRequests > 0 ? (statsRef.current.hits / totalRequests) * 100 : 0;
      
      const lastRefresh = data && data.length > 0 
        ? data.reduce((latest, entry) => 
            new Date(entry.updated_at) > new Date(latest) ? entry.updated_at : latest, 
            data[0].updated_at
          )
        : null;
      
      return { cacheSize, hitRate, lastRefresh };
      
    } catch (error) {
      console.error('Error getting cache stats:', error);
      return { cacheSize: 0, hitRate: 0, lastRefresh: null };
    }
  }, [user?.id]);
  
  // Auto-refresh cache in background every 30 minutes
  useEffect(() => {
    if (!user?.id) return;
    
    const interval = setInterval(() => {
      refreshCacheInBackground();
    }, 30 * 60 * 1000); // 30 minutes
    
    return () => clearInterval(interval);
  }, [user?.id, refreshCacheInBackground]);
  
  return {
    getTemplatesForContact,
    getAllTemplates,
    refreshCacheInBackground,
    clearCache,
    getCacheStats,
    isLoading
  };
};