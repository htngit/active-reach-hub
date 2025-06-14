
import { useState } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useInvoiceData } from '@/hooks/useInvoiceData';
import { Invoice, InvoiceItem } from '@/types/invoice';
import { invoiceSchema, InvoiceFormData } from './InvoiceFormSchema';

interface UseInvoiceFormLogicProps {
  invoice: Invoice;
  items: InvoiceItem[];
  onInvoiceUpdated: () => void;
}

export const useInvoiceFormLogic = ({
  invoice,
  items,
  onInvoiceUpdated,
}: UseInvoiceFormLogicProps) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { updateInvoice } = useInvoiceData();

  const form = useForm<InvoiceFormData>({
    resolver: zodResolver(invoiceSchema),
    defaultValues: {
      contact_id: invoice.contact_id,
      team_id: invoice.team_id,
      due_date: invoice.due_date || '',
      tax_rate: invoice.tax_rate || 0,
      notes: invoice.notes || '',
      items: items.map(item => ({
        description: item.description || '',
        quantity: item.quantity || 1,
        unit_price: item.unit_price || 0,
      })),
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'items',
  });

  const watchedItems = form.watch('items');
  const watchedTaxRate = form.watch('tax_rate');

  const subtotal = watchedItems.reduce((sum, item) => 
    sum + (item.quantity * item.unit_price), 0
  );
  const taxAmount = subtotal * (watchedTaxRate || 0) / 100;
  const total = subtotal + taxAmount;

  const onSubmit = async (data: InvoiceFormData) => {
    setIsSubmitting(true);
    try {
      const success = await updateInvoice(invoice.id, {
        contact_id: data.contact_id,
        team_id: data.team_id,
        due_date: data.due_date || null,
        tax_rate: data.tax_rate || 0,
        notes: data.notes || null,
        items: data.items.map(item => ({
          description: item.description || '',
          quantity: item.quantity || 1,
          unit_price: item.unit_price || 0,
        })),
      });

      if (success) {
        onInvoiceUpdated();
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return {
    form,
    fields,
    append,
    remove,
    isSubmitting,
    subtotal,
    taxAmount,
    total,
    watchedTaxRate,
    onSubmit,
  };
};
