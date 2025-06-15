
import React from 'react';
import { Textarea } from '@/components/ui/textarea';

interface QualificationNotesProps {
  notes: string;
  onNotesChange: (notes: string) => void;
}

export const QualificationNotes: React.FC<QualificationNotesProps> = ({
  notes,
  onNotesChange,
}) => {
  return (
    <div className="space-y-2">
      <label htmlFor="notes" className="text-sm font-medium text-gray-700">
        Qualification Notes
      </label>
      <Textarea
        id="notes"
        placeholder="Add notes about the qualification process..."
        value={notes}
        onChange={(e) => onNotesChange(e.target.value)}
        rows={3}
      />
    </div>
  );
};
