
import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, FileText } from 'lucide-react';

interface InvoiceDetailHeaderProps {
  invoiceNumber: string;
  status: string;
  canEdit: boolean;
  isUpdatingStatus: boolean;
  onBack: () => void;
  onStatusUpdate: (status: string) => void;
  actionsElement?: React.ReactNode;
}

export const InvoiceDetailHeader: React.FC<InvoiceDetailHeaderProps> = ({
  invoiceNumber,
  status,
  canEdit,
  isUpdatingStatus,
  onBack,
  onStatusUpdate,
  actionsElement,
}) => {
  const statusOptions = ['Draft', 'Sent', 'Viewed', 'Paid', 'Overdue'];

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'draft': return 'bg-gray-100 text-gray-800';
      case 'sent': return 'bg-blue-100 text-blue-800';
      case 'viewed': return 'bg-yellow-100 text-yellow-800';
      case 'paid': return 'bg-green-100 text-green-800';
      case 'overdue': return 'bg-red-100 text-red-800';
      case 'void': return 'bg-slate-100 text-slate-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-4">
      {/* Back button and Invoice number - separate row */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
        <Button variant="outline" onClick={onBack} className="w-fit">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Invoices
        </Button>
        <div className="flex items-center gap-2">
          <FileText className="h-6 w-6" />
          <h1 className="text-2xl font-bold">{invoiceNumber}</h1>
        </div>
      </div>
      
      {/* Status, update dropdown, and actions - single row */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <Badge className={getStatusColor(status)}>
            {status}
          </Badge>
          
          {status !== 'Void' && (
            <Select
              value={status}
              onValueChange={onStatusUpdate}
              disabled={isUpdatingStatus}
            >
              <SelectTrigger className="w-full sm:w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {statusOptions.map(statusOption => (
                  <SelectItem key={statusOption} value={statusOption}>
                    {statusOption}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>
        
        {actionsElement && (
          <div className="flex justify-end">
            {actionsElement}
          </div>
        )}
      </div>
    </div>
  );
};
