
import React from 'react';
import { Badge } from '@/components/ui/badge';

interface TeamMember {
  id: string;
  team_id: string;
  user_id: string;
  role: string;
  joined_at: string;
}

interface TeamMembersProps {
  members: TeamMember[];
}

export const TeamMembers: React.FC<TeamMembersProps> = ({ members }) => {
  if (members.length === 0) {
    return <p className="text-gray-500 text-center py-4">No members yet</p>;
  }

  return (
    <div className="space-y-2">
      {members.map((member) => (
        <div key={member.id} className="flex items-center justify-between p-2 border rounded">
          <div>
            <p className="font-medium">Member {member.user_id.substring(0, 8)}...</p>
            <p className="text-sm text-gray-600">
              Joined {new Date(member.joined_at).toLocaleDateString()}
            </p>
          </div>
          <Badge variant={member.role === 'owner' ? 'default' : 'secondary'}>
            {member.role}
          </Badge>
        </div>
      ))}
    </div>
  );
};
