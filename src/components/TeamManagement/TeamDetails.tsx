
import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { UserPlus, Users, Building, Mail, Phone, Globe, MapPin, CreditCard } from 'lucide-react';
import { Team, TeamMember, TeamInvitation } from '@/types/team';
import { useAuth } from '@/contexts/AuthContext';
import { useTeamData } from '@/hooks/useTeamData';
import { TeamMembers } from './TeamMembers';
import { EditTeamDialog } from './EditTeamDialog';
import { InviteMemberDialog } from './InviteMemberDialog';
import { PendingInvitations } from './PendingInvitations';

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
          {canManageThisTeam && (
            <Button onClick={() => setIsInviteDialogOpen(true)}>
              <UserPlus className="h-4 w-4 mr-2" />
              Invite Member
            </Button>
          )}
          {/* Only owners can edit team details */}
          {isOwner && (
            <Button variant="outline" onClick={() => setIsEditDialogOpen(true)}>
              Edit Team
            </Button>
          )}
        </div>
      </div>

      {/* Company Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building className="h-5 w-5" />
            Company Information
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {team.company_legal_name && (
              <div>
                <label className="text-sm font-medium text-gray-600">Legal Name</label>
                <p className="font-medium">{team.company_legal_name}</p>
              </div>
            )}
            {team.tax_id && (
              <div>
                <label className="text-sm font-medium text-gray-600">Tax ID</label>
                <p className="font-medium">{team.tax_id}</p>
              </div>
            )}
          </div>

          {(team.company_address || team.city || team.state || team.postal_code || team.country) && (
            <div>
              <label className="text-sm font-medium text-gray-600 flex items-center gap-1">
                <MapPin className="h-4 w-4" />
                Address
              </label>
              <div className="space-y-1">
                {team.company_address && <p>{team.company_address}</p>}
                <p>
                  {[team.city, team.state, team.postal_code, team.country]
                    .filter(Boolean)
                    .join(', ')}
                </p>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {team.company_email && (
              <div>
                <label className="text-sm font-medium text-gray-600 flex items-center gap-1">
                  <Mail className="h-4 w-4" />
                  Email
                </label>
                <p>{team.company_email}</p>
              </div>
            )}
            {team.company_phone && (
              <div>
                <label className="text-sm font-medium text-gray-600 flex items-center gap-1">
                  <Phone className="h-4 w-4" />
                  Phone
                </label>
                <p>{team.company_phone}</p>
              </div>
            )}
            {team.website && (
              <div>
                <label className="text-sm font-medium text-gray-600 flex items-center gap-1">
                  <Globe className="h-4 w-4" />
                  Website
                </label>
                <a href={team.website} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                  {team.website}
                </a>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Banking Information */}
      {(team.bank_name || team.bank_account || team.bank_account_holder || team.swift_code) && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              Banking Information
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {team.bank_name && (
                <div>
                  <label className="text-sm font-medium text-gray-600">Bank Name</label>
                  <p className="font-medium">{team.bank_name}</p>
                </div>
              )}
              {team.bank_account && (
                <div>
                  <label className="text-sm font-medium text-gray-600">Account Number</label>
                  <p className="font-medium">{team.bank_account}</p>
                </div>
              )}
              {team.bank_account_holder && (
                <div>
                  <label className="text-sm font-medium text-gray-600">Account Holder</label>
                  <p className="font-medium">{team.bank_account_holder}</p>
                </div>
              )}
              {team.swift_code && (
                <div>
                  <label className="text-sm font-medium text-gray-600">SWIFT Code</label>
                  <p className="font-medium">{team.swift_code}</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      <Separator />

      {/* Team Members */}
      <TeamMembers members={teamMembers} />

      {/* Pending Invitations - Only show to managers and owners */}
      {canManageThisTeam && (
        <PendingInvitations invitations={pendingInvitations} />
      )}

      {/* Dialogs */}
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
