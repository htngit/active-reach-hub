import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Phone, Mail, Building, Plus, Search, Filter, MessageCircle } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { TemplateSelectionModal } from './TemplateSelectionModal';

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
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [availableLabels, setAvailableLabels] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    fetchContacts();
    fetchLabels();
  }, [user, selectedLabels]);

  const fetchContacts = async () => {
    if (!user) return;

    try {
      let query = supabase
        .from('contacts')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      const { data, error } = await query;
      
      if (error) throw error;

      let filteredData = data || [];

      // Filter by labels if any are selected
      if (selectedLabels.length > 0) {
        filteredData = filteredData.filter(contact => 
          contact.labels && selectedLabels.some(label => contact.labels.includes(label))
        );
      }

      // Filter by search term
      if (searchTerm) {
        filteredData = filteredData.filter(contact =>
          contact.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          contact.phone_number.includes(searchTerm) ||
          (contact.email && contact.email.toLowerCase().includes(searchTerm.toLowerCase())) ||
          (contact.company && contact.company.toLowerCase().includes(searchTerm.toLowerCase()))
        );
      }

      setContacts(filteredData);
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to fetch contacts",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

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
    fetchContacts();
  }, [searchTerm]);

  const toggleLabelFilter = (label: string) => {
    const newLabels = selectedLabels.includes(label)
      ? selectedLabels.filter(l => l !== label)
      : [...selectedLabels, label];
    onLabelFilterChange(newLabels);
  };

  if (loading) {
    return <div className="p-4">Loading contacts...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="Search contacts..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Button onClick={onAddContact}>
          <Plus className="h-4 w-4 mr-2" />
          Add Contact
        </Button>
      </div>

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

      <div className="space-y-2">
        {contacts.map(contact => (
          <Card 
            key={contact.id} 
            className="hover:shadow-md transition-shadow"
          >
            <CardContent className="p-4">
              <div className="flex justify-between items-start">
                <div 
                  className="space-y-1 cursor-pointer flex-1"
                  onClick={() => onSelectContact(contact)}
                >
                  <h3 className="font-semibold">{contact.name}</h3>
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Phone className="h-3 w-3" />
                    {contact.phone_number}
                  </div>
                  {contact.email && (
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Mail className="h-3 w-3" />
                      {contact.email}
                    </div>
                  )}
                  {contact.company && (
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Building className="h-3 w-3" />
                      {contact.company}
                    </div>
                  )}
                </div>
                <div className="text-right space-y-2">
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
                  <div className="flex gap-1">
                    <TemplateSelectionModal contact={contact}>
                      <Button variant="outline" size="sm">
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

      {contacts.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          {searchTerm || selectedLabels.length > 0 
            ? "No contacts found matching your filters" 
            : "No contacts yet. Add your first contact!"}
        </div>
      )}
    </div>
  );
};
