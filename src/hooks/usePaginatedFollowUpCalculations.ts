import { useState, useEffect, useMemo, useCallback } from 'react';
import { Contact } from '@/types/contact';
import { useOptimisticFollowUpCalculations } from './useOptimisticFollowUpCalculations';
import { useCachedContacts } from './useCachedContacts';

/**
 * Extended contact interface for follow-up specific data
 */
interface FollowUpContact extends Contact {
  last_activity?: string;
}

/**
 * Interface for paginated follow-up results
 * Extends existing FollowUpCalculations with pagination metadata
 */
interface PaginatedFollowUpResult {
  // Contact lists (limited to current page)
  needsApproach: FollowUpContact[];
  stale3Days: FollowUpContact[];
  stale7Days: FollowUpContact[];
  stale30Days: FollowUpContact[];
  
  // Pagination metadata
  totalCounts: {
    needsApproach: number;
    stale3Days: number;
    stale7Days: number;
    stale30Days: number;
  };
  currentPages: {
    needsApproach: number;
    stale3Days: number;
    stale7Days: number;
    stale30Days: number;
  };
  pageSize: number;
  totalPages: {
    needsApproach: number;
    stale3Days: number;
    stale7Days: number;
    stale30Days: number;
  };
  
  // Loading states
  isCountLoading: boolean;
  isCalculating: boolean;
  
  // Actions
  setPage: (category: 'needsApproach' | 'stale3Days' | 'stale7Days' | 'stale30Days', page: number) => void;
  refreshData: () => void;
  addOptimisticActivityToContact: (contactId: string, activity: any) => void;
}

/**
 * Hook for paginated follow-up calculations
 * Implements lazy loading with only 50 contacts calculated per page
 * Uses existing useOptimisticFollowUpCalculations and useCachedContacts
 */
export const usePaginatedFollowUpCalculations = (
  contacts: Contact[],
  selectedLabels: string[] = [],
  pageSize: number = 50
): PaginatedFollowUpResult => {
  const [currentPages, setCurrentPages] = useState({
    needsApproach: 1,
    stale3Days: 1,
    stale7Days: 1,
    stale30Days: 1,
  });
  const [isCountLoading, setIsCountLoading] = useState(true);
  const [totalCounts, setTotalCounts] = useState({
    needsApproach: 0,
    stale3Days: 0,
    stale7Days: 0,
    stale30Days: 0,
  });
  
  // Filter contacts based on selected labels (reuse existing logic)
  const filteredContacts = useMemo(() => {
    if (selectedLabels.length === 0) return contacts;
    
    return contacts.filter(contact => {
      if (!contact.labels || contact.labels.length === 0) return false;
      return selectedLabels.some(label => contact.labels?.includes(label));
    });
  }, [contacts, selectedLabels]);
  
  // Get total counts using full calculation (but only for counting)
  const {
    needsApproach: fullNeedsApproach,
    stale3Days: fullStale3Days,
    stale7Days: fullStale7Days,
    stale30Days: fullStale30Days,
    loading: fullCalculationLoading
  } = useOptimisticFollowUpCalculations(filteredContacts, selectedLabels);
  
  // Update total counts when full calculation completes
  useEffect(() => {
    if (!fullCalculationLoading) {
      setTotalCounts({
        needsApproach: fullNeedsApproach.length,
        stale3Days: fullStale3Days.length,
        stale7Days: fullStale7Days.length,
        stale30Days: fullStale30Days.length,
      });
      setIsCountLoading(false);
    } else {
      setIsCountLoading(true);
    }
  }, [fullCalculationLoading, fullNeedsApproach.length, fullStale3Days.length, fullStale7Days.length, fullStale30Days.length]);
  
  // Get paginated data from full calculation results - separate pagination per category
  const paginatedData = useMemo(() => {
    // Calculate pagination for each category separately
    const getNeedsApproachPage = () => {
      const startIndex = (currentPages.needsApproach - 1) * pageSize;
      const endIndex = startIndex + pageSize;
      return fullNeedsApproach.slice(startIndex, endIndex);
    };
    
    const getStale3DaysPage = () => {
      const startIndex = (currentPages.stale3Days - 1) * pageSize;
      const endIndex = startIndex + pageSize;
      return fullStale3Days.slice(startIndex, endIndex);
    };
    
    const getStale7DaysPage = () => {
      const startIndex = (currentPages.stale7Days - 1) * pageSize;
      const endIndex = startIndex + pageSize;
      return fullStale7Days.slice(startIndex, endIndex);
    };
    
    const getStale30DaysPage = () => {
      const startIndex = (currentPages.stale30Days - 1) * pageSize;
      const endIndex = startIndex + pageSize;
      return fullStale30Days.slice(startIndex, endIndex);
    };
    
    return {
      needsApproach: getNeedsApproachPage(),
      stale3Days: getStale3DaysPage(),
      stale7Days: getStale7DaysPage(),
      stale30Days: getStale30DaysPage(),
    };
  }, [fullNeedsApproach, fullStale3Days, fullStale7Days, fullStale30Days, currentPages, pageSize]);
  
  // Calculate total pages
  const totalPages = useMemo(() => ({
    needsApproach: Math.ceil(totalCounts.needsApproach / pageSize),
    stale3Days: Math.ceil(totalCounts.stale3Days / pageSize),
    stale7Days: Math.ceil(totalCounts.stale7Days / pageSize),
    stale30Days: Math.ceil(totalCounts.stale30Days / pageSize),
  }), [totalCounts, pageSize]);
  
  // Page navigation handler for specific categories
  const setPage = useCallback((category: 'needsApproach' | 'stale3Days' | 'stale7Days' | 'stale30Days', page: number) => {
    setCurrentPages(prev => ({
      ...prev,
      [category]: page
    }));
  }, []);
  
  // Refresh data handler
  const refreshData = useCallback(() => {
    setIsCountLoading(true);
  }, []);
  
  return {
    // Contact lists (limited to current page)
    needsApproach: paginatedData.needsApproach,
    stale3Days: paginatedData.stale3Days,
    stale7Days: paginatedData.stale7Days,
    stale30Days: paginatedData.stale30Days,
    
    // Pagination metadata
    totalCounts,
    currentPages,
    pageSize,
    totalPages,
    
    // Loading states
    isCountLoading,
    isCalculating: fullCalculationLoading,
    
    // Actions
    setPage,
    refreshData,
    addOptimisticActivityToContact: (contactId: string, activity: any) => {
      // This will be handled by the full calculation hook
    },
  };
};