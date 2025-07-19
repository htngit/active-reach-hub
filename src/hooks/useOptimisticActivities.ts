import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface Activity {
  id: string;
  type: string;
  details?: string;
  timestamp: string;
  api_call_status?: string;
  user_id: string;
  contact_id: string;
  profiles?: {
    full_name: string | null;
    username: string | null;
  };
  // Optimistic flags
  isOptimistic?: boolean;
  localTimestamp?: number;
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

export const useOptimisticActivities = (contactId?: string) => {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [optimisticActivities, setOptimisticActivities] = useState<OptimisticActivity[]>([]);
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();
  const syncQueueRef = useRef<OptimisticActivity[]>([]);

  // Fetch activities from backend
  const fetchActivities = useCallback(async (id?: string) => {
    if (!user || (!id && !contactId)) return;

    try {
      setLoading(true);
      const targetContactId = id || contactId;

      const { data: activitiesData, error: activitiesError } = await supabase
        .from('activities')
        .select('*')
        .eq('contact_id', targetContactId)
        .order('timestamp', { ascending: false });

      if (activitiesError) throw activitiesError;

      if (activitiesData && activitiesData.length > 0) {
        const userIds = [...new Set(activitiesData.map(activity => activity.user_id))];
        
        const { data: profilesData, error: profilesError } = await supabase
          .from('profiles')
          .select('id, full_name, username')
          .in('id', userIds);
          
        if (profilesError) throw profilesError;
        
        const profilesMap = (profilesData || []).reduce((map, profile) => {
          map[profile.id] = profile;
          return map;
        }, {} as Record<string, any>);
        
        const activitiesWithProfiles = activitiesData.map(activity => ({
          ...activity,
          profiles: profilesMap[activity.user_id] || null
        }));
        
        setActivities(activitiesWithProfiles);
        
        // Remove synced optimistic activities
        const backendTimestamps = new Set(activitiesData.map(a => a.timestamp));
        setOptimisticActivities(prev => 
          prev.filter(opt => !backendTimestamps.has(opt.timestamp))
        );
      } else {
        setActivities([]);
      }
    } catch (error: any) {
      console.error('Error fetching activities:', error);
    } finally {
      setLoading(false);
    }
  }, [user, contactId]);

  // Add optimistic activity immediately
  const addOptimisticActivity = useCallback((activity: Omit<OptimisticActivity, 'id' | 'isOptimistic' | 'localTimestamp'>) => {
    if (!user) return null;

    const optimisticActivity: OptimisticActivity = {
      ...activity,
      id: `optimistic-${Date.now()}-${Math.random()}`,
      user_id: user.id,
      isOptimistic: true,
      localTimestamp: Date.now(),
    };

    console.log('➕ Adding optimistic activity:', optimisticActivity);
    
    // Add to optimistic state immediately (offline-first)
    setOptimisticActivities(prev => [optimisticActivity, ...prev]);
    
    // Add to sync queue for background processing
    syncQueueRef.current.push(optimisticActivity);
    
    // Trigger background sync
    syncToBackend(optimisticActivity);
    
    return optimisticActivity;
  }, [user]);

  // Background sync to backend
  const syncToBackend = useCallback(async (optimisticActivity: OptimisticActivity) => {
    try {
      console.log('🔄 Syncing activity to backend:', optimisticActivity);
      
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
        console.error('❌ Failed to sync activity:', activityError);
        // Mark as failed but keep in optimistic state with error indicator
        setOptimisticActivities(prev => 
          prev.map(opt => 
            opt.id === optimisticActivity.id 
              ? { ...opt, api_call_status: 'failed' }
              : opt
          )
        );
      } else {
        console.log('✅ Activity synced successfully');
        // Remove from sync queue
        syncQueueRef.current = syncQueueRef.current.filter(a => a.id !== optimisticActivity.id);
        
        // Lazy refresh if we're on the same contact
        if (optimisticActivity.contact_id === contactId) {
          setTimeout(() => fetchActivities(contactId), 1000);
        }
      }
    } catch (error) {
      console.error('❌ Sync error:', error);
    }
  }, [contactId, fetchActivities]);

  // Merge optimistic and backend activities for display
  const getAllActivities = useCallback((): Activity[] => {
    const combined = [
      ...optimisticActivities.map(opt => ({ ...opt, isOptimistic: true as const })),
      ...activities
    ];
    
    // Sort by timestamp (newest first)
    return combined.sort((a, b) => {
      const aTime = a.isOptimistic ? a.localTimestamp : new Date(a.timestamp).getTime();
      const bTime = b.isOptimistic ? b.localTimestamp : new Date(b.timestamp).getTime();
      return bTime - aTime;
    });
  }, [activities, optimisticActivities]);

  // Get last activity timestamp for follow-up calculations
  const getLastActivityTimestamp = useCallback((): string | null => {
    const allActivities = getAllActivities();
    if (allActivities.length === 0) return null;
    
    const latest = allActivities[0];
    return latest.isOptimistic 
      ? latest.timestamp 
      : latest.timestamp;
  }, [getAllActivities]);

  // Check if we have any activity for this contact (including optimistic)
  const hasAnyActivity = useCallback((): boolean => {
    return getAllActivities().length > 0;
  }, [getAllActivities]);

  useEffect(() => {
    if (contactId) {
      fetchActivities(contactId);
    }
  }, [contactId, fetchActivities]);

  return {
    activities: getAllActivities(),
    loading,
    addOptimisticActivity,
    fetchActivities,
    getLastActivityTimestamp,
    hasAnyActivity,
    // Expose separate counts for debugging
    backendActivitiesCount: activities.length,
    optimisticActivitiesCount: optimisticActivities.length,
  };
};
