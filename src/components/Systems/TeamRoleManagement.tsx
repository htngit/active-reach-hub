
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Shield, Users, User, Crown } from 'lucide-react';
import { RolePermissionsMatrix } from './RolePermissionsMatrix';

const ROLE_DESCRIPTIONS = [
  {
    role: 'Owner',
    icon: Crown,
    color: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    description: 'Full system access and control',
    capabilities: [
      'Create and delete teams/companies',
      'Manage all team members and roles',
      'Access all data across the organization',
      'Configure system settings',
      'Full financial management'
    ]
  },
  {
    role: 'Manager',
    icon: Shield,
    color: 'bg-blue-100 text-blue-800 border-blue-200',
    description: 'Manage team members and their data',
    capabilities: [
      'Manage assigned team members',
      'View and edit subordinate data',
      'Create and manage contacts for team',
      'Generate reports for managed team',
      'Limited administrative functions'
    ]
  },
  {
    role: 'Member',
    icon: User,
    color: 'bg-gray-100 text-gray-800 border-gray-200',
    description: 'Basic access to own data only',
    capabilities: [
      'Manage own contacts and data',
      'Create personal invoices and products',
      'View own activity and reports',
      'Update personal profile',
      'No team management access'
    ]
  }
];

export const TeamRoleManagement: React.FC = () => {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium mb-2">Role Hierarchy</h3>
        <p className="text-sm text-gray-600 mb-4">
          Our three-tier role system ensures proper access control and data security.
        </p>
      </div>

      <div className="grid gap-4">
        {ROLE_DESCRIPTIONS.map((roleInfo) => {
          const IconComponent = roleInfo.icon;
          return (
            <Card key={roleInfo.role} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <CardTitle className="flex items-center gap-3">
                  <div className={`p-2 rounded-full ${roleInfo.color}`}>
                    <IconComponent className="h-5 w-5" />
                  </div>
                  <div className="flex items-center gap-2">
                    <span>{roleInfo.role}</span>
                    <Badge variant="outline" className={roleInfo.color}>
                      {roleInfo.role}
                    </Badge>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 mb-3">{roleInfo.description}</p>
                <div className="space-y-2">
                  <h4 className="font-medium text-sm">Key Capabilities:</h4>
                  <ul className="text-sm space-y-1">
                    {roleInfo.capabilities.map((capability, index) => (
                      <li key={index} className="flex items-start gap-2">
                        <span className="text-green-500 mt-0.5">✓</span>
                        <span>{capability}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <RolePermissionsMatrix />

      <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
        <h4 className="font-medium text-amber-900 mb-2 flex items-center gap-2">
          <Users className="h-4 w-4" />
          Role Assignment Rules
        </h4>
        <ul className="text-sm text-amber-800 space-y-1">
          <li>• Only team owners can assign and modify roles</li>
          <li>• Managers can only manage members (not other managers)</li>
          <li>• Role changes take effect immediately</li>
          <li>• Each team must have at least one owner</li>
          <li>• Data access is automatically updated based on role changes</li>
        </ul>
      </div>
    </div>
  );
};
