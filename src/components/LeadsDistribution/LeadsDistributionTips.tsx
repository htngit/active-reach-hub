
import React from 'react';
import { Target } from 'lucide-react';

export const LeadsDistributionTips: React.FC = () => {
  return (
    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
      <h4 className="font-medium text-blue-900 mb-2 flex items-center gap-2">
        <Target className="h-4 w-4" />
        Lead Distribution Tips
      </h4>
      <ul className="text-sm text-blue-800 space-y-1">
        <li>• Distribute leads evenly among team members for optimal performance</li>
        <li>• Monitor BANT qualification scores to identify high-quality leads</li>
        <li>• Qualified leads are automatically identified when BANT score reaches 75%</li>
        <li>• Use team insights to improve lead qualification processes</li>
        <li>• Regular follow-up increases conversion rates significantly</li>
      </ul>
    </div>
  );
};
