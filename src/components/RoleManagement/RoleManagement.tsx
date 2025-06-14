
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Users, Shield, User, Crown } from 'lucide-react';
import { useTeamData } from '@/hooks/useTeamData';
import { useAuth } from '@/contexts/AuthContext';
import { useUserData } from '@/hooks/useUserData';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

export const RoleManagement: React.FC = () => {
  const { teams, teamMembers, loading, refetch } = useTeamData();
  const { user } = useAuth();
  const { getUserNameById } = useUserData();
  const { toast } = useToast();
  const [selectedTeam, setSelectedTeam] = useState<string>('');
  const [updatingRoles, setUpdatingRoles] = useState<Set<string>>(new Set());

  const ownedTeams = teams.filter(team => team.owner_id === user?.id);

  const getTeamMembersForTeam = (teamId: string) => {
    return teamMembers.filter(member => member.team_id === teamId);
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'owner':
        return <Crown className="h-4 w-4" />;
      case 'manager':
        return <Shield className="h-4 w-4" />;
      case 'member':
        return <User className="h-4 w-4" />;
      default:
        return <User className="h-4 w-4" />;
    }
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'owner':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'manager':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'member':
        return 'bg-gray-100 text-gray-800 border-gray-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const updateMemberRole = async (memberId: string, newRole: string) => {
    if (!user) return;

    setUpdatingRoles(prev => new Set([...prev, memberId]));

    try {
      const { error } = await supabase
        .from('team_members')
        .update({ role: newRole })
        .eq('id', memberId);

      if (error) throw error;

      await refetch();
      
      toast({
        title: 'Success',
        description: 'Member role updated successfully',
      });
    } catch (err: any) {
      console.error('Error updating member role:', err);
      toast({
        title: 'Error',
        description: err.message || 'Failed to update member role',
        variant: 'destructive',
      });
    } finally {
      setUpdatingRoles(prev => {
        const newSet = new Set(prev);
        newSet.delete(memberId);
        return newSet;
      });
    }
  };

  if (loading) {
    return <div className="p-6">Loading teams...</div>;
  }

  if (ownedTeams.length === 0) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <Users className="h-8 w-8" />
          <div>
            <h1 className="text-3xl font-bold">Role Management</h1>
            <p className="text-gray-600">Manage team member roles and permissions</p>
          </div>
        </div>
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Users className="h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-semibold text-gray-600 mb-2">No Teams to Manage</h3>
            <p className="text-gray-500 text-center">
              You don't own any teams. Only team owners can manage member roles.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Users className="h-8 w-8" />
        <div>
          <h1 className="text-3xl font-bold">Role Management</h1>
          <p className="text-gray-600">Manage team member roles and permissions</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Select Team</CardTitle>
        </CardHeader>
        <CardContent>
          <Select value={selectedTeam} onValueChange={setSelectedTeam}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select a team to manage" />
            </SelectTrigger>
            <SelectContent>
              {ownedTeams.map(team => (
                <SelectItem key={team.id} value={team.id}>
                  {team.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {selectedTeam && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Team Members
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {getTeamMembersForTeam(selectedTeam).map(member => (
                <div key={member.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-full ${getRoleBadgeColor(member.role)}`}>
                      {getRoleIcon(member.role)}
                    </div>
                    <div>
                      <p className="font-medium">{getUserNameById(member.user_id)}</p>
                      <p className="text-sm text-gray-600">
                        Joined {new Date(member.joined_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <Badge variant="outline" className={getRoleBadgeColor(member.role)}>
                      {member.role}
                    </Badge>
                    
                    {member.role !== 'owner' && (
                      <Select
                        value={member.role}
                        onValueChange={(newRole) => updateMemberRole(member.id, newRole)}
                        disabled={updatingRoles.has(member.id)}
                      >
                        <SelectTrigger className="w-32">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="member">Member</SelectItem>
                          <SelectItem value="manager">Manager</SelectItem>
                        </SelectContent>
                      </Select>
                    )}
                  </div>
                </div>
              ))}
              
              {getTeamMembersForTeam(selectedTeam).length === 0 && (
                <div className="text-center py-8">
                  <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">No team members found</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
        <h4 className="font-medium text-amber-900 mb-2 flex items-center gap-2">
          <Shield className="h-4 w-4" />
          Role Management Guidelines
        </h4>
        <ul className="text-sm text-amber-800 space-y-1">
          <li>• Only team owners can assign and modify member roles</li>
          <li>• Managers can manage team members but cannot assign roles</li>
          <li>• Role changes take effect immediately</li>
          <li>• Each team must have at least one owner</li>
          <li>• Owner role cannot be changed or transferred through this interface</li>
        </ul>
      </div>
    </div>
  );
};
