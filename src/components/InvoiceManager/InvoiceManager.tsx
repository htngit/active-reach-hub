
import React, { useState } from 'react';
import { InvoiceList } from './InvoiceList';
import { InvoiceDetail } from './InvoiceDetail';
import { CreateInvoiceForm } from './CreateInvoiceForm';
import { Invoice } from '@/types/invoice';

export const InvoiceManager: React.FC = () => {
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);

  const handleInvoiceSelect = (invoice: Invoice) => {
    setSelectedInvoice(invoice);
    setShowCreateForm(false);
  };

  const handleBackToList = () => {
    setSelectedInvoice(null);
    setShowCreateForm(false);
  };

  const handleCreateInvoice = () => {
    setSelectedInvoice(null);
    setShowCreateForm(true);
  };

  const handleInvoiceCreated = () => {
    setShowCreateForm(false);
  };

  if (showCreateForm) {
    return (
      <CreateInvoiceForm
        onBack={handleBackToList}
        onInvoiceCreated={handleInvoiceCreated}
      />
    );
  }

  if (selectedInvoice) {
    return (
      <InvoiceDetail
        invoice={selectedInvoice}
        onBack={handleBackToList}
        onInvoiceUpdated={handleBackToList}
      />
    );
  }

  return (
    <InvoiceList
      onSelectInvoice={handleInvoiceSelect}
      onCreateInvoice={handleCreateInvoice}
    />
  );
};
