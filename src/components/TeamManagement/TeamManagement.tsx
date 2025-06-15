
import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { useTeamData } from '@/hooks/useTeamData';
import { CompanySetupForm } from './CompanySetupForm';
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
      description: "Company created successfully",
    });
  };

  const handleTeamUpdated = () => {
    refetch();
    toast({
      title: "Success",
      description: "Company updated successfully",
    });
  };

  const handleTeamDeleted = () => {
    refetch();
    setSelectedTeam(null);
    toast({
      title: "Success",
      description: "Company deleted successfully",
    });
  };

  if (loading) {
    return <div className="p-6">Loading companies...</div>;
  }

  if (showCreateForm) {
    return (
      <CompanySetupForm
        onCompanyCreated={handleTeamCreated}
        onCancel={() => setShowCreateForm(false)}
        user={user}
      />
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header Section - Desktop Layout */}
      <div className="hidden md:flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">My Companies</h1>
          <p className="text-gray-600">Manage your companies and collaborate with team members</p>
        </div>
        <Button onClick={() => setShowCreateForm(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Create Company
        </Button>
      </div>

      {/* Header Section - Mobile Layout */}
      <div className="md:hidden space-y-4">
        {/* Title and Description Row */}
        <div>
          <h1 className="text-3xl font-bold">My Companies</h1>
          <p className="text-gray-600">Manage your companies and collaborate with team members</p>
        </div>
        
        {/* Create Company Button Row */}
        <div className="flex justify-center">
          <Button onClick={() => setShowCreateForm(true)} className="w-full">
            <Plus className="h-4 w-4 mr-2" />
            Create Company
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Companies List */}
        <TeamList 
          teams={teams}
          selectedTeam={selectedTeam}
          onSelectTeam={setSelectedTeam}
          user={user}
        />

        {/* Company Details */}
        {selectedTeam && (
          <div className="lg:col-span-2">
            <TeamDetails
              team={selectedTeam}
              onBack={() => setSelectedTeam(null)}
              onTeamUpdated={handleTeamUpdated}
            />
          </div>
        )}
      </div>
    </div>
  );
};
