
import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Users, BarChart3 } from 'lucide-react';
import { useTeamData } from '@/hooks/useTeamData';
import { useLeadsStats } from '@/hooks/useLeadsStats';
import { useTeamMembersData } from '@/hooks/useTeamMembersData';
import { LeadsStatsCards } from './LeadsStatsCards';
import { LeadsDistributionHeader } from './LeadsDistributionHeader';
import { TeamDistributionTab } from './TeamDistributionTab';
import { PerformanceAnalyticsTab } from './PerformanceAnalyticsTab';
import { LeadsDistributionTips } from './LeadsDistributionTips';

export const LeadsDistribution: React.FC = () => {
  const { teams } = useTeamData();
  const { refreshing, handleRefresh, getLeadsStats } = useLeadsStats();
  const { getTeamMembersData } = useTeamMembersData();
  const [selectedTeam, setSelectedTeam] = useState<string>('');

  const stats = getLeadsStats();
  const teamMembers = getTeamMembersData(selectedTeam);

  return (
    <div className="space-y-6">
      <LeadsDistributionHeader
        refreshing={refreshing}
        onRefresh={handleRefresh}
      />

      {/* Overall Stats */}
      <LeadsStatsCards stats={stats} />

      <Tabs defaultValue="team-distribution" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="team-distribution" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Team Distribution
          </TabsTrigger>
          <TabsTrigger value="performance" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Performance Analytics
          </TabsTrigger>
        </TabsList>

        <TabsContent value="team-distribution">
          <TeamDistributionTab
            teams={teams}
            selectedTeam={selectedTeam}
            onTeamSelect={setSelectedTeam}
            teamMembers={teamMembers}
          />
        </TabsContent>

        <TabsContent value="performance">
          <PerformanceAnalyticsTab />
        </TabsContent>
      </Tabs>

      <LeadsDistributionTips />
    </div>
  );
};
