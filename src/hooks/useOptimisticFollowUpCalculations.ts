import { useState, useEffect, useMemo } from 'react';
import { Contact } from '@/types/contact';
import { useOptimisticActivities } from './useOptimisticActivities';

interface FollowUpContact extends Contact {
  last_activity?: string;
}

interface FollowUpCalculations {
  needsApproach: FollowUpContact[];
  stale3Days: FollowUpContact[];
  stale7Days: FollowUpContact[];
  stale30Days: FollowUpContact[];
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

  // Create optimistic activity hooks for all contacts that need them
  const contactActivityHooks = useMemo(() => {
    const hooks: { [contactId: string]: ReturnType<typeof useOptimisticActivities> } = {};
    
    // Only create hooks for contacts we're actually tracking
    const activeContacts = contacts.filter(contact => {
      if (contact.status === 'Paid') return false;
      if (selectedLabels.length > 0) {
        return contact.labels && selectedLabels.some(label => contact.labels!.includes(label));
      }
      return true;
    });

    activeContacts.forEach(contact => {
      hooks[contact.id] = useOptimisticActivities(contact.id);
    });

    return hooks;
  }, [contacts, selectedLabels]);

  // Calculate follow-up categories using optimistic data
  const calculateFollowUps = useMemo((): FollowUpCalculations => {
    const msPerDay = 24 * 60 * 60 * 1000;
    const now = new Date();
    
    // Filter active contacts
    let activeContacts = contacts.filter(contact => contact.status !== 'Paid');
    
    // Apply label filter
    if (selectedLabels.length > 0) {
      activeContacts = activeContacts.filter(contact => 
        contact.labels && selectedLabels.some(label => contact.labels!.includes(label))
      );
    }

    const needsApproachList: FollowUpContact[] = [];
    const stale3DaysList: FollowUpContact[] = [];
    const stale7DaysList: FollowUpContact[] = [];
    const stale30DaysList: FollowUpContact[] = [];

    activeContacts.forEach(contact => {
      const activityHook = contactActivityHooks[contact.id];
      
      if (!activityHook) return;

      const hasActivity = activityHook.hasAnyActivity();
      
      if (!hasActivity) {
        // No activities - needs approach
        needsApproachList.push({ ...contact, last_activity: null });
      } else {
        // Has activity - calculate staleness using optimistic data
        const lastActivityTimestamp = activityHook.getLastActivityTimestamp();
        
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
          stale30DaysList.push({ ...contact, last_activity: lastActivityTimestamp });
        } else if (daysSinceLastActivity >= 7 && (daysSinceCreated >= 7 || !contact.created_at)) {
          stale7DaysList.push({ ...contact, last_activity: lastActivityTimestamp });
        } else if (daysSinceLastActivity >= 3 && (daysSinceCreated >= 3 || !contact.created_at)) {
          stale3DaysList.push({ ...contact, last_activity: lastActivityTimestamp });
        }
      }
    });

    console.log('⚡ Optimistic follow-up calculation:', {
      needsApproach: needsApproachList.length,
      stale3Days: stale3DaysList.length,
      stale7Days: stale7DaysList.length,
      stale30Days: stale30DaysList.length,
      optimisticActivities: Object.values(contactActivityHooks).reduce((sum, hook) => sum + hook.optimisticActivitiesCount, 0)
    });

    return {
      needsApproach: needsApproachList,
      stale3Days: stale3DaysList,
      stale7Days: stale7DaysList,
      stale30Days: stale30DaysList,
    };
  }, [contacts, selectedLabels, contactActivityHooks]);

  // Update state when calculations change
  useEffect(() => {
    setCalculations(calculateFollowUps);
  }, [calculateFollowUps]);

  return {
    ...calculations,
    // Helper to add optimistic activity to specific contact
    addOptimisticActivityToContact: (contactId: string, activity: any) => {
      const hook = contactActivityHooks[contactId];
      if (hook) {
        return hook.addOptimisticActivity(activity);
      }
      return null;
    },
  };
};