
import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { useTeamData } from '@/hooks/useTeamData';
import { CreateTeamDialog } from './CreateTeamDialog';
import { TeamList } from './TeamList';
import { TeamDetails } from './TeamDetails';
import { Team } from '@/types/team';

export const TeamManagement = () => {
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const { user } = useAuth();
  const { teams, loading, refetch } = useTeamData();

  useEffect(() => {
    if (teams && teams.length > 0 && !selectedTeam) {
      setSelectedTeam(teams[0]);
    }
  }, [teams, selectedTeam]);

  const handleTeamCreated = () => {
    setShowCreateForm(false);
    refetch();
    toast({
      title: "Success",
      description: "Team created successfully",
    });
  };

  const handleTeamUpdated = () => {
    refetch();
    toast({
      title: "Success",
      description: "Team updated successfully",
    });
  };

  const handleTeamDeleted = () => {
    refetch();
    setSelectedTeam(null);
    toast({
      title: "Success",
      description: "Team deleted successfully",
    });
  };

  if (loading) {
    return <div className="p-6">Loading teams...</div>;
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">My Team</h1>
          <p className="text-gray-600">Manage your teams and collaborate with others</p>
        </div>
        <Button onClick={() => setShowCreateForm(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Create Team
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Teams List */}
        <TeamList 
          teams={teams}
          selectedTeam={selectedTeam}
          onSelectTeam={setSelectedTeam}
          user={user}
        />

        {/* Team Details */}
        {selectedTeam && (
          <div className="lg:col-span-2">
            <TeamDetails
              team={selectedTeam}
              user={user}
              onTeamUpdated={handleTeamUpdated}
              onTeamDeleted={handleTeamDeleted}
            />
          </div>
        )}
      </div>

      <CreateTeamDialog
        open={showCreateForm}
        onOpenChange={setShowCreateForm}
        onTeamCreated={handleTeamCreated}
        user={user}
      />
    </div>
  );
};
