import { useState, useEffect, useMemo, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Contact } from '@/types/contact';
import { toast } from 'sonner';

// Import OptimisticActivity interface from useOptimisticActivities
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

interface FollowUpCalculations {
  needsApproach: FollowUpContact[];
  stale3Days: FollowUpContact[];
  stale7Days: FollowUpContact[];
  stale30Days: FollowUpContact[];
}

interface ActivityData {
  [contactId: string]: {
    hasActivity: boolean;
    lastActivityTimestamp: number | null;
  };
}

export const useOptimisticFollowUpCalculations = (
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
  const { user } = useAuth();

  // Check if contacts is valid
  const isValidContacts = contacts && Array.isArray(contacts);

  /**
   * Fetch activities for all active contacts
   */
  const fetchActivitiesForContacts = useCallback(async (contactIds: string[]) => {
    if (!user || contactIds.length === 0 || !isValidContacts) return;

    try {
      const { data: activitiesData, error } = await supabase
        .from('activities')
        .select('contact_id, timestamp')
        .in('contact_id', contactIds)
        .order('timestamp', { ascending: false });

      if (error) {
        console.error('Error fetching activities:', error);
        return;
      }

      // Process activities data
      const newActivityData: ActivityData = {};
      
      contactIds.forEach(contactId => {
        const contactActivities = activitiesData?.filter(a => a.contact_id === contactId) || [];
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
    } catch (error) {
      console.error('Error in fetchActivitiesForContacts:', error);
    }
  }, [user, isValidContacts]);

  /**
   * Get active contacts based on filters
   */
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
   * Fetch activities when active contacts change
   */
  useEffect(() => {
    if (!isValidContacts) return;
    
    const activeContacts = getActiveContacts;
    const contactIds = activeContacts.map(c => c.id);
    
    if (contactIds.length > 0) {
      fetchActivitiesForContacts(contactIds);
    }
  }, [getActiveContacts, fetchActivitiesForContacts, isValidContacts]);

  /**
   * Calculate follow-up categories using activity data
   */
  const calculateFollowUps = useMemo((): FollowUpCalculations => {
    if (!isValidContacts) {
      return {
        needsApproach: [],
        stale3Days: [],
        stale7Days: [],
        stale30Days: [],
      };
    }
    
    const msPerDay = 24 * 60 * 60 * 1000;
    const now = new Date();
    
    const activeContacts = getActiveContacts;
    const needsApproachList: FollowUpContact[] = [];
    const stale3DaysList: FollowUpContact[] = [];
    const stale7DaysList: FollowUpContact[] = [];
    const stale30DaysList: FollowUpContact[] = [];

    activeContacts.forEach(contact => {
      const contactActivity = activityData[contact.id];
      const optimisticContactActivities = optimisticActivities[contact.id] || [];
      
      // Check if contact has any activity (including optimistic)
      const hasActivity = contactActivity?.hasActivity || optimisticContactActivities.length > 0;
      
      if (!hasActivity) {
        // No activities - needs approach
        needsApproachList.push({ ...contact, last_activity: null });
      } else {
        // Has activity - calculate staleness using optimistic data
        let lastActivityTimestamp = contactActivity?.lastActivityTimestamp;
        
        // Check optimistic activities for more recent timestamp
        if (optimisticContactActivities.length > 0) {
          const latestOptimistic = Math.max(...optimisticContactActivities.map(a => a.localTimestamp));
          if (!lastActivityTimestamp || latestOptimistic > lastActivityTimestamp) {
            lastActivityTimestamp = latestOptimistic;
          }
        }
        
        if (!lastActivityTimestamp) {
          needsApproachList.push({ ...contact, last_activity: null });
          return;
        }

        const lastActivityDate = new Date(lastActivityTimestamp);
        const daysSinceLastActivity = Math.floor((now.getTime() - lastActivityDate.getTime()) / msPerDay);
        
        // Calculate days since contact created
        let daysSinceCreated = 0;
        if (contact.created_at) {
          const contactCreatedDate = new Date(contact.created_at);
          daysSinceCreated = Math.floor((now.getTime() - contactCreatedDate.getTime()) / msPerDay);
        }

        // Categorize based on staleness
        if (daysSinceLastActivity >= 30 && (daysSinceCreated >= 30 || !contact.created_at)) {
          stale30DaysList.push({ ...contact, last_activity: lastActivityTimestamp.toString() });
        } else if (daysSinceLastActivity >= 7 && (daysSinceCreated >= 7 || !contact.created_at)) {
          stale7DaysList.push({ ...contact, last_activity: lastActivityTimestamp.toString() });
        } else if (daysSinceLastActivity >= 3 && (daysSinceCreated >= 3 || !contact.created_at)) {
          stale3DaysList.push({ ...contact, last_activity: lastActivityTimestamp.toString() });
        }
      }
    });

    console.log('⚡ Optimistic follow-up calculation:', {
      needsApproach: needsApproachList.length,
      stale3Days: stale3DaysList.length,
      stale7Days: stale7DaysList.length,
      stale30Days: stale30DaysList.length,
      totalOptimisticActivities: Object.values(optimisticActivities).reduce((sum, activities) => sum + activities.length, 0)
    });

    return {
      needsApproach: needsApproachList,
      stale3Days: stale3DaysList,
      stale7Days: stale7DaysList,
      stale30Days: stale30DaysList,
    };
  }, [getActiveContacts, activityData, optimisticActivities, isValidContacts]);

  // Update state when calculations change
  useEffect(() => {
    setCalculations(calculateFollowUps);
  }, [calculateFollowUps]);

  /**
   * Sync optimistic activity to backend database
   */
  const syncActivityToBackend = useCallback(async (optimisticActivity: OptimisticActivity) => {
    if (!user) return;
    
    try {
      console.log('🔄 Syncing template activity to backend:', optimisticActivity);
      
      const { error: activityError } = await supabase
        .from('activities')
        .insert({
          contact_id: optimisticActivity.contact_id,
          user_id: optimisticActivity.user_id,
          type: optimisticActivity.type,
          details: optimisticActivity.details,
          timestamp: optimisticActivity.timestamp,
        });

      if (activityError) {
        console.error('❌ Failed to sync template activity:', activityError);
        toast.error('Failed to log activity to database');
        
        // Mark as failed in optimistic state
        setOptimisticActivities(prev => ({
          ...prev,
          [optimisticActivity.contact_id]: (prev[optimisticActivity.contact_id] || []).map(opt => 
            opt.id === optimisticActivity.id 
              ? { ...opt, api_call_status: 'failed' }
              : opt
          )
        }));
      } else {
        console.log('✅ Template activity synced successfully to database');
        toast.success('Activity logged successfully');
        
        // Refresh activity data to get latest from database
        const activeContacts = getActiveContacts;
        const contactIds = activeContacts.map(c => c.id);
        if (contactIds.length > 0) {
          fetchActivitiesForContacts(contactIds);
        }
        
        // Remove from optimistic state after successful sync and data refresh
        setTimeout(() => {
          setOptimisticActivities(prev => ({
            ...prev,
            [optimisticActivity.contact_id]: (prev[optimisticActivity.contact_id] || []).filter(a => a.id !== optimisticActivity.id)
          }));
        }, 1000); // Short delay to show success and allow data refresh
      }
    } catch (error) {
      console.error('❌ Error syncing template activity:', error);
      toast.error('Failed to log activity');
    }
  }, [user, getActiveContacts, fetchActivitiesForContacts]);

  /**
   * Add optimistic activity to specific contact and sync to backend
   */
  const addOptimisticActivityToContact = useCallback((contactId: string, activity: Omit<OptimisticActivity, 'id' | 'isOptimistic' | 'localTimestamp' | 'contact_id'>) => {
    if (!isValidContacts || !user) return null;
    
    const optimisticActivity: OptimisticActivity = {
      ...activity,
      id: `optimistic-${Date.now()}-${Math.random()}`,
      isOptimistic: true,
      localTimestamp: Date.now(),
      contact_id: contactId,
      user_id: user.id
    };

    console.log('➕ Adding optimistic template activity:', optimisticActivity);

    // Add to optimistic state immediately for instant UI feedback
    setOptimisticActivities(prev => {
      const existingActivities = prev[contactId] || [];
      const updatedActivities: OptimisticActivity[] = [...existingActivities, optimisticActivity];
      return {
        ...prev,
        [contactId]: updatedActivities
      };
    });

    // Sync to backend database
    syncActivityToBackend(optimisticActivity);

    // Fallback: Auto-remove optimistic activity after 30 seconds if sync fails
    setTimeout(() => {
      setOptimisticActivities(prev => ({
        ...prev,
        [contactId]: (prev[contactId] || []).filter(a => a.id !== optimisticActivity.id)
      }));
    }, 30000);

    return optimisticActivity;
  }, [isValidContacts, user, syncActivityToBackend]);

  return {
    ...calculations,
    addOptimisticActivityToContact,
  };
};