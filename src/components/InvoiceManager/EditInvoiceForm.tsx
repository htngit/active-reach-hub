
import React from 'react';
import { Button } from '@/components/ui/button';
import { Form } from '@/components/ui/form';
import { useCachedContacts } from '@/hooks/useCachedContacts';
import { useTeamData } from '@/hooks/useTeamData';
import { Invoice, InvoiceItem } from '@/types/invoice';
import { InvoiceFormHeader } from './InvoiceFormHeader';
import { InvoiceDetailsCard } from './InvoiceDetailsCard';
import { InvoiceSummaryCard } from './InvoiceSummaryCard';
import { InvoiceItemsCard } from './InvoiceItemsCard';
import { InvoiceNotesCard } from './InvoiceNotesCard';
import { useInvoiceFormLogic } from './useInvoiceFormLogic';

interface EditInvoiceFormProps {
  invoice: Invoice;
  items: InvoiceItem[];
  onBack: () => void;
  onInvoiceUpdated: () => void;
}

export const EditInvoiceForm: React.FC<EditInvoiceFormProps> = ({
  invoice,
  items,
  onBack,
  onInvoiceUpdated,
}) => {
  const { contacts } = useCachedContacts();
  const { teams } = useTeamData();

  const {
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
  } = useInvoiceFormLogic({ invoice, items, onInvoiceUpdated });

  return (
    <div className="space-y-6">
      <InvoiceFormHeader 
        invoiceNumber={invoice.invoice_number}
        onBack={onBack}
      />

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <InvoiceDetailsCard
              control={form.control}
              contacts={contacts}
              teams={teams}
            />

            <InvoiceSummaryCard
              subtotal={subtotal}
              taxRate={watchedTaxRate}
              taxAmount={taxAmount}
              total={total}
            />
          </div>

          <InvoiceItemsCard
            control={form.control}
            fields={fields}
            append={append}
            remove={remove}
          />

          <InvoiceNotesCard control={form.control} />

          <div className="flex justify-end gap-3">
            <Button type="button" variant="outline" onClick={onBack}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Updating...' : 'Update Invoice'}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
};
