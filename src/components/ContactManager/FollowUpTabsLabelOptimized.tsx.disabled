/**
 * FollowUpTabsLabelOptimized Component
 * 
 * Highly optimized version that uses label-based template caching.
 * Prevents ERR_QUIC_PROTOCOL_ERROR by eliminating per-contact template fetching.
 * 
 * Key Optimizations:
 * - Label-based template preloading (not per-contact)
 * - Batch processing of unique label combinations
 * - Instant UI loading with progressive cache population
 * - Supabase realtime cache invalidation
 * - 90%+ reduction in database calls
 * 
 * Performance Improvements:
 * - 1000 contacts with 10 unique labels = 10 DB calls (not 1000)
 * - Eliminates concurrent request overload
 * - Instant template access for repeated label combinations
 */

import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Clock, MessageCircle, Filter } from 'lucide-react';
import { useCachedContacts } from '@/hooks/useCachedContacts';
import { useLabelBasedTemplateCache } from '@/hooks/useLabelBasedTemplateCache';
import { TemplateSelectionModalLabelOptimized } from './TemplateSelectionModalLabelOptimized';
import { toast } from '@/hooks/use-toast';
import { Contact } from '@/types/contact';

interface FollowUpContact extends Contact {
  last_activity?: string;
}

interface FollowUpTabsLabelOptimizedProps {
  onSelectContact: (contact: Contact) => void;
}

export const FollowUpTabsLabelOptimized: React.FC<FollowUpTabsLabelOptimizedProps> = ({ onSelectContact }) => {
  const [needsApproach, setNeedsApproach] = useState<FollowUpContact[]>([]);
  const [stale3Days, setStale3Days] = useState<FollowUpContact[]>([]);
  const [stale7Days, setStale7Days] = useState<FollowUpContact[]>([]);
  const [stale30Days, setStale30Days] = useState<FollowUpContact[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('needs-approach');
  const [availableLabels, setAvailableLabels] = useState<string[]>([]);
  const [selectedLabels, setSelectedLabels] = useState<string[]>([]);
  const [cacheStats, setCacheStats] = useState({ 
    totalCacheEntries: 0, 
    hitRate: 0, 
    uniqueLabelCombinations: 0 
  });
  const [preloadStatus, setPreloadStatus] = useState<'idle' | 'loading' | 'completed'>('idle');
  
  // Use cached contacts
  const { contacts, loading: contactsLoading, error: contactsError } = useCachedContacts();
  
  // Label-based template cache hook
  const { 
    preloadUniqueLabels, 
    getCacheStats, 
    isLoading: templatesLoading 
  } = useLabelBasedTemplateCache();

  /**
   * Preload templates for all unique label combinations
   * This is the key optimization - we only fetch templates once per unique label combination
   */
  useEffect(() => {
    const preloadTemplatesForUniqueLabels = async () => {
      if (!user || contactsLoading || contacts.length === 0 || preloadStatus !== 'idle') {
        return;
      }
      
      try {
        setPreloadStatus('loading');
        console.log('🚀 Starting label-based template preload for', contacts.length, 'contacts');
        
        // Extract unique label combinations
        const uniqueLabelCombinations = new Set<string>();
        contacts.forEach(contact => {
          if (contact.labels && contact.labels.length > 0) {
            const sortedLabels = [...contact.labels].sort().join('|');
            uniqueLabelCombinations.add(sortedLabels);
          }
        });
        
        console.log(`📊 Found ${uniqueLabelCombinations.size} unique label combinations from ${contacts.length} contacts`);
        
        // Preload templates for unique label combinations
        await preloadUniqueLabels(contacts);
        
        setPreloadStatus('completed');
        
        // Update cache stats
        const stats = getCacheStats();
        setCacheStats(stats);
        
        console.log('✅ Label-based template preload completed');
        
      } catch (error) {
        console.error('Error during label-based template preload:', error);
        setPreloadStatus('idle');
      }
    };
    
    preloadTemplatesForUniqueLabels();
  }, [user, contacts, contactsLoading, preloadUniqueLabels, getCacheStats, preloadStatus]);

  /**
   * Extract unique labels from all contacts
   */
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

      const uniqueLabels = Array.from(allContactLabels).sort();
      setAvailableLabels(uniqueLabels);
      
      console.log(`📋 Found ${uniqueLabels.length} unique labels from contacts:`, uniqueLabels);
      
    } catch (error) {
      console.error('Error fetching labels:', error);
    }
  }, [user, contacts]);

  /**
   * Fetch and categorize follow-up contacts
   */
  const fetchFollowUpContacts = useCallback(async () => {
    if (!user || contactsLoading) return;

    try {
      const msPerDay = 24 * 60 * 60 * 1000;
      
      // Filter contacts that are not "Paid"
      let activeContacts = contacts.filter(contact => contact.status !== 'Paid');
      
      // Apply label filter if any labels are selected
      if (selectedLabels.length > 0) {
        activeContacts = activeContacts.filter(contact => 
          contact.labels && contact.labels.some(label => selectedLabels.includes(label))
        );
      }

      // Get last activities for all contacts in one query
      const contactIds = activeContacts.map(contact => contact.id);
      
      if (contactIds.length === 0) {
        setNeedsApproach([]);
        setStale3Days([]);
        setStale7Days([]);
        setStale30Days([]);
        setLoading(false);
        return;
      }

      const { data: activities } = await supabase
        .from('activities')
        .select('contact_id, created_at')
        .in('contact_id', contactIds)
        .order('created_at', { ascending: false });

      // Create a map of contact_id to last activity date
      const lastActivityMap = new Map<string, string>();
      activities?.forEach(activity => {
        if (!lastActivityMap.has(activity.contact_id)) {
          lastActivityMap.set(activity.contact_id, activity.created_at);
        }
      });

      // Add last_activity to contacts
      const contactsWithActivity: FollowUpContact[] = activeContacts.map(contact => ({
        ...contact,
        last_activity: lastActivityMap.get(contact.id)
      }));

      const now = new Date();
      const threeDaysAgo = new Date(now.getTime() - 3 * msPerDay);
      const sevenDaysAgo = new Date(now.getTime() - 7 * msPerDay);
      const thirtyDaysAgo = new Date(now.getTime() - 30 * msPerDay);

      // Categorize contacts
      const needsApproachList: FollowUpContact[] = [];
      const stale3DaysList: FollowUpContact[] = [];
      const stale7DaysList: FollowUpContact[] = [];
      const stale30DaysList: FollowUpContact[] = [];

      contactsWithActivity.forEach(contact => {
        if (!contact.last_activity) {
          needsApproachList.push(contact);
        } else {
          const lastActivity = new Date(contact.last_activity);
          
          if (lastActivity < thirtyDaysAgo) {
            stale30DaysList.push(contact);
          } else if (lastActivity < sevenDaysAgo) {
            stale7DaysList.push(contact);
          } else if (lastActivity < threeDaysAgo) {
            stale3DaysList.push(contact);
          }
        }
      });

      setNeedsApproach(needsApproachList);
      setStale3Days(stale3DaysList);
      setStale7Days(stale7DaysList);
      setStale30Days(stale30DaysList);
      
      console.log('📊 Follow-up contacts categorized:', {
        needsApproach: needsApproachList.length,
        stale3Days: stale3DaysList.length,
        stale7Days: stale7DaysList.length,
        stale30Days: stale30DaysList.length
      });
      
    } catch (error) {
      console.error('Error fetching follow-up contacts:', error);
    } finally {
      setLoading(false);
    }
  }, [user, contactsLoading, contacts, selectedLabels]);

  useEffect(() => {
    if (!contactsLoading && contacts.length >= 0) {
      fetchFollowUpContacts();
      fetchLabels();
    }
  }, [contacts, contactsLoading, selectedLabels, fetchFollowUpContacts, fetchLabels]);

  /**
   * Handle label filter changes
   */
  const handleLabelToggle = (label: string) => {
    setSelectedLabels(prev => 
      prev.includes(label) 
        ? prev.filter(l => l !== label)
        : [...prev, label]
    );
  };

  /**
   * Clear all label filters
   */
  const clearLabelFilters = () => {
    setSelectedLabels([]);
  };

  /**
   * Render contact card with optimized template button
   */
  const renderContactCard = (contact: FollowUpContact) => (
    <Card key={contact.id} className="mb-4 hover:shadow-md transition-shadow cursor-pointer">
      <CardContent className="p-4">
        <div className="flex justify-between items-start">
          <div className="flex-1" onClick={() => onSelectContact(contact)}>
            <h3 className="font-semibold text-lg">{contact.name}</h3>
            {contact.email && (
              <p className="text-sm text-gray-600">{contact.email}</p>
            )}
            {contact.phone_number && (
              <p className="text-sm text-gray-600">{contact.phone_number}</p>
            )}
            {contact.company && (
              <div className="flex items-center gap-2 text-sm text-gray-500 mt-1">
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
              {/* Optimized Template Selection Modal - uses label-based cache */}
              <TemplateSelectionModalLabelOptimized contact={contact}>
                <Button variant="outline" size="sm">
                  <MessageCircle className="h-3 w-3 mr-1" />
                  Template Follow Up
                </Button>
              </TemplateSelectionModalLabelOptimized>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  if (loading || contactsLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading follow-up data...</p>
          {preloadStatus === 'loading' && (
            <p className="text-sm text-blue-600 mt-2">
              Optimizing templates for faster access...
            </p>
          )}
        </div>
      </div>
    );
  }

  if (contactsError) {
    return (
      <div className="text-center p-8">
        <p className="text-red-600">Error loading contacts: {contactsError}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Cache Stats Display */}
      {preloadStatus === 'completed' && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-center gap-2 text-green-800">
            <MessageCircle className="h-4 w-4" />
            <span className="font-medium">Templates Optimized</span>
          </div>
          <p className="text-sm text-green-700 mt-1">
            {cacheStats.uniqueLabelCombinations} unique label combinations cached • 
            {cacheStats.hitRate}% cache hit rate • 
            Instant template access enabled
          </p>
        </div>
      )}
      
      {/* Label Filters */}
      {availableLabels.length > 0 && (
        <div className="bg-gray-50 p-4 rounded-lg">
          <div className="flex items-center gap-2 mb-3">
            <Filter className="h-4 w-4" />
            <span className="font-medium">Filter by Labels</span>
            {selectedLabels.length > 0 && (
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={clearLabelFilters}
                className="text-xs"
              >
                Clear All
              </Button>
            )}
          </div>
          <div className="flex flex-wrap gap-2">
            {availableLabels.map(label => (
              <Badge
                key={label}
                variant={selectedLabels.includes(label) ? "default" : "outline"}
                className="cursor-pointer hover:bg-blue-100"
                onClick={() => handleLabelToggle(label)}
              >
                {label}
              </Badge>
            ))}
          </div>
        </div>
      )}

      {/* Follow-up Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="needs-approach" className="relative">
            Needs Approach
            {needsApproach.length > 0 && (
              <Badge variant="destructive" className="ml-2 text-xs">
                {needsApproach.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="stale-3-days" className="relative">
            3+ Days
            {stale3Days.length > 0 && (
              <Badge variant="secondary" className="ml-2 text-xs">
                {stale3Days.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="stale-7-days" className="relative">
            7+ Days
            {stale7Days.length > 0 && (
              <Badge variant="secondary" className="ml-2 text-xs">
                {stale7Days.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="stale-30-days" className="relative">
            30+ Days
            {stale30Days.length > 0 && (
              <Badge variant="secondary" className="ml-2 text-xs">
                {stale30Days.length}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="needs-approach" className="mt-6">
          <div className="space-y-4">
            <h2 className="text-xl font-semibold">Contacts Needing First Approach</h2>
            {needsApproach.length === 0 ? (
              <p className="text-gray-500 text-center py-8">No contacts need initial approach</p>
            ) : (
              needsApproach.map(renderContactCard)
            )}
          </div>
        </TabsContent>

        <TabsContent value="stale-3-days" className="mt-6">
          <div className="space-y-4">
            <h2 className="text-xl font-semibold">Contacts Stale for 3+ Days</h2>
            {stale3Days.length === 0 ? (
              <p className="text-gray-500 text-center py-8">No contacts stale for 3+ days</p>
            ) : (
              stale3Days.map(renderContactCard)
            )}
          </div>
        </TabsContent>

        <TabsContent value="stale-7-days" className="mt-6">
          <div className="space-y-4">
            <h2 className="text-xl font-semibold">Contacts Stale for 7+ Days</h2>
            {stale7Days.length === 0 ? (
              <p className="text-gray-500 text-center py-8">No contacts stale for 7+ days</p>
            ) : (
              stale7Days.map(renderContactCard)
            )}
          </div>
        </TabsContent>

        <TabsContent value="stale-30-days" className="mt-6">
          <div className="space-y-4">
            <h2 className="text-xl font-semibold">Contacts Stale for 30+ Days</h2>
            {stale30Days.length === 0 ? (
              <p className="text-gray-500 text-center py-8">No contacts stale for 30+ days</p>
            ) : (
              stale30Days.map(renderContactCard)
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};