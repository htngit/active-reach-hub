import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Phone, Mail, Building, Plus, Search, Filter, MessageCircle, RefreshCw, Trash2 } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { TemplateSelectionModal } from './TemplateSelectionModal';
import { ExportDropdown } from './ExportDropdown';
import { ImportDropdown } from './ImportDropdown';
import { useCachedContacts } from '@/hooks/useCachedContacts';
import { supabase } from '@/integrations/supabase/client';

interface Contact {
  id: string;
  name: string;
  phone_number: string;
  email?: string;
  company?: string;
  address?: string;
  notes?: string;
  labels?: string[];
  status: string;
  potential_product?: string[];
  created_at: string;
}

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
  const [refreshKey, setRefreshKey] = useState(0);
  
  // Use the cached contacts hook
  const { 
    contacts, 
    loading, 
    error, 
    cacheInfo, 
    refreshContacts, 
    clearCache 
  } = useCachedContacts();

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

  // Filter contacts based on search term and selected labels
  useEffect(() => {
    let filtered = contacts;

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

    setFilteredContacts(filtered);
  }, [contacts, selectedLabels, searchTerm]);

  const toggleLabelFilter = (label: string) => {
    const newLabels = selectedLabels.includes(label)
      ? selectedLabels.filter(l => l !== label)
      : [...selectedLabels, label];
    onLabelFilterChange(newLabels);
  };

  const handleImportSuccess = () => {
    refreshContacts();
  };

  if (loading) {
    return <div className="p-4">Loading contacts...</div>;
  }

  return (
    <div className="space-y-4">
      {/* Cache Info and Controls */}
      {cacheInfo && (
        <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg border">
          <div className="text-sm text-blue-700">
            <span className="font-medium">Cache Status:</span> {cacheInfo}
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={refreshContacts}
              className="text-blue-600 border-blue-200 hover:bg-blue-100"
            >
              <RefreshCw className="h-3 w-3 mr-1" />
              Refresh
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={clearCache}
              className="text-red-600 border-red-200 hover:bg-red-100"
            >
              <Trash2 className="h-3 w-3 mr-1" />
              Clear Cache
            </Button>
          </div>
        </div>
      )}

      {error && (
        <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
          <p className="text-sm text-yellow-700">{error}</p>
        </div>
      )}

      {/* Search and Actions Bar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="Search contacts..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="flex gap-2 flex-wrap sm:flex-nowrap">
          <ExportDropdown />
          <ImportDropdown onImportSuccess={handleImportSuccess} />
          <Button onClick={onAddContact} className="w-full sm:w-auto">
            <Plus className="h-4 w-4 mr-2" />
            Add Contact
          </Button>
        </div>
      </div>

      {/* Labels Filter */}
      {availableLabels.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4" />
            <span className="text-sm font-medium">Filter by labels:</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {availableLabels.map(label => (
              <Badge
                key={label}
                variant={selectedLabels.includes(label) ? "default" : "outline"}
                className="cursor-pointer"
                onClick={() => toggleLabelFilter(label)}
              >
                {label}
              </Badge>
            ))}
          </div>
        </div>
      )}

      {/* Contact Cards */}
      <div className="space-y-2">
        {filteredContacts.map(contact => (
          <Card 
            key={contact.id} 
            className="hover:shadow-md transition-shadow"
          >
            <CardContent className="p-4">
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4">
                <div 
                  className="space-y-1 cursor-pointer flex-1"
                  onClick={() => onSelectContact(contact)}
                >
                  <h3 className="font-semibold text-base sm:text-lg">{contact.name}</h3>
                  <div className="flex flex-col sm:flex-row sm:items-center gap-2 text-sm text-gray-600">
                    <div className="flex items-center gap-2">
                      <Phone className="h-3 w-3 shrink-0" />
                      {contact.phone_number}
                    </div>
                    {contact.email && (
                      <div className="flex items-center gap-2">
                        <Mail className="h-3 w-3 shrink-0" />
                        {contact.email}
                      </div>
                    )}
                    {contact.company && (
                      <div className="flex items-center gap-2">
                        <Building className="h-3 w-3 shrink-0" />
                        {contact.company}
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex flex-col gap-2 items-start sm:items-end">
                  <Badge variant="outline">{contact.status}</Badge>
                  {contact.labels && contact.labels.length > 0 && (
                    <div className="flex flex-wrap gap-1 justify-end">
                      {contact.labels.slice(0, 2).map(label => (
                        <Badge key={label} variant="secondary" className="text-xs">
                          {label}
                        </Badge>
                      ))}
                      {contact.labels.length > 2 && (
                        <Badge variant="secondary" className="text-xs">
                          +{contact.labels.length - 2}
                        </Badge>
                      )}
                    </div>
                  )}
                  <div className="w-full sm:w-auto">
                    <TemplateSelectionModal contact={contact}>
                      <Button variant="outline" size="sm" className="w-full sm:w-auto">
                        <MessageCircle className="h-3 w-3 mr-1" />
                        Template Follow Up
                      </Button>
                    </TemplateSelectionModal>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredContacts.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          {searchTerm || selectedLabels.length > 0 
            ? "No contacts found matching your filters" 
            : "No contacts yet. Add your first contact!"}
        </div>
      )}
    </div>
  );
};
