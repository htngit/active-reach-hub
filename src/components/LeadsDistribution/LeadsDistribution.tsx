import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Users, TrendingUp, Target, BarChart3, UserPlus, Filter, RefreshCw } from 'lucide-react';
import { useTeamData } from '@/hooks/useTeamData';
import { useAuth } from '@/contexts/AuthContext';
import { useCachedContacts } from '@/hooks/useCachedContacts';
import { supabase } from '@/integrations/supabase/client';

export const LeadsDistribution: React.FC = () => {
  const { teams, teamMembers, getTeamMemberNames } = useTeamData();
  const { user } = useAuth();
  const { contacts, refetch: refetchContacts } = useCachedContacts();
  const [selectedTeam, setSelectedTeam] = useState<string>('');
  const [refreshing, setRefreshing] = useState(false);
  const [qualificationData, setQualificationData] = useState<any[]>([]);

  // Fetch qualification criteria data
  const fetchQualificationData = async () => {
    try {
      const { data, error } = await supabase
        .from('qualification_criteria')
        .select('contact_id, qualification_score');

      if (error) {
        console.error('Error fetching qualification data:', error);
        return;
      }

      setQualificationData(data || []);
    } catch (error) {
      console.error('Error fetching qualification data:', error);
    }
  };

  // Function to manually refresh the contacts data
  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await refetchContacts();
      await fetchQualificationData();
    } finally {
      setRefreshing(false);
    }
  };

  // Auto-refresh on mount to ensure latest data
  useEffect(() => {
    refetchContacts();
    fetchQualificationData();
  }, [refetchContacts]);

  // Helper function to check if a contact is qualified based on BANT score
  const isContactQualifiedByBANT = (contactId: string) => {
    const qualificationRecord = qualificationData.find(q => q.contact_id === contactId);
    return qualificationRecord ? qualificationRecord.qualification_score >= 75 : false;
  };

  // Function to get leads distribution stats
  const getLeadsStats = () => {
    const totalContacts = contacts.length;
    const newLeads = contacts.filter(c => c.status === 'New').length;
    
    // Count qualified leads based on BANT qualification score (75% or higher)
    const qualifiedLeads = contacts.filter(c => isContactQualifiedByBANT(c.id)).length;
    
    const convertedLeads = contacts.filter(c => c.status === 'Converted').length;

    console.log('Contacts breakdown:', {
      total: totalContacts,
      new: newLeads,
      qualified: qualifiedLeads,
      converted: convertedLeads,
      qualificationData: qualificationData.length
    });

    return {
      total: totalContacts,
      new: newLeads,
      qualified: qualifiedLeads,
      converted: convertedLeads,
      conversionRate: totalContacts > 0 ? ((convertedLeads / totalContacts) * 100).toFixed(1) : '0'
    };
  };

  const stats = getLeadsStats();

  const getTeamMembersData = (teamId: string) => {
    if (!teamId) return [];
    
    const members = getTeamMemberNames(teamId);
    return members.map(member => {
      const memberContacts = contacts.filter(c => c.owner_id === member.id);
      const newLeads = memberContacts.filter(c => c.status === 'New').length;
      
      // Count qualified leads based on BANT qualification score
      const qualified = memberContacts.filter(c => isContactQualifiedByBANT(c.id)).length;
      
      const converted = memberContacts.filter(c => c.status === 'Converted').length;
      
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

  // Mock data for leads distribution stats
  const getRoleColor = (role: string) => {
    switch (role) {
      case 'owner':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'manager':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'member':
        return 'bg-gray-100 text-gray-800 border-gray-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
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
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Leads</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
            <p className="text-xs text-muted-foreground">All contacts in system</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">New Leads</CardTitle>
            <UserPlus className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.new}</div>
            <p className="text-xs text-muted-foreground">Unprocessed leads</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Qualified Leads</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.qualified}</div>
            <p className="text-xs text-muted-foreground">BANT score ≥ 75%</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Conversion Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.conversionRate}%</div>
            <p className="text-xs text-muted-foreground">Overall performance</p>
          </CardContent>
        </Card>
      </div>

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
                    View how leads are distributed among your team members (Qualified = BANT score ≥ 75%)
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
                <div className="space-y-4">
                  {getTeamMembersData(selectedTeam).map(member => (
                    <div key={member.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <div>
                          <p className="font-medium">{member.name}</p>
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className={getRoleColor(member.role)}>
                              {member.role}
                            </Badge>
                          </div>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-4 gap-4 text-center">
                        <div>
                          <p className="text-sm text-gray-600">Total</p>
                          <p className="font-bold">{member.totalLeads}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">New</p>
                          <p className="font-bold text-blue-600">{member.newLeads}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">Qualified</p>
                          <p className="font-bold text-green-600">{member.qualified}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">Converted</p>
                          <p className="font-bold text-purple-600">{member.converted}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                  
                  {getTeamMembersData(selectedTeam).length === 0 && (
                    <div className="text-center py-8">
                      <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-500">No team members found</p>
                    </div>
                  )}
                </div>
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

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h4 className="font-medium text-blue-900 mb-2 flex items-center gap-2">
          <Target className="h-4 w-4" />
          Lead Distribution Tips
        </h4>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>• Distribute leads evenly among team members for optimal performance</li>
          <li>• Monitor BANT qualification scores to identify high-quality leads</li>
          <li>• Qualified leads are automatically identified when BANT score reaches 75%</li>
          <li>• Use team insights to improve lead qualification processes</li>
          <li>• Regular follow-up increases conversion rates significantly</li>
        </ul>
      </div>
    </div>
  );
};
