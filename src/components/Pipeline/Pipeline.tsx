
import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PipelineKanban } from './PipelineKanban';
import { PipelineAnalytics } from './PipelineAnalytics';
import { BarChart3, Kanban } from 'lucide-react';

export const Pipeline = () => {
  return (
    <div className="container mx-auto p-4">
      <Tabs defaultValue="kanban" className="space-y-4">
        <TabsList>
          <TabsTrigger value="kanban" className="flex items-center gap-2">
            <Kanban className="h-4 w-4" />
            Pipeline Board
          </TabsTrigger>
          <TabsTrigger value="analytics" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Analytics
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="kanban">
          <PipelineKanban />
        </TabsContent>
        
        <TabsContent value="analytics">
          <PipelineAnalytics />
        </TabsContent>
      </Tabs>
    </div>
  );
};
