
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Team, TeamMember } from '@/types/team';

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
      console.log('Fetching teams and members...');
      
      const { data, error } = await supabase.functions.invoke('get-user-teams');

      if (error) {
        console.error('Error fetching team data:', error);
        // Set empty arrays instead of throwing to prevent UI breaks
        setTeams([]);
        setTeamMembers([]);
        return;
      }

      console.log('Team data received:', data);
      setTeams(data.teams || []);
      setTeamMembers(data.teamMembers || []);
    } catch (error) {
      console.error('Error fetching team data:', error);
      // Set empty arrays instead of throwing to prevent UI breaks
      setTeams([]);
      setTeamMembers([]);
    } finally {
      setLoading(false);
    }
  };

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
    teams,
    teamMembers,
    loading,
    getTeamMembers,
    getTeamMemberNames,
    refetch: fetchTeamsAndMembers
  };
};
