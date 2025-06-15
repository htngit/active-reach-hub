
import React from 'react';
import { AlertCircle, CheckCircle } from 'lucide-react';

interface QualificationStatusMessagesProps {
  currentScore: number;
  isQualified: boolean;
}

export const QualificationStatusMessages: React.FC<QualificationStatusMessagesProps> = ({
  currentScore,
  isQualified,
}) => {
  if (isQualified) {
    return (
      <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-lg">
        <CheckCircle className="h-4 w-4 text-green-600" />
        <span className="text-sm text-green-800">
          This lead meets qualification criteria and will be marked as Qualified
        </span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
      <AlertCircle className="h-4 w-4 text-yellow-600" />
      <span className="text-sm text-yellow-800">
        Need {75 - currentScore} more points to automatically qualify this lead
      </span>
    </div>
  );
};
