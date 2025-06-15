
import React from 'react';
import { DashboardHeader } from './DashboardHeader';
import { KPICards } from './KPICards';
import { DashboardCharts } from './DashboardCharts';
import { ActivityFeed } from './ActivityFeed';
import { QuickActions } from './QuickActions';

export const Dashboard = () => {
  return (
    <div className="container mx-auto p-4 space-y-6">
      <DashboardHeader />
      
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Main Content - 3 columns */}
        <div className="lg:col-span-3 space-y-6">
          <KPICards />
          <DashboardCharts />
        </div>
        
        {/* Sidebar - 1 column */}
        <div className="space-y-6">
          <QuickActions />
          <ActivityFeed />
        </div>
      </div>
    </div>
  );
};
