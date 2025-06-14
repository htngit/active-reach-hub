
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Team, TeamMember } from '@/types/team';
import { useUserData } from './useUserData';

export const useTeamData = () => {
  const [teams, setTeams] = useState<Team[]>([]);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { getUserNameById, fetchMultipleUsers } = useUserData();

  useEffect(() => {
    if (user) {
      fetchTeamsAndMembers();
    }
  }, [user]);

  const fetchTeamsAndMembers = async () => {
    if (!user) return;

    try {
      console.log('Fetching teams and members...');
      
      // Fetch teams where user is owner
      const { data: ownedTeams, error: ownedTeamsError } = await supabase
        .from('teams')
        .select('*')
        .eq('owner_id', user.id);

      if (ownedTeamsError) {
        console.error('Error fetching owned teams:', ownedTeamsError);
      }

      // Fetch teams where user is a member
      const { data: memberTeams, error: memberTeamsError } = await supabase
        .from('team_members')
        .select('team_id, teams(*)')
        .eq('user_id', user.id);

      if (memberTeamsError) {
        console.error('Error fetching member teams:', memberTeamsError);
      }

      // Combine owned and member teams
      const allTeams: Team[] = [
        ...(ownedTeams || []),
        ...(memberTeams?.map(mt => mt.teams).filter(Boolean) || [])
      ];

      // Remove duplicates by team id
      const uniqueTeams = allTeams.filter((team, index, self) => 
        team && index === self.findIndex(t => t.id === team.id)
      );

      console.log('All accessible teams:', uniqueTeams);
      setTeams(uniqueTeams);

      // Fetch all team members for these teams
      if (uniqueTeams.length > 0) {
        const teamIds = uniqueTeams.map(team => team.id);
        const { data: allMembers, error: membersError } = await supabase
          .from('team_members')
          .select('*')
          .in('team_id', teamIds);

        if (membersError) {
          console.error('Error fetching team members:', membersError);
          setTeamMembers([]);
        } else {
          console.log('Team members data:', allMembers);
          setTeamMembers(allMembers || []);
          
          // Pre-fetch user data for all team members
          if (allMembers && allMembers.length > 0) {
            const userIds = allMembers.map(member => member.user_id);
            fetchMultipleUsers(userIds);
          }
        }
      } else {
        setTeamMembers([]);
      }
    } catch (error) {
      console.error('Error fetching team data:', error);
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

  // Get team member names using the useUserData hook
  const getTeamMemberNames = useCallback((teamId: string) => {
    const members = getTeamMembers(teamId);
    return members.map(member => ({
      id: member.user_id,
      name: getUserNameById(member.user_id),
      role: member.role
    }));
  }, [teamMembers, getUserNameById]);

  // Check if user is a team owner
  const isTeamOwner = useCallback((teamId: string) => {
    if (!user || !teams.length) return false;
    const team = teams.find(t => t.id === teamId);
    return team ? team.owner_id === user.id : false;
  }, [user, teams]);

  return {
    teams,
    teamMembers,
    loading,
    getTeamMembers,
    getTeamMemberNames,
    refetch: fetchTeamsAndMembers,
    isTeamOwner
  };
};
