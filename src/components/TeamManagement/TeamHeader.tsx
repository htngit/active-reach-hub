
import React from 'react';
import { Button } from '@/components/ui/button';
import { UserPlus } from 'lucide-react';
import { Team } from '@/types/team';

interface TeamHeaderProps {
  team: Team;
  onBack: () => void;
  canManageTeam: boolean;
  isOwner: boolean;
  onInviteClick: () => void;
  onEditClick: () => void;
}

export const TeamHeader: React.FC<TeamHeaderProps> = ({
  team,
  onBack,
  canManageTeam,
  isOwner,
  onInviteClick,
  onEditClick,
}) => {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center space-x-4">
        <Button variant="outline" onClick={onBack}>
          ← Back to Teams
        </Button>
        <div>
          <h1 className="text-2xl font-bold">{team.name}</h1>
          <p className="text-gray-600">{team.description}</p>
        </div>
      </div>
      <div className="flex space-x-2">
        {/* Managers and owners can invite members */}
        {canManageTeam && (
          <Button onClick={onInviteClick}>
            <UserPlus className="h-4 w-4 mr-2" />
            Invite Member
          </Button>
        )}
        {/* Only owners can edit team details */}
        {isOwner && (
          <Button variant="outline" onClick={onEditClick}>
            Edit Team
          </Button>
        )}
      </div>
    </div>
  );
};
