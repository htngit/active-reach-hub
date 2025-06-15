import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { X } from 'lucide-react';

interface EngagementDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  contactId: string;
  contactName: string;
  onEngagementCreated: () => void;
}

export const EngagementDialog: React.FC<EngagementDialogProps> = ({
  open,
  onOpenChange,
  contactId,
  contactName,
  onEngagementCreated,
}) => {
  const { user } = useAuth();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [potentialProducts, setPotentialProducts] = useState<string[]>([]);
  const [newProduct, setNewProduct] = useState('');
  const [saving, setSaving] = useState(false);

  // Debug contact access when dialog opens
  useEffect(() => {
    if (open && contactId && user) {
      debugContactAccess();
    }
  }, [open, contactId, user]);

  const debugContactAccess = async () => {
    try {
      console.log('Debugging contact access for:', { contactId, userId: user?.id });
      
      // Check contact details
      const { data: contactData, error: contactError } = await supabase
        .from('contacts')
        .select('*')
        .eq('id', contactId)
        .single();

      if (contactError) {
        console.error('Error fetching contact:', contactError);
        return;
      }

      console.log('Contact data:', contactData);
      console.log('User can access because:', {
        isOwner: contactData.owner_id === user?.id,
        isCreator: contactData.user_id === user?.id,
        hasTeam: !!contactData.team_id
      });

      // If contact has a team, check team membership
      if (contactData.team_id) {
        const { data: teamData, error: teamError } = await supabase
          .from('teams')
          .select('*')
          .eq('id', contactData.team_id)
          .single();

        if (!teamError && teamData) {
          console.log('Team data:', teamData);
          console.log('User is team owner:', teamData.owner_id === user?.id);
        }

        const { data: memberData, error: memberError } = await supabase
          .from('team_members')
          .select('*')
          .eq('team_id', contactData.team_id)
          .eq('user_id', user?.id);

        if (!memberError) {
          console.log('Team membership:', memberData);
        }
      }
    } catch (error) {
      console.error('Debug error:', error);
    }
  };

  const handleAddProduct = () => {
    if (newProduct.trim() && !potentialProducts.includes(newProduct.trim())) {
      setPotentialProducts([...potentialProducts, newProduct.trim()]);
      setNewProduct('');
    }
  };

  const handleRemoveProduct = (product: string) => {
    setPotentialProducts(potentialProducts.filter(p => p !== product));
  };

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
      setNewProduct('');
      onEngagementCreated();
      onOpenChange(false);
    } catch (error: any) {
      console.error('Error creating engagement:', error);
      toast.error(error.message || 'Failed to create engagement');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Create New Engagement for {contactName}</DialogTitle>
        </DialogHeader>
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

          <div>
            <Label>Potential Products/Services</Label>
            <div className="flex gap-2 mb-2">
              <Input
                value={newProduct}
                onChange={(e) => setNewProduct(e.target.value)}
                placeholder="Add product/service"
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddProduct())}
              />
              <Button type="button" onClick={handleAddProduct} variant="outline">
                Add
              </Button>
            </div>
            {potentialProducts.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {potentialProducts.map((product) => (
                  <Badge key={product} variant="secondary" className="flex items-center gap-1">
                    {product}
                    <X
                      className="h-3 w-3 cursor-pointer"
                      onClick={() => handleRemoveProduct(product)}
                    />
                  </Badge>
                ))}
              </div>
            )}
          </div>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={saving || !name.trim()}>
              {saving ? 'Creating...' : 'Create Engagement'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
