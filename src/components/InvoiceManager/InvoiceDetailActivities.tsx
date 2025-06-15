
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { format } from 'date-fns';
import { InvoiceActivity } from '@/types/invoice';

interface InvoiceDetailActivitiesProps {
  activities: InvoiceActivity[];
}

export const InvoiceDetailActivities: React.FC<InvoiceDetailActivitiesProps> = ({
  activities,
}) => {
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
                    <h4 className="font-medium">{activity.activity_type}</h4>
                    {activity.details && (
                      <p className="text-gray-600 text-sm">{activity.details}</p>
                    )}
                  </div>
                  <span className="text-sm text-gray-500">
                    {format(new Date(activity.created_at), 'MMM dd, yyyy HH:mm')}
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
