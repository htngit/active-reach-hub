
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Users, Target, Filter } from 'lucide-react';
import { TeamMembersList } from './TeamMembersList';

interface Team {
  id: string;
  name: string;
}

interface TeamMember {
  id: string;
  name: string;
  role: string;
  totalLeads: number;
  newLeads: number;
  qualified: number;
  converted: number;
  conversionRate: string;
}

interface TeamDistributionTabProps {
  teams: Team[];
  selectedTeam: string;
  onTeamSelect: (teamId: string) => void;
  teamMembers: TeamMember[];
}

export const TeamDistributionTab: React.FC<TeamDistributionTabProps> = ({
  teams,
  selectedTeam,
  onTeamSelect,
  teamMembers
}) => {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Lead Distribution by Team
            </CardTitle>
            <CardDescription>
              View how leads are distributed among your team members
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-gray-500" />
            <Select value={selectedTeam} onValueChange={onTeamSelect}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Select team" />
              </SelectTrigger>
              <SelectContent>
                {teams.map(team => (
                  <SelectItem key={team.id} value={team.id}>
                    {team.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {selectedTeam ? (
          <TeamMembersList teamMembers={teamMembers} />
        ) : (
          <div className="text-center py-8">
            <Target className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">Select a team to view lead distribution</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
