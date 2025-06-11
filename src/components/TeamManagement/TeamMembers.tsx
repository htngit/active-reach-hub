
import React from 'react';
import { Badge } from '@/components/ui/badge';
import { TeamMember } from '@/types/team';
import { useUserData } from '@/hooks/useUserData';

interface TeamMembersProps {
  members: TeamMember[];
}

export const TeamMembers: React.FC<TeamMembersProps> = ({ members }) => {
  const { getUserNameById } = useUserData();
  
  if (members.length === 0) {
    return <p className="text-gray-500 text-center py-4">No members yet</p>;
  }

  return (
    <div className="space-y-2">
      {members.map((member) => (
        <div key={member.id} className="flex items-center justify-between p-2 border rounded">
          <div>
            <p className="font-medium">{getUserNameById(member.user_id)}</p>
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
