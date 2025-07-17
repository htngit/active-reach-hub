
import React from 'react';
import { Button } from '@/components/ui/button';

interface ContactEmptyStateProps {
  loading: boolean;
  error: string | null;
  hasFilters: boolean;
  onRefresh: () => void;
}

export const ContactEmptyState: React.FC<ContactEmptyStateProps> = ({
  loading,
  error,
  hasFilters,
  onRefresh,
}) => {
  if (loading) return null;

  return (
    <div className="flex flex-col items-center justify-center py-8 text-gray-500 space-y-4">
      {error ? (
        <div className="flex flex-col items-center space-y-3">
          <p className="text-center">Failed to load contacts</p>
          <Button
            variant="outline"
            onClick={onRefresh}
            className="flex items-center justify-center gap-2"
          >
            Try Again
          </Button>
        </div>
      ) : hasFilters ? (
        <p className="text-center">No contacts found matching your filters</p>
      ) : (
        <p className="text-center">No contacts yet. Add your first contact!</p>
      )}
    </div>
  );
};
