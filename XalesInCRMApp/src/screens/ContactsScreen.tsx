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
  Linking,
} from 'react-native';
import { Button, Icon, Input, Select, Menu, MenuItem } from '@components';

interface Contact {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  company: string;
  position: string;
  type: 'lead' | 'customer' | 'partner' | 'vendor';
  tags: string[];
  lastContact?: string;
  createdAt: string;
  avatar?: string;
}

interface ContactsScreenProps {
  navigation: any;
}

const typeOptions = [
  { label: 'All Types', value: 'all' },
  { label: 'Lead', value: 'lead' },
  { label: 'Customer', value: 'customer' },
  { label: 'Partner', value: 'partner' },
  { label: 'Vendor', value: 'vendor' },
];

const sortOptions = [
  { label: 'Name A-Z', value: 'name_asc' },
  { label: 'Name Z-A', value: 'name_desc' },
  { label: 'Recent First', value: 'recent' },
  { label: 'Oldest First', value: 'oldest' },
  { label: 'Company A-Z', value: 'company_asc' },
  { label: 'Last Contact', value: 'last_contact' },
];

export const ContactsScreen: React.FC<ContactsScreenProps> = ({ navigation }) => {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [filteredContacts, setFilteredContacts] = useState<Contact[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [sortBy, setSortBy] = useState('name_asc');
  const [selectedContacts, setSelectedContacts] = useState<string[]>([]);
  const [isSelectionMode, setIsSelectionMode] = useState(false);

  // Load contacts data
  const loadContacts = async () => {
    try {
      setIsLoading(true);
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Mock data
      const mockContacts: Contact[] = [
        {
          id: '1',
          firstName: 'John',
          lastName: 'Doe',
          email: 'john.doe@example.com',
          phone: '+1 (555) 123-4567',
          company: 'ABC Corp',
          position: 'CEO',
          type: 'customer',
          tags: ['VIP', 'Enterprise'],
          createdAt: '2024-01-15T10:30:00Z',
          lastContact: '2024-01-18T14:20:00Z',
        },
        {
          id: '2',
          firstName: 'Sarah',
          lastName: 'Johnson',
          email: 'sarah.j@techstart.com',
          phone: '+1 (555) 987-6543',
          company: 'TechStart Inc',
          position: 'CTO',
          type: 'lead',
          tags: ['Tech', 'Startup'],
          createdAt: '2024-01-14T14:20:00Z',
          lastContact: '2024-01-17T09:15:00Z',
        },
        {
          id: '3',
          firstName: 'Mike',
          lastName: 'Wilson',
          email: 'mike.wilson@innovate.co',
          phone: '+1 (555) 456-7890',
          company: 'Innovate Co',
          position: 'Product Manager',
          type: 'partner',
          tags: ['Innovation', 'Product'],
          createdAt: '2024-01-13T16:45:00Z',
          lastContact: '2024-01-16T11:30:00Z',
        },
        {
          id: '4',
          firstName: 'Emily',
          lastName: 'Chen',
          email: 'emily.chen@globaltech.com',
          phone: '+1 (555) 321-0987',
          company: 'GlobalTech',
          position: 'VP Sales',
          type: 'customer',
          tags: ['Global', 'Sales'],
          createdAt: '2024-01-12T08:15:00Z',
          lastContact: '2024-01-19T15:45:00Z',
        },
        {
          id: '5',
          firstName: 'David',
          lastName: 'Brown',
          email: 'david.brown@supplier.com',
          phone: '+1 (555) 654-3210',
          company: 'Supplier Co',
          position: 'Account Manager',
          type: 'vendor',
          tags: ['Supplier', 'Logistics'],
          createdAt: '2024-01-11T12:00:00Z',
          lastContact: '2024-01-15T10:20:00Z',
        },
        {
          id: '6',
          firstName: 'Lisa',
          lastName: 'Anderson',
          email: 'lisa.anderson@marketing.pro',
          phone: '+1 (555) 789-0123',
          company: 'Marketing Pro',
          position: 'Marketing Director',
          type: 'lead',
          tags: ['Marketing', 'Digital'],
          createdAt: '2024-01-10T09:30:00Z',
        },
      ];
      
      setContacts(mockContacts);
    } catch (error) {
      console.error('Error loading contacts:', error);
      Alert.alert('Error', 'Failed to load contacts');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle refresh
  const handleRefresh = async () => {
    setIsRefreshing(true);
    await loadContacts();
    setIsRefreshing(false);
  };

  // Filter and sort contacts
  useEffect(() => {
    let filtered = [...contacts];

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        contact =>
          contact.firstName.toLowerCase().includes(query) ||
          contact.lastName.toLowerCase().includes(query) ||
          contact.email.toLowerCase().includes(query) ||
          contact.company.toLowerCase().includes(query) ||
          contact.position.toLowerCase().includes(query) ||
          contact.phone.includes(query) ||
          contact.tags.some(tag => tag.toLowerCase().includes(query))
      );
    }

    // Apply type filter
    if (typeFilter !== 'all') {
      filtered = filtered.filter(contact => contact.type === typeFilter);
    }

    // Apply sorting
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'name_desc':
          return `${b.firstName} ${b.lastName}`.localeCompare(`${a.firstName} ${a.lastName}`);
        case 'recent':
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        case 'oldest':
          return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        case 'company_asc':
          return a.company.localeCompare(b.company);
        case 'last_contact':
          if (!a.lastContact && !b.lastContact) return 0;
          if (!a.lastContact) return 1;
          if (!b.lastContact) return -1;
          return new Date(b.lastContact).getTime() - new Date(a.lastContact).getTime();
        case 'name_asc':
        default:
          return `${a.firstName} ${a.lastName}`.localeCompare(`${b.firstName} ${b.lastName}`);
      }
    });

    setFilteredContacts(filtered);
  }, [contacts, searchQuery, typeFilter, sortBy]);

  // Load data on component mount
  useEffect(() => {
    loadContacts();
  }, []);

  // Get type color
  const getTypeColor = (type: string): string => {
    switch (type) {
      case 'lead':
        return '#3b82f6';
      case 'customer':
        return '#10b981';
      case 'partner':
        return '#8b5cf6';
      case 'vendor':
        return '#f59e0b';
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

  // Get initials for avatar
  const getInitials = (firstName: string, lastName: string): string => {
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  };

  // Handle contact selection
  const toggleContactSelection = (contactId: string) => {
    setSelectedContacts(prev => {
      if (prev.includes(contactId)) {
        return prev.filter(id => id !== contactId);
      } else {
        return [...prev, contactId];
      }
    });
  };

  // Handle bulk actions
  const handleBulkAction = (action: string) => {
    Alert.alert(
      'Confirm Action',
      `Are you sure you want to ${action} ${selectedContacts.length} contact(s)?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Confirm',
          onPress: () => {
            // Implement bulk action logic here
            console.log(`Bulk ${action} for contacts:`, selectedContacts);
            setSelectedContacts([]);
            setIsSelectionMode(false);
          },
        },
      ]
    );
  };

  // Handle call
  const handleCall = (phone: string) => {
    const phoneUrl = `tel:${phone}`;
    Linking.canOpenURL(phoneUrl)
      .then(supported => {
        if (supported) {
          Linking.openURL(phoneUrl);
        } else {
          Alert.alert('Error', 'Phone calls are not supported on this device');
        }
      })
      .catch(err => console.error('Error opening phone app:', err));
  };

  // Handle email
  const handleEmail = (email: string) => {
    const emailUrl = `mailto:${email}`;
    Linking.canOpenURL(emailUrl)
      .then(supported => {
        if (supported) {
          Linking.openURL(emailUrl);
        } else {
          Alert.alert('Error', 'Email is not supported on this device');
        }
      })
      .catch(err => console.error('Error opening email app:', err));
  };

  // Render contact item
  const renderContactItem = ({ item }: { item: Contact }) => (
    <TouchableOpacity
      style={[
        styles.contactItem,
        selectedContacts.includes(item.id) && styles.selectedContactItem,
      ]}
      onPress={() => {
        if (isSelectionMode) {
          toggleContactSelection(item.id);
        } else {
          navigation.navigate('ContactDetails', { contactId: item.id });
        }
      }}
      onLongPress={() => {
        if (!isSelectionMode) {
          setIsSelectionMode(true);
          toggleContactSelection(item.id);
        }
      }}
    >
      {isSelectionMode && (
        <View style={styles.selectionIndicator}>
          <Icon
            name={selectedContacts.includes(item.id) ? 'check-circle' : 'circle'}
            size={20}
            color={selectedContacts.includes(item.id) ? '#3b82f6' : '#d1d5db'}
          />
        </View>
      )}
      
      {/* Avatar */}
      <View style={[styles.avatar, { backgroundColor: getTypeColor(item.type) }]}>
        <Text style={styles.avatarText}>
          {getInitials(item.firstName, item.lastName)}
        </Text>
      </View>
      
      <View style={styles.contactContent}>
        <View style={styles.contactHeader}>
          <Text style={styles.contactName}>
            {item.firstName} {item.lastName}
          </Text>
          <View style={[styles.typeBadge, { backgroundColor: getTypeColor(item.type) }]}>
            <Text style={styles.typeText}>{item.type.toUpperCase()}</Text>
          </View>
        </View>
        
        <Text style={styles.contactPosition}>{item.position}</Text>
        <Text style={styles.contactCompany}>{item.company}</Text>
        <Text style={styles.contactEmail}>{item.email}</Text>
        
        {/* Tags */}
        {item.tags.length > 0 && (
          <View style={styles.tagsContainer}>
            {item.tags.slice(0, 2).map((tag, index) => (
              <View key={index} style={styles.tag}>
                <Text style={styles.tagText}>{tag}</Text>
              </View>
            ))}
            {item.tags.length > 2 && (
              <Text style={styles.moreTagsText}>+{item.tags.length - 2}</Text>
            )}
          </View>
        )}
        
        <View style={styles.contactFooter}>
          <Text style={styles.contactDate}>
            {item.lastContact ? `Last contact: ${formatDate(item.lastContact)}` : `Added: ${formatDate(item.createdAt)}`}
          </Text>
        </View>
      </View>
      
      {/* Quick Actions */}
      <View style={styles.quickActions}>
        <TouchableOpacity
          style={styles.quickActionButton}
          onPress={() => handleCall(item.phone)}
        >
          <Icon name="phone" size={18} color="#3b82f6" />
        </TouchableOpacity>
        
        <TouchableOpacity
          style={styles.quickActionButton}
          onPress={() => handleEmail(item.email)}
        >
          <Icon name="mail" size={18} color="#3b82f6" />
        </TouchableOpacity>
        
        <Menu
          trigger={
            <TouchableOpacity style={styles.quickActionButton}>
              <Icon name="more-vertical" size={18} color="#6b7280" />
            </TouchableOpacity>
          }
        >
          <MenuItem
            title="View Details"
            onPress={() => navigation.navigate('ContactDetails', { contactId: item.id })}
          />
          <MenuItem
            title="Edit Contact"
            onPress={() => navigation.navigate('EditContact', { contactId: item.id })}
          />
          <MenuItem
            title="Add Note"
            onPress={() => navigation.navigate('AddNote', { contactId: item.id })}
          />
          <MenuItem
            title="Schedule Meeting"
            onPress={() => navigation.navigate('ScheduleMeeting', { contactId: item.id })}
          />
          <MenuItem
            title="Delete"
            onPress={() => {
              Alert.alert(
                'Delete Contact',
                'Are you sure you want to delete this contact?',
                [
                  { text: 'Cancel', style: 'cancel' },
                  { text: 'Delete', style: 'destructive', onPress: () => console.log('Delete contact:', item.id) },
                ]
              );
            }}
          />
        </Menu>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.title}>Contacts</Text>
          <Text style={styles.subtitle}>{filteredContacts.length} contacts</Text>
        </View>
        <View style={styles.headerRight}>
          {isSelectionMode ? (
            <TouchableOpacity
              style={styles.headerButton}
              onPress={() => {
                setIsSelectionMode(false);
                setSelectedContacts([]);
              }}
            >
              <Text style={styles.cancelText}>Cancel</Text>
            </TouchableOpacity>
          ) : (
            <Button
              title="Add Contact"
              leftIcon="plus"
              onPress={() => navigation.navigate('AddContact')}
              size="sm"
            />
          )}
        </View>
      </View>

      {/* Bulk Actions */}
      {isSelectionMode && selectedContacts.length > 0 && (
        <View style={styles.bulkActions}>
          <Text style={styles.bulkActionsText}>
            {selectedContacts.length} selected
          </Text>
          <View style={styles.bulkActionsButtons}>
            <Button
              title="Add Tags"
              onPress={() => handleBulkAction('add tags to')}
              size="sm"
              variant="outline"
              style={styles.bulkActionButton}
            />
            <Button
              title="Export"
              onPress={() => handleBulkAction('export')}
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
          placeholder="Search contacts..."
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
            options={sortOptions}
            value={sortBy}
            onValueChange={setSortBy}
            placeholder="Sort by"
            style={styles.filterSelect}
          />
        </View>
      </View>

      {/* Contacts List */}
      <FlatList
        data={filteredContacts}
        renderItem={renderContactItem}
        keyExtractor={item => item.id}
        style={styles.list}
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} />
        }
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Icon name="users" size={48} color="#d1d5db" />
            <Text style={styles.emptyStateTitle}>No contacts found</Text>
            <Text style={styles.emptyStateText}>
              {searchQuery || typeFilter !== 'all'
                ? 'Try adjusting your filters'
                : 'Add your first contact to get started'}
            </Text>
            {!searchQuery && typeFilter === 'all' && (
              <Button
                title="Add Contact"
                onPress={() => navigation.navigate('AddContact')}
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
  contactItem: {
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
  selectedContactItem: {
    backgroundColor: '#eff6ff',
    borderColor: '#3b82f6',
    borderWidth: 1,
  },
  selectionIndicator: {
    marginRight: 12,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  avatarText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  contactContent: {
    flex: 1,
  },
  contactHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  contactName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    flex: 1,
  },
  typeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
    marginLeft: 8,
  },
  typeText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#ffffff',
  },
  contactPosition: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 2,
  },
  contactCompany: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 2,
  },
  contactEmail: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 8,
  },
  tagsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  tag: {
    backgroundColor: '#f3f4f6',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
    marginRight: 4,
  },
  tagText: {
    fontSize: 12,
    color: '#6b7280',
  },
  moreTagsText: {
    fontSize: 12,
    color: '#9ca3af',
    marginLeft: 4,
  },
  contactFooter: {
    marginTop: 4,
  },
  contactDate: {
    fontSize: 12,
    color: '#9ca3af',
  },
  quickActions: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 12,
  },
  quickActionButton: {
    padding: 8,
    marginLeft: 4,
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

export default ContactsScreen;