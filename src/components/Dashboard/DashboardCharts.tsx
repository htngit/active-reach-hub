
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
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Lead Funnel */}
      <Card>
        <CardHeader>
          <CardTitle>Lead Funnel</CardTitle>
        </CardHeader>
        <CardContent>
          <ChartContainer config={chartConfig} className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={funnelData}>
                <XAxis 
                  dataKey="name" 
                  tick={{ fontSize: 12 }}
                  angle={-45}
                  textAnchor="end"
                  height={60}
                />
                <YAxis tick={{ fontSize: 12 }} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar dataKey="value" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </ChartContainer>
        </CardContent>
      </Card>

      {/* Status Distribution */}
      <Card>
        <CardHeader>
          <CardTitle>Contact Status Distribution</CardTitle>
        </CardHeader>
        <CardContent>
          <ChartContainer config={chartConfig} className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={statusData}
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  dataKey="value"
                  label={({ name, value }) => `${name}: ${value}`}
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
      <Card className="lg:col-span-2">
        <CardHeader>
          <CardTitle>Monthly Contact Trends</CardTitle>
        </CardHeader>
        <CardContent>
          <ChartContainer config={chartConfig} className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthlyData}>
                <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
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
