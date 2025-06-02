
import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Edit, Trash2, UserPlus } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { EditTeamDialog } from './EditTeamDialog';
import { InviteMemberDialog } from './InviteMemberDialog';
import { TeamMembers } from './TeamMembers';
import { PendingInvitations } from './PendingInvitations';

interface Team {
  id: string;
  name: string;
  description?: string;
  owner_id: string;
  created_at: string;
  updated_at: string;
}

interface TeamMember {
  id: string;
  team_id: string;
  user_id: string;
  role: string;
  joined_at: string;
}

interface TeamInvitation {
  id: string;
  team_id: string;
  email: string;
  token: string;
  expires_at: string;
  used_at?: string;
  created_at: string;
}

interface TeamDetailsProps {
  team: Team;
  user: any;
  onTeamUpdated: () => void;
  onTeamDeleted: () => void;
}

export const TeamDetails: React.FC<TeamDetailsProps> = ({
  team,
  user,
  onTeamUpdated,
  onTeamDeleted
}) => {
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [invitations, setInvitations] = useState<TeamInvitation[]>([]);
  const [showEditForm, setShowEditForm] = useState(false);
  const [showInviteForm, setShowInviteForm] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (team) {
      fetchTeamData();
    }
  }, [team]);

  const fetchTeamData = async () => {
    setLoading(true);
    try {
      await Promise.all([
        fetchTeamMembers(),
        fetchTeamInvitations()
      ]);
    } catch (error) {
      console.error('Error fetching team data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchTeamMembers = async () => {
    try {
      const { data, error } = await supabase
        .from('team_members')
        .select('*')
        .eq('team_id', team.id);

      if (error) throw error;
      setMembers(data || []);
    } catch (error: any) {
      console.error('Error fetching team members:', error);
    }
  };

  const fetchTeamInvitations = async () => {
    try {
      const { data, error } = await supabase
        .from('team_invitations')
        .select('*')
        .eq('team_id', team.id)
        .is('used_at', null)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setInvitations(data || []);
    } catch (error: any) {
      console.error('Error fetching team invitations:', error);
    }
  };

  const handleDeleteTeam = async () => {
    if (!confirm('Are you sure you want to delete this team? This action cannot be undone.')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('teams')
        .delete()
        .eq('id', team.id);

      if (error) throw error;
      onTeamDeleted();
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to delete team",
        variant: "destructive",
      });
    }
  };

  const handleInvitationSent = () => {
    fetchTeamInvitations();
    toast({
      title: "Success",
      description: "Invitation sent successfully",
    });
  };

  const isOwner = team.owner_id === user?.id;

  if (loading) {
    return <div className="p-4">Loading team details...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Team Info */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>{team.name}</CardTitle>
              {team.description && (
                <p className="text-gray-600 mt-1">{team.description}</p>
              )}
            </div>
            {isOwner && (
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowEditForm(true)}
                >
                  <Edit className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleDeleteTeam}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <div className="text-sm">
              <span className="font-medium">Created:</span>{' '}
              {new Date(team.created_at).toLocaleDateString()}
            </div>
            <div className="text-sm">
              <span className="font-medium">Members:</span> {members.length}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Team Members */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Team Members</CardTitle>
            {isOwner && (
              <Button size="sm" onClick={() => setShowInviteForm(true)}>
                <UserPlus className="h-4 w-4 mr-2" />
                Invite Member
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <TeamMembers members={members} />
        </CardContent>
      </Card>

      {/* Pending Invitations */}
      {isOwner && invitations.length > 0 && (
        <PendingInvitations invitations={invitations} />
      )}

      {/* Dialogs */}
      <EditTeamDialog
        open={showEditForm}
        onOpenChange={setShowEditForm}
        team={team}
        onTeamUpdated={() => {
          setShowEditForm(false);
          onTeamUpdated();
        }}
      />

      <InviteMemberDialog
        open={showInviteForm}
        onOpenChange={setShowInviteForm}
        team={team}
        user={user}
        onInvitationSent={() => {
          setShowInviteForm(false);
          handleInvitationSent();
        }}
      />
    </div>
  );
};
