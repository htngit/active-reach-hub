
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart3 } from 'lucide-react';

export const PerformanceAnalyticsTab: React.FC = () => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BarChart3 className="h-5 w-5" />
          Performance Analytics
        </CardTitle>
        <CardDescription>
          Detailed performance metrics and conversion analytics
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="text-center py-12">
          <BarChart3 className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-600 mb-2">Analytics Coming Soon</h3>
          <p className="text-gray-500">
            Advanced performance analytics and detailed reporting will be available here
          </p>
        </div>
      </CardContent>
    </Card>
  );
};
