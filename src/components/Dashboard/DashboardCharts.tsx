
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { useLeadsStats } from '@/hooks/useLeadsStats';
import { useCachedContacts } from '@/hooks/useCachedContacts';

const chartConfig = {
  new: {
    label: "New Leads",
    color: "#3b82f6",
  },
  qualified: {
    label: "Qualified",
    color: "#f59e0b",
  },
  converted: {
    label: "Converted",
    color: "#10b981",
  },
};

export const DashboardCharts = () => {
  const { getLeadsStats } = useLeadsStats();
  const { contacts } = useCachedContacts();
  const stats = getLeadsStats();

  // Lead funnel data
  const funnelData = [
    { name: 'Total Contacts', value: stats.total, fill: '#94a3b8' },
    { name: 'New Leads', value: stats.new, fill: '#3b82f6' },
    { name: 'Qualified', value: stats.qualified, fill: '#f59e0b' },
    { name: 'Converted', value: stats.converted, fill: '#10b981' },
  ];

  // Monthly trends (simplified - using recent contacts)
  const getMonthlyData = () => {
    const monthlyStats = {};
    contacts.forEach(contact => {
      const month = new Date(contact.created_at).toLocaleDateString('en-US', { 
        month: 'short', 
        year: 'numeric' 
      });
      if (!monthlyStats[month]) {
        monthlyStats[month] = { month, new: 0, qualified: 0, converted: 0 };
      }
      monthlyStats[month].new += 1;
      if (contact.status === 'Qualified') monthlyStats[month].qualified += 1;
      if (contact.status === 'Converted') monthlyStats[month].converted += 1;
    });
    
    return Object.values(monthlyStats).slice(-6); // Last 6 months
  };

  const monthlyData = getMonthlyData();

  // Status distribution for pie chart
  const statusData = [
    { name: 'New', value: stats.new, fill: '#3b82f6' },
    { name: 'Qualified', value: stats.qualified, fill: '#f59e0b' },
    { name: 'Converted', value: stats.converted, fill: '#10b981' },
    { name: 'Other', value: stats.total - stats.new - stats.qualified - stats.converted, fill: '#94a3b8' },
  ].filter(item => item.value > 0);

  return (
    <div className="grid grid-cols-1 gap-6">
      {/* Lead Funnel */}
      <Card className="min-h-[400px]">
        <CardHeader>
          <CardTitle>Lead Funnel</CardTitle>
        </CardHeader>
        <CardContent className="flex-1">
          <ChartContainer config={chartConfig} className="h-[350px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart 
                data={funnelData}
                margin={{ top: 20, right: 30, left: 10, bottom: 90 }}
              >
                <XAxis 
                  dataKey="name" 
                  tick={{ fontSize: 12 }}
                  angle={-45}
                  textAnchor="end"
                  height={90}
                  padding={{ left: 20, right: 20 }}
                />
                <YAxis tick={{ fontSize: 12 }} width={50} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar dataKey="value" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </ChartContainer>
        </CardContent>
      </Card>

      {/* Status Distribution */}
      <Card className="min-h-[400px]">
        <CardHeader>
          <CardTitle>Contact Status Distribution</CardTitle>
        </CardHeader>
        <CardContent className="flex-1">
          <ChartContainer config={chartConfig} className="h-[350px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart margin={{ top: 20, right: 20, left: 20, bottom: 20 }}>
                <Pie
                  data={statusData}
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  innerRadius={0}
                  paddingAngle={2}
                  dataKey="value"
                  labelLine={true}
                  label={({ name, value, percent }) => `${name}: ${value} (${(percent * 100).toFixed(0)}%)`}
                >
                  {statusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Pie>
                <ChartTooltip content={<ChartTooltipContent />} />
              </PieChart>
            </ResponsiveContainer>
          </ChartContainer>
        </CardContent>
      </Card>

      {/* Monthly Trends */}
      <Card className="min-h-[400px]">
        <CardHeader>
          <CardTitle>Monthly Contact Trends</CardTitle>
        </CardHeader>
        <CardContent className="flex-1">
          <ChartContainer config={chartConfig} className="h-[350px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart 
                data={monthlyData}
                margin={{ top: 20, right: 30, left: 10, bottom: 30 }}
              >
                <XAxis 
                  dataKey="month" 
                  tick={{ fontSize: 12 }}
                  padding={{ left: 20, right: 20 }}
                />
                <YAxis tick={{ fontSize: 12 }} width={50} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar dataKey="new" fill="#3b82f6" name="New" />
                <Bar dataKey="qualified" fill="#f59e0b" name="Qualified" />
                <Bar dataKey="converted" fill="#10b981" name="Converted" />
              </BarChart>
            </ResponsiveContainer>
          </ChartContainer>
        </CardContent>
      </Card>
    </div>
  );
};
