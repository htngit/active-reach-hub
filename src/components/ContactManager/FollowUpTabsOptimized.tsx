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

import React, { useState, useEffect, useCallback } from 'react';
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
import { type CatchError, getErrorMessage } from '@/utils/errorTypes';
import { Pagination } from './Pagination';
import { useOptimisticFollowUpCalculations } from '@/hooks/useOptimisticFollowUpCalculations';

// Extended contact interface for follow-up specific data
interface FollowUpContact extends Contact {
  last_activity?: string;
}

interface FollowUpTabsOptimizedProps {
  onSelectContact: (contact: Contact) => void;
}

export const FollowUpTabsOptimized: React.FC<FollowUpTabsOptimizedProps> = ({ onSelectContact }) => {
  const [needsApproachCurrentPage, setNeedsApproachCurrentPage] = useState(1);
  const [stale3DaysCurrentPage, setStale3DaysCurrentPage] = useState(1);
  const [stale7DaysCurrentPage, setStale7DaysCurrentPage] = useState(1);
  const [stale30DaysCurrentPage, setStale30DaysCurrentPage] = useState(1);
  const contactsPerPage = 50; // Max 50 contacts per page
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('needs-approach');
  const [availableLabels, setAvailableLabels] = useState<string[]>([]);
  const [selectedLabels, setSelectedLabels] = useState<string[]>([]);
  const [cacheStats, setCacheStats] = useState({ cacheSize: 0, hitRate: 0, lastRefresh: null as string | null });
  
  // Use cached contacts instead of direct database queries
  const { contacts, loading: contactsLoading, error: contactsError } = useCachedContacts();
  
  // Use optimistic follow-up calculations
  const {
    needsApproach,
    stale3Days,
    stale7Days,
    stale30Days,
    loading: followUpLoading,
    refreshFollowUpData
  } = useOptimisticFollowUpCalculations(contacts, selectedLabels);

  // Debug logging removed - using hook's internal logging
  

  
  // Database cache hook (no blocking preload)
  const { refreshCacheInBackground, getCacheStats, getAllTemplates } = useTemplateCacheDB();

  // Template loading is now handled by TemplateSelectionModalOptimized component
  // using its internal cache mechanism for better performance



  const fetchLabels = useCallback(async () => {
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
    } catch (error: CatchError) {
      console.error('Error fetching labels:', getErrorMessage(error));
    }
  }, [user, contacts]);



  // Callback to refresh categorization after engagement creation
  const handleEngagementCreated = useCallback(() => {
    // Force refresh of contact categorization
    refreshFollowUpData();
  }, [refreshFollowUpData]);

  const paginateNeedsApproach = (pageNumber: number) => setNeedsApproachCurrentPage(pageNumber);
  const paginateStale3Days = (pageNumber: number) => setStale3DaysCurrentPage(pageNumber);
  const paginateStale7Days = (pageNumber: number) => setStale7DaysCurrentPage(pageNumber);
  const paginateStale30Days = (pageNumber: number) => setStale30DaysCurrentPage(pageNumber);

  const toggleLabelFilter = (label: string) => {
    setSelectedLabels(prev => 
      prev.includes(label) 
        ? prev.filter(l => l !== label)
        : [...prev, label]
    );
  };


  
  useEffect(() => {
    fetchLabels();
  }, [fetchLabels]);
  
  // Templates are now loaded on-demand by TemplateSelectionModalOptimized
  
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
              <TemplateSelectionModalOptimized 
              contact={contact}
              onEngagementCreated={handleEngagementCreated}
            >
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
  if (followUpLoading || contactsLoading) {
    return <div className="p-4">Loading follow-up data...</div>;
  }

  if (contactsError) {
    return <div className="p-4 text-red-500">Error loading contacts: {contactsError.message}</div>;
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
        onLabelsChanged={() => {}}
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
            Contacts that need initial approach ({needsApproach.length} total)
            {selectedLabels.length > 0 && (
              <div className="text-xs text-orange-600 mt-1 p-2 bg-orange-50 rounded flex items-center justify-between">
                <span>⚠️ FILTERED BY LABELS: {selectedLabels.join(', ')} - Showing only contacts with these labels</span>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => setSelectedLabels([])} 
                  className="ml-2 h-6 px-2 text-xs"
                >
                  Clear Filters
                </Button>
              </div>
            )}

          </div>
          {needsApproach.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              Great! All contacts have been approached.
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {needsApproach.slice((needsApproachCurrentPage - 1) * contactsPerPage, needsApproachCurrentPage * contactsPerPage).map(contact => (
                  <ContactCard key={contact.id} contact={contact} />
                ))}
              </div>
              {needsApproach.length > contactsPerPage && (
                <div className="flex justify-center mt-4">
                  <Pagination
                    contactsPerPage={contactsPerPage}
                    totalContacts={needsApproach.length}
                    paginate={paginateNeedsApproach}
                    currentPage={needsApproachCurrentPage}
                  />
                </div>
              )}
            </>
          )}
        </TabsContent>

        <TabsContent value="stale-3" className="space-y-4">
          <div className="text-sm text-gray-600 mb-4">
            Contacts last contacted more than 3 days ago ({stale3Days.length} total)
            {selectedLabels.length > 0 && (
              <div className="text-xs text-orange-600 mt-1 p-2 bg-orange-50 rounded flex items-center justify-between">
                <span>⚠️ FILTERED BY LABELS: {selectedLabels.join(', ')}</span>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => setSelectedLabels([])} 
                  className="ml-2 h-6 px-2 text-xs"
                >
                  Clear Filters
                </Button>
              </div>
            )}
          </div>
          {stale3Days.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No stale contacts in this timeframe!
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {stale3Days.slice((stale3DaysCurrentPage - 1) * contactsPerPage, stale3DaysCurrentPage * contactsPerPage).map(contact => (
                  <ContactCard key={contact.id} contact={contact} />
                ))}
              </div>
              {stale3Days.length > contactsPerPage && (
                <div className="flex justify-center mt-4">
                  <Pagination
                    contactsPerPage={contactsPerPage}
                    totalContacts={stale3Days.length}
                    paginate={paginateStale3Days}
                    currentPage={stale3DaysCurrentPage}
                  />
                </div>
              )}
            </>
          )}
        </TabsContent>

        <TabsContent value="stale-7" className="space-y-4">
          <div className="text-sm text-gray-600 mb-4">
            Contacts last contacted more than 7 days ago ({stale7Days.length} total)
            {selectedLabels.length > 0 && (
              <div className="text-xs text-orange-600 mt-1 p-2 bg-orange-50 rounded flex items-center justify-between">
                <span>⚠️ FILTERED BY LABELS: {selectedLabels.join(', ')}</span>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => setSelectedLabels([])} 
                  className="ml-2 h-6 px-2 text-xs"
                >
                  Clear Filters
                </Button>
              </div>
            )}
          </div>
          {stale7Days.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No stale contacts in this timeframe!
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {stale7Days.slice((stale7DaysCurrentPage - 1) * contactsPerPage, stale7DaysCurrentPage * contactsPerPage).map(contact => (
                  <ContactCard key={contact.id} contact={contact} />
                ))}
              </div>
              {stale7Days.length > contactsPerPage && (
                <div className="flex justify-center mt-4">
                  <Pagination
                    contactsPerPage={contactsPerPage}
                    totalContacts={stale7Days.length}
                    paginate={paginateStale7Days}
                    currentPage={stale7DaysCurrentPage}
                  />
                </div>
              )}
            </>
          )}
        </TabsContent>

        <TabsContent value="stale-30" className="space-y-4">
          <div className="text-sm text-gray-600 mb-4">
            Contacts last contacted more than 30 days ago ({stale30Days.length} total)
            {selectedLabels.length > 0 && (
              <div className="text-xs text-orange-600 mt-1 p-2 bg-orange-50 rounded flex items-center justify-between">
                <span>⚠️ FILTERED BY LABELS: {selectedLabels.join(', ')}</span>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => setSelectedLabels([])} 
                  className="ml-2 h-6 px-2 text-xs"
                >
                  Clear Filters
                </Button>
              </div>
            )}
          </div>
          {stale30Days.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No stale contacts in this timeframe!
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {stale30Days.slice((stale30DaysCurrentPage - 1) * contactsPerPage, stale30DaysCurrentPage * contactsPerPage).map(contact => (
                  <ContactCard key={contact.id} contact={contact} />
                ))}
              </div>
              {stale30Days.length > contactsPerPage && (
                <div className="flex justify-center mt-4">
                  <Pagination
                    contactsPerPage={contactsPerPage}
                    totalContacts={stale30Days.length}
                    paginate={paginateStale30Days}
                    currentPage={stale30DaysCurrentPage}
                  />
                </div>
              )}
            </>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};