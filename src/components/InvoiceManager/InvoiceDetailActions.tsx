
import React from 'react';
import { Button } from '@/components/ui/button';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
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
import { Download, Edit, AlertTriangle, MoreVertical } from 'lucide-react';

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
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline">
          <MoreVertical className="h-4 w-4" />
          Actions
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuItem 
          onClick={onDownloadPDF}
          disabled={isDownloading}
        >
          <Download className="h-4 w-4 mr-2" />
          {isDownloading ? 'Downloading...' : 'Download Invoice'}
        </DropdownMenuItem>
        
        {canEdit && (
          <>
            <DropdownMenuItem onClick={onEdit}>
              <Edit className="h-4 w-4 mr-2" />
              Edit Invoice
            </DropdownMenuItem>
            
            {status !== 'Void' && (
              <>
                <DropdownMenuSeparator />
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <DropdownMenuItem 
                      className="text-red-600 focus:text-red-600"
                      onSelect={(e) => e.preventDefault()}
                    >
                      <AlertTriangle className="h-4 w-4 mr-2" />
                      Void Invoice
                    </DropdownMenuItem>
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
              </>
            )}
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
