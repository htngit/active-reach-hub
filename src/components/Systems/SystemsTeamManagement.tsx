
import React, { useState, useEffect } from 'react';
import { useTeamData } from '@/hooks/useTeamData';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Building2, Users } from 'lucide-react';
import { TeamManagementHeader } from './TeamManagementHeader';
import { TeamMembers } from '@/components/TeamManagement/TeamMembers';
import { PendingInvitations } from '@/components/TeamManagement/PendingInvitations';
import { Team, TeamMember, TeamInvitation } from '@/types/team';
import { supabase } from '@/integrations/supabase/client';

export const SystemsTeamManagement: React.FC = () => {
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [pendingInvitations, setPendingInvitations] = useState<TeamInvitation[]>([]);
  const [invitationRefreshKey, setInvitationRefreshKey] = useState(0);
  const { user } = useAuth();
  const { teams, loading, refetch, canManageTeam } = useTeamData();

  // Set first team as default
  useEffect(() => {
    if (teams && teams.length > 0 && !selectedTeam) {
      setSelectedTeam(teams[0]);
    }
  }, [teams, selectedTeam]);

  // Fetch team members when team changes
  useEffect(() => {
    if (selectedTeam) {
      fetchTeamMembers();
    }
  }, [selectedTeam]);

  // Fetch pending invitations when team changes
  useEffect(() => {
    if (selectedTeam && canManageTeam(selectedTeam.id)) {
      fetchPendingInvitations();
    }
  }, [selectedTeam, canManageTeam, invitationRefreshKey]);

  const fetchTeamMembers = async () => {
    if (!selectedTeam) return;

    const { data, error } = await supabase
      .from('team_members')
      .select('*')
      .eq('team_id', selectedTeam.id);

    if (error) {
      console.error('Error fetching team members:', error);
    } else {
      setTeamMembers(data || []);
    }
  };

  const fetchPendingInvitations = async () => {
    if (!selectedTeam || !canManageTeam(selectedTeam.id)) return;

    const { data, error } = await supabase
      .from('team_invitations')
      .select('*')
      .eq('team_id', selectedTeam.id)
      .is('used_at', null)
      .gt('expires_at', new Date().toISOString());

    if (error) {
      console.error('Error fetching pending invitations:', error);
    } else {
      setPendingInvitations(data || []);
    }
  };

  const handleTeamUpdated = () => {
    refetch();
    fetchTeamMembers();
    setInvitationRefreshKey(prev => prev + 1);
  };

  if (loading) {
    return <div className="p-4">Loading teams...</div>;
  }

  if (teams.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <Building2 className="h-12 w-12 text-gray-400 mb-4" />
          <h3 className="text-lg font-semibold text-gray-600 mb-2">No Teams Found</h3>
          <p className="text-gray-500 text-center">
            You don't have access to any teams. Create a team or ask to be invited to one.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Team Selector */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            Select Team
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Select 
            value={selectedTeam?.id || ''} 
            onValueChange={(value) => {
              const team = teams.find(t => t.id === value);
              setSelectedTeam(team || null);
            }}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select a team to manage" />
            </SelectTrigger>
            <SelectContent>
              {teams.map(team => (
                <SelectItem key={team.id} value={team.id}>
                  {team.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {/* Team Management Actions */}
      {selectedTeam && (
        <TeamManagementHeader
          selectedTeam={selectedTeam}
          onTeamUpdated={handleTeamUpdated}
        />
      )}

      {/* Team Members */}
      {selectedTeam && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Team Members
            </CardTitle>
          </CardHeader>
          <CardContent>
            <TeamMembers members={teamMembers} />
          </CardContent>
        </Card>
      )}

      {/* Pending Invitations */}
      {selectedTeam && canManageTeam(selectedTeam.id) && (
        <Card>
          <CardHeader>
            <CardTitle>Pending Invitations</CardTitle>
          </CardHeader>
          <CardContent>
            <PendingInvitations invitations={pendingInvitations} />
          </CardContent>
        </Card>
      )}
    </div>
  );
};
