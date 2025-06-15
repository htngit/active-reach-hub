
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useLeadsStats } from '@/hooks/useLeadsStats';
import { TrendingUp, Users, Target, DollarSign } from 'lucide-react';

export const KPICards = () => {
  const { getLeadsStats } = useLeadsStats();
  const stats = getLeadsStats();

  const kpis = [
    {
      title: 'Total Contacts',
      value: stats.total,
      icon: Users,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
    },
    {
      title: 'New Leads',
      value: stats.new,
      icon: TrendingUp,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
    },
    {
      title: 'Qualified Leads',
      value: stats.qualified,
      icon: Target,
      color: 'text-orange-600',
      bgColor: 'bg-orange-50',
    },
    {
      title: 'Converted',
      value: stats.converted,
      icon: DollarSign,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
      subtitle: `${stats.conversionRate}% conversion rate`,
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {kpis.map((kpi) => {
        const Icon = kpi.icon;
        return (
          <Card key={kpi.title} className="hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                {kpi.title}
              </CardTitle>
              <div className={`rounded-lg p-2 ${kpi.bgColor}`}>
                <Icon className={`h-4 w-4 ${kpi.color}`} />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900">
                {kpi.value}
              </div>
              {kpi.subtitle && (
                <p className="text-xs text-gray-500 mt-1">
                  {kpi.subtitle}
                </p>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};
