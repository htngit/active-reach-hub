
import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { X } from 'lucide-react';
import { toast } from 'sonner';

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

interface ContactDetailEditFormProps {
  contact: Contact;
  onContactChange: (contact: Contact) => void;
}

const statusOptions = ['New', 'Approached', 'Follow-up Required', 'Paid', 'Lost'];

export const ContactDetailEditForm: React.FC<ContactDetailEditFormProps> = ({
  contact,
  onContactChange,
}) => {
  const [availableLabels, setAvailableLabels] = useState<string[]>([]);
  const [newLabel, setNewLabel] = useState('');
  const { user } = useAuth();

  useEffect(() => {
    fetchLabels();
  }, []);

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

  const addLabel = (label: string) => {
    if (!contact.labels?.includes(label)) {
      onContactChange({
        ...contact,
        labels: [...(contact.labels || []), label]
      });
    }
  };

  const removeLabel = (labelToRemove: string) => {
    onContactChange({
      ...contact,
      labels: contact.labels?.filter(label => label !== labelToRemove) || []
    });
  };

  const createAndAddLabel = async () => {
    if (!newLabel.trim() || !user) return;

    try {
      const { error } = await supabase
        .from('labels')
        .insert({
          name: newLabel.trim(),
          user_id: user.id,
        });

      if (error && error.code !== '23505') {
        throw error;
      }

      addLabel(newLabel.trim());
      setAvailableLabels([...availableLabels, newLabel.trim()]);
      setNewLabel('');
    } catch (error: any) {
      console.error('Error creating label:', error);
      toast.error(error.message || "Failed to create label");
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Edit Contact Information</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">Name</label>
          <Input
            value={contact.name}
            onChange={(e) => onContactChange({ ...contact, name: e.target.value })}
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Phone</label>
          <Input
            value={contact.phone_number}
            onChange={(e) => onContactChange({ ...contact, phone_number: e.target.value })}
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Email</label>
          <Input
            value={contact.email || ''}
            onChange={(e) => onContactChange({ ...contact, email: e.target.value })}
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Company</label>
          <Input
            value={contact.company || ''}
            onChange={(e) => onContactChange({ ...contact, company: e.target.value })}
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Address</label>
          <Input
            value={contact.address || ''}
            onChange={(e) => onContactChange({ ...contact, address: e.target.value })}
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Status</label>
          <Select
            value={contact.status}
            onValueChange={(value) => onContactChange({ ...contact, status: value })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {statusOptions.map(status => (
                <SelectItem key={status} value={status}>{status}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Notes</label>
          <Textarea
            value={contact.notes || ''}
            onChange={(e) => onContactChange({ ...contact, notes: e.target.value })}
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Labels</label>
          <div className="space-y-2">
            <div className="flex flex-wrap gap-2">
              {contact.labels?.map(label => (
                <Badge key={label} variant="secondary" className="flex items-center gap-1">
                  {label}
                  <X className="h-3 w-3 cursor-pointer" onClick={() => removeLabel(label)} />
                </Badge>
              ))}
            </div>
            <div className="flex gap-2">
              <Select onValueChange={addLabel}>
                <SelectTrigger className="flex-1">
                  <SelectValue placeholder="Add existing label" />
                </SelectTrigger>
                <SelectContent>
                  {availableLabels.filter(label => !contact.labels?.includes(label)).map(label => (
                    <SelectItem key={label} value={label}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex gap-2">
              <Input
                placeholder="Create new label"
                value={newLabel}
                onChange={(e) => setNewLabel(e.target.value)}
              />
              <Button onClick={createAndAddLabel}>Add</Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
