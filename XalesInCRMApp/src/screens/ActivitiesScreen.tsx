import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  Alert,
  SectionList,
} from 'react-native';
import { Button, Icon, Input, Select, Menu, MenuItem } from '@components';

interface Activity {
  id: string;
  type: 'call' | 'email' | 'meeting' | 'task' | 'note' | 'demo' | 'follow_up';
  title: string;
  description?: string;
  relatedTo: {
    type: 'lead' | 'contact' | 'deal' | 'company';
    id: string;
    name: string;
  };
  assignedTo: string;
  status: 'pending' | 'completed' | 'cancelled' | 'overdue';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  dueDate?: string;
  completedAt?: string;
  createdAt: string;
  duration?: number; // in minutes
  outcome?: string;
}

interface ActivitiesScreenProps {
  navigation: any;
}

const typeOptions = [
  { label: 'All Types', value: 'all' },
  { label: 'Call', value: 'call' },
  { label: 'Email', value: 'email' },
  { label: 'Meeting', value: 'meeting' },
  { label: 'Task', value: 'task' },
  { label: 'Note', value: 'note' },
  { label: 'Demo', value: 'demo' },
  { label: 'Follow Up', value: 'follow_up' },
];

const statusOptions = [
  { label: 'All Status', value: 'all' },
  { label: 'Pending', value: 'pending' },
  { label: 'Completed', value: 'completed' },
  { label: 'Cancelled', value: 'cancelled' },
  { label: 'Overdue', value: 'overdue' },
];

const priorityOptions = [
  { label: 'All Priority', value: 'all' },
  { label: 'Low', value: 'low' },
  { label: 'Medium', value: 'medium' },
  { label: 'High', value: 'high' },
  { label: 'Urgent', value: 'urgent' },
];

const sortOptions = [
  { label: 'Due Date', value: 'due_date' },
  { label: 'Recent First', value: 'recent' },
  { label: 'Oldest First', value: 'oldest' },
  { label: 'Priority High-Low', value: 'priority_desc' },
  { label: 'Status', value: 'status' },
];

const viewModeOptions = [
  { label: 'List View', value: 'list' },
  { label: 'Timeline View', value: 'timeline' },
];

export const ActivitiesScreen: React.FC<ActivitiesScreenProps> = ({ navigation }) => {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [filteredActivities, setFilteredActivities] = useState<Activity[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [sortBy, setSortBy] = useState('due_date');
  const [viewMode, setViewMode] = useState<'list' | 'timeline'>('list');
  const [selectedActivities, setSelectedActivities] = useState<string[]>([]);
  const [isSelectionMode, setIsSelectionMode] = useState(false);

  // Load activities data
  const loadActivities = async () => {
    try {
      setIsLoading(true);
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Mock data
      const mockActivities: Activity[] = [
        {
          id: '1',
          type: 'call',
          title: 'Follow-up call with John Doe',
          description: 'Discuss enterprise software requirements and pricing',
          relatedTo: {
            type: 'lead',
            id: '1',
            name: 'John Doe - ABC Corp',
          },
          assignedTo: 'Sarah Johnson',
          status: 'pending',
          priority: 'high',
          dueDate: '2024-01-20T14:00:00Z',
          createdAt: '2024-01-18T10:30:00Z',
          duration: 30,
        },
        {
          id: '2',
          type: 'email',
          title: 'Send proposal to TechStart Inc',
          description: 'Cloud migration project proposal with detailed timeline',
          relatedTo: {
            type: 'deal',
            id: '2',
            name: 'Cloud Migration Project - TechStart Inc',
          },
          assignedTo: 'Mike Wilson',
          status: 'completed',
          priority: 'medium',
          dueDate: '2024-01-19T09:00:00Z',
          completedAt: '2024-01-19T08:45:00Z',
          createdAt: '2024-01-17T14:20:00Z',
        },
        {
          id: '3',
          type: 'meeting',
          title: 'Product demo for Innovate Co',
          description: 'Demonstrate digital transformation capabilities',
          relatedTo: {
            type: 'deal',
            id: '3',
            name: 'Digital Transformation - Innovate Co',
          },
          assignedTo: 'Emily Chen',
          status: 'pending',
          priority: 'high',
          dueDate: '2024-01-22T15:30:00Z',
          createdAt: '2024-01-16T16:45:00Z',
          duration: 60,
        },
        {
          id: '4',
          type: 'task',
          title: 'Prepare contract for GlobalTech',
          description: 'CRM implementation contract with custom terms',
          relatedTo: {
            type: 'deal',
            id: '4',
            name: 'CRM Implementation - GlobalTech',
          },
          assignedTo: 'David Brown',
          status: 'completed',
          priority: 'urgent',
          dueDate: '2024-01-18T17:00:00Z',
          completedAt: '2024-01-18T16:30:00Z',
          createdAt: '2024-01-15T08:15:00Z',
          outcome: 'Contract prepared and sent for review',
        },
        {
          id: '5',
          type: 'note',
          title: 'Meeting notes - Startup.io discussion',
          description: 'Security audit requirements and budget constraints',
          relatedTo: {
            type: 'contact',
            id: '5',
            name: 'David Brown - Startup.io',
          },
          assignedTo: 'Lisa Anderson',
          status: 'completed',
          priority: 'low',
          completedAt: '2024-01-17T11:20:00Z',
          createdAt: '2024-01-17T11:00:00Z',
        },
        {
          id: '6',
          type: 'follow_up',
          title: 'Follow up on Marketing Pro decision',
          description: 'Check on marketing automation project status',
          relatedTo: {
            type: 'deal',
            id: '6',
            name: 'Marketing Automation - Marketing Pro',
          },
          assignedTo: 'Sarah Johnson',
          status: 'overdue',
          priority: 'medium',
          dueDate: '2024-01-19T10:00:00Z',
          createdAt: '2024-01-15T09:30:00Z',
        },
        {
          id: '7',
          type: 'demo',
          title: 'Technical demo for ABC Corp',
          description: 'Deep dive into enterprise features and integrations',
          relatedTo: {
            type: 'lead',
            id: '1',
            name: 'John Doe - ABC Corp',
          },
          assignedTo: 'Mike Wilson',
          status: 'pending',
          priority: 'high',
          dueDate: '2024-01-25T14:00:00Z',
          createdAt: '2024-01-18T12:00:00Z',
          duration: 90,
        },
      ];
      
      setActivities(mockActivities);
    } catch (error) {
      console.error('Error loading activities:', error);
      Alert.alert('Error', 'Failed to load activities');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle refresh
  const handleRefresh = async () => {
    setIsRefreshing(true);
    await loadActivities();
    setIsRefreshing(false);
  };

  // Filter and sort activities
  useEffect(() => {
    let filtered = [...activities];

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        activity =>
          activity.title.toLowerCase().includes(query) ||
          activity.description?.toLowerCase().includes(query) ||
          activity.relatedTo.name.toLowerCase().includes(query) ||
          activity.assignedTo.toLowerCase().includes(query)
      );
    }

    // Apply type filter
    if (typeFilter !== 'all') {
      filtered = filtered.filter(activity => activity.type === typeFilter);
    }

    // Apply status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(activity => activity.status === statusFilter);
    }

    // Apply priority filter
    if (priorityFilter !== 'all') {
      filtered = filtered.filter(activity => activity.priority === priorityFilter);
    }

    // Apply sorting
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'recent':
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        case 'oldest':
          return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        case 'priority_desc':
          const priorityOrder = { urgent: 4, high: 3, medium: 2, low: 1 };
          return priorityOrder[b.priority] - priorityOrder[a.priority];
        case 'status':
          return a.status.localeCompare(b.status);
        case 'due_date':
        default:
          if (!a.dueDate && !b.dueDate) return 0;
          if (!a.dueDate) return 1;
          if (!b.dueDate) return -1;
          return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
      }
    });

    setFilteredActivities(filtered);
  }, [activities, searchQuery, typeFilter, statusFilter, priorityFilter, sortBy]);

  // Load data on component mount
  useEffect(() => {
    loadActivities();
  }, []);

  // Get type icon
  const getTypeIcon = (type: string): string => {
    switch (type) {
      case 'call':
        return 'phone';
      case 'email':
        return 'mail';
      case 'meeting':
        return 'calendar';
      case 'task':
        return 'check-square';
      case 'note':
        return 'file-text';
      case 'demo':
        return 'monitor';
      case 'follow_up':
        return 'clock';
      default:
        return 'activity';
    }
  };

  // Get type color
  const getTypeColor = (type: string): string => {
    switch (type) {
      case 'call':
        return '#3b82f6';
      case 'email':
        return '#10b981';
      case 'meeting':
        return '#8b5cf6';
      case 'task':
        return '#f59e0b';
      case 'note':
        return '#6b7280';
      case 'demo':
        return '#ec4899';
      case 'follow_up':
        return '#ef4444';
      default:
        return '#6b7280';
    }
  };

  // Get status color
  const getStatusColor = (status: string): string => {
    switch (status) {
      case 'pending':
        return '#f59e0b';
      case 'completed':
        return '#10b981';
      case 'cancelled':
        return '#6b7280';
      case 'overdue':
        return '#ef4444';
      default:
        return '#6b7280';
    }
  };

  // Get priority color
  const getPriorityColor = (priority: string): string => {
    switch (priority) {
      case 'urgent':
        return '#ef4444';
      case 'high':
        return '#f59e0b';
      case 'medium':
        return '#3b82f6';
      case 'low':
        return '#6b7280';
      default:
        return '#6b7280';
    }
  };

  // Format date
  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  // Format time
  const formatTime = (dateString: string): string => {
    return new Date(dateString).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  };

  // Check if activity is overdue
  const isOverdue = (activity: Activity): boolean => {
    if (!activity.dueDate || activity.status === 'completed' || activity.status === 'cancelled') {
      return false;
    }
    return new Date(activity.dueDate) < new Date();
  };

  // Handle activity selection
  const toggleActivitySelection = (activityId: string) => {
    setSelectedActivities(prev => {
      if (prev.includes(activityId)) {
        return prev.filter(id => id !== activityId);
      } else {
        return [...prev, activityId];
      }
    });
  };

  // Handle bulk actions
  const handleBulkAction = (action: string) => {
    Alert.alert(
      'Confirm Action',
      `Are you sure you want to ${action} ${selectedActivities.length} activity(ies)?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Confirm',
          onPress: () => {
            // Implement bulk action logic here
            console.log(`Bulk ${action} for activities:`, selectedActivities);
            setSelectedActivities([]);
            setIsSelectionMode(false);
          },
        },
      ]
    );
  };

  // Group activities by date for timeline view
  const groupActivitiesByDate = () => {
    const grouped = filteredActivities.reduce((acc, activity) => {
      const date = activity.dueDate ? formatDate(activity.dueDate) : 'No Due Date';
      if (!acc[date]) {
        acc[date] = [];
      }
      acc[date].push(activity);
      return acc;
    }, {} as Record<string, Activity[]>);

    return Object.entries(grouped).map(([date, activities]) => ({
      title: date,
      data: activities,
    }));
  };

  // Render activity item
  const renderActivityItem = ({ item }: { item: Activity }) => (
    <TouchableOpacity
      style={[
        styles.activityItem,
        selectedActivities.includes(item.id) && styles.selectedActivityItem,
        isOverdue(item) && styles.overdueActivityItem,
      ]}
      onPress={() => {
        if (isSelectionMode) {
          toggleActivitySelection(item.id);
        } else {
          navigation.navigate('ActivityDetails', { activityId: item.id });
        }
      }}
      onLongPress={() => {
        if (!isSelectionMode) {
          setIsSelectionMode(true);
          toggleActivitySelection(item.id);
        }
      }}
    >
      {isSelectionMode && (
        <View style={styles.selectionIndicator}>
          <Icon
            name={selectedActivities.includes(item.id) ? 'check-circle' : 'circle'}
            size={20}
            color={selectedActivities.includes(item.id) ? '#3b82f6' : '#d1d5db'}
          />
        </View>
      )}
      
      {/* Type Icon */}
      <View style={[styles.typeIcon, { backgroundColor: getTypeColor(item.type) }]}>
        <Icon name={getTypeIcon(item.type)} size={16} color="#ffffff" />
      </View>
      
      <View style={styles.activityContent}>
        <View style={styles.activityHeader}>
          <Text style={styles.activityTitle}>{item.title}</Text>
          <View style={styles.badges}>
            <View style={[styles.priorityBadge, { backgroundColor: getPriorityColor(item.priority) }]}>
              <Text style={styles.badgeText}>{item.priority.toUpperCase()}</Text>
            </View>
            <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) }]}>
              <Text style={styles.badgeText}>{item.status.toUpperCase()}</Text>
            </View>
          </View>
        </View>
        
        {item.description && (
          <Text style={styles.activityDescription} numberOfLines={2}>
            {item.description}
          </Text>
        )}
        
        <Text style={styles.activityRelated}>
          Related to: {item.relatedTo.name}
        </Text>
        
        <View style={styles.activityFooter}>
          <Text style={styles.activityAssigned}>Assigned to: {item.assignedTo}</Text>
          
          <View style={styles.activityDates}>
            {item.dueDate && (
              <Text style={[styles.activityDueDate, isOverdue(item) && styles.overdueText]}>
                Due: {formatDate(item.dueDate)} at {formatTime(item.dueDate)}
              </Text>
            )}
            {item.completedAt && (
              <Text style={styles.activityCompletedDate}>
                Completed: {formatDate(item.completedAt)}
              </Text>
            )}
          </View>
        </View>
        
        {item.outcome && (
          <Text style={styles.activityOutcome}>Outcome: {item.outcome}</Text>
        )}
      </View>
      
      <Menu
        trigger={
          <TouchableOpacity style={styles.menuButton}>
            <Icon name="more-vertical" size={20} color="#6b7280" />
          </TouchableOpacity>
        }
      >
        <MenuItem
          title="View Details"
          onPress={() => navigation.navigate('ActivityDetails', { activityId: item.id })}
        />
        <MenuItem
          title="Edit Activity"
          onPress={() => navigation.navigate('EditActivity', { activityId: item.id })}
        />
        {item.status === 'pending' && (
          <MenuItem
            title="Mark Complete"
            onPress={() => console.log('Mark complete:', item.id)}
          />
        )}
        <MenuItem
          title="Duplicate"
          onPress={() => navigation.navigate('AddActivity', { duplicateFrom: item.id })}
        />
        <MenuItem
          title="Delete"
          onPress={() => {
            Alert.alert(
              'Delete Activity',
              'Are you sure you want to delete this activity?',
              [
                { text: 'Cancel', style: 'cancel' },
                { text: 'Delete', style: 'destructive', onPress: () => console.log('Delete activity:', item.id) },
              ]
            );
          }}
        />
      </Menu>
    </TouchableOpacity>
  );

  // Render timeline section header
  const renderSectionHeader = ({ section }: { section: { title: string } }) => (
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionHeaderText}>{section.title}</Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.title}>Activities</Text>
          <Text style={styles.subtitle}>{filteredActivities.length} activities</Text>
        </View>
        <View style={styles.headerRight}>
          {isSelectionMode ? (
            <TouchableOpacity
              style={styles.headerButton}
              onPress={() => {
                setIsSelectionMode(false);
                setSelectedActivities([]);
              }}
            >
              <Text style={styles.cancelText}>Cancel</Text>
            </TouchableOpacity>
          ) : (
            <Button
              title="Add Activity"
              leftIcon="plus"
              onPress={() => navigation.navigate('AddActivity')}
              size="sm"
            />
          )}
        </View>
      </View>

      {/* Bulk Actions */}
      {isSelectionMode && selectedActivities.length > 0 && (
        <View style={styles.bulkActions}>
          <Text style={styles.bulkActionsText}>
            {selectedActivities.length} selected
          </Text>
          <View style={styles.bulkActionsButtons}>
            <Button
              title="Complete"
              onPress={() => handleBulkAction('complete')}
              size="sm"
              variant="outline"
              style={styles.bulkActionButton}
            />
            <Button
              title="Reschedule"
              onPress={() => handleBulkAction('reschedule')}
              size="sm"
              variant="outline"
              style={styles.bulkActionButton}
            />
            <Button
              title="Delete"
              onPress={() => handleBulkAction('delete')}
              size="sm"
              variant="outline"
              style={styles.bulkActionButton}
            />
          </View>
        </View>
      )}

      {/* Filters */}
      <View style={styles.filters}>
        <Input
          placeholder="Search activities..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          leftIcon="search"
          style={styles.searchInput}
        />
        
        <View style={styles.filterRow}>
          <Select
            options={typeOptions}
            value={typeFilter}
            onValueChange={setTypeFilter}
            placeholder="Type"
            style={styles.filterSelect}
          />
          
          <Select
            options={statusOptions}
            value={statusFilter}
            onValueChange={setStatusFilter}
            placeholder="Status"
            style={styles.filterSelect}
          />
        </View>
        
        <View style={styles.filterRow}>
          <Select
            options={priorityOptions}
            value={priorityFilter}
            onValueChange={setPriorityFilter}
            placeholder="Priority"
            style={styles.filterSelect}
          />
          
          <Select
            options={sortOptions}
            value={sortBy}
            onValueChange={setSortBy}
            placeholder="Sort by"
            style={styles.filterSelect}
          />
          
          <Select
            options={viewModeOptions}
            value={viewMode}
            onValueChange={(value) => setViewMode(value as 'list' | 'timeline')}
            placeholder="View"
            style={styles.filterSelect}
          />
        </View>
      </View>

      {/* Content */}
      {viewMode === 'list' ? (
        <FlatList
          data={filteredActivities}
          renderItem={renderActivityItem}
          keyExtractor={item => item.id}
          style={styles.list}
          refreshControl={
            <RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} />
          }
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Icon name="activity" size={48} color="#d1d5db" />
              <Text style={styles.emptyStateTitle}>No activities found</Text>
              <Text style={styles.emptyStateText}>
                {searchQuery || typeFilter !== 'all' || statusFilter !== 'all' || priorityFilter !== 'all'
                  ? 'Try adjusting your filters'
                  : 'Add your first activity to get started'}
              </Text>
              {!searchQuery && typeFilter === 'all' && statusFilter === 'all' && priorityFilter === 'all' && (
                <Button
                  title="Add Activity"
                  onPress={() => navigation.navigate('AddActivity')}
                  style={styles.emptyStateButton}
                />
              )}
            </View>
          }
        />
      ) : (
        <SectionList
          sections={groupActivitiesByDate()}
          renderItem={renderActivityItem}
          renderSectionHeader={renderSectionHeader}
          keyExtractor={item => item.id}
          style={styles.list}
          refreshControl={
            <RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} />
          }
        />
      )}
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
  headerRight: {
    marginLeft: 16,
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
  headerButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  cancelText: {
    fontSize: 16,
    color: '#3b82f6',
    fontWeight: '600',
  },
  bulkActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: '#eff6ff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  bulkActionsText: {
    fontSize: 14,
    color: '#1f2937',
    fontWeight: '600',
  },
  bulkActionsButtons: {
    flexDirection: 'row',
  },
  bulkActionButton: {
    marginLeft: 8,
  },
  filters: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  searchInput: {
    marginBottom: 12,
  },
  filterRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  filterSelect: {
    flex: 1,
    marginHorizontal: 2,
  },
  list: {
    flex: 1,
  },
  sectionHeader: {
    backgroundColor: '#f3f4f6',
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  sectionHeaderText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
  },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#ffffff',
    marginHorizontal: 20,
    marginVertical: 4,
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  selectedActivityItem: {
    backgroundColor: '#eff6ff',
    borderColor: '#3b82f6',
    borderWidth: 1,
  },
  overdueActivityItem: {
    borderLeftWidth: 4,
    borderLeftColor: '#ef4444',
  },
  selectionIndicator: {
    marginRight: 12,
    marginTop: 2,
  },
  typeIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  activityContent: {
    flex: 1,
  },
  activityHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 4,
  },
  activityTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    flex: 1,
    marginRight: 8,
  },
  badges: {
    flexDirection: 'row',
  },
  priorityBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    marginLeft: 4,
  },
  statusBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    marginLeft: 4,
  },
  badgeText: {
    fontSize: 9,
    fontWeight: '600',
    color: '#ffffff',
  },
  activityDescription: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 4,
    lineHeight: 20,
  },
  activityRelated: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 8,
  },
  activityFooter: {
    marginBottom: 4,
  },
  activityAssigned: {
    fontSize: 12,
    color: '#9ca3af',
    marginBottom: 4,
  },
  activityDates: {
    alignItems: 'flex-start',
  },
  activityDueDate: {
    fontSize: 12,
    color: '#1f2937',
    fontWeight: '500',
  },
  activityCompletedDate: {
    fontSize: 12,
    color: '#10b981',
    fontWeight: '500',
  },
  overdueText: {
    color: '#ef4444',
  },
  activityOutcome: {
    fontSize: 12,
    color: '#6b7280',
    fontStyle: 'italic',
    marginTop: 4,
  },
  menuButton: {
    padding: 8,
    marginLeft: 8,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
    paddingVertical: 60,
  },
  emptyStateTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateText: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
    marginBottom: 24,
  },
  emptyStateButton: {
    marginTop: 16,
  },
});

export default ActivitiesScreen;