import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Separator } from '@/components/ui/separator';
import { Team, TeamMember, TeamInvitation } from '@/types/team';
import { useAuth } from '@/contexts/AuthContext';
import { useTeamData } from '@/hooks/useTeamData';
import { TeamMembers } from './TeamMembers';
import { EditTeamDialog } from './EditTeamDialog';
import { InviteMemberDialog } from './InviteMemberDialog';
import { PendingInvitations } from './PendingInvitations';
import { CompanyInformation } from './CompanyInformation';
import { BankingInformation } from './BankingInformation';
import { TeamHeader } from './TeamHeader';

interface TeamDetailsProps {
  team: Team;
  onBack: () => void;
  onTeamUpdated: () => void;
}

export const TeamDetails: React.FC<TeamDetailsProps> = ({
  team,
  onBack,
  onTeamUpdated,
}) => {
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isInviteDialogOpen, setIsInviteDialogOpen] = useState(false);
  const [invitationRefreshKey, setInvitationRefreshKey] = useState(0);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [pendingInvitations, setPendingInvitations] = useState<TeamInvitation[]>([]);
  const { user } = useAuth();
  const { canManageTeam, isTeamOwner } = useTeamData();

  const canManageThisTeam = canManageTeam(team.id);
  const isOwner = isTeamOwner(team.id);

  // Fetch team members
  useEffect(() => {
    const fetchTeamMembers = async () => {
      const { data, error } = await supabase
        .from('team_members')
        .select('*')
        .eq('team_id', team.id);

      if (error) {
        console.error('Error fetching team members:', error);
      } else {
        setTeamMembers(data || []);
      }
    };

    fetchTeamMembers();
  }, [team.id]);

  // Fetch pending invitations
  useEffect(() => {
    const fetchPendingInvitations = async () => {
      if (!canManageThisTeam) return;

      const { data, error } = await supabase
        .from('team_invitations')
        .select('*')
        .eq('team_id', team.id)
        .is('used_at', null)
        .gt('expires_at', new Date().toISOString());

      if (error) {
        console.error('Error fetching pending invitations:', error);
      } else {
        setPendingInvitations(data || []);
      }
    };

    fetchPendingInvitations();
  }, [team.id, canManageThisTeam, invitationRefreshKey]);

  const handleInvitationSent = () => {
    setInvitationRefreshKey(prev => prev + 1);
    onTeamUpdated();
  };

  return (
    <div className="space-y-6">
      <TeamHeader
        team={team}
        onBack={onBack}
        canManageTeam={canManageThisTeam}
        isOwner={isOwner}
        onInviteClick={() => setIsInviteDialogOpen(true)}
        onEditClick={() => setIsEditDialogOpen(true)}
      />

      <CompanyInformation team={team} />

      <BankingInformation team={team} />

      <Separator />

      <TeamMembers members={teamMembers} />

      {canManageThisTeam && (
        <PendingInvitations invitations={pendingInvitations} />
      )}

      {isOwner && (
        <EditTeamDialog
          open={isEditDialogOpen}
          onOpenChange={setIsEditDialogOpen}
          team={team}
          onTeamUpdated={onTeamUpdated}
        />
      )}

      {canManageThisTeam && user && (
        <InviteMemberDialog
          open={isInviteDialogOpen}
          onOpenChange={setIsInviteDialogOpen}
          team={team}
          user={user}
          onInvitationSent={handleInvitationSent}
        />
      )}
    </div>
  );
};
