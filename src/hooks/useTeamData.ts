
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface TeamMember {
  id: string;
  team_id: string;
  user_id: string;
  role: string;
  joined_at: string;
}

interface Team {
  id: string;
  name: string;
  description?: string;
  owner_id: string;
}

export const useTeamData = () => {
  const [teams, setTeams] = useState<Team[]>([]);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      fetchTeamsAndMembers();
    }
  }, [user]);

  const fetchTeamsAndMembers = async () => {
    if (!user) return;

    try {
      // Fetch teams where user is a member
      const { data: teams, error: teamsError } = await supabase
        .from('teams')
        .select('*');

      if (teamsError) throw teamsError;

      // Fetch all team members for these teams
      const { data: members, error: membersError } = await supabase
        .from('team_members')
        .select('*');

      if (membersError) throw membersError;

      setTeams(teams || []);
      setTeamMembers(members || []);
    } catch (error) {
      console.error('Error fetching team data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Get teams where current user is a member
  const userTeams = teams.filter(team => 
    teamMembers.some(member => 
      member.team_id === team.id && member.user_id === user?.id
    )
  );

  // Get team members for a specific team
  const getTeamMembers = (teamId: string) => {
    return teamMembers.filter(member => member.team_id === teamId);
  };

  // Get team member names (simplified - in real app you'd join with profiles)
  const getTeamMemberNames = (teamId: string) => {
    const members = getTeamMembers(teamId);
    return members.map(member => ({
      id: member.user_id,
      name: `User ${member.user_id.substring(0, 8)}...`, // Simplified name
      role: member.role
    }));
  };

  return {
    teams: userTeams,
    teamMembers,
    loading,
    getTeamMembers,
    getTeamMemberNames,
    refetch: fetchTeamsAndMembers
  };
};
