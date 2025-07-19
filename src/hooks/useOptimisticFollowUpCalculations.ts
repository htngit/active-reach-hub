import { useState, useEffect, useMemo, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Contact } from '@/types/contact';

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
  const [optimisticActivities, setOptimisticActivities] = useState<{[contactId: string]: any[]}>({});
  const { user } = useAuth();

  // Early return if contacts is not available
  if (!contacts || !Array.isArray(contacts)) {
    return {
      needsApproach: [],
      stale3Days: [],
      stale7Days: [],
      stale30Days: [],
      addOptimisticActivityToContact: () => null,
    };
  }

  /**
   * Fetch activities for all active contacts
   */
  const fetchActivitiesForContacts = useCallback(async (contactIds: string[]) => {
    if (!user || contactIds.length === 0) return;

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
  }, [user]);

  /**
   * Get active contacts based on filters
   */
  const getActiveContacts = useMemo(() => {
    let activeContacts = contacts.filter(contact => contact.status !== 'Paid');
    
    // Apply label filter
    if (selectedLabels.length > 0) {
      activeContacts = activeContacts.filter(contact => 
        contact.labels && selectedLabels.some(label => contact.labels!.includes(label))
      );
    }
    
    return activeContacts;
  }, [contacts, selectedLabels]);

  /**
   * Fetch activities when active contacts change
   */
  useEffect(() => {
    const activeContacts = getActiveContacts;
    const contactIds = activeContacts.map(c => c.id);
    
    if (contactIds.length > 0) {
      fetchActivitiesForContacts(contactIds);
    }
  }, [getActiveContacts, fetchActivitiesForContacts]);

  /**
   * Calculate follow-up categories using activity data
   */
  const calculateFollowUps = useMemo((): FollowUpCalculations => {
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
  }, [getActiveContacts, activityData, optimisticActivities]);

  // Update state when calculations change
  useEffect(() => {
    setCalculations(calculateFollowUps);
  }, [calculateFollowUps]);

  /**
   * Add optimistic activity to specific contact
   */
  const addOptimisticActivityToContact = useCallback((contactId: string, activity: any) => {
    const optimisticActivity = {
      ...activity,
      id: `optimistic-${Date.now()}-${Math.random()}`,
      isOptimistic: true,
      localTimestamp: Date.now(),
      contact_id: contactId
    };

    setOptimisticActivities(prev => ({
      ...prev,
      [contactId]: [...(prev[contactId] || []), optimisticActivity]
    }));

    // Auto-remove optimistic activity after 30 seconds
    setTimeout(() => {
      setOptimisticActivities(prev => ({
        ...prev,
        [contactId]: (prev[contactId] || []).filter(a => a.id !== optimisticActivity.id)
      }));
    }, 30000);

    return optimisticActivity;
  }, []);

  return {
    ...calculations,
    addOptimisticActivityToContact,
  };
};