
import React from 'react';
import { Button } from '@/components/ui/button';
import { UserPlus, Edit, MoreHorizontal } from 'lucide-react';
import { Team } from '@/types/team';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

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
  // Show actions dropdown if user can invite OR edit
  const showActions = canManageTeam || isOwner;

  return (
    <div className="flex items-center justify-between">
      <div>
        <h1 className="text-2xl font-bold">{team.name}</h1>
        <p className="text-gray-600">{team.description}</p>
      </div>
      
      {showActions && (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline">
              <MoreHorizontal className="h-4 w-4 mr-2" />
              Actions
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {/* Managers and owners can invite members */}
            {canManageTeam && (
              <DropdownMenuItem onClick={onInviteClick}>
                <UserPlus className="h-4 w-4 mr-2" />
                Invite Member
              </DropdownMenuItem>
            )}
            {/* Only owners can edit team details */}
            {isOwner && (
              <DropdownMenuItem onClick={onEditClick}>
                <Edit className="h-4 w-4 mr-2" />
                Edit Team
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      )}
    </div>
  );
};
