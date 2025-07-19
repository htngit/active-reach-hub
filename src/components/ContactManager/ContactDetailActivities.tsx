
import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useOptimisticActivities } from '@/hooks/useOptimisticActivities';


interface ContactDetailActivitiesProps {
  contactId: string;
}

export const ContactDetailActivities: React.FC<ContactDetailActivitiesProps> = ({
  contactId,
}) => {
  const { user } = useAuth();
  const { activities, loading } = useOptimisticActivities(contactId);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Activity History</CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <p className="text-gray-500">Loading activities...</p>
        ) : activities.length === 0 ? (
          <p className="text-gray-500">No activities logged yet</p>
        ) : (
          <div className="space-y-4">
            {activities.map(activity => (
              <div key={activity.id} className="border-l-2 border-gray-200 pl-4">
                <div className="flex justify-between items-start">
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="font-medium">{activity.type}</h4>
                      {activity.isOptimistic && (
                        <Badge variant="secondary" className="text-xs">
                          Syncing...
                        </Badge>
                      )}
                      {activity.user_id !== user?.id && !activity.isOptimistic && (
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
