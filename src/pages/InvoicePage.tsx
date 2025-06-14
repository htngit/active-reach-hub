
import React from 'react';
import { InvoiceManager } from '@/components/InvoiceManager/InvoiceManager';
import { Skeleton } from '@/components/ui/skeleton';
import { useInvoiceData } from '@/hooks/useInvoiceData';

const InvoicePage: React.FC = () => {
  const { loading } = useInvoiceData();

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="space-y-6">
          {/* Header Skeleton */}
          <div className="flex justify-between items-center">
            <Skeleton className="h-8 w-[150px]" />
            <Skeleton className="h-10 w-[140px]" />
          </div>

          {/* Search and Filters Skeleton */}
          <div className="flex flex-col gap-3 sm:flex-row">
            <Skeleton className="h-10 flex-1" />
            <Skeleton className="h-10 w-[180px]" />
          </div>

          {/* Invoice List Skeleton */}
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="border rounded-lg p-4">
                <div className="flex justify-between items-start">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Skeleton className="h-4 w-4" />
                      <Skeleton className="h-6 w-[120px]" />
                      <Skeleton className="h-6 w-[60px]" />
                    </div>
                    <Skeleton className="h-4 w-[200px]" />
                    <div className="flex gap-4">
                      <Skeleton className="h-3 w-[100px]" />
                      <Skeleton className="h-3 w-[120px]" />
                    </div>
                  </div>
                  <div className="text-right space-y-1">
                    <Skeleton className="h-6 w-[80px]" />
                    <Skeleton className="h-3 w-[120px]" />
                  </div>
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
      <InvoiceManager />
    </div>
  );
};

export default InvoicePage;
