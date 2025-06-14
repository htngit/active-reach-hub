
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Settings, DollarSign, Users } from 'lucide-react';
import { CurrencySettings } from './CurrencySettings';
import { TeamRoleManagement } from './TeamRoleManagement';

export const SystemsManager: React.FC = () => {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Settings className="h-8 w-8" />
        <div>
          <h1 className="text-3xl font-bold">System Settings</h1>
          <p className="text-gray-600">Manage your system configurations and team settings</p>
        </div>
      </div>

      <Tabs defaultValue="currency" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="currency" className="flex items-center gap-2">
            <DollarSign className="h-4 w-4" />
            Currency Settings
          </TabsTrigger>
          <TabsTrigger value="team-roles" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Team Role Management
          </TabsTrigger>
        </TabsList>

        <TabsContent value="currency">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5" />
                Currency Configuration
              </CardTitle>
            </CardHeader>
            <CardContent>
              <CurrencySettings />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="team-roles">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Team Role Management
              </CardTitle>
            </CardHeader>
            <CardContent>
              <TeamRoleManagement />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};
