import React, { useState, useEffect } from 'react';
import { useInvoiceData } from '@/hooks/useInvoiceData';
import { useCachedContacts } from '@/hooks/useCachedContacts';
import { useProductData } from '@/hooks/useProductData';
import { useTeamData } from '@/hooks/useTeamData';
import { useCurrency } from '@/hooks/useCurrency';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Plus, Trash2, Calculator } from 'lucide-react';
import { CreateInvoiceRequest } from '@/types/invoice';

interface CreateInvoiceFormProps {
  onBack: () => void;
  onInvoiceCreated: () => void;
}

interface InvoiceItemForm {
  product_id?: string;
  description: string;
  quantity: number;
  unit_price: number;
}

export const CreateInvoiceForm: React.FC<CreateInvoiceFormProps> = ({
  onBack,
  onInvoiceCreated,
}) => {
  const [selectedContactId, setSelectedContactId] = useState('');
  const [selectedTeamId, setSelectedTeamId] = useState('');
  const [items, setItems] = useState<InvoiceItemForm[]>([
    { description: '', quantity: 1, unit_price: 0 }
  ]);
  const [taxRate, setTaxRate] = useState(0);
  const [dueDate, setDueDate] = useState('');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { createInvoice } = useInvoiceData();
  const { contacts, loading: contactsLoading, refreshContacts } = useCachedContacts();
  const { products } = useProductData();
  const { teams } = useTeamData();
  const { user } = useAuth();
  const { formatCurrency } = useCurrency();

  // Auto-select team if only one team exists
  useEffect(() => {
    if (teams.length === 1) {
      setSelectedTeamId(teams[0].id);
    }
  }, [teams]);

  // Handle pre-selected contact from URL params
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const contactId = urlParams.get('contact');
    if (contactId && contacts.find(c => c.id === contactId)) {
      setSelectedContactId(contactId);
      // Find the team for invoice creation
      if (teams.length > 0) {
        setSelectedTeamId(teams[0].id);
      }
    }
  }, [contacts, teams]);

  // Force refresh contacts when component mounts to ensure we have latest data
  useEffect(() => {
    refreshContacts();
  }, [refreshContacts]);

  // All available contacts (RLS handles filtering)
  const availableContacts = contacts;

  console.log('Contact access debug:', {
    totalContacts: contacts.length,
    selectedTeamId,
    userId: user?.id,
    contactsPreview: contacts.slice(0, 5).map(c => ({
      id: c.id,
      name: c.name,
      owner_id: c.owner_id,
      team_id: c.team_id,
      user_id: c.user_id
    }))
  });

  const teamProducts = products.filter(product => 
    selectedTeamId ? product.team_id === selectedTeamId : true
  );

  const addItem = () => {
    setItems([...items, { description: '', quantity: 1, unit_price: 0 }]);
  };

  const removeItem = (index: number) => {
    if (items.length > 1) {
      setItems(items.filter((_, i) => i !== index));
    }
  };

  const updateItem = (index: number, field: keyof InvoiceItemForm, value: any) => {
    const updatedItems = [...items];
    updatedItems[index] = { ...updatedItems[index], [field]: value };
    setItems(updatedItems);
  };

  const selectProduct = (index: number, productId: string) => {
    if (productId === 'custom') {
      // Reset to custom item
      updateItem(index, 'product_id', undefined);
      updateItem(index, 'description', '');
      updateItem(index, 'unit_price', 0);
    } else {
      const product = products.find(p => p.id === productId);
      if (product) {
        updateItem(index, 'product_id', productId);
        updateItem(index, 'description', product.name);
        updateItem(index, 'unit_price', product.price || 0);
      }
    }
  };

  const subtotal = items.reduce((sum, item) => sum + (item.quantity * item.unit_price), 0);
  const taxAmount = subtotal * taxRate / 100;
  const total = subtotal + taxAmount;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedContactId || !selectedTeamId || items.length === 0) return;

    setIsSubmitting(true);
    try {
      const invoiceData: CreateInvoiceRequest = {
        contact_id: selectedContactId,
        team_id: selectedTeamId,
        items: items.map(item => ({
          product_id: item.product_id || undefined,
          description: item.description,
          quantity: item.quantity,
          unit_price: item.unit_price,
          total_price: item.quantity * item.unit_price,
        })),
        tax_rate: taxRate,
        due_date: dueDate || undefined,
        notes: notes || undefined,
      };

      const result = await createInvoice(invoiceData);
      if (result) {
        onInvoiceCreated();
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  if (contactsLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="outline" onClick={onBack}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Invoices
          </Button>
          <h1 className="text-2xl font-bold">Create Invoice</h1>
        </div>
        <div className="text-center py-8">Loading contacts...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="outline" onClick={onBack}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Invoices
        </Button>
        <h1 className="text-2xl font-bold">Create Invoice</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Invoice Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Team</label>
                <Select value={selectedTeamId} onValueChange={setSelectedTeamId} required>
                  <SelectTrigger>
                    <SelectValue placeholder="Select team" />
                  </SelectTrigger>
                  <SelectContent>
                    {teams.map(team => (
                      <SelectItem key={team.id} value={team.id}>
                        {team.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Contact</label>
                <Select value={selectedContactId} onValueChange={setSelectedContactId} required>
                  <SelectTrigger>
                    <SelectValue placeholder="Select contact" />
                  </SelectTrigger>
                  <SelectContent>
                    {contacts.map(contact => (
                      <SelectItem key={contact.id} value={contact.id}>
                        {contact.name} - {contact.phone_number}
                      </SelectItem>
                    ))}
                    {contacts.length === 0 && (
                      <SelectItem value="no-contacts" disabled>
                        No contacts available
                      </SelectItem>
                    )}
                  </SelectContent>
                </Select>
                <div className="text-xs text-gray-500 mt-1">
                  {contacts.length} contact{contacts.length !== 1 ? 's' : ''} available
                </div>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Due Date (Optional)</label>
                <Input
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Tax Rate (%)</label>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  max="100"
                  value={taxRate}
                  onChange={(e) => setTaxRate(Number(e.target.value))}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle>Invoice Items</CardTitle>
              <Button type="button" onClick={addItem} variant="outline" size="sm">
                <Plus className="h-4 w-4 mr-1" />
                Add Item
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {items.map((item, index) => (
              <div key={index} className="border rounded-lg p-4 space-y-3">
                <div className="flex justify-between items-start">
                  <span className="text-sm font-medium">Item {index + 1}</span>
                  {items.length > 1 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeItem(index)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                  <div>
                    <label className="block text-sm font-medium mb-1">Product (Optional)</label>
                    <Select 
                      value={item.product_id || 'custom'} 
                      onValueChange={(value) => selectProduct(index, value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select product" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="custom">Custom Item</SelectItem>
                        {teamProducts.map(product => (
                          <SelectItem key={product.id} value={product.id}>
                            {product.name} - {formatCurrency(product.price || 0)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Description</label>
                    <Input
                      value={item.description}
                      onChange={(e) => updateItem(index, 'description', e.target.value)}
                      placeholder="Item description"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Quantity</label>
                    <Input
                      type="number"
                      step="0.01"
                      min="0.01"
                      value={item.quantity}
                      onChange={(e) => updateItem(index, 'quantity', Number(e.target.value))}
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Unit Price</label>
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      value={item.unit_price}
                      onChange={(e) => updateItem(index, 'unit_price', Number(e.target.value))}
                      required
                    />
                  </div>
                </div>
                <div className="text-right">
                  <Badge variant="outline">
                    Total: {formatCurrency(item.quantity * item.unit_price)}
                  </Badge>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calculator className="h-5 w-5" />
              Invoice Summary
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between">
              <span>Subtotal:</span>
              <span>{formatCurrency(subtotal)}</span>
            </div>
            <div className="flex justify-between">
              <span>Tax ({taxRate}%):</span>
              <span>{formatCurrency(taxAmount)}</span>
            </div>
            <div className="flex justify-between text-lg font-semibold border-t pt-2">
              <span>Total:</span>
              <span>{formatCurrency(total)}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Notes (Optional)</CardTitle>
          </CardHeader>
          <CardContent>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Additional notes or terms..."
              rows={3}
            />
          </CardContent>
        </Card>

        <div className="flex gap-4">
          <Button type="submit" disabled={isSubmitting || !selectedContactId || !selectedTeamId}>
            {isSubmitting ? 'Creating...' : 'Create Invoice'}
          </Button>
          <Button type="button" variant="outline" onClick={onBack}>
            Cancel
          </Button>
        </div>
      </form>
    </div>
  );
};
