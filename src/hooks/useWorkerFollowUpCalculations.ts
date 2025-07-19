/**
 * Hook untuk kalkulasi follow-up menggunakan Web Worker dan IndexedDB cache
 * Menggantikan useOptimisticFollowUpCalculations dengan performa yang lebih baik
 */

import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Contact } from '@/types/contact';
import { toast } from 'sonner';
import { IndexedDBCache } from '@/utils/indexedDBCache';
import type {
  WorkerMessage,
  WorkerResponse,
  FollowUpCalculations,
  ProgressMessage,
  ResultMessage,
  ErrorMessage
} from '@/workers/followUpCalculationWorker';

// Import OptimisticActivity interface
interface OptimisticActivity {
  id: string;
  type: string;
  details?: string;
  timestamp: string;
  contact_id: string;
  user_id: string;
  isOptimistic: true;
  localTimestamp: number;
}

interface FollowUpContact extends Contact {
  last_activity?: string;
}

interface ActivityData {
  [contactId: string]: {
    hasActivity: boolean;
    lastActivityTimestamp: number | null;
  };
}

interface CalculationProgress {
  processed: number;
  total: number;
  percentage: number;
}

interface CacheStats {
  hits: number;
  misses: number;
  hitRate: number;
  totalEntries: number;
  lastCleanup: number;
}

// Initialize IndexedDB cache
const followUpCache = new IndexedDBCache({
  dbName: 'followUpCache',
  version: 1,
  storeName: 'calculations',
  defaultTTL: 5 * 60 * 1000, // 5 minutes
  maxEntries: 500
});

const activityCache = new IndexedDBCache({
  dbName: 'activityCache',
  version: 1,
  storeName: 'activities',
  defaultTTL: 2 * 60 * 1000, // 2 minutes
  maxEntries: 1000
});

export const useWorkerFollowUpCalculations = (
  contacts: Contact[], 
  selectedLabels: string[]
) => {
  const [calculations, setCalculations] = useState<FollowUpCalculations>({
    needsApproach: [],
    stale3Days: [],
    stale7Days: [],
    stale30Days: [],
  });
  
  const [activityData, setActivityData] = useState<ActivityData>({});
  const [optimisticActivities, setOptimisticActivities] = useState<{[contactId: string]: OptimisticActivity[]}>({});
  const [loading, setLoading] = useState(false);
  const [calculating, setCalculating] = useState(false);
  const [progress, setProgress] = useState<CalculationProgress>({ processed: 0, total: 0, percentage: 0 });
  const [cacheStats, setCacheStats] = useState<CacheStats>({
    hits: 0,
    misses: 0,
    hitRate: 0,
    totalEntries: 0,
    lastCleanup: Date.now()
  });
  
  const { user } = useAuth();
  const workerRef = useRef<Worker | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const lastCalculationRef = useRef<string>('');

  // Initialize Web Worker
  useEffect(() => {
    try {
      workerRef.current = new Worker(
        new URL('@/workers/followUpCalculationWorker.ts', import.meta.url),
        { type: 'module' }
      );
      
      workerRef.current.onmessage = (event: MessageEvent<WorkerResponse>) => {
        const { type, payload } = event.data;
        
        switch (type) {
          case 'PROGRESS':
            setProgress(payload as CalculationProgress);
            break;
            
          case 'CALCULATION_COMPLETE':
            const { calculations: newCalculations } = payload as ResultMessage['payload'];
            setCalculations(newCalculations);
            setCalculating(false);
            setProgress({ processed: 0, total: 0, percentage: 0 });
            break;
            
          case 'CALCULATION_ERROR':
            const { error } = payload as ErrorMessage['payload'];
            console.error('Worker calculation error:', error);
            toast.error('Calculation failed: ' + error);
            setCalculating(false);
            setProgress({ processed: 0, total: 0, percentage: 0 });
            break;
        }
      };
      
      workerRef.current.onerror = (error) => {
        console.error('Worker error:', error);
        toast.error('Worker failed to initialize');
        setCalculating(false);
      };
      
    } catch (error) {
      console.error('Failed to create worker:', error);
      // Fallback to main thread calculation if worker fails
    }
    
    return () => {
      if (workerRef.current) {
        workerRef.current.terminate();
      }
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  // Generate cache key for current state
  const generateCacheKey = useCallback((contactIds: string[], labels: string[]) => {
    const sortedContactIds = [...contactIds].sort();
    const sortedLabels = [...labels].sort();
    
    // Include optimistic activities in cache key to ensure cache invalidation
    const optimisticHash = Object.keys(optimisticActivities).length > 0 
      ? `_opt_${Object.keys(optimisticActivities).sort().join(',')}_${Object.values(optimisticActivities).flat().length}`
      : '';
    
    return `followup_${user?.id}_${sortedContactIds.join(',')}_${sortedLabels.join(',')}${optimisticHash}`;
  }, [user?.id, optimisticActivities]);

  // Generate activity cache key
  const generateActivityCacheKey = useCallback((contactIds: string[]) => {
    const sortedContactIds = [...contactIds].sort();
    return `activity_${user?.id}_${sortedContactIds.join(',')}`;
  }, [user?.id]);

  // Check if contacts is valid
  const isValidContacts = contacts && Array.isArray(contacts);

  // Get active contacts based on filters
  const getActiveContacts = useMemo(() => {
    if (!isValidContacts) return [];
    let activeContacts = contacts.filter(contact => contact.status !== 'Paid');
    
    // Apply label filter
    if (selectedLabels.length > 0) {
      activeContacts = activeContacts.filter(contact => 
        contact.labels && selectedLabels.some(label => contact.labels!.includes(label))
      );
    }
    
    return activeContacts;
  }, [contacts, selectedLabels, isValidContacts]);

  /**
   * Fetch activities for contacts with caching
   */
  const fetchActivitiesForContacts = useCallback(async (contactIds: string[]) => {
    if (!user || contactIds.length === 0 || !isValidContacts) return;

    const cacheKey = generateActivityCacheKey(contactIds);
    
    // Try to get from cache first
    try {
      const cachedData = await activityCache.get<ActivityData>(cacheKey);
      if (cachedData) {
        setActivityData(cachedData);
        setCacheStats(prev => ({ ...prev, hits: prev.hits + 1, hitRate: (prev.hits + 1) / (prev.hits + prev.misses + 1) }));
        return;
      }
    } catch (error) {
      console.warn('Cache read failed:', error);
    }

    setCacheStats(prev => ({ ...prev, misses: prev.misses + 1, hitRate: prev.hits / (prev.hits + prev.misses + 1) }));
    setLoading(true);

    try {
      // Abort previous request if still running
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      abortControllerRef.current = new AbortController();

      const batchSize = 50;
      const allActivitiesData: any[] = [];
      
      // Process contacts in batches
      for (let i = 0; i < contactIds.length; i += batchSize) {
        const batch = contactIds.slice(i, i + batchSize);
        
        const { data: batchData, error } = await supabase
          .from('activities')
          .select('contact_id, timestamp')
          .in('contact_id', batch)
          .order('timestamp', { ascending: false })
          .abortSignal(abortControllerRef.current.signal);

        if (error) {
          console.warn('Batch fetch error:', error);
          continue;
        }

        if (batchData) {
          allActivitiesData.push(...batchData);
        }
      }

      // Process activities data
      const newActivityData: ActivityData = {};
      
      contactIds.forEach(contactId => {
        const contactActivities = allActivitiesData.filter(a => a.contact_id === contactId) || [];
        const hasActivity = contactActivities.length > 0;
        const lastActivityTimestamp = hasActivity 
          ? new Date(contactActivities[0].timestamp).getTime()
          : null;
        
        newActivityData[contactId] = {
          hasActivity,
          lastActivityTimestamp
        };
      });

      setActivityData(newActivityData);
      
      // Cache the result
      try {
        await activityCache.set(cacheKey, newActivityData, '1.0');
      } catch (error) {
        console.warn('Cache write failed:', error);
      }
      
    } catch (error: any) {
      if (error.name !== 'AbortError') {
        console.error('Exception in fetchActivitiesForContacts:', error);
        toast.error('Failed to fetch activities');
      }
    } finally {
      setLoading(false);
    }
  }, [user, isValidContacts, generateActivityCacheKey]);

  /**
   * Calculate follow-ups using Web Worker with caching
   */
  const calculateFollowUps = useCallback(async () => {
    if (!isValidContacts || !user) return;
    
    const activeContacts = getActiveContacts;
    const contactIds = activeContacts.map(c => c.id);
    
    if (contactIds.length === 0) {
      setCalculations({
        needsApproach: [],
        stale3Days: [],
        stale7Days: [],
        stale30Days: [],
      });
      return;
    }

    const cacheKey = generateCacheKey(contactIds, selectedLabels);
    const currentCalculationKey = `${cacheKey}_${JSON.stringify(optimisticActivities)}`;
    
    // Skip if same calculation is already in progress
    if (lastCalculationRef.current === currentCalculationKey && calculating) {
      return;
    }
    
    lastCalculationRef.current = currentCalculationKey;

    // Try to get from cache first
    try {
      const cachedCalculations = await followUpCache.get<FollowUpCalculations>(cacheKey);
      const hasOptimisticActivities = Object.keys(optimisticActivities).length > 0;
      
      if (cachedCalculations && !hasOptimisticActivities) {
        console.log('📋 Using cached calculations');
        setCalculations(cachedCalculations);
        setCacheStats(prev => ({ ...prev, hits: prev.hits + 1, hitRate: (prev.hits + 1) / (prev.hits + prev.misses + 1) }));
        return;
      } else if (hasOptimisticActivities) {
        console.log('⚡ Optimistic activities detected, forcing recalculation:', Object.keys(optimisticActivities));
      }
    } catch (error) {
      console.warn('Cache read failed:', error);
    }

    setCacheStats(prev => ({ ...prev, misses: prev.misses + 1, hitRate: prev.hits / (prev.hits + prev.misses + 1) }));

    // Ensure we have activity data
    const hasCompleteActivityData = activeContacts.every(contact => 
      Object.prototype.hasOwnProperty.call(activityData, contact.id)
    );
    
    if (!hasCompleteActivityData) {
      await fetchActivitiesForContacts(contactIds);
      return; // Will be called again when activity data is ready
    }

    setCalculating(true);
    setProgress({ processed: 0, total: activeContacts.length, percentage: 0 });

    try {
      if (workerRef.current) {
        // Use Web Worker for calculation
        const message: WorkerMessage = {
          type: 'CALCULATE_FOLLOW_UPS',
          payload: {
            contacts: activeContacts,
            selectedLabels,
            activityData,
            optimisticActivities
          }
        };
        
        workerRef.current.postMessage(message);
      } else {
        // Fallback to main thread calculation
        console.warn('Worker not available, using main thread calculation');
        // Implement fallback calculation here if needed
        setCalculating(false);
      }
    } catch (error) {
      console.error('Calculation failed:', error);
      toast.error('Calculation failed');
      setCalculating(false);
    }
  }, [isValidContacts, user, getActiveContacts, selectedLabels, activityData, optimisticActivities, calculating, generateCacheKey, fetchActivitiesForContacts]);

  // Effect to trigger calculation when dependencies change
  useEffect(() => {
    if (isValidContacts && getActiveContacts.length > 0) {
      const contactIds = getActiveContacts.map(c => c.id);
      
      // Check if we have activity data, if not fetch it
      const hasCompleteActivityData = getActiveContacts.every(contact => 
        Object.prototype.hasOwnProperty.call(activityData, contact.id)
      );
      
      if (!hasCompleteActivityData) {
        fetchActivitiesForContacts(contactIds);
      } else {
        calculateFollowUps();
      }
    } else if (isValidContacts && getActiveContacts.length === 0) {
      setCalculations({
        needsApproach: [],
        stale3Days: [],
        stale7Days: [],
        stale30Days: [],
      });
    }
  }, [getActiveContacts, selectedLabels, activityData, optimisticActivities]);

  /**
   * Auto-cleanup old optimistic activities (older than 5 minutes)
   */
  const cleanupOldOptimisticActivities = useCallback(() => {
    const fiveMinutesAgo = Date.now() - (5 * 60 * 1000);
    
    setOptimisticActivities(prev => {
      const newState = { ...prev };
      let hasChanges = false;
      
      Object.keys(newState).forEach(contactId => {
        const filteredActivities = newState[contactId].filter(activity => 
          activity.localTimestamp > fiveMinutesAgo
        );
        
        if (filteredActivities.length !== newState[contactId].length) {
          hasChanges = true;
          if (filteredActivities.length === 0) {
            delete newState[contactId];
          } else {
            newState[contactId] = filteredActivities;
          }
        }
      });
      
      if (hasChanges) {
        console.log('🧹 Auto-cleaned old optimistic activities');
      }
      
      return newState;
    });
  }, []);

  // Periodic cache cleanup and optimistic activities cleanup
  useEffect(() => {
    const cleanup = async () => {
      try {
        const [followUpStats, activityStats] = await Promise.all([
          followUpCache.garbageCollect(),
          activityCache.garbageCollect()
        ]);
        
        setCacheStats(prev => ({
          ...prev,
          lastCleanup: Date.now(),
          totalEntries: followUpStats.total + activityStats.total
        }));
        
        // Also cleanup old optimistic activities
        cleanupOldOptimisticActivities();
        
        console.log('🧹 Cache cleanup completed');
      } catch (error) {
        console.warn('Cache cleanup failed:', error);
      }
    };

    // Run cleanup every 5 minutes
    const interval = setInterval(cleanup, 5 * 60 * 1000);
    
    return () => clearInterval(interval);
  }, [cleanupOldOptimisticActivities]);

  /**
   * Add optimistic activity
   */
  const addOptimisticActivity = useCallback((contactId: string, activityData: Partial<OptimisticActivity>) => {
    const activity: OptimisticActivity = {
      id: `optimistic_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      contact_id: contactId,
      user_id: user?.id || '',
      isOptimistic: true,
      localTimestamp: Date.now(),
      ...activityData,
      timestamp: activityData.timestamp || new Date().toISOString(),
      type: activityData.type || 'Follow-Up',
    };
    
    setOptimisticActivities(prev => ({
      ...prev,
      [contactId]: [...(prev[contactId] || []), activity]
    }));
    
    console.log('✅ Optimistic activity added:', activity);
  }, [user?.id]);

  /**
   * Remove optimistic activity
   */
  const removeOptimisticActivity = useCallback((contactId: string, activityId: string) => {
    setOptimisticActivities(prev => ({
      ...prev,
      [contactId]: (prev[contactId] || []).filter(a => a.id !== activityId)
    }));
  }, []);

  /**
   * Clear optimistic activities for a contact
   */
  const clearOptimisticActivities = useCallback((contactId?: string) => {
    if (contactId) {
      setOptimisticActivities(prev => {
        const newState = { ...prev };
        delete newState[contactId];
        return newState;
      });
      console.log('🧹 Cleared optimistic activities for contact:', contactId);
    } else {
      setOptimisticActivities({});
      console.log('🧹 Cleared all optimistic activities');
    }
  }, []);

  /**
   * Clear all caches
   */
  const clearCache = useCallback(async () => {
    try {
      await Promise.all([
        followUpCache.clear(),
        activityCache.clear()
      ]);
      
      setCacheStats({
        hits: 0,
        misses: 0,
        hitRate: 0,
        totalEntries: 0,
        lastCleanup: Date.now()
      });
      
      toast.success('Cache cleared successfully');
    } catch (error) {
      console.error('Failed to clear cache:', error);
      toast.error('Failed to clear cache');
    }
  }, []);

  /**
   * Force recalculation
   */
  const forceRecalculation = useCallback(async () => {
    const activeContacts = getActiveContacts;
    const contactIds = activeContacts.map(c => c.id);
    const cacheKey = generateCacheKey(contactIds, selectedLabels);
    
    try {
      await followUpCache.delete(cacheKey);
    } catch (error) {
      console.warn('Failed to clear cache entry:', error);
    }
    
    await calculateFollowUps();
  }, [getActiveContacts, generateCacheKey, selectedLabels, calculateFollowUps]);

  return {
    calculations,
    loading,
    calculating,
    progress,
    cacheStats,
    addOptimisticActivity,
    removeOptimisticActivity,
    clearOptimisticActivities,
    clearCache,
    forceRecalculation,
    optimisticActivities,
    isReady: !loading && !calculating
  };
};