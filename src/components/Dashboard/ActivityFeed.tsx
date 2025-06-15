
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useCachedContacts } from '@/hooks/useCachedContacts';
import { useEngagements } from '@/hooks/useEngagements';
import { Badge } from '@/components/ui/badge';
import { Clock, User, Phone, Target } from 'lucide-react';

export const ActivityFeed = () => {
  const { contacts } = useCachedContacts();
  const { engagements } = useEngagements();

  // Combine and sort recent activities
  const getRecentActivities = () => {
    const activities = [];

    // Recent contacts (last 10)
    const recentContacts = contacts
      .slice(-10)
      .map(contact => ({
        id: contact.id,
        type: 'contact',
        title: `New contact: ${contact.name}`,
        subtitle: contact.company || contact.phone_number,
        timestamp: new Date(contact.created_at),
        status: contact.status,
      }));

    // Recent engagements (last 10)
    const recentEngagements = engagements
      .slice(-10)
      .map(engagement => ({
        id: engagement.id,
        type: 'engagement',
        title: `Engagement: ${engagement.name}`,
        subtitle: `Score: ${engagement.qualification_score || 0}%`,
        timestamp: new Date(engagement.created_at),
        status: engagement.status,
      }));

    activities.push(...recentContacts, ...recentEngagements);

    // Sort by timestamp (most recent first)
    return activities
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, 15); // Show only 15 most recent
  };

  const activities = getRecentActivities();

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'contact':
        return <User className="h-4 w-4" />;
      case 'engagement':
        return <Target className="h-4 w-4" />;
      default:
        return <Clock className="h-4 w-4" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'New':
        return 'bg-blue-100 text-blue-800';
      case 'Qualified':
        return 'bg-orange-100 text-orange-800';
      case 'Converted':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatTime = (timestamp: Date) => {
    const now = new Date();
    const diff = now.getTime() - timestamp.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(hours / 24);

    if (days > 0) return `${days}d ago`;
    if (hours > 0) return `${hours}h ago`;
    return 'Just now';
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="h-5 w-5" />
          Recent Activity
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <ScrollArea className="h-[400px]">
          <div className="space-y-2 p-4">
            {activities.length === 0 ? (
              <div className="text-center text-gray-500 py-8">
                <Clock className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>No recent activity</p>
              </div>
            ) : (
              activities.map((activity) => (
                <div
                  key={`${activity.type}-${activity.id}`}
                  className="flex items-start gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div className="mt-1 text-gray-400">
                    {getActivityIcon(activity.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {activity.title}
                    </p>
                    <p className="text-xs text-gray-500 truncate">
                      {activity.subtitle}
                    </p>
                    <div className="flex items-center justify-between mt-1">
                      <Badge 
                        variant="secondary" 
                        className={`text-xs ${getStatusColor(activity.status)}`}
                      >
                        {activity.status}
                      </Badge>
                      <span className="text-xs text-gray-400">
                        {formatTime(activity.timestamp)}
                      </span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
};
