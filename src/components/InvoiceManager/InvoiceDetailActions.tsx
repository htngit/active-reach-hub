
import React from 'react';
import { Button } from '@/components/ui/button';
import { 
  AlertDialog, 
  AlertDialogAction, 
  AlertDialogCancel, 
  AlertDialogContent, 
  AlertDialogDescription, 
  AlertDialogFooter, 
  AlertDialogHeader, 
  AlertDialogTitle, 
  AlertDialogTrigger 
} from '@/components/ui/alert-dialog';
import { Download, Edit, AlertTriangle } from 'lucide-react';

interface InvoiceDetailActionsProps {
  canEdit: boolean;
  status: string;
  isDownloading: boolean;
  isVoiding: boolean;
  onDownloadPDF: () => void;
  onEdit: () => void;
  onVoidInvoice: () => void;
}

export const InvoiceDetailActions: React.FC<InvoiceDetailActionsProps> = ({
  canEdit,
  status,
  isDownloading,
  isVoiding,
  onDownloadPDF,
  onEdit,
  onVoidInvoice,
}) => {
  return (
    <div className="flex items-center gap-3">
      <Button 
        variant="outline" 
        onClick={onDownloadPDF}
        disabled={isDownloading}
      >
        <Download className="h-4 w-4 mr-2" />
        {isDownloading ? 'Downloading...' : 'Download Invoice'}
      </Button>
      
      {canEdit && (
        <Button variant="outline" onClick={onEdit}>
          <Edit className="h-4 w-4 mr-2" />
          Edit Invoice
        </Button>
      )}
      
      {canEdit && status !== 'Void' && (
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="outline" className="text-red-600 border-red-600 hover:bg-red-50">
              <AlertTriangle className="h-4 w-4 mr-2" />
              Void Invoice
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Void Invoice</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to void this invoice? This action cannot be undone.
                Voided invoices cannot be edited or paid.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction 
                onClick={onVoidInvoice}
                disabled={isVoiding}
                className="bg-red-600 hover:bg-red-700"
              >
                {isVoiding ? 'Voiding...' : 'Void Invoice'}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </div>
  );
};
