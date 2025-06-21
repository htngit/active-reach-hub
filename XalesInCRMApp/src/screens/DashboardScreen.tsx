import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { Button, Icon } from '@components';

interface DashboardScreenProps {
  navigation: any;
}

interface DashboardStats {
  totalLeads: number;
  convertedLeads: number;
  totalRevenue: number;
  activeDeals: number;
}

interface RecentActivity {
  id: string;
  type: 'lead' | 'deal' | 'contact' | 'task';
  title: string;
  description: string;
  timestamp: string;
  status?: 'completed' | 'pending' | 'overdue';
}

const { width } = Dimensions.get('window');

export const DashboardScreen: React.FC<DashboardScreenProps> = ({ navigation }) => {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [stats, setStats] = useState<DashboardStats>({
    totalLeads: 0,
    convertedLeads: 0,
    totalRevenue: 0,
    activeDeals: 0,
  });
  const [recentActivities, setRecentActivities] = useState<RecentActivity[]>([]);

  // Load dashboard data
  const loadDashboardData = async () => {
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Mock data
      setStats({
        totalLeads: 156,
        convertedLeads: 42,
        totalRevenue: 125000,
        activeDeals: 23,
      });

      setRecentActivities([
        {
          id: '1',
          type: 'lead',
          title: 'New Lead Added',
          description: 'John Doe from ABC Corp',
          timestamp: '2 hours ago',
          status: 'pending',
        },
        {
          id: '2',
          type: 'deal',
          title: 'Deal Closed',
          description: 'Software License - $15,000',
          timestamp: '4 hours ago',
          status: 'completed',
        },
        {
          id: '3',
          type: 'task',
          title: 'Follow-up Call',
          description: 'Call Sarah Johnson about proposal',
          timestamp: '1 day ago',
          status: 'overdue',
        },
        {
          id: '4',
          type: 'contact',
          title: 'Contact Updated',
          description: 'Mike Wilson contact information',
          timestamp: '2 days ago',
          status: 'completed',
        },
      ]);
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    }
  };

  // Handle refresh
  const handleRefresh = async () => {
    setIsRefreshing(true);
    await loadDashboardData();
    setIsRefreshing(false);
  };

  // Load data on component mount
  useEffect(() => {
    loadDashboardData();
  }, []);

  // Format currency
  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  // Get activity icon
  const getActivityIcon = (type: string): string => {
    switch (type) {
      case 'lead':
        return 'user-plus';
      case 'deal':
        return 'dollar-sign';
      case 'contact':
        return 'users';
      case 'task':
        return 'check-square';
      default:
        return 'bell';
    }
  };

  // Get status color
  const getStatusColor = (status?: string): string => {
    switch (status) {
      case 'completed':
        return '#10b981';
      case 'pending':
        return '#f59e0b';
      case 'overdue':
        return '#ef4444';
      default:
        return '#6b7280';
    }
  };

  // Render stat card
  const renderStatCard = (title: string, value: string | number, icon: string, color: string) => (
    <View style={[styles.statCard, { borderLeftColor: color }]}>
      <View style={styles.statHeader}>
        <Icon name={icon} size={24} color={color} />
        <Text style={styles.statTitle}>{title}</Text>
      </View>
      <Text style={styles.statValue}>{value}</Text>
    </View>
  );

  // Render activity item
  const renderActivityItem = (activity: RecentActivity) => (
    <TouchableOpacity key={activity.id} style={styles.activityItem}>
      <View style={styles.activityIcon}>
        <Icon name={getActivityIcon(activity.type)} size={20} color="#6b7280" />
      </View>
      <View style={styles.activityContent}>
        <Text style={styles.activityTitle}>{activity.title}</Text>
        <Text style={styles.activityDescription}>{activity.description}</Text>
        <Text style={styles.activityTimestamp}>{activity.timestamp}</Text>
      </View>
      {activity.status && (
        <View style={[styles.statusDot, { backgroundColor: getStatusColor(activity.status) }]} />
      )}
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>Good morning!</Text>
            <Text style={styles.userName}>Welcome back to XalesIn CRM</Text>
          </View>
          <TouchableOpacity style={styles.notificationButton}>
            <Icon name="bell" size={24} color="#6b7280" />
          </TouchableOpacity>
        </View>

        {/* Stats Cards */}
        <View style={styles.statsContainer}>
          <View style={styles.statsRow}>
            {renderStatCard('Total Leads', stats.totalLeads, 'users', '#3b82f6')}
            {renderStatCard('Converted', stats.convertedLeads, 'check-circle', '#10b981')}
          </View>
          <View style={styles.statsRow}>
            {renderStatCard('Revenue', formatCurrency(stats.totalRevenue), 'dollar-sign', '#f59e0b')}
            {renderStatCard('Active Deals', stats.activeDeals, 'trending-up', '#8b5cf6')}
          </View>
        </View>

        {/* Quick Actions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <View style={styles.quickActions}>
            <Button
              title="Add Lead"
              leftIcon="user-plus"
              onPress={() => navigation.navigate('AddLead')}
              style={styles.actionButton}
              size="sm"
            />
            <Button
              title="New Deal"
              leftIcon="plus-circle"
              onPress={() => navigation.navigate('AddDeal')}
              style={styles.actionButton}
              variant="outline"
              size="sm"
            />
            <Button
              title="View Reports"
              leftIcon="bar-chart"
              onPress={() => navigation.navigate('Reports')}
              style={styles.actionButton}
              variant="outline"
              size="sm"
            />
          </View>
        </View>

        {/* Recent Activities */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Recent Activities</Text>
            <TouchableOpacity onPress={() => navigation.navigate('Activities')}>
              <Text style={styles.viewAllText}>View All</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.activitiesContainer}>
            {recentActivities.map(renderActivityItem)}
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
  scrollView: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#ffffff',
  },
  greeting: {
    fontSize: 16,
    color: '#6b7280',
  },
  userName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1f2937',
    marginTop: 2,
  },
  notificationButton: {
    padding: 8,
  },
  statsContainer: {
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 6,
    borderLeftWidth: 4,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  statHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  statTitle: {
    fontSize: 14,
    color: '#6b7280',
    marginLeft: 8,
    fontWeight: '500',
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  section: {
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  viewAllText: {
    fontSize: 14,
    color: '#3b82f6',
    fontWeight: '600',
  },
  quickActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  actionButton: {
    flex: 1,
    marginHorizontal: 4,
  },
  activitiesContainer: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    overflow: 'hidden',
  },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  activityIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f3f4f6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  activityContent: {
    flex: 1,
  },
  activityTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 2,
  },
  activityDescription: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 2,
  },
  activityTimestamp: {
    fontSize: 12,
    color: '#9ca3af',
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginLeft: 8,
  },
});

export default DashboardScreen;