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
  ScrollView,
} from 'react-native';
import { Button, Icon, Input, Select, Menu, MenuItem } from '@components';

interface Deal {
  id: string;
  title: string;
  company: string;
  contact: string;
  value: number;
  stage: 'prospecting' | 'qualification' | 'proposal' | 'negotiation' | 'closed_won' | 'closed_lost';
  probability: number;
  expectedCloseDate: string;
  createdAt: string;
  lastActivity?: string;
  source: string;
  assignedTo: string;
  notes?: string;
}

interface DealsScreenProps {
  navigation: any;
}

const stageOptions = [
  { label: 'All Stages', value: 'all' },
  { label: 'Prospecting', value: 'prospecting' },
  { label: 'Qualification', value: 'qualification' },
  { label: 'Proposal', value: 'proposal' },
  { label: 'Negotiation', value: 'negotiation' },
  { label: 'Closed Won', value: 'closed_won' },
  { label: 'Closed Lost', value: 'closed_lost' },
];

const sortOptions = [
  { label: 'Value High-Low', value: 'value_desc' },
  { label: 'Value Low-High', value: 'value_asc' },
  { label: 'Close Date', value: 'close_date' },
  { label: 'Recent First', value: 'recent' },
  { label: 'Oldest First', value: 'oldest' },
  { label: 'Probability High-Low', value: 'probability_desc' },
  { label: 'Company A-Z', value: 'company_asc' },
];

const viewModeOptions = [
  { label: 'List View', value: 'list' },
  { label: 'Pipeline View', value: 'pipeline' },
];

export const DealsScreen: React.FC<DealsScreenProps> = ({ navigation }) => {
  const [deals, setDeals] = useState<Deal[]>([]);
  const [filteredDeals, setFilteredDeals] = useState<Deal[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [stageFilter, setStageFilter] = useState('all');
  const [sortBy, setSortBy] = useState('value_desc');
  const [viewMode, setViewMode] = useState<'list' | 'pipeline'>('list');
  const [selectedDeals, setSelectedDeals] = useState<string[]>([]);
  const [isSelectionMode, setIsSelectionMode] = useState(false);

  // Load deals data
  const loadDeals = async () => {
    try {
      setIsLoading(true);
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Mock data
      const mockDeals: Deal[] = [
        {
          id: '1',
          title: 'Enterprise Software License',
          company: 'ABC Corp',
          contact: 'John Doe',
          value: 150000,
          stage: 'negotiation',
          probability: 80,
          expectedCloseDate: '2024-02-15T00:00:00Z',
          createdAt: '2024-01-15T10:30:00Z',
          lastActivity: '2024-01-18T14:20:00Z',
          source: 'Website',
          assignedTo: 'Sarah Johnson',
        },
        {
          id: '2',
          title: 'Cloud Migration Project',
          company: 'TechStart Inc',
          contact: 'Sarah Johnson',
          value: 75000,
          stage: 'proposal',
          probability: 60,
          expectedCloseDate: '2024-02-28T00:00:00Z',
          createdAt: '2024-01-14T14:20:00Z',
          lastActivity: '2024-01-17T09:15:00Z',
          source: 'Referral',
          assignedTo: 'Mike Wilson',
        },
        {
          id: '3',
          title: 'Digital Transformation',
          company: 'Innovate Co',
          contact: 'Mike Wilson',
          value: 250000,
          stage: 'qualification',
          probability: 40,
          expectedCloseDate: '2024-03-15T00:00:00Z',
          createdAt: '2024-01-13T16:45:00Z',
          lastActivity: '2024-01-16T11:30:00Z',
          source: 'LinkedIn',
          assignedTo: 'Emily Chen',
        },
        {
          id: '4',
          title: 'CRM Implementation',
          company: 'GlobalTech',
          contact: 'Emily Chen',
          value: 120000,
          stage: 'closed_won',
          probability: 100,
          expectedCloseDate: '2024-01-20T00:00:00Z',
          createdAt: '2024-01-12T08:15:00Z',
          lastActivity: '2024-01-19T15:45:00Z',
          source: 'Cold Email',
          assignedTo: 'David Brown',
        },
        {
          id: '5',
          title: 'Security Audit Service',
          company: 'Startup.io',
          contact: 'David Brown',
          value: 45000,
          stage: 'prospecting',
          probability: 20,
          expectedCloseDate: '2024-04-01T00:00:00Z',
          createdAt: '2024-01-11T12:00:00Z',
          source: 'Trade Show',
          assignedTo: 'Lisa Anderson',
        },
        {
          id: '6',
          title: 'Marketing Automation',
          company: 'Marketing Pro',
          contact: 'Lisa Anderson',
          value: 85000,
          stage: 'closed_lost',
          probability: 0,
          expectedCloseDate: '2024-01-25T00:00:00Z',
          createdAt: '2024-01-10T09:30:00Z',
          lastActivity: '2024-01-20T16:00:00Z',
          source: 'Partner',
          assignedTo: 'Sarah Johnson',
        },
      ];
      
      setDeals(mockDeals);
    } catch (error) {
      console.error('Error loading deals:', error);
      Alert.alert('Error', 'Failed to load deals');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle refresh
  const handleRefresh = async () => {
    setIsRefreshing(true);
    await loadDeals();
    setIsRefreshing(false);
  };

  // Filter and sort deals
  useEffect(() => {
    let filtered = [...deals];

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        deal =>
          deal.title.toLowerCase().includes(query) ||
          deal.company.toLowerCase().includes(query) ||
          deal.contact.toLowerCase().includes(query) ||
          deal.assignedTo.toLowerCase().includes(query) ||
          deal.source.toLowerCase().includes(query)
      );
    }

    // Apply stage filter
    if (stageFilter !== 'all') {
      filtered = filtered.filter(deal => deal.stage === stageFilter);
    }

    // Apply sorting
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'value_asc':
          return a.value - b.value;
        case 'close_date':
          return new Date(a.expectedCloseDate).getTime() - new Date(b.expectedCloseDate).getTime();
        case 'recent':
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        case 'oldest':
          return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        case 'probability_desc':
          return b.probability - a.probability;
        case 'company_asc':
          return a.company.localeCompare(b.company);
        case 'value_desc':
        default:
          return b.value - a.value;
      }
    });

    setFilteredDeals(filtered);
  }, [deals, searchQuery, stageFilter, sortBy]);

  // Load data on component mount
  useEffect(() => {
    loadDeals();
  }, []);

  // Get stage color
  const getStageColor = (stage: string): string => {
    switch (stage) {
      case 'prospecting':
        return '#6b7280';
      case 'qualification':
        return '#3b82f6';
      case 'proposal':
        return '#f59e0b';
      case 'negotiation':
        return '#8b5cf6';
      case 'closed_won':
        return '#10b981';
      case 'closed_lost':
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

  // Get stage display name
  const getStageDisplayName = (stage: string): string => {
    return stage.split('_').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  };

  // Handle deal selection
  const toggleDealSelection = (dealId: string) => {
    setSelectedDeals(prev => {
      if (prev.includes(dealId)) {
        return prev.filter(id => id !== dealId);
      } else {
        return [...prev, dealId];
      }
    });
  };

  // Handle bulk actions
  const handleBulkAction = (action: string) => {
    Alert.alert(
      'Confirm Action',
      `Are you sure you want to ${action} ${selectedDeals.length} deal(s)?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Confirm',
          onPress: () => {
            // Implement bulk action logic here
            console.log(`Bulk ${action} for deals:`, selectedDeals);
            setSelectedDeals([]);
            setIsSelectionMode(false);
          },
        },
      ]
    );
  };

  // Group deals by stage for pipeline view
  const groupDealsByStage = () => {
    const stages = ['prospecting', 'qualification', 'proposal', 'negotiation', 'closed_won', 'closed_lost'];
    return stages.map(stage => ({
      stage,
      deals: filteredDeals.filter(deal => deal.stage === stage),
      totalValue: filteredDeals
        .filter(deal => deal.stage === stage)
        .reduce((sum, deal) => sum + deal.value, 0),
    }));
  };

  // Render deal item for list view
  const renderDealItem = ({ item }: { item: Deal }) => (
    <TouchableOpacity
      style={[
        styles.dealItem,
        selectedDeals.includes(item.id) && styles.selectedDealItem,
      ]}
      onPress={() => {
        if (isSelectionMode) {
          toggleDealSelection(item.id);
        } else {
          navigation.navigate('DealDetails', { dealId: item.id });
        }
      }}
      onLongPress={() => {
        if (!isSelectionMode) {
          setIsSelectionMode(true);
          toggleDealSelection(item.id);
        }
      }}
    >
      {isSelectionMode && (
        <View style={styles.selectionIndicator}>
          <Icon
            name={selectedDeals.includes(item.id) ? 'check-circle' : 'circle'}
            size={20}
            color={selectedDeals.includes(item.id) ? '#3b82f6' : '#d1d5db'}
          />
        </View>
      )}
      
      <View style={styles.dealContent}>
        <View style={styles.dealHeader}>
          <Text style={styles.dealTitle}>{item.title}</Text>
          <View style={[styles.stageBadge, { backgroundColor: getStageColor(item.stage) }]}>
            <Text style={styles.stageText}>{getStageDisplayName(item.stage)}</Text>
          </View>
        </View>
        
        <Text style={styles.dealCompany}>{item.company}</Text>
        <Text style={styles.dealContact}>Contact: {item.contact}</Text>
        <Text style={styles.dealAssigned}>Assigned to: {item.assignedTo}</Text>
        
        <View style={styles.dealMetrics}>
          <View style={styles.dealValue}>
            <Text style={styles.dealValueText}>{formatCurrency(item.value)}</Text>
            <Text style={styles.dealProbability}>{item.probability}% probability</Text>
          </View>
          
          <View style={styles.dealDates}>
            <Text style={styles.dealCloseDate}>Close: {formatDate(item.expectedCloseDate)}</Text>
            {item.lastActivity && (
              <Text style={styles.dealLastActivity}>Last activity: {formatDate(item.lastActivity)}</Text>
            )}
          </View>
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
          onPress={() => navigation.navigate('DealDetails', { dealId: item.id })}
        />
        <MenuItem
          title="Edit Deal"
          onPress={() => navigation.navigate('EditDeal', { dealId: item.id })}
        />
        <MenuItem
          title="Move Stage"
          onPress={() => navigation.navigate('MoveDealStage', { dealId: item.id })}
        />
        <MenuItem
          title="Add Activity"
          onPress={() => navigation.navigate('AddActivity', { dealId: item.id })}
        />
        <MenuItem
          title="Delete"
          onPress={() => {
            Alert.alert(
              'Delete Deal',
              'Are you sure you want to delete this deal?',
              [
                { text: 'Cancel', style: 'cancel' },
                { text: 'Delete', style: 'destructive', onPress: () => console.log('Delete deal:', item.id) },
              ]
            );
          }}
        />
      </Menu>
    </TouchableOpacity>
  );

  // Render pipeline stage
  const renderPipelineStage = (stageData: { stage: string; deals: Deal[]; totalValue: number }) => (
    <View key={stageData.stage} style={styles.pipelineStage}>
      <View style={[styles.pipelineStageHeader, { backgroundColor: getStageColor(stageData.stage) }]}>
        <Text style={styles.pipelineStageTitle}>{getStageDisplayName(stageData.stage)}</Text>
        <Text style={styles.pipelineStageCount}>{stageData.deals.length} deals</Text>
        <Text style={styles.pipelineStageValue}>{formatCurrency(stageData.totalValue)}</Text>
      </View>
      
      {stageData.deals.map(deal => (
        <TouchableOpacity
          key={deal.id}
          style={styles.pipelineDealItem}
          onPress={() => navigation.navigate('DealDetails', { dealId: deal.id })}
        >
          <Text style={styles.pipelineDealTitle}>{deal.title}</Text>
          <Text style={styles.pipelineDealCompany}>{deal.company}</Text>
          <View style={styles.pipelineDealFooter}>
            <Text style={styles.pipelineDealValue}>{formatCurrency(deal.value)}</Text>
            <Text style={styles.pipelineDealProbability}>{deal.probability}%</Text>
          </View>
        </TouchableOpacity>
      ))}
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.title}>Deals</Text>
          <Text style={styles.subtitle}>
            {filteredDeals.length} deals • {formatCurrency(filteredDeals.reduce((sum, deal) => sum + deal.value, 0))} total
          </Text>
        </View>
        <View style={styles.headerRight}>
          {isSelectionMode ? (
            <TouchableOpacity
              style={styles.headerButton}
              onPress={() => {
                setIsSelectionMode(false);
                setSelectedDeals([]);
              }}
            >
              <Text style={styles.cancelText}>Cancel</Text>
            </TouchableOpacity>
          ) : (
            <Button
              title="Add Deal"
              leftIcon="plus"
              onPress={() => navigation.navigate('AddDeal')}
              size="sm"
            />
          )}
        </View>
      </View>

      {/* Bulk Actions */}
      {isSelectionMode && selectedDeals.length > 0 && (
        <View style={styles.bulkActions}>
          <Text style={styles.bulkActionsText}>
            {selectedDeals.length} selected
          </Text>
          <View style={styles.bulkActionsButtons}>
            <Button
              title="Move Stage"
              onPress={() => handleBulkAction('move stage for')}
              size="sm"
              variant="outline"
              style={styles.bulkActionButton}
            />
            <Button
              title="Assign"
              onPress={() => handleBulkAction('assign')}
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

      {/* Filters and View Toggle */}
      <View style={styles.filters}>
        <Input
          placeholder="Search deals..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          leftIcon="search"
          style={styles.searchInput}
        />
        
        <View style={styles.filterRow}>
          <Select
            options={stageOptions}
            value={stageFilter}
            onValueChange={setStageFilter}
            placeholder="Stage"
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
            onValueChange={(value) => setViewMode(value as 'list' | 'pipeline')}
            placeholder="View"
            style={styles.filterSelect}
          />
        </View>
      </View>

      {/* Content */}
      {viewMode === 'list' ? (
        <FlatList
          data={filteredDeals}
          renderItem={renderDealItem}
          keyExtractor={item => item.id}
          style={styles.list}
          refreshControl={
            <RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} />
          }
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Icon name="briefcase" size={48} color="#d1d5db" />
              <Text style={styles.emptyStateTitle}>No deals found</Text>
              <Text style={styles.emptyStateText}>
                {searchQuery || stageFilter !== 'all'
                  ? 'Try adjusting your filters'
                  : 'Add your first deal to get started'}
              </Text>
              {!searchQuery && stageFilter === 'all' && (
                <Button
                  title="Add Deal"
                  onPress={() => navigation.navigate('AddDeal')}
                  style={styles.emptyStateButton}
                />
              )}
            </View>
          }
        />
      ) : (
        <ScrollView
          horizontal
          style={styles.pipelineContainer}
          showsHorizontalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} />
          }
        >
          {groupDealsByStage().map(renderPipelineStage)}
        </ScrollView>
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
  },
  filterSelect: {
    flex: 1,
    marginHorizontal: 2,
  },
  list: {
    flex: 1,
  },
  dealItem: {
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
  selectedDealItem: {
    backgroundColor: '#eff6ff',
    borderColor: '#3b82f6',
    borderWidth: 1,
  },
  selectionIndicator: {
    marginRight: 12,
  },
  dealContent: {
    flex: 1,
  },
  dealHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  dealTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    flex: 1,
  },
  stageBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
    marginLeft: 8,
  },
  stageText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#ffffff',
  },
  dealCompany: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 2,
  },
  dealContact: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 2,
  },
  dealAssigned: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 8,
  },
  dealMetrics: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  dealValue: {
    flex: 1,
  },
  dealValueText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#10b981',
  },
  dealProbability: {
    fontSize: 12,
    color: '#6b7280',
  },
  dealDates: {
    alignItems: 'flex-end',
  },
  dealCloseDate: {
    fontSize: 12,
    color: '#1f2937',
    fontWeight: '500',
  },
  dealLastActivity: {
    fontSize: 12,
    color: '#9ca3af',
  },
  menuButton: {
    padding: 8,
    marginLeft: 8,
  },
  // Pipeline View Styles
  pipelineContainer: {
    flex: 1,
    paddingHorizontal: 16,
  },
  pipelineStage: {
    width: 280,
    marginRight: 16,
    backgroundColor: '#ffffff',
    borderRadius: 12,
    marginVertical: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  pipelineStageHeader: {
    padding: 16,
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
  },
  pipelineStageTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
    marginBottom: 4,
  },
  pipelineStageCount: {
    fontSize: 14,
    color: '#ffffff',
    opacity: 0.9,
  },
  pipelineStageValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#ffffff',
    marginTop: 4,
  },
  pipelineDealItem: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  pipelineDealTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 4,
  },
  pipelineDealCompany: {
    fontSize: 12,
    color: '#6b7280',
    marginBottom: 8,
  },
  pipelineDealFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  pipelineDealValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#10b981',
  },
  pipelineDealProbability: {
    fontSize: 12,
    color: '#6b7280',
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

export default DealsScreen;