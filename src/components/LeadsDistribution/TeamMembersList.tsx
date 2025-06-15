
import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Users } from 'lucide-react';

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

interface TeamMembersListProps {
  teamMembers: TeamMember[];
}

const getRoleColor = (role: string) => {
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

export const TeamMembersList: React.FC<TeamMembersListProps> = ({ teamMembers }) => {
  if (teamMembers.length === 0) {
    return (
      <div className="text-center py-8">
        <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <p className="text-gray-500">No team members found</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {teamMembers.map(member => (
        <div key={member.id} className="flex items-center justify-between p-4 border rounded-lg">
          <div className="flex items-center gap-3">
            <div>
              <p className="font-medium">{member.name}</p>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className={getRoleColor(member.role)}>
                  {member.role}
                </Badge>
              </div>
            </div>
          </div>
          
          <div className="grid grid-cols-4 gap-4 text-center">
            <div>
              <p className="text-sm text-gray-600">Total</p>
              <p className="font-bold">{member.totalLeads}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">New</p>
              <p className="font-bold text-blue-600">{member.newLeads}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Qualified</p>
              <p className="font-bold text-green-600">{member.qualified}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Converted</p>
              <p className="font-bold text-purple-600">{member.converted}</p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};
