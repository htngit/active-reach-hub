/**
 * Web Worker untuk kalkulasi follow-up yang berat
 * Mencegah UI freeze dengan memindahkan kalkulasi ke background thread
 */

interface Contact {
  id: string;
  status: string;
  labels?: string[];
  created_at?: string;
  [key: string]: any;
}

interface ActivityData {
  [contactId: string]: {
    hasActivity: boolean;
    lastActivityTimestamp: number | null;
  };
}

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

interface CalculationMessage {
  type: 'CALCULATE_FOLLOW_UPS';
  payload: {
    contacts: Contact[];
    selectedLabels: string[];
    activityData: ActivityData;
    optimisticActivities: {[contactId: string]: OptimisticActivity[]};
  };
}

interface ProgressMessage {
  type: 'PROGRESS';
  payload: {
    processed: number;
    total: number;
    percentage: number;
  };
}

interface ResultMessage {
  type: 'CALCULATION_COMPLETE';
  payload: {
    calculations: FollowUpCalculations;
    processingTime: number;
  };
}

interface ErrorMessage {
  type: 'CALCULATION_ERROR';
  payload: {
    error: string;
  };
}

type WorkerMessage = CalculationMessage;
type WorkerResponse = ProgressMessage | ResultMessage | ErrorMessage;

/**
 * Filter active contacts based on status and labels
 */
function getActiveContacts(contacts: Contact[], selectedLabels: string[]): Contact[] {
  let activeContacts = contacts.filter(contact => contact.status !== 'Paid');
  
  // Apply label filter
  if (selectedLabels.length > 0) {
    activeContacts = activeContacts.filter(contact => 
      contact.labels && selectedLabels.some(label => contact.labels!.includes(label))
    );
  }
  
  return activeContacts;
}

/**
 * Calculate follow-up categories with progress reporting
 */
function calculateFollowUps(
  contacts: Contact[],
  selectedLabels: string[],
  activityData: ActivityData,
  optimisticActivities: {[contactId: string]: OptimisticActivity[]}
): FollowUpCalculations {
  const startTime = performance.now();
  
  const activeContacts = getActiveContacts(contacts, selectedLabels);
  const msPerDay = 24 * 60 * 60 * 1000;
  const now = new Date();
  
  const needsApproachList: FollowUpContact[] = [];
  const stale3DaysList: FollowUpContact[] = [];
  const stale7DaysList: FollowUpContact[] = [];
  const stale30DaysList: FollowUpContact[] = [];

  const total = activeContacts.length;
  let processed = 0;

  activeContacts.forEach((contact, index) => {
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
      // Only add to stale categories if the contact meets the criteria
      // Contacts with recent activity (< 3 days) should not appear in any category
      if (daysSinceLastActivity >= 30 && (daysSinceCreated >= 30 || !contact.created_at)) {
        stale30DaysList.push({ ...contact, last_activity: lastActivityTimestamp.toString() });
      } else if (daysSinceLastActivity >= 7 && (daysSinceCreated >= 7 || !contact.created_at)) {
        stale7DaysList.push({ ...contact, last_activity: lastActivityTimestamp.toString() });
      } else if (daysSinceLastActivity >= 3 && (daysSinceCreated >= 3 || !contact.created_at)) {
        stale3DaysList.push({ ...contact, last_activity: lastActivityTimestamp.toString() });
      }
      // Contacts with daysSinceLastActivity < 3 are considered "fresh" and don't appear in any follow-up category
    }
    
    processed++;
    
    // Report progress every 10 contacts or at the end
    if (processed % 10 === 0 || processed === total) {
      const progressMessage: ProgressMessage = {
        type: 'PROGRESS',
        payload: {
          processed,
          total,
          percentage: Math.round((processed / total) * 100)
        }
      };
      self.postMessage(progressMessage);
    }
  });

  const endTime = performance.now();
  const processingTime = endTime - startTime;

  return {
    needsApproach: needsApproachList,
    stale3Days: stale3DaysList,
    stale7Days: stale7DaysList,
    stale30Days: stale30DaysList,
  };
}

/**
 * Worker message handler
 */
self.onmessage = function(event: MessageEvent<WorkerMessage>) {
  const { type, payload } = event.data;
  
  try {
    switch (type) {
      case 'CALCULATE_FOLLOW_UPS': {
        const { contacts, selectedLabels, activityData, optimisticActivities } = payload;
        
        const calculations = calculateFollowUps(
          contacts,
          selectedLabels,
          activityData,
          optimisticActivities
        );
        
        const resultMessage: ResultMessage = {
          type: 'CALCULATION_COMPLETE',
          payload: {
            calculations,
            processingTime: performance.now()
          }
        };
        
        self.postMessage(resultMessage);
        break;
      }
      
      default:
        throw new Error(`Unknown message type: ${type}`);
    }
  } catch (error) {
    const errorMessage: ErrorMessage = {
      type: 'CALCULATION_ERROR',
      payload: {
        error: error instanceof Error ? error.message : String(error)
      }
    };
    
    self.postMessage(errorMessage);
  }
};

// Export types for main thread usage
export type {
  WorkerMessage,
  WorkerResponse,
  CalculationMessage,
  ProgressMessage,
  ResultMessage,
  ErrorMessage,
  FollowUpCalculations
};