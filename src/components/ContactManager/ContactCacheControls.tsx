
import React from 'react';
import { Button } from '@/components/ui/button';
import { RefreshCw, Trash2 } from 'lucide-react';

interface ContactCacheControlsProps {
  cacheInfo: string;
  error: string | null;
  onRefresh: () => void;
  onClearCache: () => void;
}

export const ContactCacheControls: React.FC<ContactCacheControlsProps> = ({
  cacheInfo,
  error,
  onRefresh,
  onClearCache,
}) => {
  if (!cacheInfo && !error) return null;

  return (
    <>
      {/* Cache Info and Controls - Rearranged for mobile */}
      {cacheInfo && (
        <div className="p-3 bg-blue-50 rounded-lg border space-y-3">
          {/* Cache Status - Full width row */}
          <div className="text-sm text-blue-700">
            <span className="font-medium">Cache Status:</span> {cacheInfo}
          </div>
          
          {/* Action Buttons - Single row */}
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={onRefresh}
              className="flex-1 text-blue-600 border-blue-200 hover:bg-blue-100"
            >
              <RefreshCw className="h-3 w-3 mr-1" />
              Refresh
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={onClearCache}
              className="flex-1 text-red-600 border-red-200 hover:bg-red-100"
            >
              <Trash2 className="h-3 w-3 mr-1" />
              Clear Cache
            </Button>
          </div>
        </div>
      )}

      {error && (
        <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
          <p className="text-sm text-yellow-700">{error}</p>
          <Button
            variant="outline"
            size="sm"
            onClick={onRefresh}
            className="mt-2 text-yellow-600 border-yellow-200 hover:bg-yellow-100"
          >
            Try Again
          </Button>
        </div>
      )}
    </>
  );
};
