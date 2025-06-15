
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { PotentialProductsInput } from './PotentialProductsInput';

interface EngagementFormProps {
  contactId: string;
  onSuccess: () => void;
  onCancel: () => void;
}

export const EngagementForm: React.FC<EngagementFormProps> = ({
  contactId,
  onSuccess,
  onCancel,
}) => {
  const { user } = useAuth();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [potentialProducts, setPotentialProducts] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !name.trim()) return;

    setSaving(true);
    try {
      const { data, error } = await supabase
        .from('engagements')
        .insert([{
          contact_id: contactId,
          name: name.trim(),
          description: description.trim() || null,
          potential_product: potentialProducts.length > 0 ? potentialProducts : null,
          created_by: user.id,
          status: 'New'
        }])
        .select()
        .single();

      if (error) {
        throw error;
      }

      toast.success('New engagement created successfully');
      setName('');
      setDescription('');
      setPotentialProducts([]);
      onSuccess();
    } catch (error: any) {
      console.error('Error creating engagement:', error);
      toast.error(error.message || 'Failed to create engagement');
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="engagement-name">Engagement Name *</Label>
        <Input
          id="engagement-name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g., Q1 2024 Software Implementation"
          required
        />
      </div>
      
      <div>
        <Label htmlFor="engagement-description">Description</Label>
        <Textarea
          id="engagement-description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Brief description of this engagement opportunity..."
          rows={3}
        />
      </div>

      <PotentialProductsInput
        potentialProducts={potentialProducts}
        onProductsChange={setPotentialProducts}
      />

      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" disabled={saving || !name.trim()}>
          {saving ? 'Creating...' : 'Create Engagement'}
        </Button>
      </div>
    </form>
  );
};
