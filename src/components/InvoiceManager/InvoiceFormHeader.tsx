
import React from 'react';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';

interface InvoiceFormHeaderProps {
  invoiceNumber: string;
  onBack: () => void;
}

export const InvoiceFormHeader: React.FC<InvoiceFormHeaderProps> = ({
  invoiceNumber,
  onBack,
}) => {
  return (
    <div className="flex items-center gap-4">
      <Button variant="outline" onClick={onBack}>
        <ArrowLeft className="h-4 w-4 mr-2" />
        Back to Invoice
      </Button>
      <h1 className="text-2xl font-bold">Edit Invoice {invoiceNumber}</h1>
    </div>
  );
};
