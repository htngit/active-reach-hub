
import React from 'react';
import { Checkbox } from '@/components/ui/checkbox';
import { CheckCircle } from 'lucide-react';

interface QualificationCriteriaChecklistProps {
  budgetConfirmed: boolean;
  authorityConfirmed: boolean;
  needIdentified: boolean;
  timelineDefined: boolean;
  onCriteriaChange: (field: string, value: boolean) => void;
}

export const QualificationCriteriaChecklist: React.FC<QualificationCriteriaChecklistProps> = ({
  budgetConfirmed,
  authorityConfirmed,
  needIdentified,
  timelineDefined,
  onCriteriaChange,
}) => {
  return (
    <div className="space-y-4">
      <h4 className="font-medium text-gray-900">BANT Qualification Criteria</h4>
      
      <div className="space-y-3">
        <div className="flex items-center space-x-3">
          <Checkbox
            id="budget"
            checked={budgetConfirmed}
            onCheckedChange={(checked) => 
              onCriteriaChange('budget_confirmed', checked as boolean)
            }
          />
          <label htmlFor="budget" className="text-sm font-medium">
            Budget Confirmed (25 points)
          </label>
          {budgetConfirmed && <CheckCircle className="h-4 w-4 text-green-500" />}
        </div>

        <div className="flex items-center space-x-3">
          <Checkbox
            id="authority"
            checked={authorityConfirmed}
            onCheckedChange={(checked) => 
              onCriteriaChange('authority_confirmed', checked as boolean)
            }
          />
          <label htmlFor="authority" className="text-sm font-medium">
            Authority Confirmed (25 points)
          </label>
          {authorityConfirmed && <CheckCircle className="h-4 w-4 text-green-500" />}
        </div>

        <div className="flex items-center space-x-3">
          <Checkbox
            id="need"
            checked={needIdentified}
            onCheckedChange={(checked) => 
              onCriteriaChange('need_identified', checked as boolean)
            }
          />
          <label htmlFor="need" className="text-sm font-medium">
            Need Identified (25 points)
          </label>
          {needIdentified && <CheckCircle className="h-4 w-4 text-green-500" />}
        </div>

        <div className="flex items-center space-x-3">
          <Checkbox
            id="timeline"
            checked={timelineDefined}
            onCheckedChange={(checked) => 
              onCriteriaChange('timeline_defined', checked as boolean)
            }
          />
          <label htmlFor="timeline" className="text-sm font-medium">
            Timeline Defined (25 points)
          </label>
          {timelineDefined && <CheckCircle className="h-4 w-4 text-green-500" />}
        </div>
      </div>
    </div>
  );
};
