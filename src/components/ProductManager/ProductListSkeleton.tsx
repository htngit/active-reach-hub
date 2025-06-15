
import React from 'react';
import { Skeleton } from '@/components/ui/skeleton';

export const ProductListSkeleton: React.FC = () => {
  return (
    <div className="space-y-4">
      {/* Header Skeleton */}
      <div className="flex items-center justify-between">
        <Skeleton className="h-8 w-[150px]" />
        <Skeleton className="h-10 w-[120px]" />
      </div>

      {/* Filters Skeleton */}
      <div className="flex flex-col space-y-4 md:flex-row md:space-y-0 md:space-x-4">
        <Skeleton className="h-10 flex-1" />
        <Skeleton className="h-10 w-[180px]" />
        <Skeleton className="h-10 w-[180px]" />
      </div>

      {/* Product Grid Skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {[...Array(9)].map((_, i) => (
          <div key={i} className="border rounded-lg p-4 space-y-3">
            <div className="flex justify-between items-start">
              <Skeleton className="h-5 w-[150px]" />
              <Skeleton className="h-6 w-[60px]" />
            </div>
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-[80%]" />
            <div className="flex justify-between items-center">
              <Skeleton className="h-4 w-[60px]" />
              <Skeleton className="h-6 w-[80px]" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
