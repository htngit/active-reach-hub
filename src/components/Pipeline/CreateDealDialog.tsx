
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useDeals } from '@/hooks/useDeals';
import { useCachedContacts } from '@/hooks/useCachedContacts';
import { useTeamData } from '@/hooks/useTeamData';
import { Deal } from '@/types/deal';

interface CreateDealDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const CreateDealDialog = ({ open, onOpenChange }: CreateDealDialogProps) => {
  const { createDeal } = useDeals();
  const { contacts } = useCachedContacts();
  const { teams } = useTeamData();
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    contact_id: '',
    stage: 'Lead' as Deal['stage'],
    value: '',
    probability: '10',
    expected_close_date: '',
    team_id: '',
    notes: '',
    source: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.contact_id) {
      return;
    }

    try {
      await createDeal({
        title: formData.title,
        description: formData.description || undefined,
        contact_id: formData.contact_id,
        stage: formData.stage,
        value: parseFloat(formData.value) || 0,
        probability: parseInt(formData.probability) || 0,
        expected_close_date: formData.expected_close_date || undefined,
        actual_close_date: undefined,
        created_by: '', // This will be set in the hook
        assigned_to: undefined,
        team_id: formData.team_id || undefined,
        closed_at: undefined,
        notes: formData.notes || undefined,
        source: formData.source || undefined
      });
      
      onOpenChange(false);
      setFormData({
        title: '',
        description: '',
        contact_id: '',
        stage: 'Lead',
        value: '',
        probability: '10',
        expected_close_date: '',
        team_id: '',
        notes: '',
        source: ''
      });
    } catch (error) {
      console.error('Error creating deal:', error);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Create New Deal</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="title">Deal Title</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              required
            />
          </div>

          <div>
            <Label htmlFor="contact_id">Contact</Label>
            <Select value={formData.contact_id} onValueChange={(value) => setFormData({ ...formData, contact_id: value })}>
              <SelectTrigger>
                <SelectValue placeholder="Select a contact" />
              </SelectTrigger>
              <SelectContent>
                {contacts.map((contact) => (
                  <SelectItem key={contact.id} value={contact.id}>
                    {contact.name} {contact.company && `(${contact.company})`}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="value">Deal Value ($)</Label>
              <Input
                id="value"
                type="number"
                value={formData.value}
                onChange={(e) => setFormData({ ...formData, value: e.target.value })}
              />
            </div>
            
            <div>
              <Label htmlFor="probability">Probability (%)</Label>
              <Input
                id="probability"
                type="number"
                min="0"
                max="100"
                value={formData.probability}
                onChange={(e) => setFormData({ ...formData, probability: e.target.value })}
              />
            </div>
          </div>

          <div>
            <Label htmlFor="expected_close_date">Expected Close Date</Label>
            <Input
              id="expected_close_date"
              type="date"
              value={formData.expected_close_date}
              onChange={(e) => setFormData({ ...formData, expected_close_date: e.target.value })}
            />
          </div>

          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={3}
            />
          </div>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit">
              Create Deal
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
