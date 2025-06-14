
import React from 'react';
import { TeamManagement as TeamManagementComponent } from '@/components/TeamManagement/TeamManagement';
import { Skeleton } from '@/components/ui/skeleton';
import { useTeamData } from '@/hooks/useTeamData';

const TeamManagement: React.FC = () => {
  const { loading } = useTeamData();

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="space-y-6">
          {/* Header Skeleton */}
          <div className="flex justify-between items-center">
            <Skeleton className="h-8 w-[200px]" />
            <Skeleton className="h-10 w-[120px]" />
          </div>

          {/* Team Cards Skeleton */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="border rounded-lg p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <Skeleton className="h-6 w-[150px]" />
                  <Skeleton className="h-8 w-8 rounded-full" />
                </div>
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-[80px]" />
                <div className="flex justify-between items-center">
                  <Skeleton className="h-4 w-[100px]" />
                  <Skeleton className="h-8 w-[80px]" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <TeamManagementComponent />
    </div>
  );
};

export default TeamManagement;
