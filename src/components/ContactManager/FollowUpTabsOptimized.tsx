/**
 * FollowUpTabsOptimized Component
 * 
 * Optimized version with instant loading and database cache storage.
 * No more blocking preload operations - UI loads instantly.
 * 
 * Features:
 * - Instant UI loading
 * - Database-backed cache
 * - Background cache refresh
 * - Progressive template loading
 * - Optimal user experience
 */

import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Phone, Mail, Building, Clock, MessageCircle, RefreshCw } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { TemplateSelectionModalOptimized } from './TemplateSelectionModalOptimized';
import { useCachedContacts } from '@/hooks/useCachedContacts';
import { ContactLabelFilter } from './ContactLabelFilter';
import { Contact } from '@/types/contact';
import { useTemplateCacheDB } from '@/hooks/useTemplateCacheDB';

// Extended contact interface for follow-up specific data
interface FollowUpContact extends Contact {
  last_activity?: string;
}

interface FollowUpTabsOptimizedProps {
  onSelectContact: (contact: Contact) => void;
}

export const FollowUpTabsOptimized: React.FC<FollowUpTabsOptimizedProps> = ({ onSelectContact }) => {
  const [needsApproach, setNeedsApproach] = useState<FollowUpContact[]>([]);
  const [stale3Days, setStale3Days] = useState<FollowUpContact[]>([]);
  const [stale7Days, setStale7Days] = useState<FollowUpContact[]>([]);
  const [stale30Days, setStale30Days] = useState<FollowUpContact[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('needs-approach');
  const [availableLabels, setAvailableLabels] = useState<string[]>([]);
  const [selectedLabels, setSelectedLabels] = useState<string[]>([]);
  const [cacheStats, setCacheStats] = useState({ cacheSize: 0, hitRate: 0, lastRefresh: null as string | null });
  
  // Use cached contacts instead of direct database queries
  const { contacts, loading: contactsLoading, error: contactsError } = useCachedContacts();
  
  // Database cache hook (no blocking preload)
  const { refreshCacheInBackground, getCacheStats } = useTemplateCacheDB();

  useEffect(() => {
    if (!contactsLoading && contacts.length >= 0) {
      fetchFollowUpContacts();
    }
  }, [contacts, contactsLoading, user, selectedLabels]);
  
  useEffect(() => {
    fetchLabels();
  }, [user]);
  
  // Load cache stats and start background refresh (non-blocking)
  useEffect(() => {
    if (user) {
      // Load cache stats
      getCacheStats().then(setCacheStats);
      
      // Start background cache refresh (non-blocking)
      refreshCacheInBackground().catch(error => {
        console.error('Background cache refresh failed:', error);
      });
    }
  }, [user, getCacheStats, refreshCacheInBackground]);
  
  const fetchLabels = async () => {
    if (!user) return;

    try {
      // Get all unique labels from contacts that actually have labels
      const allContactLabels = new Set<string>();
      contacts.forEach(contact => {
        if (contact.labels && contact.labels.length > 0) {
          contact.labels.forEach(label => allContactLabels.add(label));
        }
      });
      
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

  const handleLabelsChanged = (labels: string[]) => {
    setSelectedLabels(labels);
  };

  const fetchFollowUpContacts = async () => {
    if (!user || contactsLoading) return;

    try {
      setLoading(true);
      
      // Filter contacts based on selected labels if any
      let filteredContacts = contacts;
      if (selectedLabels.length > 0) {
        filteredContacts = contacts.filter(contact => 
          contact.labels && contact.labels.some(label => selectedLabels.includes(label))
        );
      }

      // Get engagements for all contacts to determine last activity
      const contactIds = filteredContacts.map(c => c.id);
      
      let engagementsData: any[] = [];
      if (contactIds.length > 0) {
        const { data, error } = await supabase
          .from('engagements')
          .select('contact_id, created_at')
          .in('contact_id', contactIds)
          .order('created_at', { ascending: false });
        
        if (error) throw error;
        engagementsData = data || [];
      }

      // Create a map of contact_id to last engagement date
      const lastEngagementMap = new Map<string, string>();
      engagementsData.forEach(engagement => {
        if (!lastEngagementMap.has(engagement.contact_id)) {
          lastEngagementMap.set(engagement.contact_id, engagement.created_at);
        }
      });

      // Categorize contacts
      const now = new Date();
      const threeDaysAgo = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000);
      const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

      const needsApproachList: FollowUpContact[] = [];
      const stale3DaysList: FollowUpContact[] = [];
      const stale7DaysList: FollowUpContact[] = [];
      const stale30DaysList: FollowUpContact[] = [];

      filteredContacts.forEach(contact => {
        const lastEngagement = lastEngagementMap.get(contact.id);
        const contactWithActivity: FollowUpContact = {
          ...contact,
          last_activity: lastEngagement
        };

        if (!lastEngagement) {
          // Never been contacted - needs approach
          needsApproachList.push(contactWithActivity);
        } else {
          const lastActivityDate = new Date(lastEngagement);
          
          if (lastActivityDate < thirtyDaysAgo) {
            stale30DaysList.push(contactWithActivity);
          } else if (lastActivityDate < sevenDaysAgo) {
            stale7DaysList.push(contactWithActivity);
          } else if (lastActivityDate < threeDaysAgo) {
            stale3DaysList.push(contactWithActivity);
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

  const handleRefreshCache = async () => {
    try {
      await refreshCacheInBackground();
      const newStats = await getCacheStats();
      setCacheStats(newStats);
      toast({
        title: "Cache Refreshed",
        description: "Template cache has been refreshed in background",
        variant: "default",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to refresh cache",
        variant: "destructive",
      });
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
              <TemplateSelectionModalOptimized contact={contact}>
                <Button variant="outline" size="sm">
                  <MessageCircle className="h-3 w-3 mr-1" />
                  Template Follow Up
                </Button>
              </TemplateSelectionModalOptimized>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  // Show loading only for contacts, not for templates
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
      {/* Cache Stats and Controls */}
      <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
        <div className="flex items-center gap-4 text-sm text-gray-600">
          <span>Cache: {cacheStats.cacheSize} entries</span>
          <span>Hit Rate: {cacheStats.hitRate.toFixed(1)}%</span>
          {cacheStats.lastRefresh && (
            <span>Last Refresh: {new Date(cacheStats.lastRefresh).toLocaleTimeString()}</span>
          )}
        </div>
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={handleRefreshCache}
          className="flex items-center gap-1"
        >
          <RefreshCw className="h-3 w-3" />
          Refresh Cache
        </Button>
      </div>
      
      <ContactLabelFilter
        availableLabels={availableLabels}
        selectedLabels={selectedLabels}
        onToggleLabel={toggleLabelFilter}
        onLabelsChanged={handleLabelsChanged}
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