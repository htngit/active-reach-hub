
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
    <div className="text-center py-8 text-gray-500">
      {error ? (
        <div>
          <p>Failed to load contacts</p>
          <Button
            variant="outline"
            onClick={onRefresh}
            className="mt-2"
          >
            Try Again
          </Button>
        </div>
      ) : hasFilters ? (
        "No contacts found matching your filters"
      ) : (
        "No contacts yet. Add your first contact!"
      )}
    </div>
  );
};
