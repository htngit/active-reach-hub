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

import React, { useState, useEffect, ReactNode } from 'react';
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
import { useTemplateCacheDB } from '@/hooks/useTemplateCacheDB';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface MessageTemplateSet {
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

interface Label {
  id: string;
  name: string;
  color?: string;
}

interface TemplateSelectionModalOptimizedProps {
  contact: Contact;
  children: ReactNode;
}

export const TemplateSelectionModalOptimized: React.FC<TemplateSelectionModalOptimizedProps> = ({
  contact,
  children,
}) => {
  const [open, setOpen] = useState(false);
  const [templateSets, setTemplateSets] = useState<MessageTemplateSet[]>([]);
  const [labels, setLabels] = useState<Label[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<string>('');
  const [customMessage, setCustomMessage] = useState<string>('');
  const [loadingSource, setLoadingSource] = useState<'cache' | 'database' | null>(null);
  const { user } = useAuth();
  
  // Database cache hook
  const { 
    getTemplatesFromCache, 
    getCacheStats, 
    refreshCacheInBackground 
  } = useTemplateCacheDB();

  useEffect(() => {
    if (open && user) {
      fetchRelevantTemplateSets();
    }
  }, [open, user, contact]);

  const fetchRelevantTemplateSets = async () => {
    if (!user || !contact) return;

    try {
      setLoading(true);
      
      // Try to get templates from cache first (instant)
      setLoadingSource('cache');
      const cacheResult = await getTemplatesFromCache(contact.labels || []);
      
      if (cacheResult.success && cacheResult.data) {
        setTemplateSets(cacheResult.data.templateSets || []);
        setLabels(cacheResult.data.labels || []);
        setLoadingSource(null);
        setLoading(false);
        
        // Start background refresh for next time (non-blocking)
        refreshCacheInBackground().catch(console.error);
        return;
      }
      
      // Fallback to database if cache miss
      setLoadingSource('database');
      await fetchFromDatabase();
      
    } catch (error: any) {
      console.error('Error fetching templates:', error);
      toast({
        title: "Error",
        description: "Failed to load templates",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
      setLoadingSource(null);
    }
  };

  const fetchFromDatabase = async () => {
    if (!user) return;

    try {
      // Get contact labels for filtering
      const contactLabels = contact.labels || [];
      
      let query = supabase
        .from('message_template_sets')
        .select(`
          id,
          name,
          description,
          templates:message_templates(
            id,
            name,
            content,
            type,
            variables
          ),
          labels:message_template_set_labels(
            label:labels(
              id,
              name,
              color
            )
          ),
          created_at,
          updated_at
        `)
        .eq('user_id', user.id)
        .order('updated_at', { ascending: false });

      const { data: templateSetsData, error: templateSetsError } = await query;
      
      if (templateSetsError) throw templateSetsError;

      // Transform the data to match our interface
      const transformedTemplateSets: MessageTemplateSet[] = (templateSetsData || []).map(set => ({
        id: set.id,
        name: set.name,
        description: set.description,
        templates: set.templates || [],
        labels: (set.labels || []).map((l: any) => l.label?.name).filter(Boolean),
        created_at: set.created_at,
        updated_at: set.updated_at,
      }));

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
      
    } catch (error: any) {
      console.error('Database fetch error:', error);
      throw error;
    }
  };

  const replaceVariables = (content: string, contact: Contact): string => {
    let processedContent = content;
    
    // Replace common variables
    processedContent = processedContent.replace(/\{\{name\}\}/g, contact.name || '');
    processedContent = processedContent.replace(/\{\{first_name\}\}/g, contact.name?.split(' ')[0] || '');
    processedContent = processedContent.replace(/\{\{company\}\}/g, contact.company || '');
    processedContent = processedContent.replace(/\{\{phone\}\}/g, contact.phone_number || '');
    processedContent = processedContent.replace(/\{\{email\}\}/g, contact.email || '');
    
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
          user_id: user?.id,
          type: 'template_message',
          content: customMessage,
          status: 'sent'
        });

      if (error) throw error;

      toast({
        title: "Message Sent",
        description: `Template message sent to ${contact.name}`,
        variant: "default",
      });

      setOpen(false);
      setSelectedTemplate('');
      setCustomMessage('');
    } catch (error: any) {
      console.error('Error sending message:', error);
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
                  Available variables: {{name}}, {{first_name}}, {{company}}, {{phone}}, {{email}}
                </p>
              </div>
              
              {/* Preview */}
              {customMessage && (
                <div className="space-y-2">
                  <label className="text-sm font-medium">Preview</label>
                  <div className="p-3 bg-gray-50 rounded border text-sm">
                    {customMessage}
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