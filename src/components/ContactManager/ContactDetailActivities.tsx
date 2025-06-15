
import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';

interface Activity {
  id: string;
  type: string;
  details?: string;
  timestamp: string;
  api_call_status?: string;
  user_id: string;
  profiles?: {
    full_name: string | null;
    username: string | null;
  };
}

interface ContactDetailActivitiesProps {
  contactId: string;
}

export const ContactDetailActivities: React.FC<ContactDetailActivitiesProps> = ({
  contactId,
}) => {
  const [activities, setActivities] = useState<Activity[]>([]);
  const { user } = useAuth();

  useEffect(() => {
    fetchActivities();
  }, [contactId]);

  const fetchActivities = async () => {
    if (!user) return;

    try {
      const { data: activitiesData, error: activitiesError } = await supabase
        .from('activities')
        .select('*')
        .eq('contact_id', contactId)
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
      } else {
        setActivities([]);
      }
    } catch (error: any) {
      console.error('Error fetching activities:', error);
      toast.error("Failed to fetch activities: " + (error.message || JSON.stringify(error)));
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Activity History</CardTitle>
      </CardHeader>
      <CardContent>
        {activities.length === 0 ? (
          <p className="text-gray-500">No activities logged yet</p>
        ) : (
          <div className="space-y-4">
            {activities.map(activity => (
              <div key={activity.id} className="border-l-2 border-gray-200 pl-4">
                <div className="flex justify-between items-start">
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="font-medium">{activity.type}</h4>
                      {activity.user_id !== user?.id && (
                        <Badge variant="outline" className="text-xs">
                          {activity.profiles?.full_name || activity.profiles?.username || 'Team member'}
                        </Badge>
                      )}
                    </div>
                    {activity.details && (
                      <p className="text-gray-600 text-sm">{activity.details}</p>
                    )}
                    {activity.api_call_status && (
                      <Badge 
                        variant={activity.api_call_status === 'success' ? 'default' : 'destructive'}
                        className="text-xs mt-1"
                      >
                        {activity.api_call_status}
                      </Badge>
                    )}
                  </div>
                  <span className="text-sm text-gray-500">
                    {new Date(activity.timestamp).toLocaleString()}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
