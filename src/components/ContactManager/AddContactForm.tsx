import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { X } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { normalizePhoneNumber, isValidPhoneNumber } from '@/utils/phoneUtils';

interface AddContactFormProps {
  onBack: () => void;
  onContactAdded: () => void;
}

const statusOptions = [
  { value: 'New', label: 'New' },
  { value: 'Contacted', label: 'Contacted' },
  { value: 'Qualified', label: 'Qualified' },
  { value: 'Converted', label: 'Converted' },
  { value: 'Lost', label: 'Lost' }
];

export const AddContactForm: React.FC<AddContactFormProps> = ({
  onBack,
  onContactAdded,
}) => {
  const [formData, setFormData] = useState({
    name: '',
    phone_number: '',
    email: '',
    company: '',
    address: '',
    notes: '',
    status: 'New',
    labels: [] as string[],
    potential_product: [] as string[],
  });
  const [availableLabels, setAvailableLabels] = useState<string[]>([]);
  const [newLabel, setNewLabel] = useState('');
  const [newProduct, setNewProduct] = useState('');
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    fetchLabels();
  }, [user]);

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.phone_number) {
      toast({
        title: "Error",
        description: "Name and phone number are required",
        variant: "destructive",
      });
      return;
    }

    // Validate phone number format
    if (!isValidPhoneNumber(formData.phone_number)) {
      toast({
        title: "Error",
        description: "Please enter a valid phone number",
        variant: "destructive",
      });
      return;
    }

    if (!user) {
      toast({
        title: "Error",
        description: "You must be logged in to add contacts",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      // Normalize phone number for consistent checking
      const normalizedPhone = normalizePhoneNumber(formData.phone_number);
      
      const { data: existing, error: checkError } = await supabase
        .from('contacts')
        .select('id')
        .eq('user_id', user.id)
        .eq('phone_number', normalizedPhone)
        .maybeSingle();

      if (checkError) throw checkError;

      if (existing) {
        setLoading(false);
        toast({
          title: "Error",
          description: "A contact with this phone number already exists",
          variant: "destructive",
        });
        return;
      }

      // Simplified contact data - no team categorization, just user ownership
      const contactData = {
        name: formData.name,
        phone_number: normalizedPhone, // Use normalized phone number
        email: formData.email || null,
        company: formData.company || null,
        address: formData.address || null,
        notes: formData.notes || null,
        status: formData.status,
        labels: formData.labels.length > 0 ? formData.labels : null,
        potential_product: formData.potential_product.length > 0 ? formData.potential_product : null,
        user_id: user.id, // User who created the contact
        owner_id: user.id, // User who owns the contact
        team_id: null, // No team assignment - RLS will handle team access
      };

      console.log('Submitting contact data:', contactData);

      const { data, error } = await supabase
        .from('contacts')
        .insert(contactData)
        .select();

      if (error) {
        console.error('Supabase error:', error);
        throw error;
      }

      console.log('Contact created successfully:', data);

      toast({
        title: "Success",
        description: "Contact added successfully",
      });

      onContactAdded();
    } catch (error: any) {
      console.error('Error adding contact:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to add contact",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const addLabel = (label: string) => {
    if (!formData.labels.includes(label)) {
      setFormData({
        ...formData,
        labels: [...formData.labels, label]
      });
    }
  };

  const removeLabel = (labelToRemove: string) => {
    setFormData({
      ...formData,
      labels: formData.labels.filter(label => label !== labelToRemove)
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
      toast({
        title: "Error",
        description: "Failed to create label",
        variant: "destructive",
      });
    }
  };

  const addProduct = () => {
    if (newProduct.trim() && !formData.potential_product.includes(newProduct.trim())) {
      setFormData({
        ...formData,
        potential_product: [...formData.potential_product, newProduct.trim()]
      });
      setNewProduct('');
    }
  };

  const removeProduct = (productToRemove: string) => {
    setFormData({
      ...formData,
      potential_product: formData.potential_product.filter(product => product !== productToRemove)
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Button variant="outline" onClick={onBack}>
          ← Back to Contacts
        </Button>
        <h1 className="text-2xl font-bold">Add New Contact</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Contact Information</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Name *</label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Phone Number *</label>
              <Input
                value={formData.phone_number}
                onChange={(e) => setFormData({ ...formData, phone_number: e.target.value })}
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Email</label>
              <Input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Company</label>
              <Input
                value={formData.company}
                onChange={(e) => setFormData({ ...formData, company: e.target.value })}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Address</label>
              <Input
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Status</label>
              <Select
                value={formData.status}
                onValueChange={(value) => setFormData({ ...formData, status: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {statusOptions.map(status => (
                    <SelectItem key={status.value} value={status.value}>{status.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Labels</label>
              <div className="space-y-2">
                <div className="flex flex-wrap gap-2">
                  {formData.labels.map(label => (
                    <Badge key={label} variant="secondary" className="flex items-center gap-1">
                      {label}
                      <X className="h-3 w-3 cursor-pointer" onClick={() => removeLabel(label)} />
                    </Badge>
                  ))}
                </div>
                {availableLabels.length > 0 && (
                  <div className="flex gap-2">
                    <Select onValueChange={addLabel}>
                      <SelectTrigger className="flex-1">
                        <SelectValue placeholder="Add existing label" />
                      </SelectTrigger>
                      <SelectContent>
                        {availableLabels.filter(label => !formData.labels.includes(label)).map(label => (
                          <SelectItem key={label} value={label}>{label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
                <div className="flex gap-2">
                  <Input
                    placeholder="Create new label"
                    value={newLabel}
                    onChange={(e) => setNewLabel(e.target.value)}
                  />
                  <Button type="button" onClick={createAndAddLabel}>Add</Button>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Potential Products</label>
              <div className="space-y-2">
                <div className="flex flex-wrap gap-2">
                  {formData.potential_product.map(product => (
                    <Badge key={product} variant="outline" className="flex items-center gap-1">
                      {product}
                      <X className="h-3 w-3 cursor-pointer" onClick={() => removeProduct(product)} />
                    </Badge>
                  ))}
                </div>
                <div className="flex flex-col sm:flex-row gap-2">
                  <Input
                    placeholder="Add potential product"
                    value={newProduct}
                    onChange={(e) => setNewProduct(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addProduct())}
                    className="flex-1"
                  />
                  <Button type="button" onClick={addProduct} className="flex items-center justify-center gap-1 w-full sm:w-auto">Add</Button>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Notes</label>
              <Textarea
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                rows={3}
              />
            </div>

            <div className="flex flex-col sm:flex-row gap-2">
              <Button type="submit" disabled={loading} className="flex items-center justify-center gap-1 w-full sm:w-auto">
                {loading ? 'Adding...' : 'Add Contact'}
              </Button>
              <Button type="button" variant="outline" onClick={onBack} className="flex items-center justify-center gap-1 w-full sm:w-auto">
                Cancel
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};
