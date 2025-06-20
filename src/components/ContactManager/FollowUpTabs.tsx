
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

interface Contact {
  id: string;
  name: string;
  phone_number: string;
  email?: string;
  company?: string;
  status: string;
  labels?: string[];
  last_activity?: string;
}

interface FollowUpTabsProps {
  onSelectContact: (contact: Contact) => void;
}

export const FollowUpTabs: React.FC<FollowUpTabsProps> = ({ onSelectContact }) => {
  const [needsApproach, setNeedsApproach] = useState<Contact[]>([]);
  const [stale3Days, setStale3Days] = useState<Contact[]>([]);
  const [stale7Days, setStale7Days] = useState<Contact[]>([]);
  const [stale30Days, setStale30Days] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('needs-approach');
  const [availableLabels, setAvailableLabels] = useState<string[]>([]);
  const [selectedLabels, setSelectedLabels] = useState<string[]>([]);
  
  // Use cached contacts instead of direct database queries
  const { contacts, loading: contactsLoading, error: contactsError } = useCachedContacts();

  useEffect(() => {
    if (!contactsLoading && contacts.length >= 0) {
      fetchFollowUpContacts();
    }
  }, [contacts, contactsLoading, user, selectedLabels]);
  
  useEffect(() => {
    fetchLabels();
  }, [user]);
  
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
  
  const toggleLabelFilter = (label: string) => {
    setSelectedLabels(prev => 
      prev.includes(label)
        ? prev.filter(l => l !== label)
        : [...prev, label]
    );
  };

  const fetchFollowUpContacts = async () => {
    if (!user || contactsLoading) return;

    try {
      // Filter contacts that are not "Paid"
      let activeContacts = contacts.filter(contact => contact.status !== 'Paid');
      
      // Apply label filter if any labels are selected
      if (selectedLabels.length > 0) {
        activeContacts = activeContacts.filter(contact => 
          contact.labels && selectedLabels.some(label => contact.labels.includes(label))
        );
      }

      // Get all activities to determine last contact time
      const { data: activities, error: activitiesError } = await supabase
        .from('activities')
        .select('contact_id, timestamp')
        .eq('user_id', user.id)
        .order('timestamp', { ascending: false });

      if (activitiesError) throw activitiesError;

      // Create a map of contact_id to last activity timestamp
      const lastActivityMap = new Map();
      activities?.forEach(activity => {
        if (!lastActivityMap.has(activity.contact_id)) {
          lastActivityMap.set(activity.contact_id, activity.timestamp);
        }
      });

      const now = new Date();
      const threeDaysAgo = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000);
      const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

      const needsApproachList: Contact[] = [];
      const stale3DaysList: Contact[] = [];
      const stale7DaysList: Contact[] = [];
      const stale30DaysList: Contact[] = [];

      activeContacts.forEach(contact => {
        const lastActivity = lastActivityMap.get(contact.id);
        
        if (!lastActivity) {
          // No activities logged yet
          needsApproachList.push({ ...contact, last_activity: null });
        } else {
          const lastActivityDate = new Date(lastActivity);
          
          if (lastActivityDate < thirtyDaysAgo) {
            stale30DaysList.push({ ...contact, last_activity: lastActivity });
          } else if (lastActivityDate < sevenDaysAgo) {
            stale7DaysList.push({ ...contact, last_activity: lastActivity });
          } else if (lastActivityDate < threeDaysAgo) {
            stale3DaysList.push({ ...contact, last_activity: lastActivity });
          }
        }
      });

      setNeedsApproach(needsApproachList);
      setStale3Days(stale3DaysList);
      setStale7Days(stale7DaysList);
      setStale30Days(stale30DaysList);
    } catch (error: any) {
      console.error('Error fetching follow-up contacts:', error);
      toast({
        title: "Error",
        description: "Failed to fetch follow-up contacts",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const ContactCard = ({ contact }: { contact: Contact }) => (
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
  );

  if (loading || contactsLoading) {
    return <div className="p-4">Loading follow-up data...</div>;
  }

  if (contactsError) {
    return (
      <div className="p-4">
        <div className="text-red-600">Error loading contacts: {contactsError}</div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <ContactLabelFilter
        availableLabels={availableLabels}
        selectedLabels={selectedLabels}
        onToggleLabel={toggleLabelFilter}
      />
      
      <Tabs defaultValue="needs-approach" onValueChange={setActiveTab} className="w-full">
      <TabsList className="grid w-full grid-cols-4 h-12">
        <TabsTrigger
          value="needs-approach"
          className={`transition-all duration-300 ${activeTab === 'needs-approach' ? 'text-base px-4 py-2' : 'text-sm px-2 py-1'}`}
        >
          Needs Approach ({needsApproach.length})
        </TabsTrigger>
        <TabsTrigger
          value="stale-3"
          className={`transition-all duration-300 ${activeTab === 'stale-3' ? 'text-base px-4 py-2' : 'text-sm px-2 py-1'}`}
        >
          {'>'} 3d ({stale3Days.length})
        </TabsTrigger>
        <TabsTrigger
          value="stale-7"
          className={`transition-all duration-300 ${activeTab === 'stale-7' ? 'text-base px-4 py-2' : 'text-sm px-2 py-1'}`}
        >
          {'>'} 7d ({stale7Days.length})
        </TabsTrigger>
        <TabsTrigger
          value="stale-30"
          className={`transition-all duration-300 ${activeTab === 'stale-30' ? 'text-base px-4 py-2' : 'text-sm px-2 py-1'}`}
        >
          {'>'} 30d ({stale30Days.length})
        </TabsTrigger>
      </TabsList>

      <TabsContent value="needs-approach" className="space-y-4">
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

      <TabsContent value="stale-3" className="space-y-4">
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

      <TabsContent value="stale-7" className="space-y-4">
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

      <TabsContent value="stale-30" className="space-y-4">
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
