
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Calendar, MessageSquare, Users, Phone, Mail, CheckCircle, Clock, XCircle } from 'lucide-react';

interface ActivityStatusSelectionProps {
  currentStatus: string;
  currentActivity: string;
  onStatusChange: (status: string) => void;
  onActivityChange: (activity: string) => void;
}

const statusOptions = [
  { value: 'New', label: 'New', color: 'bg-blue-100 text-blue-800' },
  { value: 'Contacted', label: 'Contacted', color: 'bg-yellow-100 text-yellow-800' },
  { value: 'Qualified', label: 'Qualified', color: 'bg-purple-100 text-purple-800' },
  { value: 'Follow-up Required', label: 'Follow-up Required', color: 'bg-orange-100 text-orange-800' },
  { value: 'Converted', label: 'Converted', color: 'bg-green-100 text-green-800' },
  { value: 'Lost', label: 'Lost', color: 'bg-red-100 text-red-800' },
];

const activityOptions = [
  { value: 'initial_contact', label: 'Initial Contact', icon: Phone },
  { value: 'email_sent', label: 'Email Sent', icon: Mail },
  { value: 'follow_up_call', label: 'Follow-up Call', icon: Phone },
  { value: 'meeting_scheduled', label: 'Meeting Scheduled', icon: Calendar },
  { value: 'meeting_completed', label: 'Meeting Completed', icon: Users },
  { value: 'proposal_sent', label: 'Proposal Sent', icon: MessageSquare },
  { value: 'negotiation', label: 'Negotiation', icon: MessageSquare },
  { value: 'closed_won', label: 'Closed Won', icon: CheckCircle },
  { value: 'closed_lost', label: 'Closed Lost', icon: XCircle },
  { value: 'on_hold', label: 'On Hold', icon: Clock },
];

export const ActivityStatusSelection: React.FC<ActivityStatusSelectionProps> = ({
  currentStatus,
  currentActivity,
  onStatusChange,
  onActivityChange,
}) => {
  const getStatusColor = (status: string) => {
    const statusConfig = statusOptions.find(s => s.value === status);
    return statusConfig?.color || 'bg-gray-100 text-gray-800';
  };

  const getCurrentActivityIcon = () => {
    const activity = activityOptions.find(a => a.value === currentActivity);
    return activity?.icon || MessageSquare;
  };

  const ActivityIcon = getCurrentActivityIcon();

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ActivityIcon className="h-5 w-5" />
          Status & Activity Management
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Contact Status</label>
            <Select value={currentStatus} onValueChange={onStatusChange}>
              <SelectTrigger>
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                {statusOptions.map(status => (
                  <SelectItem key={status.value} value={status.value}>
                    <div className="flex items-center gap-2">
                      <Badge className={status.color} variant="outline">
                        {status.label}
                      </Badge>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Current Activity</label>
            <Select value={currentActivity} onValueChange={onActivityChange}>
              <SelectTrigger>
                <SelectValue placeholder="Select activity" />
              </SelectTrigger>
              <SelectContent>
                {activityOptions.map(activity => {
                  const Icon = activity.icon;
                  return (
                    <SelectItem key={activity.value} value={activity.value}>
                      <div className="flex items-center gap-2">
                        <Icon className="h-4 w-4" />
                        {activity.label}
                      </div>
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="flex items-center gap-2 pt-2">
          <span className="text-sm text-gray-600">Current Status:</span>
          <Badge className={getStatusColor(currentStatus)} variant="outline">
            {currentStatus}
          </Badge>
          {currentActivity && (
            <>
              <span className="text-sm text-gray-600">•</span>
              <div className="flex items-center gap-1">
                <ActivityIcon className="h-3 w-3" />
                <span className="text-sm text-gray-600">
                  {activityOptions.find(a => a.value === currentActivity)?.label}
                </span>
              </div>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
