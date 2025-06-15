
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { UserPlus, Edit, MoreHorizontal, Trash2 } from 'lucide-react';
import { Team } from '@/types/team';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

interface TeamHeaderProps {
  team: Team;
  onBack: () => void;
  canManageTeam: boolean;
  isOwner: boolean;
  onInviteClick: () => void;
  onEditClick: () => void;
  onTeamDeleted?: () => void;
}

export const TeamHeader: React.FC<TeamHeaderProps> = ({
  team,
  onBack,
  canManageTeam,
  isOwner,
  onInviteClick,
  onEditClick,
  onTeamDeleted,
}) => {
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Show actions dropdown if user can invite OR edit OR delete
  const showActions = canManageTeam || isOwner;

  const handleDeleteTeam = async () => {
    if (!isOwner) return;

    setIsDeleting(true);
    try {
      // Delete team members first
      const { error: membersError } = await supabase
        .from('team_members')
        .delete()
        .eq('team_id', team.id);

      if (membersError) throw membersError;

      // Delete team invitations
      const { error: invitationsError } = await supabase
        .from('team_invitations')
        .delete()
        .eq('team_id', team.id);

      if (invitationsError) throw invitationsError;

      // Delete the team
      const { error: teamError } = await supabase
        .from('teams')
        .delete()
        .eq('id', team.id);

      if (teamError) throw teamError;

      toast({
        title: "Success",
        description: "Team deleted successfully",
      });

      // Call onTeamDeleted callback to refresh the parent component
      if (onTeamDeleted) {
        onTeamDeleted();
      } else {
        onBack();
      }
    } catch (error: any) {
      console.error('Error deleting team:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to delete team",
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
      setShowDeleteDialog(false);
    }
  };

  return (
    <>
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
              {/* Only owners can delete team */}
              {isOwner && (
                <DropdownMenuItem 
                  onClick={() => setShowDeleteDialog(true)}
                  className="text-red-600 focus:text-red-600"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete Team
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Team</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{team.name}"? This action cannot be undone. 
              All team members, invitations, and associated data will be permanently deleted.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteTeam}
              disabled={isDeleting}
              className="bg-red-600 hover:bg-red-700"
            >
              {isDeleting ? 'Deleting...' : 'Delete Team'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};
