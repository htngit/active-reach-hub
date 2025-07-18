/**
 * useTemplateCache Hook
 * 
 * Manages template caching with metadata verification for optimal performance.
 * Provides cached template fetching with automatic invalidation based on metadata changes.
 * 
 * Features:
 * - Template caching with metadata verification
 * - Automatic cache invalidation
 * - Label-based template filtering
 * - Performance monitoring
 * - Real-time cache updates
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useUserMetadata } from './useUserMetadata';
import { toast } from '@/hooks/use-toast';

interface MessageTemplateSet {
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

interface Label {
  id: string;
  name: string;
  user_id: string;
}

interface TemplateCacheEntry {
  templates: MessageTemplateSet[];
  labels: Label[];
  timestamp: string;
  contactLabels: string[];
  cacheVersion: number;
}

interface UseTemplateCacheReturn {
  getTemplatesForContact: (contactLabels: string[]) => Promise<{
    templates: MessageTemplateSet[];
    labels: Label[];
    fromCache: boolean;
  }>;
  preloadAllUserTemplates: () => Promise<boolean>;
  getTemplatesFromCacheOnly: (contactLabels: string[]) => {
    templates: MessageTemplateSet[];
    labels: Label[];
    fromCache: boolean;
  };
  clearCache: () => void;
  getCacheStats: () => {
    cacheSize: number;
    cacheAge: number;
    hitRate: number;
  };
  isLoading: boolean;
  isPreloaded: boolean;
}

/**
 * Custom hook for template caching with metadata verification
 */
export const useTemplateCache = (): UseTemplateCacheReturn => {
  const [isLoading, setIsLoading] = useState(false);
  const [isPreloaded, setIsPreloaded] = useState(false);
  const { user } = useAuth();
  const { metadata, isMetadataStale } = useUserMetadata();
  
  // Cache storage
  const cacheRef = useRef<Map<string, TemplateCacheEntry>>(new Map());
  const statsRef = useRef({ hits: 0, misses: 0 });
  const allTemplatesRef = useRef<{ templates: MessageTemplateSet[]; labels: Label[]; timestamp: string } | null>(null);
  
  /**
   * Generates cache key based on contact labels
   */
  const generateCacheKey = useCallback((contactLabels: string[]): string => {
    if (!user?.id) return '';
    const sortedLabels = [...contactLabels].sort().join(',');
    return `${user.id}:${sortedLabels}`;
  }, [user?.id]);
  
  /**
   * Checks if cache entry is valid based on metadata
   */
  const isCacheValid = useCallback((cacheEntry: TemplateCacheEntry): boolean => {
    if (!metadata) return false;
    
    // Check if metadata is stale
    if (isMetadataStale(2)) { // 2 minutes threshold
      return false;
    }
    
    // Check cache version against metadata cache version
    if (cacheEntry.cacheVersion < metadata.cache_version) {
      return false;
    }
    
    // Check timestamp (max 5 minutes)
    const cacheAge = Date.now() - new Date(cacheEntry.timestamp).getTime();
    if (cacheAge > 5 * 60 * 1000) { // 5 minutes
      return false;
    }
    
    return true;
  }, [metadata, isMetadataStale]);
  
  /**
   * Fetches templates from database
   */
  const fetchTemplatesFromDatabase = useCallback(async (contactLabels: string[]): Promise<{
    templates: MessageTemplateSet[];
    labels: Label[];
  }> => {
    if (!user || contactLabels.length === 0) {
      return { templates: [], labels: [] };
    }

    try {
      console.log('🔄 Fetching templates from database for labels:', contactLabels);
      
      // First fetch labels to get their IDs
      const { data: labelsData, error: labelsError } = await supabase
        .from('labels')
        .select('id, name, user_id')
        .eq('user_id', user.id)
        .in('name', contactLabels);

      if (labelsError) throw labelsError;
      
      const labels = labelsData || [];
      const labelIds = labels.map(label => label.id);

      if (labelIds.length === 0) {
        return { templates: [], labels: [] };
      }

      // Fetch template sets that match the contact's labels
      const { data: templatesData, error: templatesError } = await supabase
        .from('message_template_sets')
        .select('*')
        .eq('user_id', user.id)
        .in('associated_label_id', labelIds);

      if (templatesError) throw templatesError;
      
      const templates = templatesData || [];
      
      console.log(`✅ Fetched ${templates.length} templates from database`);
      return { templates, labels };
      
    } catch (error: any) {
      console.error('❌ Failed to fetch templates from database:', error);
      toast({
        title: "Error",
        description: "Failed to fetch templates",
        variant: "destructive",
      });
      return { templates: [], labels: [] };
    }
  }, [user]);
  
  /**
   * Preloads all user templates and stores them in cache
   */
  const preloadAllUserTemplates = useCallback(async (): Promise<boolean> => {
    if (!user?.id) {
      console.warn('⚠️ Cannot preload templates: No user logged in');
      return false;
    }

    setIsLoading(true);
    console.log('🚀 Starting preload of all user templates...');
    
    try {
      // Fetch all user's labels
      const { data: labelsData, error: labelsError } = await supabase
        .from('labels')
        .select('id, name, user_id')
        .eq('user_id', user.id);

      if (labelsError) throw labelsError;
      
      const allLabels = labelsData || [];
      console.log(`📋 Found ${allLabels.length} labels for user`);

      // Fetch all user's templates
      const { data: templatesData, error: templatesError } = await supabase
        .from('message_template_sets')
        .select('*')
        .eq('user_id', user.id);

      if (templatesError) throw templatesError;
      
      const allTemplates = templatesData || [];
      console.log(`📝 Found ${allTemplates.length} templates for user`);

      // Store all templates in reference for instant access
      allTemplatesRef.current = {
        templates: allTemplates,
        labels: allLabels,
        timestamp: new Date().toISOString()
      };

      // Pre-populate cache for common label combinations
      // Group templates by their associated labels
      const labelTemplateMap = new Map<string, MessageTemplateSet[]>();
      
      allTemplates.forEach(template => {
        const label = allLabels.find(l => l.id === template.associated_label_id);
        if (label) {
          const labelName = label.name;
          if (!labelTemplateMap.has(labelName)) {
            labelTemplateMap.set(labelName, []);
          }
          labelTemplateMap.get(labelName)!.push(template);
        }
      });

      // Create cache entries for each label combination
      for (const [labelName, templates] of labelTemplateMap.entries()) {
        const cacheKey = generateCacheKey([labelName]);
        const relevantLabels = allLabels.filter(l => l.name === labelName);
        
        const cacheEntry: TemplateCacheEntry = {
          templates,
          labels: relevantLabels,
          timestamp: new Date().toISOString(),
          contactLabels: [labelName],
          cacheVersion: metadata?.cache_version || 0
        };
        
        cacheRef.current.set(cacheKey, cacheEntry);
      }

      setIsPreloaded(true);
      console.log(`✅ Successfully preloaded templates for ${labelTemplateMap.size} label combinations`);
      
      return true;
      
    } catch (error: any) {
      console.error('❌ Failed to preload templates:', error);
      toast({
        title: "Error",
        description: "Failed to preload templates",
        variant: "destructive",
      });
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [user?.id, generateCacheKey, metadata?.cache_version]);

  /**
   * Gets templates from cache only (no database fetch)
   */
  const getTemplatesFromCacheOnly = useCallback((contactLabels: string[]): {
    templates: MessageTemplateSet[];
    labels: Label[];
    fromCache: boolean;
  } => {
    if (!user?.id || contactLabels.length === 0 || !allTemplatesRef.current) {
      return { templates: [], labels: [], fromCache: false };
    }

    const { templates: allTemplates, labels: allLabels } = allTemplatesRef.current;
    
    // Filter templates that match any of the contact's labels
    const matchingTemplates: MessageTemplateSet[] = [];
    const matchingLabels: Label[] = [];
    
    contactLabels.forEach(contactLabel => {
      const label = allLabels.find(l => l.name === contactLabel);
      if (label) {
        matchingLabels.push(label);
        const labelTemplates = allTemplates.filter(t => t.associated_label_id === label.id);
        matchingTemplates.push(...labelTemplates);
      }
    });

    // Remove duplicates
    const uniqueTemplates = matchingTemplates.filter((template, index, self) => 
      index === self.findIndex(t => t.id === template.id)
    );
    
    console.log(`🎯 Found ${uniqueTemplates.length} templates from cache for labels: ${contactLabels.join(', ')}`);
    
    return {
      templates: uniqueTemplates,
      labels: matchingLabels,
      fromCache: true
    };
  }, [user?.id]);
  
  /**
   * Gets templates for contact with caching
   */
  const getTemplatesForContact = useCallback(async (contactLabels: string[]): Promise<{
    templates: MessageTemplateSet[];
    labels: Label[];
    fromCache: boolean;
  }> => {
    const startTime = performance.now();
    
    if (!user?.id || contactLabels.length === 0) {
      return { templates: [], labels: [], fromCache: false };
    }
    
    setIsLoading(true);
    
    try {
      const cacheKey = generateCacheKey(contactLabels);
      const cachedEntry = cacheRef.current.get(cacheKey);
      
      // Check if we have valid cached data
      if (cachedEntry && isCacheValid(cachedEntry)) {
        statsRef.current.hits++;
        const endTime = performance.now();
        console.log(`🎯 Template cache HIT in ${(endTime - startTime).toFixed(2)}ms`);
        
        return {
          templates: cachedEntry.templates,
          labels: cachedEntry.labels,
          fromCache: true
        };
      }
      
      // Cache miss - fetch from database
      statsRef.current.misses++;
      console.log('💾 Template cache MISS - fetching from database');
      
      const { templates, labels } = await fetchTemplatesFromDatabase(contactLabels);
      
      // Store in cache
      const cacheEntry: TemplateCacheEntry = {
        templates,
        labels,
        timestamp: new Date().toISOString(),
        contactLabels: [...contactLabels],
        cacheVersion: metadata?.cache_version || 0
      };
      
      cacheRef.current.set(cacheKey, cacheEntry);
      
      const endTime = performance.now();
      console.log(`📊 Template fetched and cached in ${(endTime - startTime).toFixed(2)}ms`);
      
      return {
        templates,
        labels,
        fromCache: false
      };
      
    } catch (error: any) {
      console.error('❌ Template cache error:', error);
      return { templates: [], labels: [], fromCache: false };
    } finally {
      setIsLoading(false);
    }
  }, [user?.id, generateCacheKey, isCacheValid, fetchTemplatesFromDatabase, metadata?.cache_version]);
  
  /**
   * Clears all cached templates
   */
  const clearCache = useCallback(() => {
    console.log('🗑️ Clearing template cache');
    cacheRef.current.clear();
    allTemplatesRef.current = null;
    statsRef.current = { hits: 0, misses: 0 };
    setIsPreloaded(false);
  }, []);
  
  /**
   * Gets cache statistics
   */
  const getCacheStats = useCallback(() => {
    const { hits, misses } = statsRef.current;
    const total = hits + misses;
    const hitRate = total > 0 ? (hits / total) * 100 : 0;
    
    return {
      cacheSize: cacheRef.current.size,
      cacheAge: 0, // Could be enhanced to show oldest cache entry age
      hitRate: Math.round(hitRate * 100) / 100
    };
  }, []);
  
  // Clear cache when user changes
  useEffect(() => {
    if (user?.id) {
      // Keep cache but validate it will be checked against new user metadata
    } else {
      clearCache();
    }
  }, [user?.id, clearCache]);
  
  // Clear cache when metadata version changes
  useEffect(() => {
    if (metadata?.cache_version) {
      // Check if any cached entries have outdated cache version
      const currentCacheVersion = metadata.cache_version;
      let hasOutdatedEntries = false;
      
      for (const [key, entry] of cacheRef.current.entries()) {
        if (entry.cacheVersion < currentCacheVersion) {
          cacheRef.current.delete(key);
          hasOutdatedEntries = true;
        }
      }
      
      if (hasOutdatedEntries) {
        console.log('🔄 Cleared outdated template cache entries due to metadata version change');
      }
    }
  }, [metadata?.cache_version]);
  
  // Set up real-time subscription for template changes
  useEffect(() => {
    if (!user?.id) return;

    const subscription = supabase
      .channel('template_cache_invalidation')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'message_template_sets',
          filter: `user_id=eq.${user.id}`
        },
        (payload) => {
          console.log('📡 Template changed, clearing cache:', payload);
          clearCache();
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'labels',
          filter: `user_id=eq.${user.id}`
        },
        (payload) => {
          console.log('📡 Label changed, clearing cache:', payload);
          clearCache();
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [user?.id, clearCache]);
  
  return {
    getTemplatesForContact,
    preloadAllUserTemplates,
    getTemplatesFromCacheOnly,
    clearCache,
    getCacheStats,
    isLoading,
    isPreloaded
  };
};

export default useTemplateCache;