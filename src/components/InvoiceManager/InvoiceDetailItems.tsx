
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { useCurrency } from '@/hooks/useCurrency';
import { InvoiceItem, Invoice } from '@/types/invoice';

interface InvoiceDetailItemsProps {
  items: InvoiceItem[];
  invoice: Invoice;
}

export const InvoiceDetailItems: React.FC<InvoiceDetailItemsProps> = ({
  items,
  invoice,
}) => {
  const { formatCurrency } = useCurrency();

  return (
    <Card>
      <CardHeader>
        <CardTitle>Invoice Items</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {items.map((item) => (
            <div key={item.id} className="flex justify-between items-center p-3 border rounded">
              <div>
                <h4 className="font-medium">{item.description}</h4>
                <p className="text-sm text-gray-600">
                  Quantity: {item.quantity} × {formatCurrency(item.unit_price)}
                </p>
              </div>
              <div className="text-right">
                <span className="font-semibold">{formatCurrency(item.total_price)}</span>
              </div>
            </div>
          ))}
        </div>
        
        <Separator className="my-4" />
        
        <div className="space-y-2">
          <div className="flex justify-between">
            <span>Subtotal:</span>
            <span>{formatCurrency(invoice.subtotal)}</span>
          </div>
          {invoice.tax_rate && invoice.tax_rate > 0 && (
            <div className="flex justify-between">
              <span>Tax ({invoice.tax_rate}%):</span>
              <span>{formatCurrency(invoice.tax_amount || 0)}</span>
            </div>
          )}
          <div className="flex justify-between text-lg font-semibold border-t pt-2">
            <span>Total:</span>
            <span>{formatCurrency(invoice.total)}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
