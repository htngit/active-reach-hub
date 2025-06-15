
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { DollarSign, Calendar } from 'lucide-react';
import { format } from 'date-fns';

interface Invoice {
  id: string;
  invoice_number: string;
  total: number;
  status: string;
  created_at: string;
  due_date?: string;
}

interface ConversionInvoiceSelectionProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  contactId: string;
  onInvoiceSelected: (invoiceId: string) => void;
  onCancel: () => void;
}

export const ConversionInvoiceSelection: React.FC<ConversionInvoiceSelectionProps> = ({
  open,
  onOpenChange,
  contactId,
  onInvoiceSelected,
  onCancel,
}) => {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [selectedInvoiceId, setSelectedInvoiceId] = useState<string>('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open) {
      fetchInvoices();
    }
  }, [open, contactId]);

  const fetchInvoices = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('invoices')
        .select('id, invoice_number, total, status, created_at, due_date')
        .eq('contact_id', contactId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setInvoices(data || []);
    } catch (error: any) {
      console.error('Error fetching invoices:', error);
      toast.error('Failed to fetch invoices');
    } finally {
      setLoading(false);
    }
  };

  const handleConfirm = () => {
    if (!selectedInvoiceId) {
      toast.error('Please select an invoice');
      return;
    }
    onInvoiceSelected(selectedInvoiceId);
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'paid': return 'bg-green-100 text-green-800';
      case 'sent': return 'bg-blue-100 text-blue-800';
      case 'draft': return 'bg-gray-100 text-gray-800';
      case 'overdue': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const selectedInvoice = invoices.find(inv => inv.id === selectedInvoiceId);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Select Invoice for Conversion</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            Which invoice represents this successful conversion?
          </p>

          {loading ? (
            <div className="text-center py-4">Loading invoices...</div>
          ) : invoices.length === 0 ? (
            <div className="text-center py-4 text-gray-500">
              No invoices found for this contact
            </div>
          ) : (
            <div className="space-y-3">
              <Select value={selectedInvoiceId} onValueChange={setSelectedInvoiceId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select an invoice" />
                </SelectTrigger>
                <SelectContent>
                  {invoices.map((invoice) => (
                    <SelectItem key={invoice.id} value={invoice.id}>
                      <div className="flex items-center justify-between w-full">
                        <span>{invoice.invoice_number}</span>
                        <div className="flex items-center gap-2 ml-4">
                          <span className="font-medium">${invoice.total}</span>
                          <Badge className={getStatusColor(invoice.status)} variant="outline">
                            {invoice.status}
                          </Badge>
                        </div>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {selectedInvoice && (
                <div className="p-3 bg-gray-50 rounded-lg space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-medium">{selectedInvoice.invoice_number}</span>
                    <Badge className={getStatusColor(selectedInvoice.status)}>
                      {selectedInvoice.status}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-4 text-sm text-gray-600">
                    <div className="flex items-center gap-1">
                      <DollarSign className="h-3 w-3" />
                      ${selectedInvoice.total}
                    </div>
                    <div className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {format(new Date(selectedInvoice.created_at), 'MMM dd, yyyy')}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={onCancel}>
              Cancel
            </Button>
            <Button 
              onClick={handleConfirm} 
              disabled={!selectedInvoiceId || loading}
            >
              Confirm Conversion
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
