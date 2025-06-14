
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Check, X } from 'lucide-react';

const PERMISSIONS = [
  {
    category: 'Data Access',
    permissions: [
      { name: 'Own Data', owner: true, manager: true, member: true },
      { name: 'Subordinate Data', owner: true, manager: true, member: false },
      { name: 'All Team Data', owner: true, manager: false, member: false },
    ]
  },
  {
    category: 'Team Management',
    permissions: [
      { name: 'Create Teams', owner: true, manager: false, member: false },
      { name: 'Delete Teams', owner: true, manager: false, member: false },
      { name: 'Invite Members', owner: true, manager: true, member: false },
      { name: 'Assign Roles', owner: true, manager: false, member: false },
    ]
  },
  {
    category: 'Financial Operations',
    permissions: [
      { name: 'Create Invoices', owner: true, manager: true, member: true },
      { name: 'View Team Invoices', owner: true, manager: true, member: false },
      { name: 'Manage Products', owner: true, manager: true, member: true },
      { name: 'Financial Reports', owner: true, manager: true, member: false },
    ]
  },
  {
    category: 'System Settings',
    permissions: [
      { name: 'Currency Settings', owner: true, manager: false, member: false },
      { name: 'Team Settings', owner: true, manager: false, member: false },
      { name: 'User Management', owner: true, manager: false, member: false },
    ]
  }
];

const PermissionIcon: React.FC<{ allowed: boolean }> = ({ allowed }) => {
  return allowed ? (
    <Check className="h-4 w-4 text-green-600" />
  ) : (
    <X className="h-4 w-4 text-red-400" />
  );
};

export const RolePermissionsMatrix: React.FC = () => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Permissions Matrix</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {PERMISSIONS.map((category) => (
            <div key={category.category}>
              <h4 className="font-medium mb-3 text-gray-900">{category.category}</h4>
              <div className="space-y-2">
                {category.permissions.map((permission) => (
                  <div key={permission.name} className="grid grid-cols-4 gap-4 items-center py-2 border-b border-gray-100 last:border-b-0">
                    <div className="font-medium text-sm">{permission.name}</div>
                    <div className="flex items-center justify-center">
                      <div className="flex items-center gap-2">
                        <PermissionIcon allowed={permission.owner} />
                        <Badge variant="outline" className="bg-yellow-50 text-yellow-800 border-yellow-200">
                          Owner
                        </Badge>
                      </div>
                    </div>
                    <div className="flex items-center justify-center">
                      <div className="flex items-center gap-2">
                        <PermissionIcon allowed={permission.manager} />
                        <Badge variant="outline" className="bg-blue-50 text-blue-800 border-blue-200">
                          Manager
                        </Badge>
                      </div>
                    </div>
                    <div className="flex items-center justify-center">
                      <div className="flex items-center gap-2">
                        <PermissionIcon allowed={permission.member} />
                        <Badge variant="outline" className="bg-gray-50 text-gray-800 border-gray-200">
                          Member
                        </Badge>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};
