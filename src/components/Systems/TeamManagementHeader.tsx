
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { UserPlus, Edit3 } from 'lucide-react';
import { useTeamData } from '@/hooks/useTeamData';
import { useAuth } from '@/contexts/AuthContext';
import { InviteMemberDialog } from '@/components/TeamManagement/InviteMemberDialog';
import { EditTeamDialog } from '@/components/TeamManagement/EditTeamDialog';
import { Team } from '@/types/team';

interface TeamManagementHeaderProps {
  selectedTeam: Team | null;
  onTeamUpdated: () => void;
}

export const TeamManagementHeader: React.FC<TeamManagementHeaderProps> = ({
  selectedTeam,
  onTeamUpdated,
}) => {
  const [isInviteDialogOpen, setIsInviteDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const { canManageTeam, isTeamOwner } = useTeamData();
  const { user } = useAuth();

  if (!selectedTeam) {
    return null;
  }

  const canManageThisTeam = canManageTeam(selectedTeam.id);
  const isOwner = isTeamOwner(selectedTeam.id);

  const handleInvitationSent = () => {
    onTeamUpdated();
  };

  return (
    <div className="flex items-center justify-between mb-6">
      <div>
        <h3 className="text-lg font-semibold">{selectedTeam.name}</h3>
        <p className="text-sm text-gray-600">{selectedTeam.description}</p>
      </div>
      
      <div className="flex gap-2">
        {canManageThisTeam && (
          <Button
            onClick={() => setIsInviteDialogOpen(true)}
            size="sm"
          >
            <UserPlus className="h-4 w-4 mr-2" />
            Invite Member
          </Button>
        )}
        
        {isOwner && (
          <Button
            variant="outline"
            onClick={() => setIsEditDialogOpen(true)}
            size="sm"
          >
            <Edit3 className="h-4 w-4 mr-2" />
            Edit Team
          </Button>
        )}
      </div>

      {/* Dialogs */}
      {isOwner && (
        <EditTeamDialog
          open={isEditDialogOpen}
          onOpenChange={setIsEditDialogOpen}
          team={selectedTeam}
          onTeamUpdated={onTeamUpdated}
        />
      )}

      {canManageThisTeam && user && (
        <InviteMemberDialog
          open={isInviteDialogOpen}
          onOpenChange={setIsInviteDialogOpen}
          team={selectedTeam}
          user={user}
          onInvitationSent={handleInvitationSent}
        />
      )}
    </div>
  );
};
