import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Invoice, InvoiceItem, InvoiceActivity, CreateInvoiceRequest } from '@/types/invoice';
import { useTeamData } from './useTeamData';
import { useToast } from './use-toast';

export const useInvoiceData = () => {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();
  const { teams, loading: teamsLoading, isTeamOwner } = useTeamData();
  const { toast } = useToast();

  const fetchInvoices = useCallback(async () => {
    if (!user || teamsLoading) return;

    try {
      setLoading(true);
      setError(null);

      if (teams.length === 0) {
        setInvoices([]);
        return;
      }

      const { data, error: fetchError } = await supabase
        .from('invoices')
        .select('*')
        .order('created_at', { ascending: false });

      if (fetchError) {
        throw fetchError;
      }

      setInvoices(data || []);
    } catch (err: any) {
      console.error('Error fetching invoices:', err);
      setError(err.message || 'Failed to fetch invoices');
      toast({
        title: 'Error',
        description: 'Failed to load invoices. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [user, teams, teamsLoading, toast]);

  useEffect(() => {
    if (user && !teamsLoading) {
      fetchInvoices();
    }
  }, [user, teamsLoading, fetchInvoices]);

  const createInvoice = async (invoiceData: CreateInvoiceRequest) => {
    if (!user) return null;

    try {
      const isOwner = isTeamOwner(invoiceData.team_id);
      if (!isOwner) {
        throw new Error('Only team owners can create invoices');
      }

      // Generate invoice number
      const { data: invoiceNumber, error: numberError } = await supabase
        .rpc('generate_invoice_number');

      if (numberError) {
        throw numberError;
      }

      // Calculate totals
      const subtotal = invoiceData.items.reduce((sum, item) => 
        sum + (item.quantity * item.unit_price), 0
      );
      const taxAmount = subtotal * (invoiceData.tax_rate || 0) / 100;
      const total = subtotal + taxAmount;

      // Create invoice
      const { data: invoice, error: invoiceError } = await supabase
        .from('invoices')
        .insert({
          invoice_number: invoiceNumber,
          contact_id: invoiceData.contact_id,
          team_id: invoiceData.team_id,
          created_by: user.id,
          subtotal,
          tax_rate: invoiceData.tax_rate || 0,
          tax_amount: taxAmount,
          total,
          due_date: invoiceData.due_date,
          notes: invoiceData.notes,
        })
        .select()
        .single();

      if (invoiceError) {
        throw invoiceError;
      }

      // Create invoice items
      const itemsWithInvoiceId = invoiceData.items.map(item => ({
        ...item,
        invoice_id: invoice.id,
        total_price: item.quantity * item.unit_price,
      }));

      const { error: itemsError } = await supabase
        .from('invoice_items')
        .insert(itemsWithInvoiceId);

      if (itemsError) {
        throw itemsError;
      }

      // Log activity
      await supabase
        .from('invoice_activities')
        .insert({
          invoice_id: invoice.id,
          user_id: user.id,
          activity_type: 'Invoice Created',
          details: `Invoice ${invoiceNumber} created`,
        });

      // Log contact activity
      await supabase
        .from('activities')
        .insert({
          contact_id: invoiceData.contact_id,
          user_id: user.id,
          type: 'Invoice Created',
          details: `Invoice ${invoiceNumber} created for ${total.toFixed(2)}`,
        });

      setInvoices(prevInvoices => [invoice, ...prevInvoices]);
      
      toast({
        title: 'Success',
        description: `Invoice ${invoiceNumber} created successfully`,
      });

      return invoice;
    } catch (err: any) {
      console.error('Error creating invoice:', err);
      toast({
        title: 'Error',
        description: err.message || 'Failed to create invoice',
        variant: 'destructive',
      });
      return null;
    }
  };

  const updateInvoice = async (invoiceId: string, updateData: {
    contact_id: string;
    team_id: string;
    due_date: string | null;
    tax_rate: number;
    notes: string | null;
    items: Array<{
      description: string;
      quantity: number;
      unit_price: number;
    }>;
  }) => {
    if (!user) return false;

    try {
      const isOwner = isTeamOwner(updateData.team_id);
      if (!isOwner) {
        throw new Error('Only team owners can update invoices');
      }

      // Calculate totals
      const subtotal = updateData.items.reduce((sum, item) => 
        sum + (item.quantity * item.unit_price), 0
      );
      const taxAmount = subtotal * updateData.tax_rate / 100;
      const total = subtotal + taxAmount;

      // Update invoice
      const { error: invoiceError } = await supabase
        .from('invoices')
        .update({
          contact_id: updateData.contact_id,
          team_id: updateData.team_id,
          subtotal,
          tax_rate: updateData.tax_rate,
          tax_amount: taxAmount,
          total,
          due_date: updateData.due_date,
          notes: updateData.notes,
          updated_at: new Date().toISOString(),
        })
        .eq('id', invoiceId);

      if (invoiceError) {
        throw invoiceError;
      }

      // Delete existing items
      const { error: deleteError } = await supabase
        .from('invoice_items')
        .delete()
        .eq('invoice_id', invoiceId);

      if (deleteError) {
        throw deleteError;
      }

      // Create new items
      const itemsWithInvoiceId = updateData.items.map(item => ({
        ...item,
        invoice_id: invoiceId,
        total_price: item.quantity * item.unit_price,
      }));

      const { error: itemsError } = await supabase
        .from('invoice_items')
        .insert(itemsWithInvoiceId);

      if (itemsError) {
        throw itemsError;
      }

      // Log activity
      await supabase
        .from('invoice_activities')
        .insert({
          invoice_id: invoiceId,
          user_id: user.id,
          activity_type: 'Invoice Updated',
          details: 'Invoice details were updated',
        });

      setInvoices(prevInvoices =>
        prevInvoices.map(invoice =>
          invoice.id === invoiceId 
            ? { 
                ...invoice, 
                ...updateData,
                subtotal,
                tax_amount: taxAmount,
                total,
                updated_at: new Date().toISOString()
              }
            : invoice
        )
      );

      toast({
        title: 'Success',
        description: 'Invoice updated successfully',
      });

      return true;
    } catch (err: any) {
      console.error('Error updating invoice:', err);
      toast({
        title: 'Error',
        description: err.message || 'Failed to update invoice',
        variant: 'destructive',
      });
      return false;
    }
  };

  const updateInvoiceStatus = async (invoiceId: string, status: string) => {
    if (!user) return false;

    try {
      const { error } = await supabase
        .from('invoices')
        .update({ 
          status, 
          updated_at: new Date().toISOString() 
        })
        .eq('id', invoiceId);

      if (error) {
        throw error;
      }

      // Log activity
      await supabase
        .from('invoice_activities')
        .insert({
          invoice_id: invoiceId,
          user_id: user.id,
          activity_type: 'Status Updated',
          details: `Invoice status changed to ${status}`,
        });

      setInvoices(prevInvoices =>
        prevInvoices.map(invoice =>
          invoice.id === invoiceId 
            ? { ...invoice, status, updated_at: new Date().toISOString() }
            : invoice
        )
      );

      toast({
        title: 'Success',
        description: 'Invoice status updated successfully',
      });

      return true;
    } catch (err: any) {
      console.error('Error updating invoice status:', err);
      toast({
        title: 'Error',
        description: err.message || 'Failed to update invoice status',
        variant: 'destructive',
      });
      return false;
    }
  };

  const fetchInvoiceItems = async (invoiceId: string): Promise<InvoiceItem[]> => {
    try {
      const { data, error } = await supabase
        .from('invoice_items')
        .select('*')
        .eq('invoice_id', invoiceId)
        .order('created_at', { ascending: true });

      if (error) {
        throw error;
      }

      return data || [];
    } catch (err: any) {
      console.error('Error fetching invoice items:', err);
      return [];
    }
  };

  const fetchInvoiceActivities = async (invoiceId: string): Promise<InvoiceActivity[]> => {
    try {
      const { data, error } = await supabase
        .from('invoice_activities')
        .select('*')
        .eq('invoice_id', invoiceId)
        .order('created_at', { ascending: false });

      if (error) {
        throw error;
      }

      return data || [];
    } catch (err: any) {
      console.error('Error fetching invoice activities:', err);
      return [];
    }
  };

  return {
    invoices,
    loading,
    error,
    fetchInvoices,
    createInvoice,
    updateInvoice,
    updateInvoiceStatus,
    fetchInvoiceItems,
    fetchInvoiceActivities,
    isTeamOwner,
  };
};
