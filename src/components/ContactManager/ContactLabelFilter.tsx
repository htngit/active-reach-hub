
import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Filter } from 'lucide-react';

interface ContactLabelFilterProps {
  availableLabels: string[];
  selectedLabels: string[];
  onToggleLabel: (label: string) => void;
  onLabelsChanged: () => void;
}

export const ContactLabelFilter: React.FC<ContactLabelFilterProps> = ({
  availableLabels,
  selectedLabels,
  onToggleLabel,
}) => {
  if (availableLabels.length === 0) return null;

  return (
    <div className="flex flex-col space-y-3 max-w-full overflow-hidden">
      <div className="flex items-center gap-2">
        <Filter className="h-4 w-4 shrink-0" />
        <span className="text-xs sm:text-sm font-medium">Filter by labels:</span>
      </div>
      <div className="flex flex-wrap items-center gap-1 sm:gap-2 max-w-full">
        {availableLabels.map(label => (
          <Badge
            key={label}
            variant={selectedLabels.includes(label) ? "default" : "outline"}
            className="cursor-pointer text-xs truncate max-w-32 text-center"
            onClick={() => onToggleLabel(label)}
          >
            {label}
          </Badge>
        ))}
      </div>
    </div>
  );
};
