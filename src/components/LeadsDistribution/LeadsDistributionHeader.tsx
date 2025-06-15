
import React from 'react';
import { Button } from '@/components/ui/button';
import { HoverCard, HoverCardContent, HoverCardTrigger } from '@/components/ui/hover-card';
import { Target, RefreshCw, Info } from 'lucide-react';

interface LeadsDistributionHeaderProps {
  refreshing: boolean;
  onRefresh: () => void;
}

export const LeadsDistributionHeader: React.FC<LeadsDistributionHeaderProps> = ({
  refreshing,
  onRefresh
}) => {
  return (
    <div className="flex items-center gap-3">
      <Target className="h-8 w-8" />
      <div className="flex-1">
        <div className="flex items-center gap-2">
          <h1 className="text-3xl font-bold">Leads Distribution</h1>
          <HoverCard>
            <HoverCardTrigger asChild>
              <Button variant="ghost" size="sm" className="h-6 w-6 p-0 hover:bg-gray-100">
                <Info className="h-4 w-4 text-gray-500 hover:text-gray-700" />
              </Button>
            </HoverCardTrigger>
            <HoverCardContent className="w-80">
              <div className="space-y-2">
                <h4 className="text-sm font-semibold">Lead Distribution Metrics</h4>
                <div className="text-sm text-gray-600 space-y-1">
                  <p><strong>Qualified:</strong> Engagements with BANT score ≥ 75%</p>
                  <p><strong>Converted:</strong> Contacts with "Converted" status or validated by paid invoice</p>
                  <p><strong>Attribution:</strong> All metrics are attributed to the contact owner, regardless of who performs the actions</p>
                </div>
              </div>
            </HoverCardContent>
          </HoverCard>
        </div>
        <p className="text-gray-600">Track and manage lead distribution across your team</p>
      </div>
      <Button
        onClick={onRefresh}
        disabled={refreshing}
        variant="outline"
        size="sm"
        className="flex items-center gap-2"
      >
        <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
        {refreshing ? 'Refreshing...' : 'Refresh Data'}
      </Button>
    </div>
  );
};
