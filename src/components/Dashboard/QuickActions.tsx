
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { Plus, FileText, Users, Target } from 'lucide-react';

export const QuickActions = () => {
  const navigate = useNavigate();

  const actions = [
    {
      title: 'Add Contact',
      description: 'Create a new contact',
      icon: Plus,
      color: 'bg-blue-500 hover:bg-blue-600',
      onClick: () => navigate('/contacts'),
    },
    {
      title: 'Create Invoice',
      description: 'Generate new invoice',
      icon: FileText,
      color: 'bg-green-500 hover:bg-green-600',
      onClick: () => navigate('/invoices'),
    },
    {
      title: 'View Team',
      description: 'Manage team members',
      icon: Users,
      color: 'bg-purple-500 hover:bg-purple-600',
      onClick: () => navigate('/team-management'),
    },
    {
      title: 'Leads Distribution',
      description: 'View lead analytics',
      icon: Target,
      color: 'bg-orange-500 hover:bg-orange-600',
      onClick: () => navigate('/leads-distribution'),
    },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Target className="h-5 w-5" />
          Quick Actions
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {actions.map((action) => {
          const Icon = action.icon;
          return (
            <Button
              key={action.title}
              onClick={action.onClick}
              className={`w-full justify-start gap-3 h-auto p-3 ${action.color} text-white`}
            >
              <Icon className="h-4 w-4" />
              <div className="text-left">
                <div className="font-medium">{action.title}</div>
                <div className="text-xs opacity-90">{action.description}</div>
              </div>
            </Button>
          );
        })}
      </CardContent>
    </Card>
  );
};
