
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Building2 } from 'lucide-react';
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
          <Building2 className="h-5 w-5" />
          Companies
        </CardTitle>
      </CardHeader>
      <CardContent>
        {teams.length === 0 ? (
          <p className="text-gray-500 text-center py-4">No companies yet</p>
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
                <div className="flex items-center gap-2 mb-2">
                  {team.logo_url && (
                    <img 
                      src={team.logo_url} 
                      alt={`${team.name} logo`}
                      className="h-8 w-8 object-contain rounded"
                    />
                  )}
                  <h4 className="font-medium">{team.name}</h4>
                </div>
                {team.description && (
                  <p className="text-sm text-gray-600 mb-2">{team.description}</p>
                )}
                {team.company_legal_name && (
                  <p className="text-xs text-gray-500 mb-2">{team.company_legal_name}</p>
                )}
                <Badge variant="outline" className="text-xs">
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
