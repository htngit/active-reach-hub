
import React from 'react';
import { PersonalSettings as PersonalSettingsComponent } from '@/components/Settings/PersonalSettings';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuth } from '@/contexts/AuthContext';

const PersonalSettings: React.FC = () => {
  const { loading } = useAuth();

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="space-y-6">
          {/* Header Skeleton */}
          <Skeleton className="h-8 w-[200px]" />

          {/* Profile Section Skeleton */}
          <div className="border rounded-lg p-6 space-y-4">
            <Skeleton className="h-6 w-[150px]" />
            <div className="flex items-center space-x-4">
              <Skeleton className="h-20 w-20 rounded-full" />
              <div className="space-y-2">
                <Skeleton className="h-4 w-[200px]" />
                <Skeleton className="h-4 w-[150px]" />
              </div>
            </div>
          </div>

          {/* Form Sections Skeleton */}
          {[...Array(3)].map((_, i) => (
            <div key={i} className="border rounded-lg p-6 space-y-4">
              <Skeleton className="h-6 w-[180px]" />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[...Array(4)].map((_, j) => (
                  <div key={j} className="space-y-2">
                    <Skeleton className="h-4 w-[100px]" />
                    <Skeleton className="h-10 w-full" />
                  </div>
                ))}
              </div>
              <Skeleton className="h-10 w-[100px]" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <PersonalSettingsComponent />
    </div>
  );
};

export default PersonalSettings;
