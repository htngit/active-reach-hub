
import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useCachedContacts } from '@/hooks/useCachedContacts';
import { useTeamData } from '@/hooks/useTeamData';
import { useUserData } from '@/hooks/useUserData';
import { Contact } from '@/types/contact';
import { ContactCacheControls } from './ContactCacheControls';
import { ContactSearchBar } from './ContactSearchBar';
import { ContactLabelFilter } from './ContactLabelFilter';
import { ContactCard } from './ContactCard';
import { ContactEmptyState } from './ContactEmptyState';

interface ContactListProps {
  onSelectContact: (contact: Contact) => void;
  onAddContact: () => void;
  selectedLabels: string[];
  onLabelFilterChange: (labels: string[]) => void;
}

export const ContactList: React.FC<ContactListProps> = ({
  onSelectContact,
  onAddContact,
  selectedLabels,
  onLabelFilterChange,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [availableLabels, setAvailableLabels] = useState<string[]>([]);
  const [filteredContacts, setFilteredContacts] = useState<Contact[]>([]);
  const { user } = useAuth();
  const { getUserNameById } = useUserData();
  
  // Use the cached contacts hook
  const { 
    contacts, 
    loading, 
    error, 
    cacheInfo, 
    refreshContacts, 
    clearCache 
  } = useCachedContacts();

  // Use team data hook
  const { teams, loading: teamsLoading } = useTeamData();

  const fetchLabels = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('labels')
        .select('name')
        .eq('user_id', user.id);

      if (error) throw error;
      
      setAvailableLabels(data?.map(label => label.name) || []);
    } catch (error: any) {
      console.error('Error fetching labels:', error);
    }
  };

  useEffect(() => {
    fetchLabels();
  }, [user]);

  // Filter contacts based on search term and selected labels only - RLS handles access
  useEffect(() => {
    let filtered = contacts;

    console.log('Filtering contacts:', { 
      total: contacts.length, 
      user: user?.id,
      myContacts: contacts.filter(c => c.user_id === user?.id).length,
      teamMemberContacts: contacts.filter(c => c.user_id !== user?.id).length
    });

    // Apply label filter
    if (selectedLabels.length > 0) {
      filtered = filtered.filter(contact => 
        contact.labels && selectedLabels.some(label => contact.labels.includes(label))
      );
    }

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(contact =>
        contact.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        contact.phone_number.includes(searchTerm) ||
        (contact.email && contact.email.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (contact.company && contact.company.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    console.log('Final filtered contacts:', filtered.length);
    setFilteredContacts(filtered);
  }, [contacts, selectedLabels, searchTerm, user]);

  const toggleLabelFilter = (label: string) => {
    const newLabels = selectedLabels.includes(label)
      ? selectedLabels.filter(l => l !== label)
      : [...selectedLabels, label];
    onLabelFilterChange(newLabels);
  };

  const handleImportSuccess = () => {
    refreshContacts();
  };

  const getOwnerDisplay = (contact: Contact) => {
    if (contact.user_id === user?.id) {
      return 'My Contact';
    }
    
    // This is a team member's contact that I can see as team owner
    const ownerName = getUserNameById(contact.user_id);
    const team = teams.find(t => t.id === contact.team_id);
    
    if (team) {
      return `${ownerName} (${team.name})`;
    }
    
    return `${ownerName} (Team Member)`;
  };

  if (loading || teamsLoading) {
    return (
      <div className="p-4 text-center">
        <div className="text-lg">Loading contacts...</div>
        {teamsLoading && <div className="text-sm text-gray-500 mt-2">Loading team data...</div>}
      </div>
    );
  }

  const hasFilters = searchTerm || selectedLabels.length > 0;

  return (
    <div className="space-y-4">
      <ContactCacheControls
        cacheInfo={cacheInfo}
        error={error}
        onRefresh={refreshContacts}
        onClearCache={clearCache}
      />

      <ContactSearchBar
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        onAddContact={onAddContact}
        onImportSuccess={handleImportSuccess}
      />

      <ContactLabelFilter
        availableLabels={availableLabels}
        selectedLabels={selectedLabels}
        onToggleLabel={toggleLabelFilter}
      />

      {/* Contact Cards */}
      <div className="space-y-2">
        {filteredContacts.map(contact => (
          <ContactCard
            key={contact.id}
            contact={contact}
            currentUserId={user?.id}
            onSelectContact={onSelectContact}
            getOwnerDisplay={getOwnerDisplay}
          />
        ))}
      </div>

      <ContactEmptyState
        loading={Boolean(loading)}
        error={error}
        hasFilters={Boolean(hasFilters)}
        onRefresh={refreshContacts}
      />
    </div>
  );
};
