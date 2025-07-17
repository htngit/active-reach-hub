
import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Filter } from 'lucide-react';
import { LabelManager } from './LabelManager';

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
  onLabelsChanged,
}) => {
  if (availableLabels.length === 0) return null;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4" />
          <span className="text-sm font-medium">Filter by labels:</span>
        </div>
        <LabelManager 
          availableLabels={availableLabels}
          onLabelsChanged={onLabelsChanged}
        />
      </div>
      <div className="flex flex-wrap gap-2">
        {availableLabels.map(label => (
          <Badge
            key={label}
            variant={selectedLabels.includes(label) ? "default" : "outline"}
            className="cursor-pointer"
            onClick={() => onToggleLabel(label)}
          >
            {label}
          </Badge>
        ))}
      </div>
    </div>
  );
};
