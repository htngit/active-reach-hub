
import React, { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { MessageCircle, FileText, Plus } from 'lucide-react';
import { toast } from 'sonner';
import { TemplateSelectionModal } from './TemplateSelectionModal';

interface Contact {
  id: string;
  name: string;
  phone_number: string;
  email?: string;
  company?: string;
  address?: string;
  notes?: string;
  labels?: string[];
  status: string;
  potential_product?: string[];
  created_at: string;
}

interface ContactDetailActionsProps {
  contact: Contact;
}

const activityTypes = ['WhatsApp Attempt', 'Call Logged', 'Email Sent', 'Meeting Note'];

export const ContactDetailActions: React.FC<ContactDetailActionsProps> = ({
  contact,
}) => {
  const [showAddActivity, setShowAddActivity] = useState(false);
  const [newActivity, setNewActivity] = useState({ type: '', details: '' });
  const { user } = useAuth();

  const formatPhoneNumber = (phoneNumber: string) => {
    let cleaned = phoneNumber.replace(/\D/g, '');
    
    if (phoneNumber.startsWith('+')) {
      cleaned = phoneNumber.substring(1).replace(/\D/g, '');
    }
    
    if (cleaned.startsWith('0')) {
      cleaned = '62' + cleaned.substring(1);
    }
    
    return cleaned;
  };

  const handleWhatsAppContact = async () => {
    if (!user) return;

    try {
      const formattedPhone = formatPhoneNumber(contact.phone_number);
      const whatsappUrl = `https://wa.me/${formattedPhone}`;
      
      const { error } = await supabase
        .from('activities')
        .insert({
          contact_id: contact.id,
          user_id: user.id,
          type: 'WhatsApp Direct Contact',
          details: `Direct WhatsApp contact to ${contact.phone_number}`,
          timestamp: new Date().toISOString(),
        });

      if (error) {
        console.error('Failed to log activity:', error);
      }

      window.open(whatsappUrl, '_blank');
      toast.success(`WhatsApp opened for ${contact.name}`);
    } catch (error: any) {
      await supabase
        .from('activities')
        .insert({
          contact_id: contact.id,
          user_id: user?.id,
          type: 'WhatsApp Direct Contact',
          details: `Failed WhatsApp attempt: ${error.message}`,
          timestamp: new Date().toISOString(),
        });

      toast.error("Failed to open WhatsApp");
    }
  };

  const handleAddActivity = async () => {
    if (!newActivity.type || !user) return;

    try {
      const { error } = await supabase
        .from('activities')
        .insert({
          contact_id: contact.id,
          user_id: user.id,
          type: newActivity.type,
          details: newActivity.details || null,
          timestamp: new Date().toISOString(),
        });

      if (error) throw error;

      toast.success("Activity logged successfully");
      setNewActivity({ type: '', details: '' });
      setShowAddActivity(false);
    } catch (error: any) {
      console.error('Error adding activity:', error);
      toast.error(error.message || "Failed to log activity");
    }
  };

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2 flex-wrap">
            <Button onClick={handleWhatsAppContact}>
              <MessageCircle className="h-4 w-4 mr-2" />
              Contact via WhatsApp
            </Button>
            <TemplateSelectionModal contact={contact}>
              <Button variant="outline">
                <MessageCircle className="h-4 w-4 mr-2" />
                Template Follow Up
              </Button>
            </TemplateSelectionModal>
            <Button 
              variant="outline" 
              onClick={() => window.location.href = `/invoices?contact=${contact.id}`}
            >
              <FileText className="h-4 w-4 mr-2" />
              Create Invoice
            </Button>
            <Button variant="outline" onClick={() => setShowAddActivity(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Log Activity
            </Button>
          </div>
        </CardContent>
      </Card>

      {showAddActivity && (
        <Card>
          <CardHeader>
            <CardTitle>Log New Activity</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Select
              value={newActivity.type}
              onValueChange={(value) => setNewActivity({ ...newActivity, type: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select activity type" />
              </SelectTrigger>
              <SelectContent>
                {activityTypes.map(type => (
                  <SelectItem key={type} value={type}>{type}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Textarea
              placeholder="Activity details (optional)"
              value={newActivity.details}
              onChange={(e) => setNewActivity({ ...newActivity, details: e.target.value })}
            />
            <div className="flex gap-2">
              <Button onClick={handleAddActivity}>Log Activity</Button>
              <Button variant="outline" onClick={() => setShowAddActivity(false)}>Cancel</Button>
            </div>
          </CardContent>
        </Card>
      )}
    </>
  );
};
