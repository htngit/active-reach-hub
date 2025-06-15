
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useCurrency } from '@/hooks/useCurrency';

interface InvoiceSummaryCardProps {
  subtotal: number;
  taxRate: number;
  taxAmount: number;
  total: number;
}

export const InvoiceSummaryCard: React.FC<InvoiceSummaryCardProps> = ({
  subtotal,
  taxRate,
  taxAmount,
  total,
}) => {
  const { formatCurrency } = useCurrency();

  return (
    <Card>
      <CardHeader>
        <CardTitle>Invoice Summary</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex justify-between">
          <span>Subtotal:</span>
          <span>{formatCurrency(subtotal)}</span>
        </div>
        {taxRate > 0 && (
          <div className="flex justify-between">
            <span>Tax ({taxRate}%):</span>
            <span>{formatCurrency(taxAmount)}</span>
          </div>
        )}
        <div className="flex justify-between text-lg font-semibold border-t pt-2">
          <span>Total:</span>
          <span>{formatCurrency(total)}</span>
        </div>
      </CardContent>
    </Card>
  );
};
