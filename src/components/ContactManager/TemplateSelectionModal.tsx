
/**
 * Template Selection Modal Component with Intelligent Caching
 * 
 * Features:
 * - Displays relevant message templates based on contact labels
 * - Intelligent caching with metadata verification for optimal performance
 * - Real-time cache invalidation when templates or labels change
 * - Cache statistics and debugging tools in development mode
 * - Automatic cache refresh when metadata becomes stale
 * 
 * Caching Strategy:
 * - Templates are cached by label combination to avoid redundant database queries
 * - Cache entries are validated against user metadata timestamps
 * - Automatic cache invalidation on template/label changes via Supabase real-time
 * - Cache statistics tracking for performance monitoring
 * 
 * Performance Benefits:
 * - Reduces database load for frequently accessed template combinations
 * - Faster template loading for repeat label combinations
 * - Maintains data consistency through metadata verification
 */

import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { MessageCircle, RefreshCw, Trash2 } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { useUserMetadata } from '@/hooks/useUserMetadata';
import { useTemplateCache } from '@/hooks/useTemplateCache';

interface Contact {
  id: string;
  name: string;
  phone_number: string;
  email?: string;
  company?: string;
  labels?: string[];
}

interface MessageTemplateSet {
  id: string;
  title: string;
  associated_label_id: string;
  template_variation_1: string;
  template_variation_2: string;
  template_variation_3: string;
}

interface Label {
  id: string;
  name: string;
}

interface TemplateSelectionModalProps {
  contact: Contact;
  children: React.ReactNode;
  usePreloadedCache?: boolean;
}

export const TemplateSelectionModal: React.FC<TemplateSelectionModalProps> = ({
  contact,
  children,
  usePreloadedCache = false,
}) => {
  const [templateSets, setTemplateSets] = useState<MessageTemplateSet[]>([]);
  const [labels, setLabels] = useState<Label[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [cacheInfo, setCacheInfo] = useState<{ fromCache: boolean; cacheStats?: any }>({ fromCache: false });
  const { user } = useAuth();
  const { 
    validateSingleContactAccess, 
    refreshMetadata, 
    isMetadataStale 
  } = useUserMetadata();
  const { getTemplatesForContact, getTemplatesFromCacheOnly, getCacheStats, clearCache, isPreloaded } = useTemplateCache();

  useEffect(() => {
    if (open) {
      fetchRelevantTemplateSets();
    }
  }, [open, contact, user]);

  /**
   * Fetches relevant template sets using intelligent caching with metadata verification
   * 
   * This function implements a sophisticated caching strategy that:
   * 1. Checks cache for existing template data based on label combination
   * 2. Validates cache freshness against user metadata timestamps
   * 3. Falls back to database query if cache is invalid or missing
   * 4. Updates cache with fresh data and metadata verification
   * 5. Provides performance metrics and debugging information
   * 
   * Cache Key Strategy:
   * - Uses sorted label names to create consistent cache keys
   * - Includes user ID to prevent cross-user data leakage
   * - Validates against metadata timestamps for data consistency
   * 
   * Performance Monitoring:
   * - Tracks fetch duration and cache hit/miss rates
   * - Logs cache statistics for performance analysis
   * - Provides visual indicators for cache usage in development
   */
  const fetchRelevantTemplateSets = async () => {
    if (!user || !contact.labels || contact.labels.length === 0) {
      setTemplateSets([]);
      setLabels([]);
      setCacheInfo({ fromCache: false });
      return;
    }

    setLoading(true);
    const startTime = performance.now();
    
    try {
      console.log('🔍 Fetching templates for contact:', contact.name, 'with labels:', contact.labels);
      
      let result;
      
      // Use preloaded cache if available and requested
      if (usePreloadedCache && isPreloaded) {
        console.log('⚡ Using preloaded cache for instant template access');
        result = getTemplatesFromCacheOnly(contact.labels);
      } else {
        // Use cached template fetching with metadata verification
        result = await getTemplatesForContact(contact.labels);
      }
      
      setTemplateSets(result.templates);
      setLabels(result.labels);
      
      // Update cache info for debugging
      const stats = getCacheStats();
      setCacheInfo({ 
        fromCache: result.fromCache, 
        cacheStats: stats 
      });
      
      const endTime = performance.now();
      const duration = (endTime - startTime).toFixed(2);
      
      console.log(`✅ Template fetch completed in ${duration}ms`);
      console.log(`📊 Cache stats - Hit rate: ${stats.hitRate}%, Cache size: ${stats.cacheSize}`);
      
      if (result.fromCache) {
        console.log('🎯 Templates loaded from cache');
      } else {
        console.log('💾 Templates fetched from database and cached');
      }
      
    } catch (error: any) {
      console.error('❌ Failed to fetch template sets:', error);
      toast({
        title: "Error",
        description: "Failed to fetch template sets",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const formatPhoneNumber = (phoneNumber: string) => {
    // Remove all non-numeric characters
    let cleaned = phoneNumber.replace(/\D/g, '');
    
    // If starts with +, remove it
    if (phoneNumber.startsWith('+')) {
      cleaned = phoneNumber.substring(1).replace(/\D/g, '');
    }
    
    // If starts with 0, replace with country code (assuming Indonesia +62)
    if (cleaned.startsWith('0')) {
      cleaned = '62' + cleaned.substring(1);
    }
    
    return cleaned;
  };

  const replacePlaceholders = (template: string, contact: Contact) => {
    let message = template;
    
    // Replace common placeholders
    message = message.replace(/\{\{name\}\}/g, contact.name || '');
    message = message.replace(/\{\{company\}\}/g, contact.company || '');
    message = message.replace(/\{\{email\}\}/g, contact.email || '');
    message = message.replace(/\{\{phone_number\}\}/g, contact.phone_number || '');
    
    return message;
  };

  const selectRandomVariation = (templateSet: MessageTemplateSet) => {
    const variations = [
      templateSet.template_variation_1,
      templateSet.template_variation_2,
      templateSet.template_variation_3,
    ];
    
    const randomIndex = Math.floor(Math.random() * variations.length);
    return { variation: variations[randomIndex], variationNumber: randomIndex + 1 };
  };

  /**
   * Performs simple contact access validation (fast local check)
   */
  const performContactValidation = (): boolean => {
    const hasAccess = validateSingleContactAccess(contact.id);
    
    if (!hasAccess) {
      console.error('❌ Contact access denied:', contact.id);
      toast({
        title: "Access Denied",
        description: "Contact not found in your authorized list.",
        variant: "destructive"
      });
      return false;
    }
    
    console.log('✅ Contact access validated for template selection');
    return true;
  };

  const handleTemplateSelect = async (templateSet: MessageTemplateSet) => {
    try {
      setLoading(true);
      
      // Check if metadata is stale and refresh if needed
      if (isMetadataStale(2)) {
        console.log('🔄 Metadata is stale, refreshing...');
        const refreshSuccess = await refreshMetadata();
        if (!refreshSuccess) {
          toast({
            title: "Refresh Failed",
            description: "Failed to refresh data. Please try again.",
            variant: "destructive"
          });
          return;
        }
      }
      
      // Perform simple contact validation (fast local check)
      const isValid = performContactValidation();
      if (!isValid) {
        return; // Error already shown in performContactValidation
      }
      
      // Select random variation
      const { variation, variationNumber } = selectRandomVariation(templateSet);
      
      // Replace placeholders
      const personalizedMessage = replacePlaceholders(variation, contact);
      
      // Format phone number for wa.me
      const formattedPhone = formatPhoneNumber(contact.phone_number);
      
      // Construct WhatsApp URL
      const encodedMessage = encodeURIComponent(personalizedMessage);
      const whatsappUrl = `https://wa.me/${formattedPhone}?text=${encodedMessage}`;
      
      // Log activity to database with enhanced error handling
      const { error: activityError } = await supabase
        .from('activities')
        .insert({
          contact_id: contact.id,
          user_id: user?.id,
          type: 'WhatsApp Follow-Up via Template',
          details: `Template: "${templateSet.title}" (Variation ${variationNumber})`,
          timestamp: new Date().toISOString(),
        });

      if (activityError) {
        console.error('Failed to log activity:', activityError);
        toast({
          title: "Activity Logging Failed",
          description: "WhatsApp will open but activity logging failed.",
          variant: "destructive"
        });
      } else {
        console.log('✅ Template activity logged successfully');
      }

      // Open WhatsApp
      window.open(whatsappUrl, '_blank');
      
      // Close modal
      setOpen(false);
      
      // Show success notification
      toast({
        title: "Success",
        description: `Pesan untuk ${contact.name} telah disiapkan di WhatsApp. Silakan periksa dan kirim.`,
      });
      
    } catch (error: any) {
      console.error('❌ Template selection failed:', error);
      toast({
        title: "Error",
        description: "Gagal membuka link WhatsApp. Silakan coba lagi.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getLabelName = (labelId: string) => {
    const label = labels.find(l => l.id === labelId);
    return label ? label.name : 'Unknown Label';
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MessageCircle className="h-5 w-5" />
            Select Template for {contact.name}
            {cacheInfo.fromCache && (
              <Badge variant="secondary" className="ml-2 text-xs">
                🎯 Cached
              </Badge>
            )}
          </DialogTitle>
          {process.env.NODE_ENV === 'development' && cacheInfo.cacheStats && (
            <div className="flex items-center justify-between mt-2">
              <div className="text-xs text-muted-foreground">
                Cache: {cacheInfo.cacheStats.hitRate}% hit rate | {cacheInfo.cacheStats.cacheSize} entries
              </div>
              <div className="flex gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    fetchRelevantTemplateSets();
                    toast({ title: "Templates refreshed", description: "Template data has been refreshed" });
                  }}
                  className="h-6 px-2 text-xs"
                >
                  <RefreshCw className="h-3 w-3 mr-1" />
                  Refresh
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    clearCache();
                    setCacheInfo({ fromCache: false });
                    toast({ title: "Cache cleared", description: "Template cache has been cleared" });
                  }}
                  className="h-6 px-2 text-xs"
                >
                  <Trash2 className="h-3 w-3 mr-1" />
                  Clear Cache
                </Button>
              </div>
            </div>
          )}
        </DialogHeader>
        
        {loading ? (
          <div className="flex justify-center py-8">
            <div className="text-muted-foreground flex items-center gap-2">
              <RefreshCw className="h-4 w-4 animate-spin" />
              {cacheInfo.fromCache ? 'Loading from cache...' : 'Fetching templates...'}
            </div>
          </div>
        ) : templateSets.length === 0 ? (
          <div className="p-4 text-center text-gray-500">
            There are no templates that match this contact label.
          </div>
        ) : (
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {templateSets.map(templateSet => (
              <Card 
                key={templateSet.id} 
                className="cursor-pointer hover:shadow-md transition-shadow"
                onClick={() => handleTemplateSelect(templateSet)}
              >
                <CardContent className="p-3">
                  <div className="space-y-2">
                    <h4 className="font-medium">{templateSet.title}</h4>
                    <Badge variant="outline" className="text-xs">
                      {getLabelName(templateSet.associated_label_id)}
                    </Badge>
                    <div className="text-xs text-gray-500">
                      3 variation message available
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
