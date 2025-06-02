
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Users } from 'lucide-react';
import { Team } from '@/types/team';

interface TeamListProps {
  teams: Team[];
  selectedTeam: Team | null;
  onSelectTeam: (team: Team) => void;
  user: any;
}

export const TeamList: React.FC<TeamListProps> = ({
  teams,
  selectedTeam,
  onSelectTeam,
  user
}) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5" />
          Teams
        </CardTitle>
      </CardHeader>
      <CardContent>
        {teams.length === 0 ? (
          <p className="text-gray-500 text-center py-4">No teams yet</p>
        ) : (
          <div className="space-y-2">
            {teams.map((team) => (
              <div
                key={team.id}
                className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                  selectedTeam?.id === team.id
                    ? 'bg-blue-50 border-blue-200'
                    : 'hover:bg-gray-50'
                }`}
                onClick={() => onSelectTeam(team)}
              >
                <h4 className="font-medium">{team.name}</h4>
                {team.description && (
                  <p className="text-sm text-gray-600">{team.description}</p>
                )}
                <Badge variant="outline" className="text-xs mt-1">
                  {team.owner_id === user?.id ? 'Owner' : 'Member'}
                </Badge>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
