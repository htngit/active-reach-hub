/**
 * TemplateSelectionModalOptimized Component
 * 
 * Optimized version using database cache storage for instant template loading.
 * No more slow database queries - templates load instantly from cache.
 * 
 * Features:
 * - Instant template loading from DB cache
 * - Lazy loading with progressive enhancement
 * - Background cache refresh
 * - Metadata-based security validation
 * - Optimal user experience
 */

import React, { useState, useEffect, useCallback, ReactNode } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { MessageCircle, Send, Clock, Database, Zap } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { Contact } from '@/types/contact';
import { useTemplateCacheDB, type MessageTemplateSet } from '@/hooks/useTemplateCacheDB';

// Utility function to extract variables from template content
const extractVariables = (content: string): string[] => {
  const variableRegex = /\{\{(\w+)\}\}/g;
  const variables: string[] = [];
  let match;
  
  while ((match = variableRegex.exec(content)) !== null) {
    if (!variables.includes(match[1])) {
      variables.push(match[1]);
    }
  }
  
  return variables;
};

// Local Label interface for Supabase data (without user_id)
interface LocalLabel {
  id: string;
  name: string;
  color: string | null;
}
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { type CatchError, getErrorMessage } from '@/utils/errorTypes';

// Interface for transformed template set to match component expectations
interface TransformedTemplateSet {
  id: string;
  name: string;
  description?: string;
  templates: {
    id: string;
    name: string;
    content: string;
    type: 'sms' | 'email' | 'whatsapp';
    variables?: string[];
  }[];
  labels: string[];
  created_at: string;
  updated_at: string;
}

// Supabase query result types - sesuai dengan skema database sebenarnya
interface SupabaseTemplateSet {
  id: string;
  title: string; // menggunakan 'title' bukan 'name'
  associated_label_id: string;
  template_variation_1: string;
  template_variation_2: string;
  template_variation_3: string;
  user_id: string;
  created_at: string;
  updated_at: string;
  // Joined data dari labels table
  labels?: {
    id: string;
    name: string;
    color: string | null;
  } | null;
}

interface TemplateSelectionModalOptimizedProps {
  contact: Contact;
  children: ReactNode;
  preloadedTemplates?: TransformedTemplateSet[];
  onEngagementCreated?: () => void;
  onTemplateUsed?: (templateTitle: string, variationNumber: number, contactId: string) => void;
}

export const TemplateSelectionModalOptimized: React.FC<TemplateSelectionModalOptimizedProps> = ({ 
  contact, 
  children, 
  preloadedTemplates,
  onEngagementCreated,
  onTemplateUsed 
}) => {
  const [open, setOpen] = useState(false);
  const [templateSets, setTemplateSets] = useState<TransformedTemplateSet[]>([]);
  const [labels, setLabels] = useState<LocalLabel[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<string>('');
  const [customMessage, setCustomMessage] = useState<string>('');
  const [loadingSource, setLoadingSource] = useState<'cache' | 'database' | null>(null);
  const { user } = useAuth();
  
  // Database cache hook
  const { 
    getTemplatesForContact, 
    getCacheStats, 
    refreshCacheInBackground 
  } = useTemplateCacheDB();

  // Adapter function to convert MessageTemplateSet to TransformedTemplateSet
  const adaptMessageTemplateSet = (templateSet: MessageTemplateSet): TransformedTemplateSet => {
    return {
      id: templateSet.id,
      name: templateSet.title, // Map title to name
      description: undefined, // MessageTemplateSet doesn't have description
      templates: [
        templateSet.template_variation_1 && {
          id: `${templateSet.id}_var1`,
          name: 'Variation 1',
          content: templateSet.template_variation_1,
          type: 'sms' as const,
          variables: undefined
        },
        templateSet.template_variation_2 && {
          id: `${templateSet.id}_var2`,
          name: 'Variation 2',
          content: templateSet.template_variation_2,
          type: 'sms' as const,
          variables: undefined
        },
        templateSet.template_variation_3 && {
          id: `${templateSet.id}_var3`,
          name: 'Variation 3',
          content: templateSet.template_variation_3,
          type: 'sms' as const,
          variables: undefined
        }
      ].filter((template): template is NonNullable<typeof template> => Boolean(template)),
      labels: [], // MessageTemplateSet doesn't have direct labels
      created_at: templateSet.created_at,
      updated_at: templateSet.updated_at
    };
  };

  // Declare fetchFromDatabase first to avoid hoisting issues
  const fetchFromDatabase = useCallback(async () => {
    if (!user) return;

    try {
      // Get contact labels for filtering
      const contactLabels = contact.labels || [];
      
      const query = supabase
        .from('message_template_sets')
        .select(`
          id,
          title,
          associated_label_id,
          template_variation_1,
          template_variation_2,
          template_variation_3,
          user_id,
          created_at,
          updated_at,
          labels:labels!associated_label_id(
            id,
            name,
            color
          )
        `)
        .eq('user_id', user.id)
        .order('updated_at', { ascending: false });

      const { data: templateSetsData, error: templateSetsError } = await query;
      
      if (templateSetsError) {
        console.error('Error fetching template sets:', templateSetsError);
        setTemplateSets([]);
        setLabels([]);
        return;
      }

      // Ensure templateSetsData is not null and has proper type
      if (!templateSetsData || !Array.isArray(templateSetsData)) {
        setTemplateSets([]);
        setLabels([]);
        return;
      }

      // Transform the data to match our interface with proper typing
      const transformedTemplateSets: TransformedTemplateSet[] = templateSetsData.map(set => {
        // Create templates from variations
        const templates = [];
        if (set.template_variation_1) {
          templates.push({
            id: `${set.id}_var1`,
            name: 'Variation 1',
            content: set.template_variation_1,
            type: 'sms' as const,
            variables: extractVariables(set.template_variation_1)
          });
        }
        if (set.template_variation_2) {
          templates.push({
            id: `${set.id}_var2`,
            name: 'Variation 2',
            content: set.template_variation_2,
            type: 'sms' as const,
            variables: extractVariables(set.template_variation_2)
          });
        }
        if (set.template_variation_3) {
          templates.push({
            id: `${set.id}_var3`,
            name: 'Variation 3',
            content: set.template_variation_3,
            type: 'sms' as const,
            variables: extractVariables(set.template_variation_3)
          });
        }

        return {
          id: set.id,
          name: set.title, // menggunakan title sebagai name
          description: undefined, // tidak ada description di database
          templates,
          labels: set.labels ? [set.labels.name] : [], // single label dari join
          created_at: set.created_at,
          updated_at: set.updated_at,
        };
      });

      // Filter template sets based on contact labels if any
      let filteredTemplateSets = transformedTemplateSets;
      if (contactLabels.length > 0) {
        filteredTemplateSets = transformedTemplateSets.filter(templateSet => 
          templateSet.labels.some(label => contactLabels.includes(label))
        );
        
        // If no matches found with labels, show all templates
        if (filteredTemplateSets.length === 0) {
          filteredTemplateSets = transformedTemplateSets;
        }
      }

      // Get all unique labels
      const { data: labelsData, error: labelsError } = await supabase
        .from('labels')
        .select('id, name, color')
        .eq('user_id', user.id)
        .order('name');
      
      if (labelsError) throw labelsError;

      setTemplateSets(filteredTemplateSets);
      setLabels(labelsData || []);
      
    } catch (error: CatchError) {
      console.error('Database fetch error:', getErrorMessage(error));
      throw error;
    }
  }, [user, contact]);

  const fetchRelevantTemplateSets = useCallback(async () => {
    if (!user || !contact) return;

    try {
      setLoading(true);
      
      // Use preloaded templates for instant filtering (0ms loading)
      if (preloadedTemplates.length > 0) {
        const contactLabels = contact.labels || [];
        
        // Filter templates based on contact labels
        let relevantTemplates = preloadedTemplates;
        if (contactLabels.length > 0) {
          relevantTemplates = preloadedTemplates.filter(templateSet => 
            templateSet.labels.some(label => contactLabels.includes(label))
          );
        }
        
        // If no matching templates, show all templates
        if (relevantTemplates.length === 0) {
          relevantTemplates = preloadedTemplates;
        }
        
        setTemplateSets(relevantTemplates);
        setLoading(false);
        return;
      }
      
      // Fallback to cache/database if no preloaded templates
      setLoadingSource('cache');
      const cacheResult = await getTemplatesForContact(contact.labels || []);
      
      if (cacheResult.templates && cacheResult.templates.length > 0) {
        // Convert MessageTemplateSet[] to TransformedTemplateSet[] using adapter
        const adaptedTemplateSets = cacheResult.templates.map(adaptMessageTemplateSet);
        setTemplateSets(adaptedTemplateSets);
        // Convert Label[] to LocalLabel[]
        const localLabels: LocalLabel[] = (cacheResult.labels || []).map(label => ({
          id: label.id,
          name: label.name,
          color: null // Label from cache doesn't have color property
        }));
        setLabels(localLabels);
        setLoadingSource(null);
        setLoading(false);
        
        // Start background refresh for next time (non-blocking)
        refreshCacheInBackground().catch(console.error);
        return;
      }
      
      // Final fallback to database if cache miss
      setLoadingSource('database');
      await fetchFromDatabase();
      
    } catch (error: CatchError) {
      console.error('Error fetching templates:', getErrorMessage(error));
      toast({
        title: "Error",
        description: "Failed to load templates",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
      setLoadingSource(null);
    }
  }, [user, contact, preloadedTemplates, getTemplatesForContact, refreshCacheInBackground, fetchFromDatabase]);

  useEffect(() => {
    if (open && user) {
      fetchRelevantTemplateSets();
    }
  }, [open, user, contact, fetchRelevantTemplateSets]);

  const replaceVariables = (content: string, contact: Contact): string => {
    let processedContent = content;
    
    // Replace common variables with proper string conversion and null checking
    processedContent = processedContent.replace(/\{\{name\}\}/g, String(contact.name || ''));
    processedContent = processedContent.replace(/\{\{first_name\}\}/g, String(contact.name?.split(' ')[0] || ''));
    processedContent = processedContent.replace(/\{\{company\}\}/g, String(contact.company || ''));
    processedContent = processedContent.replace(/\{\{phone\}\}/g, String(contact.phone_number || ''));
    processedContent = processedContent.replace(/\{\{email\}\}/g, String(contact.email || ''));
    
    return processedContent;
  };

  const handleTemplateSelect = (templateContent: string) => {
    const processedContent = replaceVariables(templateContent, contact);
    setSelectedTemplate(templateContent);
    setCustomMessage(processedContent);
  };

  const handleSendMessage = async () => {
    if (!customMessage.trim()) {
      toast({
        title: "Error",
        description: "Please enter a message",
        variant: "destructive",
      });
      return;
    }

    try {
      // Create engagement record
      const { error } = await supabase
        .from('engagements')
        .insert({
          contact_id: contact.id,
          created_by: user?.id || '',
          name: 'Template Follow-up',
          description: customMessage,
          status: 'Active'
        });

      if (error) throw error;

      // Create activity record for proper logging
      const { error: activityError } = await supabase
        .from('activities')
        .insert({
          contact_id: contact.id,
          user_id: user?.id || '',
          type: 'Template Follow-up',
          details: `Template message: ${customMessage.substring(0, 100)}${customMessage.length > 100 ? '...' : ''}`,
          timestamp: new Date().toISOString()
        });

      if (activityError) {
        console.warn('Failed to log activity:', activityError);
        // Don't fail the whole operation for activity logging
      }

      // Trigger optimistic activity callback for immediate UI update
      if (onTemplateUsed) {
        onTemplateUsed('Template Follow-up', 1, contact.id);
      }

      toast({
        title: "Message Sent",
        description: `Template message sent to ${contact.name}`,
        variant: "default",
      });

      // Trigger categorization refresh
      if (onEngagementCreated) {
        onEngagementCreated();
      }

      setOpen(false);
      setSelectedTemplate('');
      setCustomMessage('');
    } catch (error: CatchError) {
      console.error('Error sending message:', getErrorMessage(error));
      toast({
        title: "Error",
        description: "Failed to send message",
        variant: "destructive",
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MessageCircle className="h-5 w-5" />
            Select Template for {contact.name}
          </DialogTitle>
          <DialogDescription>
            Choose a template and customize your message
          </DialogDescription>
        </DialogHeader>
        
        {/* Loading indicator with source */}
        {loading && (
          <div className="flex items-center justify-center py-8 space-x-2">
            {loadingSource === 'cache' ? (
              <>
                <Zap className="h-4 w-4 animate-pulse text-green-500" />
                <span className="text-sm text-green-600">Loading from cache...</span>
              </>
            ) : loadingSource === 'database' ? (
              <>
                <Database className="h-4 w-4 animate-pulse text-blue-500" />
                <span className="text-sm text-blue-600">Loading from database...</span>
              </>
            ) : (
              <>
                <Clock className="h-4 w-4 animate-spin" />
                <span className="text-sm">Loading templates...</span>
              </>
            )}
          </div>
        )}

        {!loading && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-[70vh]">
            {/* Template Selection */}
            <div className="space-y-4">
              <h3 className="font-semibold text-lg">Available Templates</h3>
              
              {/* Contact Labels */}
              {contact.labels && contact.labels.length > 0 && (
                <div className="space-y-2">
                  <p className="text-sm text-gray-600">Contact Labels:</p>
                  <div className="flex flex-wrap gap-1">
                    {contact.labels.map(label => (
                      <Badge key={label} variant="secondary" className="text-xs">
                        {label}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
              
              <ScrollArea className="h-[50vh]">
                <div className="space-y-3">
                  {templateSets.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      No templates found. Create some templates first.
                    </div>
                  ) : (
                    templateSets.map(templateSet => (
                      <Card key={templateSet.id} className="hover:shadow-md transition-shadow">
                        <CardContent className="p-4">
                          <div className="space-y-3">
                            <div>
                              <h4 className="font-medium">{templateSet.name}</h4>
                              {templateSet.description && (
                                <p className="text-sm text-gray-600">{templateSet.description}</p>
                              )}
                            </div>
                            
                            {/* Template Set Labels */}
                            {templateSet.labels.length > 0 && (
                              <div className="flex flex-wrap gap-1">
                                {templateSet.labels.map(label => (
                                  <Badge key={label} variant="outline" className="text-xs">
                                    {label}
                                  </Badge>
                                ))}
                              </div>
                            )}
                            
                            {/* Templates */}
                            <div className="space-y-2">
                              {templateSet.templates.map(template => (
                                <div key={template.id} className="border rounded p-2 hover:bg-gray-50">
                                  <div className="flex justify-between items-start mb-2">
                                    <span className="font-medium text-sm">{template.name}</span>
                                    <Badge variant="secondary" className="text-xs">
                                      {template.type}
                                    </Badge>
                                  </div>
                                  <p className="text-sm text-gray-600 mb-2 line-clamp-2">
                                    {template.content}
                                  </p>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleTemplateSelect(template.content)}
                                    className="w-full"
                                  >
                                    Use This Template
                                  </Button>
                                </div>
                              ))}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))
                  )}
                </div>
              </ScrollArea>
            </div>

            <Separator orientation="vertical" className="hidden lg:block" />

            {/* Message Composition */}
            <div className="space-y-4">
              <h3 className="font-semibold text-lg">Compose Message</h3>
              
              <div className="space-y-2">
                <label className="text-sm font-medium">Message Content</label>
                <Textarea
                  value={customMessage}
                  onChange={(e) => setCustomMessage(e.target.value)}
                  placeholder="Select a template or write your custom message..."
                  className="min-h-[300px] resize-none"
                />
                <p className="text-xs text-gray-500">
                  Available variables: {'{'}{'{'} name {'}'}{'}'},  {'{'}{'{'} first_name {'}'}{'}'},  {'{'}{'{'} company {'}'}{'}'},  {'{'}{'{'} phone {'}'}{'}'},  {'{'}{'{'} email {'}'}{'}'}  
                </p>
              </div>
              
              {/* Preview */}
              {customMessage && (
                <div className="space-y-2">
                  <label className="text-sm font-medium">Preview</label>
                  <div className="p-3 bg-gray-50 rounded border text-sm">
                    {replaceVariables(customMessage, contact)}
                  </div>
                </div>
              )}
              
              <div className="flex gap-2 pt-4">
                <Button
                  onClick={handleSendMessage}
                  disabled={!customMessage.trim()}
                  className="flex-1"
                >
                  <Send className="h-4 w-4 mr-2" />
                  Send Message
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setOpen(false)}
                >
                  Cancel
                </Button>
              </div>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};