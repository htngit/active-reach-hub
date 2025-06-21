import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Dimensions,
  Alert,
} from 'react-native';
import { Button, Icon, Select } from '@components';

interface ReportData {
  id: string;
  title: string;
  value: string | number;
  change: number;
  changeType: 'increase' | 'decrease' | 'neutral';
  icon: string;
  color: string;
}

interface ChartData {
  label: string;
  value: number;
  color?: string;
}

interface ReportsScreenProps {
  navigation: any;
}

const { width } = Dimensions.get('window');

const periodOptions = [
  { label: 'Last 7 Days', value: '7d' },
  { label: 'Last 30 Days', value: '30d' },
  { label: 'Last 3 Months', value: '3m' },
  { label: 'Last 6 Months', value: '6m' },
  { label: 'Last Year', value: '1y' },
  { label: 'Custom Range', value: 'custom' },
];

const reportTypeOptions = [
  { label: 'Sales Overview', value: 'sales' },
  { label: 'Lead Analytics', value: 'leads' },
  { label: 'Activity Reports', value: 'activities' },
  { label: 'Performance', value: 'performance' },
  { label: 'Revenue Analysis', value: 'revenue' },
];

export const ReportsScreen: React.FC<ReportsScreenProps> = ({ navigation }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [selectedPeriod, setSelectedPeriod] = useState('30d');
  const [selectedReportType, setSelectedReportType] = useState('sales');
  const [reportData, setReportData] = useState<ReportData[]>([]);
  const [chartData, setChartData] = useState<ChartData[]>([]);
  const [conversionData, setConversionData] = useState<ChartData[]>([]);

  // Load reports data
  const loadReportsData = async () => {
    try {
      setIsLoading(true);
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Mock data based on report type
      let mockReportData: ReportData[] = [];
      let mockChartData: ChartData[] = [];
      let mockConversionData: ChartData[] = [];

      switch (selectedReportType) {
        case 'sales':
          mockReportData = [
            {
              id: '1',
              title: 'Total Revenue',
              value: '$847,500',
              change: 12.5,
              changeType: 'increase',
              icon: 'dollar-sign',
              color: '#10b981',
            },
            {
              id: '2',
              title: 'Deals Closed',
              value: 23,
              change: 8.3,
              changeType: 'increase',
              icon: 'check-circle',
              color: '#3b82f6',
            },
            {
              id: '3',
              title: 'Average Deal Size',
              value: '$36,850',
              change: -2.1,
              changeType: 'decrease',
              icon: 'trending-up',
              color: '#f59e0b',
            },
            {
              id: '4',
              title: 'Win Rate',
              value: '68%',
              change: 5.2,
              changeType: 'increase',
              icon: 'target',
              color: '#8b5cf6',
            },
          ];
          
          mockChartData = [
            { label: 'Week 1', value: 185000, color: '#3b82f6' },
            { label: 'Week 2', value: 220000, color: '#10b981' },
            { label: 'Week 3', value: 195000, color: '#f59e0b' },
            { label: 'Week 4', value: 247500, color: '#8b5cf6' },
          ];
          break;

        case 'leads':
          mockReportData = [
            {
              id: '1',
              title: 'Total Leads',
              value: 156,
              change: 18.7,
              changeType: 'increase',
              icon: 'users',
              color: '#10b981',
            },
            {
              id: '2',
              title: 'Qualified Leads',
              value: 89,
              change: 15.2,
              changeType: 'increase',
              icon: 'user-check',
              color: '#3b82f6',
            },
            {
              id: '3',
              title: 'Conversion Rate',
              value: '57%',
              change: -3.1,
              changeType: 'decrease',
              icon: 'trending-up',
              color: '#f59e0b',
            },
            {
              id: '4',
              title: 'Lead Score Avg',
              value: 72,
              change: 4.8,
              changeType: 'increase',
              icon: 'star',
              color: '#8b5cf6',
            },
          ];
          
          mockChartData = [
            { label: 'New', value: 45, color: '#3b82f6' },
            { label: 'Contacted', value: 32, color: '#10b981' },
            { label: 'Qualified', value: 28, color: '#f59e0b' },
            { label: 'Proposal', value: 18, color: '#8b5cf6' },
            { label: 'Negotiation', value: 12, color: '#ef4444' },
            { label: 'Closed Won', value: 21, color: '#06b6d4' },
          ];
          break;

        case 'activities':
          mockReportData = [
            {
              id: '1',
              title: 'Total Activities',
              value: 342,
              change: 22.1,
              changeType: 'increase',
              icon: 'activity',
              color: '#10b981',
            },
            {
              id: '2',
              title: 'Completed Tasks',
              value: 287,
              change: 19.5,
              changeType: 'increase',
              icon: 'check-square',
              color: '#3b82f6',
            },
            {
              id: '3',
              title: 'Overdue Items',
              value: 12,
              change: -8.3,
              changeType: 'decrease',
              icon: 'clock',
              color: '#ef4444',
            },
            {
              id: '4',
              title: 'Completion Rate',
              value: '84%',
              change: 3.7,
              changeType: 'increase',
              icon: 'trending-up',
              color: '#8b5cf6',
            },
          ];
          
          mockChartData = [
            { label: 'Calls', value: 89, color: '#3b82f6' },
            { label: 'Emails', value: 124, color: '#10b981' },
            { label: 'Meetings', value: 45, color: '#f59e0b' },
            { label: 'Tasks', value: 67, color: '#8b5cf6' },
            { label: 'Notes', value: 17, color: '#ef4444' },
          ];
          break;

        case 'performance':
          mockReportData = [
            {
              id: '1',
              title: 'Team Performance',
              value: '92%',
              change: 7.2,
              changeType: 'increase',
              icon: 'trending-up',
              color: '#10b981',
            },
            {
              id: '2',
              title: 'Response Time',
              value: '2.3h',
              change: -12.5,
              changeType: 'decrease',
              icon: 'clock',
              color: '#3b82f6',
            },
            {
              id: '3',
              title: 'Customer Satisfaction',
              value: '4.7/5',
              change: 2.1,
              changeType: 'increase',
              icon: 'star',
              color: '#f59e0b',
            },
            {
              id: '4',
              title: 'Goal Achievement',
              value: '87%',
              change: 5.8,
              changeType: 'increase',
              icon: 'target',
              color: '#8b5cf6',
            },
          ];
          
          mockChartData = [
            { label: 'Sarah J.', value: 95, color: '#10b981' },
            { label: 'Mike W.', value: 88, color: '#3b82f6' },
            { label: 'Emily C.', value: 92, color: '#f59e0b' },
            { label: 'David B.', value: 85, color: '#8b5cf6' },
            { label: 'Lisa A.', value: 90, color: '#ef4444' },
          ];
          break;

        case 'revenue':
          mockReportData = [
            {
              id: '1',
              title: 'Monthly Revenue',
              value: '$247,500',
              change: 15.3,
              changeType: 'increase',
              icon: 'dollar-sign',
              color: '#10b981',
            },
            {
              id: '2',
              title: 'Recurring Revenue',
              value: '$185,200',
              change: 8.7,
              changeType: 'increase',
              icon: 'repeat',
              color: '#3b82f6',
            },
            {
              id: '3',
              title: 'Revenue Growth',
              value: '12.5%',
              change: 2.3,
              changeType: 'increase',
              icon: 'trending-up',
              color: '#f59e0b',
            },
            {
              id: '4',
              title: 'Profit Margin',
              value: '34%',
              change: -1.2,
              changeType: 'decrease',
              icon: 'pie-chart',
              color: '#8b5cf6',
            },
          ];
          
          mockChartData = [
            { label: 'Jan', value: 185000, color: '#3b82f6' },
            { label: 'Feb', value: 210000, color: '#10b981' },
            { label: 'Mar', value: 195000, color: '#f59e0b' },
            { label: 'Apr', value: 247500, color: '#8b5cf6' },
            { label: 'May', value: 265000, color: '#ef4444' },
            { label: 'Jun', value: 280000, color: '#06b6d4' },
          ];
          break;
      }

      // Mock conversion funnel data
      mockConversionData = [
        { label: 'Leads', value: 156, color: '#3b82f6' },
        { label: 'Qualified', value: 89, color: '#10b981' },
        { label: 'Proposals', value: 45, color: '#f59e0b' },
        { label: 'Negotiations', value: 28, color: '#8b5cf6' },
        { label: 'Closed Won', value: 23, color: '#ef4444' },
      ];
      
      setReportData(mockReportData);
      setChartData(mockChartData);
      setConversionData(mockConversionData);
    } catch (error) {
      console.error('Error loading reports:', error);
      Alert.alert('Error', 'Failed to load reports data');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle refresh
  const handleRefresh = async () => {
    setIsRefreshing(true);
    await loadReportsData();
    setIsRefreshing(false);
  };

  // Load data on component mount and when filters change
  useEffect(() => {
    loadReportsData();
  }, [selectedPeriod, selectedReportType]);

  // Get change color
  const getChangeColor = (changeType: string): string => {
    switch (changeType) {
      case 'increase':
        return '#10b981';
      case 'decrease':
        return '#ef4444';
      default:
        return '#6b7280';
    }
  };

  // Get change icon
  const getChangeIcon = (changeType: string): string => {
    switch (changeType) {
      case 'increase':
        return 'trending-up';
      case 'decrease':
        return 'trending-down';
      default:
        return 'minus';
    }
  };

  // Format currency
  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  // Render metric card
  const renderMetricCard = (item: ReportData) => (
    <View key={item.id} style={styles.metricCard}>
      <View style={styles.metricHeader}>
        <View style={[styles.metricIcon, { backgroundColor: item.color }]}>
          <Icon name={item.icon} size={20} color="#ffffff" />
        </View>
        <View style={[styles.changeIndicator, { backgroundColor: getChangeColor(item.changeType) }]}>
          <Icon name={getChangeIcon(item.changeType)} size={12} color="#ffffff" />
          <Text style={styles.changeText}>{Math.abs(item.change)}%</Text>
        </View>
      </View>
      <Text style={styles.metricValue}>{item.value}</Text>
      <Text style={styles.metricTitle}>{item.title}</Text>
    </View>
  );

  // Render simple bar chart
  const renderBarChart = () => {
    const maxValue = Math.max(...chartData.map(item => item.value));
    
    return (
      <View style={styles.chartContainer}>
        <Text style={styles.chartTitle}>Performance Overview</Text>
        <View style={styles.barChart}>
          {chartData.map((item, index) => {
            const height = (item.value / maxValue) * 120;
            return (
              <View key={index} style={styles.barContainer}>
                <View style={styles.barWrapper}>
                  <View
                    style={[
                      styles.bar,
                      {
                        height,
                        backgroundColor: item.color || '#3b82f6',
                      },
                    ]}
                  />
                </View>
                <Text style={styles.barLabel}>{item.label}</Text>
                <Text style={styles.barValue}>
                  {typeof item.value === 'number' && item.value > 1000
                    ? formatCurrency(item.value)
                    : item.value}
                </Text>
              </View>
            );
          })}
        </View>
      </View>
    );
  };

  // Render conversion funnel
  const renderConversionFunnel = () => {
    const maxValue = Math.max(...conversionData.map(item => item.value));
    
    return (
      <View style={styles.chartContainer}>
        <Text style={styles.chartTitle}>Conversion Funnel</Text>
        <View style={styles.funnelChart}>
          {conversionData.map((item, index) => {
            const width = (item.value / maxValue) * 100;
            const conversionRate = index > 0 ? ((item.value / conversionData[index - 1].value) * 100).toFixed(1) : '100.0';
            
            return (
              <View key={index} style={styles.funnelItem}>
                <View style={styles.funnelBar}>
                  <View
                    style={[
                      styles.funnelSegment,
                      {
                        width: `${width}%`,
                        backgroundColor: item.color || '#3b82f6',
                      },
                    ]}
                  />
                </View>
                <View style={styles.funnelInfo}>
                  <Text style={styles.funnelLabel}>{item.label}</Text>
                  <Text style={styles.funnelValue}>{item.value}</Text>
                  <Text style={styles.funnelRate}>{conversionRate}%</Text>
                </View>
              </View>
            );
          })}
        </View>
      </View>
    );
  };

  // Export report
  const handleExportReport = () => {
    Alert.alert(
      'Export Report',
      'Choose export format:',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'PDF', onPress: () => console.log('Export as PDF') },
        { text: 'Excel', onPress: () => console.log('Export as Excel') },
        { text: 'CSV', onPress: () => console.log('Export as CSV') },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.title}>Reports & Analytics</Text>
          <Text style={styles.subtitle}>Business insights and performance metrics</Text>
        </View>
        <TouchableOpacity style={styles.exportButton} onPress={handleExportReport}>
          <Icon name="download" size={20} color="#3b82f6" />
        </TouchableOpacity>
      </View>

      {/* Filters */}
      <View style={styles.filters}>
        <View style={styles.filterRow}>
          <Select
            options={reportTypeOptions}
            value={selectedReportType}
            onValueChange={setSelectedReportType}
            placeholder="Report Type"
            style={styles.filterSelect}
          />
          
          <Select
            options={periodOptions}
            value={selectedPeriod}
            onValueChange={setSelectedPeriod}
            placeholder="Time Period"
            style={styles.filterSelect}
          />
        </View>
      </View>

      {/* Content */}
      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Metrics Grid */}
        <View style={styles.metricsGrid}>
          {reportData.map(renderMetricCard)}
        </View>

        {/* Charts */}
        {renderBarChart()}
        
        {selectedReportType === 'leads' && renderConversionFunnel()}

        {/* Quick Actions */}
        <View style={styles.quickActions}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <View style={styles.actionButtons}>
            <Button
              title="Custom Report"
              leftIcon="file-text"
              onPress={() => navigation.navigate('CustomReport')}
              variant="outline"
              style={styles.actionButton}
            />
            <Button
              title="Schedule Report"
              leftIcon="calendar"
              onPress={() => navigation.navigate('ScheduleReport')}
              variant="outline"
              style={styles.actionButton}
            />
          </View>
          <View style={styles.actionButtons}>
            <Button
              title="Dashboard"
              leftIcon="bar-chart-2"
              onPress={() => navigation.navigate('Dashboard')}
              variant="outline"
              style={styles.actionButton}
            />
            <Button
              title="Export Data"
              leftIcon="download"
              onPress={handleExportReport}
              variant="outline"
              style={styles.actionButton}
            />
          </View>
        </View>

        {/* Report Summary */}
        <View style={styles.reportSummary}>
          <Text style={styles.sectionTitle}>Report Summary</Text>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryText}>
              Based on the {selectedPeriod} data, your {selectedReportType} performance shows positive trends.
              Key highlights include improved conversion rates and increased activity levels.
            </Text>
            <View style={styles.summaryActions}>
              <Button
                title="View Detailed Analysis"
                onPress={() => navigation.navigate('DetailedAnalysis', { 
                  reportType: selectedReportType,
                  period: selectedPeriod 
                })}
                size="sm"
              />
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  headerLeft: {
    flex: 1,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  subtitle: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 2,
  },
  exportButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#eff6ff',
  },
  filters: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  filterRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  filterSelect: {
    flex: 1,
    marginHorizontal: 4,
  },
  content: {
    flex: 1,
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 16,
    paddingTop: 20,
  },
  metricCard: {
    width: (width - 48) / 2,
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    margin: 4,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  metricHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  metricIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  changeIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  changeText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#ffffff',
    marginLeft: 2,
  },
  metricValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 4,
  },
  metricTitle: {
    fontSize: 14,
    color: '#6b7280',
  },
  chartContainer: {
    backgroundColor: '#ffffff',
    marginHorizontal: 20,
    marginTop: 20,
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  chartTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 16,
  },
  barChart: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'flex-end',
    height: 160,
  },
  barContainer: {
    alignItems: 'center',
    flex: 1,
  },
  barWrapper: {
    height: 120,
    justifyContent: 'flex-end',
    marginBottom: 8,
  },
  bar: {
    width: 24,
    borderRadius: 4,
    minHeight: 4,
  },
  barLabel: {
    fontSize: 12,
    color: '#6b7280',
    marginBottom: 2,
    textAlign: 'center',
  },
  barValue: {
    fontSize: 10,
    fontWeight: '600',
    color: '#1f2937',
    textAlign: 'center',
  },
  funnelChart: {
    paddingVertical: 8,
  },
  funnelItem: {
    marginBottom: 12,
  },
  funnelBar: {
    height: 32,
    backgroundColor: '#f3f4f6',
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 4,
  },
  funnelSegment: {
    height: '100%',
    borderRadius: 16,
  },
  funnelInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  funnelLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1f2937',
    flex: 1,
  },
  funnelValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1f2937',
    marginHorizontal: 12,
  },
  funnelRate: {
    fontSize: 12,
    color: '#6b7280',
    minWidth: 40,
    textAlign: 'right',
  },
  quickActions: {
    marginHorizontal: 20,
    marginTop: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 16,
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  actionButton: {
    flex: 1,
    marginHorizontal: 4,
  },
  reportSummary: {
    marginHorizontal: 20,
    marginTop: 20,
    marginBottom: 40,
  },
  summaryCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  summaryText: {
    fontSize: 14,
    color: '#6b7280',
    lineHeight: 20,
    marginBottom: 16,
  },
  summaryActions: {
    alignItems: 'flex-start',
  },
});

export default ReportsScreen;