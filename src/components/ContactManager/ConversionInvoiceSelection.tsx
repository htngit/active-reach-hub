
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { FileText, CheckCircle } from 'lucide-react';

interface ConversionInvoiceSelectionProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  contactId: string;
  onInvoiceSelected: (invoiceId: string) => void;
  onCancel: () => void;
}

interface Invoice {
  id: string;
  invoice_number: string;
  total: number;
  status: string;
  created_at: string;
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
    if (open && contactId) {
      fetchInvoices();
    }
  }, [open, contactId]);

  const fetchInvoices = async () => {
    setLoading(true);
    try {
      // First, get all invoices for this contact
      const { data: allInvoices, error: invoicesError } = await supabase
        .from('invoices')
        .select('id, invoice_number, total, status, created_at')
        .eq('contact_id', contactId)
        .order('created_at', { ascending: false });

      if (invoicesError) throw invoicesError;

      // Then, get all invoice IDs that have already been used for conversions
      const { data: usedInvoices, error: conversionsError } = await supabase
        .from('engagement_conversions')
        .select('invoice_id');

      if (conversionsError) throw conversionsError;

      // Create a set of used invoice IDs for efficient lookup
      const usedInvoiceIds = new Set(usedInvoices?.map(conversion => conversion.invoice_id) || []);

      // Filter out invoices that have already been used for conversions
      const availableInvoices = (allInvoices || []).filter(invoice => 
        !usedInvoiceIds.has(invoice.id)
      );

      setInvoices(availableInvoices);
    } catch (error: any) {
      console.error('Error fetching invoices:', error);
      toast.error('Failed to load invoices');
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

  const handleCancel = () => {
    setSelectedInvoiceId('');
    onCancel();
  };

  const selectedInvoice = invoices.find(inv => inv.id === selectedInvoiceId);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Select Conversion Invoice
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="text-sm text-gray-600">
            To mark this engagement as converted, please select the invoice that represents this conversion:
          </div>

          {loading ? (
            <div className="text-center py-4">Loading invoices...</div>
          ) : invoices.length === 0 ? (
            <div className="text-center py-8">
              <FileText className="h-12 w-12 text-gray-400 mx-auto mb-2" />
              <p className="text-gray-500">No available invoices found for this contact</p>
              <p className="text-xs text-gray-400 mt-1">
                All invoices may have already been used for conversions or no invoices exist
              </p>
            </div>
          ) : (
            <>
              <Select value={selectedInvoiceId} onValueChange={setSelectedInvoiceId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select an invoice..." />
                </SelectTrigger>
                <SelectContent>
                  {invoices.map((invoice) => (
                    <SelectItem key={invoice.id} value={invoice.id}>
                      <div className="flex items-center justify-between w-full">
                        <span>{invoice.invoice_number}</span>
                        <div className="flex items-center gap-2 ml-4">
                          <span className="text-sm">${invoice.total.toFixed(2)}</span>
                          {invoice.status === 'Paid' && (
                            <CheckCircle className="h-4 w-4 text-green-500" />
                          )}
                          <span className={`text-xs px-2 py-1 rounded ${
                            invoice.status === 'Paid' 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-yellow-100 text-yellow-800'
                          }`}>
                            {invoice.status}
                          </span>
                        </div>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {selectedInvoice && (
                <div className="p-3 bg-gray-50 rounded-lg">
                  <div className="text-sm font-medium">{selectedInvoice.invoice_number}</div>
                  <div className="text-sm text-gray-600">
                    Amount: ${selectedInvoice.total.toFixed(2)} • Status: {selectedInvoice.status}
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    Created: {new Date(selectedInvoice.created_at).toLocaleDateString()}
                  </div>
                </div>
              )}
            </>
          )}

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={handleCancel}>
              Cancel
            </Button>
            <Button 
              onClick={handleConfirm} 
              disabled={!selectedInvoiceId}
            >
              Confirm Conversion
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
