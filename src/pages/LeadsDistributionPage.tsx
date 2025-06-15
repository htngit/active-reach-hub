
import React from 'react';
import { LeadsDistribution } from '@/components/LeadsDistribution/LeadsDistribution';

const LeadsDistributionPage: React.FC = () => {
  return (
    <div className="w-full">
      <div className="container mx-auto p-6 max-w-7xl">
        <LeadsDistribution />
      </div>
    </div>
  );
};

export default LeadsDistributionPage;
