
import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { MessageCircle } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

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
}

export const TemplateSelectionModal: React.FC<TemplateSelectionModalProps> = ({
  contact,
  children,
}) => {
  const [templateSets, setTemplateSets] = useState<MessageTemplateSet[]>([]);
  const [labels, setLabels] = useState<Label[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    if (open) {
      fetchRelevantTemplateSets();
    }
  }, [open, contact, user]);

  const fetchRelevantTemplateSets = async () => {
    if (!user || !contact.labels || contact.labels.length === 0) {
      setTemplateSets([]);
      return;
    }

    setLoading(true);
    try {
      // First fetch labels to get their IDs
      const { data: labelsData, error: labelsError } = await supabase
        .from('labels')
        .select('id, name')
        .eq('user_id', user.id)
        .in('name', contact.labels);

      if (labelsError) throw labelsError;
      setLabels(labelsData || []);

      const labelIds = labelsData?.map(label => label.id) || [];

      if (labelIds.length === 0) {
        setTemplateSets([]);
        return;
      }

      // Fetch template sets that match the contact's labels
      const { data: templatesData, error: templatesError } = await supabase
        .from('message_template_sets')
        .select('*')
        .eq('user_id', user.id)
        .in('associated_label_id', labelIds);

      if (templatesError) throw templatesError;
      setTemplateSets(templatesData || []);
    } catch (error: any) {
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

  const handleTemplateSelect = async (templateSet: MessageTemplateSet) => {
    try {
      // Select random variation
      const { variation, variationNumber } = selectRandomVariation(templateSet);
      
      // Replace placeholders
      const personalizedMessage = replacePlaceholders(variation, contact);
      
      // Format phone number for wa.me
      const formattedPhone = formatPhoneNumber(contact.phone_number);
      
      // Construct WhatsApp URL
      const encodedMessage = encodeURIComponent(personalizedMessage);
      const whatsappUrl = `https://wa.me/${formattedPhone}?text=${encodedMessage}`;
      
      // Log activity to database
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
      toast({
        title: "Error",
        description: "Gagal membuka link WhatsApp",
        variant: "destructive",
      });
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
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Select a Follow-Up Template</DialogTitle>
        </DialogHeader>
        
        {loading ? (
          <div className="p-4 text-center">Loading templates...</div>
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
