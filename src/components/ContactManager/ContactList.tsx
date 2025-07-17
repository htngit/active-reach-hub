
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
import { LabelManager } from './LabelManager';
import { ActionsDropdown } from './ActionsDropdown';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Trash2, CheckSquare, Search, Plus } from 'lucide-react';
import { toast } from 'sonner';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';

interface ContactListProps {
  onSelectContact: (contact: Contact) => void;
  onAddContact: () => void;
  selectedLabels: string[];
  onLabelFilterChange: (labels: string[]) => void;
  onContactsDeleted?: () => void;
}

export const ContactList: React.FC<ContactListProps> = ({
  onSelectContact,
  onAddContact,
  selectedLabels,
  onLabelFilterChange,
  onContactsDeleted,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [availableLabels, setAvailableLabels] = useState<string[]>([]);
  const [filteredContacts, setFilteredContacts] = useState<Contact[]>([]);
  const [selectedContacts, setSelectedContacts] = useState<Contact[]>([]);
  const [selectionMode, setSelectionMode] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
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

  const handleLabelsChanged = () => {
    fetchLabels();
    refreshContacts();
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

  const toggleSelectionMode = () => {
    setSelectionMode(!selectionMode);
    if (selectionMode) {
      setSelectedContacts([]);
    }
  };

  const toggleContactSelection = (contact: Contact) => {
    if (selectedContacts.some(c => c.id === contact.id)) {
      setSelectedContacts(selectedContacts.filter(c => c.id !== contact.id));
    } else {
      setSelectedContacts([...selectedContacts, contact]);
    }
  };

  const handleSelectAll = () => {
    if (selectedContacts.length === filteredContacts.length) {
      setSelectedContacts([]);
    } else {
      setSelectedContacts([...filteredContacts]);
    }
  };

  const handleDeleteSelected = async () => {
    if (!user || selectedContacts.length === 0) return;

    try {
      const { error } = await supabase
        .from('contacts')
        .delete()
        .in('id', selectedContacts.map(c => c.id));

      if (error) throw error;

      toast.success(`${selectedContacts.length} contacts deleted successfully`);
      setSelectedContacts([]);
      setSelectionMode(false);
      refreshContacts();
      if (onContactsDeleted) onContactsDeleted();
    } catch (error: any) {
      console.error('Error deleting contacts:', error);
      toast.error(error.message || 'Failed to delete contacts');
    }
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
    <div className="space-y-4 max-w-full overflow-hidden">
      <ContactCacheControls
        cacheInfo={cacheInfo}
        error={error}
        onRefresh={refreshContacts}
        onClearCache={clearCache}
      />

      <div className="flex flex-col space-y-4">
        {/* Search Bar */}
        <div className="relative w-full">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="Search contacts..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 w-full"
          />
        </div>
        
        {/* Action Buttons Grid */}
        <div className={`grid gap-2 w-full ${
          selectionMode 
            ? (selectedContacts.length > 0 
                ? 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-6' 
                : 'grid-cols-2 sm:grid-cols-4 lg:grid-cols-5')
            : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4'
        }`}>
          {/* Add Contact Button */}
          <Button 
            onClick={onAddContact} 
            className="w-full text-xs sm:text-sm flex items-center justify-center gap-1 sm:gap-2"
          >
            <Plus className="h-4 w-4" />
            <span className="hidden sm:inline">Add Contact</span>
            <span className="sm:hidden">Add</span>
          </Button>
          
          {/* Manage Labels Button */}
          {availableLabels.length > 0 && (
            <LabelManager 
              availableLabels={availableLabels}
              onLabelsChanged={handleLabelsChanged}
              className="w-full"
            />
          )}
          
          {/* Actions Dropdown */}
          <ActionsDropdown 
            onImportSuccess={handleImportSuccess} 
            className="w-full"
          />
          
          {/* Select All Button - Only shown in selection mode */}
          {selectionMode && filteredContacts.length > 0 && (
            <Button 
              variant="outline" 
              onClick={handleSelectAll}
              className="w-full flex items-center justify-center gap-1 text-xs sm:text-sm"
            >
              <CheckSquare className="h-4 w-4" />
              <span className="hidden sm:inline">{selectedContacts.length === filteredContacts.length ? "Deselect All" : "Select All"}</span>
              <span className="sm:hidden">{selectedContacts.length === filteredContacts.length ? "Deselect" : "Select"}</span>
            </Button>
          )}
          
          {/* Delete Selected Button - Only shown when contacts are selected */}
          {selectionMode && selectedContacts.length > 0 && (
            <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
              <AlertDialogTrigger asChild>
                <Button 
                  variant="destructive" 
                  className="w-full flex items-center justify-center gap-1 text-xs sm:text-sm"
                >
                  <Trash2 className="h-4 w-4" />
                  <span className="hidden sm:inline">Delete Selected ({selectedContacts.length})</span>
                  <span className="sm:hidden">Delete ({selectedContacts.length})</span>
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete Multiple Contacts</AlertDialogTitle>
                  <AlertDialogDescription>
                    Are you sure you want to delete {selectedContacts.length} contacts? This action cannot be undone.
                    All activities, invoices, and related data for these contacts will also be deleted.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleDeleteSelected}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  >
                    Delete Contacts
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
          
          {/* Select Multiple / Cancel Selection Button */}
          <Button 
            variant={selectionMode ? "default" : "outline"} 
            onClick={toggleSelectionMode}
            className="w-full flex items-center justify-center gap-1 text-xs sm:text-sm"
          >
            <CheckSquare className="h-4 w-4" />
            <span className="hidden sm:inline">{selectionMode ? "Cancel Selection" : "Select Multiple"}</span>
            <span className="sm:hidden">{selectionMode ? "Cancel" : "Select"}</span>
          </Button>
        </div>
      </div>

      <ContactLabelFilter
        availableLabels={availableLabels}
        selectedLabels={selectedLabels}
        onToggleLabel={toggleLabelFilter}
        onLabelsChanged={handleLabelsChanged}
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
            selectionMode={selectionMode}
            isSelected={selectedContacts.some(c => c.id === contact.id)}
            onToggleSelect={toggleContactSelection}
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
