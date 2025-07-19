
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

// Extended contact interface for follow-up specific data
interface FollowUpContact extends Contact {
  last_activity?: string;
}

interface FollowUpTabsProps {
  onSelectContact: (contact: Contact) => void;
}

export const FollowUpTabs: React.FC<FollowUpTabsProps> = ({ onSelectContact }) => {
  const [needsApproach, setNeedsApproach] = useState<FollowUpContact[]>([]);
  const [stale3Days, setStale3Days] = useState<FollowUpContact[]>([]);
  const [stale7Days, setStale7Days] = useState<FollowUpContact[]>([]);
  const [stale30Days, setStale30Days] = useState<FollowUpContact[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('needs-approach');
  const [availableLabels, setAvailableLabels] = useState<string[]>([]);
  const [selectedLabels, setSelectedLabels] = useState<string[]>([]);
  const [templatesPreloaded, setTemplatesPreloaded] = useState(false);
  
  // Use cached contacts instead of direct database queries
  const { contacts, loading: contactsLoading, error: contactsError } = useCachedContacts();
  
  // Template cache hook for preloading
  const { preloadAllUserTemplates, isLoading: templatesLoading, isPreloaded } = useTemplateCache();

  useEffect(() => {
    if (!contactsLoading && contacts.length >= 0) {
      fetchFollowUpContacts();
    }
  }, [contacts, contactsLoading, user, selectedLabels]);
  
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

  const fetchFollowUpContacts = async () => {
    if (!user || contactsLoading) return;

    try {
      // Define milliseconds per day constant
      const msPerDay = 24 * 60 * 60 * 1000;
      
      // Filter contacts that are not "Paid"
      let activeContacts = contacts.filter(contact => contact.status !== 'Paid');
      
      // Apply label filter if any labels are selected
      if (selectedLabels.length > 0) {
        activeContacts = activeContacts.filter(contact => 
          contact.labels && selectedLabels.some(label => contact.labels.includes(label))
        );
      }

      // Get all activities to determine if contact has any activity
      const { data: activities, error: activitiesError } = await supabase
        .from('activities')
        .select('contact_id, timestamp')
        .eq('user_id', user.id)
        .order('timestamp', { ascending: false });

      if (activitiesError) throw activitiesError;

      // Create a set of contact_ids that have activities
      const contactsWithActivities = new Set();
      const lastActivityMap = new Map();
      activities?.forEach(activity => {
        contactsWithActivities.add(activity.contact_id);
        if (!lastActivityMap.has(activity.contact_id)) {
          lastActivityMap.set(activity.contact_id, activity.timestamp);
        }
      });

      const now = new Date();
      const threeDaysAgo = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000);
      const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

      const needsApproachList: FollowUpContact[] = [];
      const stale3DaysList: FollowUpContact[] = [];
      const stale7DaysList: FollowUpContact[] = [];
      const stale30DaysList: FollowUpContact[] = [];
      
      console.log('🔍 Processing follow-up contacts:', {
        totalActiveContacts: activeContacts.length,
        contactsWithActivities: contactsWithActivities.size,
        selectedLabels: selectedLabels.length
      });

      activeContacts.forEach(contact => {
        const hasActivity = contactsWithActivities.has(contact.id);
        
        if (!hasActivity) {
          // No activities logged yet - use "Need Approach" tab
          console.log(`📝 Contact "${contact.name}" has no activities - adding to Need Approach`);
          needsApproachList.push({ ...contact, last_activity: null });
        } else {
            // Has activity - use last activity for staleness calculation
            const lastActivity = lastActivityMap.get(contact.id);
            const lastActivityDate = new Date(lastActivity);
            
            const daysSinceLastActivity = Math.floor((now.getTime() - lastActivityDate.getTime()) / msPerDay);
            
            // Use created_at if available, otherwise use a reasonable baseline
            let daysSinceCreated = 0;
            if (contact.created_at) {
              const contactCreatedDate = new Date(contact.created_at);
              daysSinceCreated = Math.floor((now.getTime() - contactCreatedDate.getTime()) / msPerDay);
            }

            // Contact must have been created long enough AND last activity must be stale for the period
            // If no created_at, only check activity staleness
            if (daysSinceLastActivity >= 30 && (daysSinceCreated >= 30 || !contact.created_at)) {
              stale30DaysList.push({ ...contact, last_activity: lastActivity });
            } else if (daysSinceLastActivity >= 7 && (daysSinceCreated >= 7 || !contact.created_at)) {
              stale7DaysList.push({ ...contact, last_activity: lastActivity });
            } else if (daysSinceLastActivity >= 3 && (daysSinceCreated >= 3 || !contact.created_at)) {
              stale3DaysList.push({ ...contact, last_activity: lastActivity });
            }
          }
      });

      console.log('📊 Follow-up categorization results:', {
        needsApproach: needsApproachList.length,
        stale3Days: stale3DaysList.length,
        stale7Days: stale7DaysList.length,
        stale30Days: stale30DaysList.length
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
              <TemplateSelectionModal contact={contact} usePreloadedCache={templatesPreloaded || isPreloaded}>
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
