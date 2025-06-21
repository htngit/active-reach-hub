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
} from 'react-native';
import { Button, Icon, Input, Select, Menu, MenuItem } from '@components';

interface Lead {
  id: string;
  name: string;
  email: string;
  phone: string;
  company: string;
  status: 'new' | 'contacted' | 'qualified' | 'converted' | 'lost';
  source: string;
  value: number;
  createdAt: string;
  lastContact?: string;
}

interface LeadsScreenProps {
  navigation: any;
}

const statusOptions = [
  { label: 'All Status', value: 'all' },
  { label: 'New', value: 'new' },
  { label: 'Contacted', value: 'contacted' },
  { label: 'Qualified', value: 'qualified' },
  { label: 'Converted', value: 'converted' },
  { label: 'Lost', value: 'lost' },
];

const sortOptions = [
  { label: 'Recent First', value: 'recent' },
  { label: 'Oldest First', value: 'oldest' },
  { label: 'Name A-Z', value: 'name_asc' },
  { label: 'Name Z-A', value: 'name_desc' },
  { label: 'Value High-Low', value: 'value_desc' },
  { label: 'Value Low-High', value: 'value_asc' },
];

export const LeadsScreen: React.FC<LeadsScreenProps> = ({ navigation }) => {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [filteredLeads, setFilteredLeads] = useState<Lead[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortBy, setSortBy] = useState('recent');
  const [selectedLeads, setSelectedLeads] = useState<string[]>([]);
  const [isSelectionMode, setIsSelectionMode] = useState(false);

  // Load leads data
  const loadLeads = async () => {
    try {
      setIsLoading(true);
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Mock data
      const mockLeads: Lead[] = [
        {
          id: '1',
          name: 'John Doe',
          email: 'john.doe@example.com',
          phone: '+1 (555) 123-4567',
          company: 'ABC Corp',
          status: 'new',
          source: 'Website',
          value: 15000,
          createdAt: '2024-01-15T10:30:00Z',
        },
        {
          id: '2',
          name: 'Sarah Johnson',
          email: 'sarah.j@techstart.com',
          phone: '+1 (555) 987-6543',
          company: 'TechStart Inc',
          status: 'contacted',
          source: 'Referral',
          value: 25000,
          createdAt: '2024-01-14T14:20:00Z',
          lastContact: '2024-01-16T09:15:00Z',
        },
        {
          id: '3',
          name: 'Mike Wilson',
          email: 'mike.wilson@innovate.co',
          phone: '+1 (555) 456-7890',
          company: 'Innovate Co',
          status: 'qualified',
          source: 'LinkedIn',
          value: 50000,
          createdAt: '2024-01-13T16:45:00Z',
          lastContact: '2024-01-17T11:30:00Z',
        },
        {
          id: '4',
          name: 'Emily Chen',
          email: 'emily.chen@globaltech.com',
          phone: '+1 (555) 321-0987',
          company: 'GlobalTech',
          status: 'converted',
          source: 'Cold Email',
          value: 75000,
          createdAt: '2024-01-12T08:15:00Z',
          lastContact: '2024-01-18T15:45:00Z',
        },
        {
          id: '5',
          name: 'David Brown',
          email: 'david.brown@startup.io',
          phone: '+1 (555) 654-3210',
          company: 'Startup.io',
          status: 'lost',
          source: 'Trade Show',
          value: 30000,
          createdAt: '2024-01-11T12:00:00Z',
          lastContact: '2024-01-19T10:20:00Z',
        },
      ];
      
      setLeads(mockLeads);
    } catch (error) {
      console.error('Error loading leads:', error);
      Alert.alert('Error', 'Failed to load leads');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle refresh
  const handleRefresh = async () => {
    setIsRefreshing(true);
    await loadLeads();
    setIsRefreshing(false);
  };

  // Filter and sort leads
  useEffect(() => {
    let filtered = [...leads];

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        lead =>
          lead.name.toLowerCase().includes(query) ||
          lead.email.toLowerCase().includes(query) ||
          lead.company.toLowerCase().includes(query) ||
          lead.phone.includes(query)
      );
    }

    // Apply status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(lead => lead.status === statusFilter);
    }

    // Apply sorting
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'oldest':
          return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        case 'name_asc':
          return a.name.localeCompare(b.name);
        case 'name_desc':
          return b.name.localeCompare(a.name);
        case 'value_desc':
          return b.value - a.value;
        case 'value_asc':
          return a.value - b.value;
        case 'recent':
        default:
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      }
    });

    setFilteredLeads(filtered);
  }, [leads, searchQuery, statusFilter, sortBy]);

  // Load data on component mount
  useEffect(() => {
    loadLeads();
  }, []);

  // Get status color
  const getStatusColor = (status: string): string => {
    switch (status) {
      case 'new':
        return '#3b82f6';
      case 'contacted':
        return '#f59e0b';
      case 'qualified':
        return '#8b5cf6';
      case 'converted':
        return '#10b981';
      case 'lost':
        return '#ef4444';
      default:
        return '#6b7280';
    }
  };

  // Format currency
  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  // Format date
  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  // Handle lead selection
  const toggleLeadSelection = (leadId: string) => {
    setSelectedLeads(prev => {
      if (prev.includes(leadId)) {
        return prev.filter(id => id !== leadId);
      } else {
        return [...prev, leadId];
      }
    });
  };

  // Handle bulk actions
  const handleBulkAction = (action: string) => {
    Alert.alert(
      'Confirm Action',
      `Are you sure you want to ${action} ${selectedLeads.length} lead(s)?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Confirm',
          onPress: () => {
            // Implement bulk action logic here
            console.log(`Bulk ${action} for leads:`, selectedLeads);
            setSelectedLeads([]);
            setIsSelectionMode(false);
          },
        },
      ]
    );
  };

  // Render lead item
  const renderLeadItem = ({ item }: { item: Lead }) => (
    <TouchableOpacity
      style={[
        styles.leadItem,
        selectedLeads.includes(item.id) && styles.selectedLeadItem,
      ]}
      onPress={() => {
        if (isSelectionMode) {
          toggleLeadSelection(item.id);
        } else {
          navigation.navigate('LeadDetails', { leadId: item.id });
        }
      }}
      onLongPress={() => {
        if (!isSelectionMode) {
          setIsSelectionMode(true);
          toggleLeadSelection(item.id);
        }
      }}
    >
      {isSelectionMode && (
        <View style={styles.selectionIndicator}>
          <Icon
            name={selectedLeads.includes(item.id) ? 'check-circle' : 'circle'}
            size={20}
            color={selectedLeads.includes(item.id) ? '#3b82f6' : '#d1d5db'}
          />
        </View>
      )}
      
      <View style={styles.leadContent}>
        <View style={styles.leadHeader}>
          <Text style={styles.leadName}>{item.name}</Text>
          <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) }]}>
            <Text style={styles.statusText}>{item.status.toUpperCase()}</Text>
          </View>
        </View>
        
        <Text style={styles.leadCompany}>{item.company}</Text>
        <Text style={styles.leadEmail}>{item.email}</Text>
        
        <View style={styles.leadFooter}>
          <Text style={styles.leadValue}>{formatCurrency(item.value)}</Text>
          <Text style={styles.leadDate}>{formatDate(item.createdAt)}</Text>
        </View>
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
          onPress={() => navigation.navigate('LeadDetails', { leadId: item.id })}
        />
        <MenuItem
          title="Edit Lead"
          onPress={() => navigation.navigate('EditLead', { leadId: item.id })}
        />
        <MenuItem
          title="Convert to Deal"
          onPress={() => navigation.navigate('ConvertLead', { leadId: item.id })}
        />
        <MenuItem
          title="Delete"
          onPress={() => {
            Alert.alert(
              'Delete Lead',
              'Are you sure you want to delete this lead?',
              [
                { text: 'Cancel', style: 'cancel' },
                { text: 'Delete', style: 'destructive', onPress: () => console.log('Delete lead:', item.id) },
              ]
            );
          }}
        />
      </Menu>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.title}>Leads</Text>
          <Text style={styles.subtitle}>{filteredLeads.length} leads</Text>
        </View>
        <View style={styles.headerRight}>
          {isSelectionMode ? (
            <TouchableOpacity
              style={styles.headerButton}
              onPress={() => {
                setIsSelectionMode(false);
                setSelectedLeads([]);
              }}
            >
              <Text style={styles.cancelText}>Cancel</Text>
            </TouchableOpacity>
          ) : (
            <Button
              title="Add Lead"
              leftIcon="plus"
              onPress={() => navigation.navigate('AddLead')}
              size="sm"
            />
          )}
        </View>
      </View>

      {/* Bulk Actions */}
      {isSelectionMode && selectedLeads.length > 0 && (
        <View style={styles.bulkActions}>
          <Text style={styles.bulkActionsText}>
            {selectedLeads.length} selected
          </Text>
          <View style={styles.bulkActionsButtons}>
            <Button
              title="Update Status"
              onPress={() => handleBulkAction('update status')}
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
          placeholder="Search leads..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          leftIcon="search"
          style={styles.searchInput}
        />
        
        <View style={styles.filterRow}>
          <Select
            options={statusOptions}
            value={statusFilter}
            onValueChange={setStatusFilter}
            placeholder="Status"
            style={styles.filterSelect}
          />
          
          <Select
            options={sortOptions}
            value={sortBy}
            onValueChange={setSortBy}
            placeholder="Sort by"
            style={styles.filterSelect}
          />
        </View>
      </View>

      {/* Leads List */}
      <FlatList
        data={filteredLeads}
        renderItem={renderLeadItem}
        keyExtractor={item => item.id}
        style={styles.list}
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} />
        }
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Icon name="users" size={48} color="#d1d5db" />
            <Text style={styles.emptyStateTitle}>No leads found</Text>
            <Text style={styles.emptyStateText}>
              {searchQuery || statusFilter !== 'all'
                ? 'Try adjusting your filters'
                : 'Add your first lead to get started'}
            </Text>
            {!searchQuery && statusFilter === 'all' && (
              <Button
                title="Add Lead"
                onPress={() => navigation.navigate('AddLead')}
                style={styles.emptyStateButton}
              />
            )}
          </View>
        }
      />
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
  },
  filterSelect: {
    flex: 1,
    marginHorizontal: 4,
  },
  list: {
    flex: 1,
  },
  leadItem: {
    flexDirection: 'row',
    alignItems: 'center',
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
  selectedLeadItem: {
    backgroundColor: '#eff6ff',
    borderColor: '#3b82f6',
    borderWidth: 1,
  },
  selectionIndicator: {
    marginRight: 12,
  },
  leadContent: {
    flex: 1,
  },
  leadHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  leadName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    flex: 1,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
    marginLeft: 8,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#ffffff',
  },
  leadCompany: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 2,
  },
  leadEmail: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 8,
  },
  leadFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  leadValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#10b981',
  },
  leadDate: {
    fontSize: 12,
    color: '#9ca3af',
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

export default LeadsScreen;