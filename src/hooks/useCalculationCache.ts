import { useState, useCallback, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Contact } from '@/types/contact';

/**
 * Interface for cached calculation results
 */
interface CachedCalculations {
  needsApproach: Contact[];
  stale3Days: Contact[];
  stale7Days: Contact[];
  stale30Days: Contact[];
}

/**
 * Interface for calculation cache entry
 */
interface CalculationCacheEntry {
  userId: string;
  calculations: CachedCalculations;
  timestamp: string;
  contactIds: string[];
  selectedLabels: string[];
  version: string; // For cache invalidation
}

/**
 * Hook for caching follow-up calculations to prevent unnecessary re-calculations
 * Especially useful when user switches between app and WhatsApp
 */
export const useCalculationCache = () => {
  const { user } = useAuth();
  const [cacheInfo, setCacheInfo] = useState<string>('');
  
  const CACHE_VERSION = '1.0.0';
  const CACHE_KEY_PREFIX = 'followup_calculations_cache_';
  
  /**
   * Generate cache key based on user, contacts, and labels
   */
  const generateCacheKey = useCallback((contactIds: string[], selectedLabels: string[]) => {
    if (!user) return null;
    
    const sortedContactIds = [...contactIds].sort();
    const sortedLabels = [...selectedLabels].sort();
    const keyData = {
      userId: user.id,
      contactIds: sortedContactIds,
      labels: sortedLabels
    };
    
    return `${CACHE_KEY_PREFIX}${btoa(JSON.stringify(keyData))}`;
  }, [user]);
  
  /**
   * Get cached calculations if available and valid
   */
  const getCachedCalculations = useCallback((contactIds: string[], selectedLabels: string[]): CachedCalculations | null => {
    if (!user) return null;
    
    try {
      const cacheKey = generateCacheKey(contactIds, selectedLabels);
      if (!cacheKey) return null;
      
      const cached = localStorage.getItem(cacheKey);
      if (!cached) return null;
      
      const cacheEntry: CalculationCacheEntry = JSON.parse(cached);
      
      // Validate cache entry
      if (
        cacheEntry.userId !== user.id ||
        cacheEntry.version !== CACHE_VERSION ||
        !cacheEntry.calculations
      ) {
        // Invalid cache, remove it
        localStorage.removeItem(cacheKey);
        return null;
      }
      
      // Check if cache is still valid (within session)
      const cacheTime = new Date(cacheEntry.timestamp).getTime();
      const now = Date.now();
      const maxAge = 30 * 60 * 1000; // 30 minutes max age
      
      if (now - cacheTime > maxAge) {
        localStorage.removeItem(cacheKey);
        return null;
      }
      
      setCacheInfo(`Using cached calculations from ${new Date(cacheEntry.timestamp).toLocaleTimeString()}`);
      return cacheEntry.calculations;
      
    } catch (error) {
      console.warn('Failed to get cached calculations:', error);
      return null;
    }
  }, [user, generateCacheKey]);
  
  /**
   * Save calculations to cache
   */
  const setCachedCalculations = useCallback((contactIds: string[], selectedLabels: string[], calculations: CachedCalculations) => {
    if (!user) return;
    
    try {
      const cacheKey = generateCacheKey(contactIds, selectedLabels);
      if (!cacheKey) return;
      
      const cacheEntry: CalculationCacheEntry = {
        userId: user.id,
        calculations,
        timestamp: new Date().toISOString(),
        contactIds: [...contactIds].sort(),
        selectedLabels: [...selectedLabels].sort(),
        version: CACHE_VERSION
      };
      
      localStorage.setItem(cacheKey, JSON.stringify(cacheEntry));
      setCacheInfo(`Calculations cached at ${new Date().toLocaleTimeString()}`);
      
    } catch (error) {
      console.warn('Failed to cache calculations:', error);
    }
  }, [user, generateCacheKey]);
  
  /**
   * Apply optimistic update to cached calculations
   * Reduces count immediately without re-calculation
   */
  const applyOptimisticUpdate = useCallback((contactIds: string[], selectedLabels: string[], contactId: string, fromCategory: keyof CachedCalculations) => {
    if (!user) return null;
    
    try {
      const cacheKey = generateCacheKey(contactIds, selectedLabels);
      if (!cacheKey) return null;
      
      const cached = localStorage.getItem(cacheKey);
      if (!cached) return null;
      
      const cacheEntry: CalculationCacheEntry = JSON.parse(cached);
      
      // Remove contact from the specified category
      const updatedCalculations = {
        ...cacheEntry.calculations,
        [fromCategory]: cacheEntry.calculations[fromCategory].filter(contact => contact.id !== contactId)
      };
      
      // Update cache with optimistic changes
      const updatedEntry: CalculationCacheEntry = {
        ...cacheEntry,
        calculations: updatedCalculations,
        timestamp: new Date().toISOString() // Update timestamp for optimistic change
      };
      
      localStorage.setItem(cacheKey, JSON.stringify(updatedEntry));
      setCacheInfo(`Optimistic update applied at ${new Date().toLocaleTimeString()}`);
      
      return updatedCalculations;
      
    } catch (error) {
      console.warn('Failed to apply optimistic update:', error);
      return null;
    }
  }, [user, generateCacheKey]);
  
  /**
   * Clear all calculation caches for current user
   */
  const clearCalculationCache = useCallback(() => {
    if (!user) return;
    
    try {
      // Find and remove all cache entries for current user
      const keysToRemove: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith(CACHE_KEY_PREFIX)) {
          try {
            const cached = localStorage.getItem(key);
            if (cached) {
              const cacheEntry: CalculationCacheEntry = JSON.parse(cached);
              if (cacheEntry.userId === user.id) {
                keysToRemove.push(key);
              }
            }
          } catch {
            // Invalid cache entry, mark for removal
            keysToRemove.push(key);
          }
        }
      }
      
      keysToRemove.forEach(key => localStorage.removeItem(key));
      setCacheInfo('Calculation cache cleared');
      
    } catch (error) {
      console.warn('Failed to clear calculation cache:', error);
    }
  }, [user]);
  
  /**
   * Clear cache when user logs out
   */
  useEffect(() => {
    if (!user) {
      clearCalculationCache();
    }
  }, [user, clearCalculationCache]);
  
  return {
    getCachedCalculations,
    setCachedCalculations,
    applyOptimisticUpdate,
    clearCalculationCache,
    cacheInfo
  };
};