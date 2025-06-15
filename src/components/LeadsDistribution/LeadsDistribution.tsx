
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Users, Target, BarChart3, Filter, RefreshCw } from 'lucide-react';
import { useTeamData } from '@/hooks/useTeamData';
import { useAuth } from '@/contexts/AuthContext';
import { useLeadsStats } from '@/hooks/useLeadsStats';
import { LeadsStatsCards } from './LeadsStatsCards';
import { TeamMembersList } from './TeamMembersList';
import { LeadsDistributionTips } from './LeadsDistributionTips';

export const LeadsDistribution: React.FC = () => {
  const { teams, getTeamMemberNames } = useTeamData();
  const { user } = useAuth();
  const {
    contacts,
    engagementData,
    conversionData,
    refreshing,
    handleRefresh,
    isEngagementQualified,
    isConversionValidated,
    getLeadsStats
  } = useLeadsStats();
  const [selectedTeam, setSelectedTeam] = useState<string>('');

  const stats = getLeadsStats();

  const getTeamMembersData = (teamId: string) => {
    if (!teamId) return [];
    
    const members = getTeamMemberNames(teamId);
    return members.map(member => {
      const memberContacts = contacts.filter(c => c.owner_id === member.id || c.user_id === member.id);
      const newLeads = memberContacts.filter(c => c.status === 'New').length;
      
      // Count qualified engagements for this member's contacts
      const memberEngagements = engagementData.filter(engagement => 
        memberContacts.some(contact => contact.id === engagement.contact_id)
      );
      const qualified = memberEngagements.filter(engagement => 
        isEngagementQualified(engagement.id)
      ).length;
      
      // Count validated conversions for this member's contacts
      const memberConversions = conversionData.filter(conversion => 
        memberEngagements.some(engagement => engagement.id === conversion.engagement_id)
      );
      const converted = memberConversions.filter(conversion => 
        isConversionValidated(conversion.id)
      ).length;
      
      return {
        ...member,
        totalLeads: memberContacts.length,
        newLeads,
        qualified,
        converted,
        conversionRate: memberContacts.length > 0 ? ((converted / memberContacts.length) * 100).toFixed(1) : '0'
      };
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Target className="h-8 w-8" />
        <div className="flex-1">
          <h1 className="text-3xl font-bold">Leads Distribution</h1>
          <p className="text-gray-600">Track and manage lead distribution across your team</p>
        </div>
        <Button
          onClick={handleRefresh}
          disabled={refreshing}
          variant="outline"
          size="sm"
          className="flex items-center gap-2"
        >
          <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
          {refreshing ? 'Refreshing...' : 'Refresh Data'}
        </Button>
      </div>

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
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    Lead Distribution by Team
                  </CardTitle>
                  <CardDescription>
                    View how leads are distributed among your team members (Qualified = BANT score ≥ 75%, Converted = Validated by paid invoice)
                  </CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <Filter className="h-4 w-4 text-gray-500" />
                  <Select value={selectedTeam} onValueChange={setSelectedTeam}>
                    <SelectTrigger className="w-48">
                      <SelectValue placeholder="Select team" />
                    </SelectTrigger>
                    <SelectContent>
                      {teams.map(team => (
                        <SelectItem key={team.id} value={team.id}>
                          {team.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {selectedTeam ? (
                <TeamMembersList teamMembers={getTeamMembersData(selectedTeam)} />
              ) : (
                <div className="text-center py-8">
                  <Target className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">Select a team to view lead distribution</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="performance">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Performance Analytics
              </CardTitle>
              <CardDescription>
                Detailed performance metrics and conversion analytics
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12">
                <BarChart3 className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-600 mb-2">Analytics Coming Soon</h3>
                <p className="text-gray-500">
                  Advanced performance analytics and detailed reporting will be available here
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <LeadsDistributionTips />
    </div>
  );
};
