
import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Phone, Mail, Building, Clock, MessageCircle } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { TemplateSelectionModal } from './TemplateSelectionModal';
import { useCachedContacts } from '@/hooks/useCachedContacts';
import { ContactLabelFilter } from './ContactLabelFilter';
import { Contact } from '@/types/contact';
import { useTemplateCache } from '@/hooks/useTemplateCache';
import { useOptimisticFollowUpCalculations } from '@/hooks/useOptimisticFollowUpCalculations';

// Extended contact interface for follow-up specific data
interface FollowUpContact extends Contact {
  last_activity?: string;
}

interface FollowUpTabsProps {
  onSelectContact: (contact: Contact) => void;
}

export const FollowUpTabs: React.FC<FollowUpTabsProps> = ({ onSelectContact }) => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('needs-approach');
  const [availableLabels, setAvailableLabels] = useState<string[]>([]);
  const [selectedLabels, setSelectedLabels] = useState<string[]>([]);
  const [templatesPreloaded, setTemplatesPreloaded] = useState(false);
  
  // Use cached contacts instead of direct database queries
  const { contacts, loading: contactsLoading, error: contactsError } = useCachedContacts();
  
  // Template cache hook for preloading
  const { preloadAllUserTemplates, isLoading: templatesLoading, isPreloaded } = useTemplateCache();
  
  // Use optimistic follow-up calculations for instant updates
  const { 
    needsApproach, 
    stale3Days, 
    stale7Days, 
    stale30Days,
    addOptimisticActivityToContact 
  } = useOptimisticFollowUpCalculations(contacts, selectedLabels);

  // Remove the old fetchFollowUpContacts useEffect since we're using optimistic calculations
  
  useEffect(() => {
    fetchLabels();
  }, [user]);
  
  // Preload all user templates when component mounts or user changes
  useEffect(() => {
    const preloadTemplates = async () => {
      if (user && !isPreloaded && !templatesPreloaded) {
        console.log('🚀 FollowUpTabs: Starting template preload...');
        const success = await preloadAllUserTemplates();
        if (success) {
          setTemplatesPreloaded(true);
          console.log('✅ FollowUpTabs: Templates preloaded successfully');
          toast({
            title: "Templates Ready",
            description: "All templates have been preloaded for faster access",
            variant: "default",
          });
        }
      }
    };
    
    preloadTemplates();
  }, [user, preloadAllUserTemplates, isPreloaded, templatesPreloaded]);
  
  const fetchLabels = async () => {
    if (!user) return;

    try {
      // Get all unique labels from contacts that actually have labels
      const allContactLabels = new Set<string>();
      contacts.forEach(contact => {
        if (contact.labels && Array.isArray(contact.labels)) {
          contact.labels.forEach(label => {
            if (label && label.trim()) {
              allContactLabels.add(label.trim());
            }
          });
        }
      });
      
      // Only show labels that are actually used by contacts
      setAvailableLabels(Array.from(allContactLabels).sort());
    } catch (error: any) {
      console.error('Error fetching labels:', error);
    }
  };
  
  const toggleLabelFilter = (label: string) => {
    setSelectedLabels(prev => 
      prev.includes(label)
        ? prev.filter(l => l !== label)
        : [...prev, label]
    );
  };

  const handleLabelsChanged = () => {
    fetchLabels();
  };

  // Template message handler with optimistic activity logging
  const handleTemplateMessage = (contact: FollowUpContact, templateTitle: string, variationNumber: number) => {
    // Add optimistic activity immediately for instant UI update
    addOptimisticActivityToContact(contact.id, {
      contact_id: contact.id,
      type: 'WhatsApp Follow-Up via Template',
      details: `Template: "${templateTitle}" (Variation ${variationNumber})`,
      timestamp: new Date().toISOString(),
    });
    
    console.log('⚡ Optimistic activity added for contact:', contact.name);
  };

  const ContactCard = ({ contact }: { contact: FollowUpContact }) => (
    <Card className="hover:shadow-md transition-shadow mb-2">
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
            {contact.last_activity && (
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <Clock className="h-3 w-3" />
                Last contact: {new Date(contact.last_activity).toLocaleDateString()}
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
              <TemplateSelectionModal 
                contact={contact} 
                usePreloadedCache={templatesPreloaded || isPreloaded}
                onTemplateUsed={(templateTitle, variationNumber) => 
                  handleTemplateMessage(contact, templateTitle, variationNumber)
                }
              >
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
  );

  if (contactsLoading) {
    return <div className="p-4">Loading follow-up data...</div>;
  }
  
  if (templatesLoading && !templatesPreloaded) {
    return (
      <div className="p-4">
        <div className="flex items-center gap-2">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
          <span>Preloading templates for faster access...</span>
        </div>
      </div>
    );
  }

  if (contactsError) {
    return (
      <div className="p-4">
        <div className="text-red-600">Error loading contacts: {contactsError}</div>
      </div>
    );
  }

  return (
    <div className="space-y-4 px-4 md:px-0">
      <ContactLabelFilter
        availableLabels={availableLabels}
        selectedLabels={selectedLabels}
        onToggleLabel={toggleLabelFilter}
        onLabelsChanged={handleLabelsChanged}
      />
      
      <Tabs defaultValue="needs-approach" onValueChange={setActiveTab} className="w-full">
      <TabsList className="grid w-full grid-cols-4 h-12 mx-2 md:mx-0">
        <TabsTrigger
          value="needs-approach"
          className={`transition-all duration-300 text-xs md:text-sm px-1 md:px-2 py-1 ${activeTab === 'needs-approach' ? 'md:text-base md:px-4 md:py-2' : ''}`}
        >
          <span className="hidden sm:inline">Needs Approach</span>
          <span className="sm:hidden">New</span> ({needsApproach.length})
        </TabsTrigger>
        <TabsTrigger
          value="stale-3"
          className={`transition-all duration-300 text-xs md:text-sm px-1 md:px-2 py-1 ${activeTab === 'stale-3' ? 'md:text-base md:px-4 md:py-2' : ''}`}
        >
          {'>'} 3d ({stale3Days.length})
        </TabsTrigger>
        <TabsTrigger
          value="stale-7"
          className={`transition-all duration-300 text-xs md:text-sm px-1 md:px-2 py-1 ${activeTab === 'stale-7' ? 'md:text-base md:px-4 md:py-2' : ''}`}
        >
          {'>'} 7d ({stale7Days.length})
        </TabsTrigger>
        <TabsTrigger
          value="stale-30"
          className={`transition-all duration-300 text-xs md:text-sm px-1 md:px-2 py-1 ${activeTab === 'stale-30' ? 'md:text-base md:px-4 md:py-2' : ''}`}
        >
          {'>'} 30d ({stale30Days.length})
        </TabsTrigger>
      </TabsList>

      <TabsContent value="needs-approach" className="space-y-4 px-2 md:px-0">
        <div className="text-sm text-gray-600 mb-4">
          Contacts that have never been approached
        </div>
        {needsApproach.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            No contacts need initial approach!
          </div>
        ) : (
          needsApproach.map(contact => <ContactCard key={contact.id} contact={contact} />)
        )}
      </TabsContent>

      <TabsContent value="stale-3" className="space-y-4 px-2 md:px-0">
        <div className="text-sm text-gray-600 mb-4">
          Contacts last contacted more than 3 days ago
        </div>
        {stale3Days.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            No stale contacts in this timeframe!
          </div>
        ) : (
          stale3Days.map(contact => <ContactCard key={contact.id} contact={contact} />)
        )}
      </TabsContent>

      <TabsContent value="stale-7" className="space-y-4 px-2 md:px-0">
        <div className="text-sm text-gray-600 mb-4">
          Contacts last contacted more than 7 days ago
        </div>
        {stale7Days.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            No stale contacts in this timeframe!
          </div>
        ) : (
          stale7Days.map(contact => <ContactCard key={contact.id} contact={contact} />)
        )}
      </TabsContent>

      <TabsContent value="stale-30" className="space-y-4 px-2 md:px-0">
        <div className="text-sm text-gray-600 mb-4">
          Contacts last contacted more than 30 days ago
        </div>
        {stale30Days.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            No stale contacts in this timeframe!
          </div>
        ) : (
          stale30Days.map(contact => <ContactCard key={contact.id} contact={contact} />)
        )}
      </TabsContent>
    </Tabs>
    </div>
  );
};
