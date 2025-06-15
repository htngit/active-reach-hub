
import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Target, CheckCircle } from 'lucide-react';

interface QualificationScoreDisplayProps {
  contactName: string;
  currentScore: number;
  isQualified: boolean;
}

export const QualificationScoreDisplay: React.FC<QualificationScoreDisplayProps> = ({
  contactName,
  currentScore,
  isQualified,
}) => {
  return (
    <>
      <div className="flex items-center gap-2">
        <Target className="h-5 w-5" />
        Lead Qualification - {contactName}
      </div>
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-600">Qualification Score:</span>
          <Badge variant={isQualified ? "default" : "secondary"}>
            {currentScore}/100
          </Badge>
        </div>
        {isQualified && (
          <div className="flex items-center gap-1 text-green-600">
            <CheckCircle className="h-4 w-4" />
            <span className="text-sm font-medium">Qualified Lead</span>
          </div>
        )}
      </div>
      <Progress value={currentScore} className="w-full" />
    </>
  );
};
