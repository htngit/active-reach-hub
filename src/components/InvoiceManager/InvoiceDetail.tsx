import React, { useState, useEffect } from 'react';
import { useInvoiceData } from '@/hooks/useInvoiceData';
import { useCachedContacts } from '@/hooks/useCachedContacts';
import { useUserData } from '@/hooks/useUserData';
import { useTeamData } from '@/hooks/useTeamData';
import { Card, CardContent } from '@/components/ui/card';
import { AlertTriangle } from 'lucide-react';
import { Invoice, InvoiceItem, InvoiceActivity } from '@/types/invoice';
import { EditInvoiceForm } from './EditInvoiceForm';
import { InvoiceDetailHeader } from './InvoiceDetailHeader';
import { InvoiceDetailActions } from './InvoiceDetailActions';
import { InvoiceDetailInfo } from './InvoiceDetailInfo';
import { InvoiceDetailItems } from './InvoiceDetailItems';
import { InvoiceDetailActivities } from './InvoiceDetailActivities';
import { useInvoicePDFGenerator } from './InvoiceDetailPDFGenerator';

interface InvoiceDetailProps {
  invoice: Invoice;
  onBack: () => void;
  onInvoiceUpdated: () => void;
}

export const InvoiceDetail: React.FC<InvoiceDetailProps> = ({
  invoice,
  onBack,
  onInvoiceUpdated,
}) => {
  const [items, setItems] = useState<InvoiceItem[]>([]);
  const [activities, setActivities] = useState<InvoiceActivity[]>([]);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [showEditForm, setShowEditForm] = useState(false);
  const [isVoiding, setIsVoiding] = useState(false);
  
  const { updateInvoiceStatus, fetchInvoiceItems, fetchInvoiceActivities, isTeamOwner } = useInvoiceData();
  const { contacts } = useCachedContacts();
  const { getUserNameById } = useUserData();
  const { teams } = useTeamData();
  const { generatePDF } = useInvoicePDFGenerator();

  const contact = contacts.find(c => c.id === invoice.contact_id);
  const company = teams.find(t => t.id === invoice.team_id);
  const canEdit = isTeamOwner(invoice.team_id) && invoice.status !== 'Paid' && invoice.status !== 'Void';

  useEffect(() => {
    const loadInvoiceData = async () => {
      const [itemsData, activitiesData] = await Promise.all([
        fetchInvoiceItems(invoice.id),
        fetchInvoiceActivities(invoice.id)
      ]);
      setItems(itemsData);
      setActivities(activitiesData);
    };

    loadInvoiceData();
  }, [invoice.id, fetchInvoiceItems, fetchInvoiceActivities]);

  const handleStatusUpdate = async (newStatus: string) => {
    setIsUpdatingStatus(true);
    try {
      const success = await updateInvoiceStatus(invoice.id, newStatus);
      if (success) {
        onInvoiceUpdated();
      }
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const handleVoidInvoice = async () => {
    setIsVoiding(true);
    try {
      const success = await updateInvoiceStatus(invoice.id, 'Void');
      if (success) {
        onInvoiceUpdated();
      }
    } finally {
      setIsVoiding(false);
    }
  };

  const handleEditComplete = () => {
    setShowEditForm(false);
    onInvoiceUpdated();
  };

  const handleDownloadPDF = async () => {
    setIsDownloading(true);
    try {
      await generatePDF({ invoice, items, contact, company });
    } catch (error) {
      console.error('Error generating PDF:', error);
    } finally {
      setIsDownloading(false);
    }
  };

  if (showEditForm) {
    return (
      <EditInvoiceForm
        invoice={invoice}
        items={items}
        onBack={() => setShowEditForm(false)}
        onInvoiceUpdated={handleEditComplete}
      />
    );
  }

  return (
    <div className="space-y-6">
      <InvoiceDetailHeader
        invoiceNumber={invoice.invoice_number}
        status={invoice.status}
        canEdit={canEdit}
        isUpdatingStatus={isUpdatingStatus}
        onBack={onBack}
        onStatusUpdate={handleStatusUpdate}
        actionsElement={
          <InvoiceDetailActions
            canEdit={canEdit}
            status={invoice.status}
            isDownloading={isDownloading}
            isVoiding={isVoiding}
            onDownloadPDF={handleDownloadPDF}
            onEdit={() => setShowEditForm(true)}
            onVoidInvoice={handleVoidInvoice}
          />
        }
      />

      {invoice.status === 'Void' && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-red-800">
              <AlertTriangle className="h-5 w-5" />
              <span className="font-medium">This invoice has been voided and cannot be modified or paid.</span>
            </div>
          </CardContent>
        </Card>
      )}

      <InvoiceDetailInfo
        invoice={invoice}
        contact={contact}
        company={company}
        getUserNameById={getUserNameById}
      />

      <InvoiceDetailItems
        items={items}
        invoice={invoice}
      />

      {invoice.notes && (
        <Card>
          <CardContent className="pt-6">
            <h3 className="font-semibold mb-2">Notes</h3>
            <p className="text-gray-700">{invoice.notes}</p>
          </CardContent>
        </Card>
      )}

      <InvoiceDetailActivities activities={activities} />
    </div>
  );
};
