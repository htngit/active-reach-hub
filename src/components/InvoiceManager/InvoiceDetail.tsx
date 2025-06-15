import React, { useState, useEffect } from 'react';
import { useInvoiceData } from '@/hooks/useInvoiceData';
import { useCachedContacts } from '@/hooks/useCachedContacts';
import { useUserData } from '@/hooks/useUserData';
import { useTeamData } from '@/hooks/useTeamData';
import { useCurrency } from '@/hooks/useCurrency';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { 
  ArrowLeft, 
  FileText, 
  Calendar, 
  DollarSign, 
  User, 
  Building, 
  Download, 
  Edit, 
  AlertTriangle 
} from 'lucide-react';
import { Invoice, InvoiceItem, InvoiceActivity } from '@/types/invoice';
import { format } from 'date-fns';
import html2pdf from 'html2pdf.js';
import { EditInvoiceForm } from './EditInvoiceForm';
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
  const { formatCurrency } = useCurrency();

  const contact = contacts.find(c => c.id === invoice.contact_id);
  const company = teams.find(t => t.id === invoice.team_id);
  const statusOptions = ['Draft', 'Sent', 'Viewed', 'Paid', 'Overdue'];
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
      // Create a temporary div element for the PDF content
      const element = document.createElement('div');
      element.innerHTML = `
        <div style="font-family: Arial, sans-serif; padding: 20px; max-width: 800px; margin: 0 auto;">
          <!-- Company Header -->
          <div style="text-align: center; margin-bottom: 30px; border-bottom: 2px solid #333; padding-bottom: 20px;">
            ${company?.logo_url ? `<img src="${company.logo_url}" alt="Company Logo" style="max-height: 80px; margin-bottom: 10px;">` : ''}
            <h1 style="color: #333; margin-bottom: 5px; font-size: 28px;">${company?.company_legal_name || company?.name || 'Company Name'}</h1>
            ${company?.company_address ? `<p style="margin: 2px 0; font-size: 12px;">${company.company_address}</p>` : ''}
            ${company?.city ? `<p style="margin: 2px 0; font-size: 12px;">${company.city}${company.state ? `, ${company.state}` : ''} ${company.postal_code || ''}</p>` : ''}
            ${company?.country ? `<p style="margin: 2px 0; font-size: 12px;">${company.country}</p>` : ''}
            ${company?.company_phone ? `<p style="margin: 2px 0; font-size: 12px;">Phone: ${company.company_phone}</p>` : ''}
            ${company?.company_email ? `<p style="margin: 2px 0; font-size: 12px;">Email: ${company.company_email}</p>` : ''}
            ${company?.website ? `<p style="margin: 2px 0; font-size: 12px;">Website: ${company.website}</p>` : ''}
            ${company?.tax_id ? `<p style="margin: 2px 0; font-size: 12px;">Tax ID: ${company.tax_id}</p>` : ''}
          </div>

          <!-- Invoice Header -->
          <div style="text-align: center; margin-bottom: 30px;">
            <h2 style="color: #333; margin-bottom: 10px; font-size: 24px;">INVOICE</h2>
            <h3 style="color: #333; margin-bottom: 10px;">${invoice.invoice_number}</h3>
            <p style="margin: 5px 0;">Created: ${format(new Date(invoice.created_at), 'MMM dd, yyyy')}</p>
            ${invoice.due_date ? `<p style="margin: 5px 0;">Due: ${format(new Date(invoice.due_date), 'MMM dd, yyyy')}</p>` : ''}
          </div>
          
          <div style="margin-bottom: 30px;">
            <h3 style="color: #333; border-bottom: 1px solid #ddd; padding-bottom: 5px;">Bill To:</h3>
            <div style="margin-top: 10px;">
              <p style="margin: 3px 0; font-weight: bold;">${contact?.name || 'N/A'}</p>
              ${contact?.phone_number ? `<p style="margin: 3px 0;">${contact.phone_number}</p>` : ''}
              ${contact?.email ? `<p style="margin: 3px 0;">${contact.email}</p>` : ''}
              ${contact?.company ? `<p style="margin: 3px 0;">${contact.company}</p>` : ''}
              ${contact?.address ? `<p style="margin: 3px 0;">${contact.address}</p>` : ''}
            </div>
          </div>

          <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
            <thead>
              <tr style="background-color: #f8f9fa;">
                <th style="border: 1px solid #ddd; padding: 12px; text-align: left;">Description</th>
                <th style="border: 1px solid #ddd; padding: 12px; text-align: center;">Qty</th>
                <th style="border: 1px solid #ddd; padding: 12px; text-align: right;">Unit Price</th>
                <th style="border: 1px solid #ddd; padding: 12px; text-align: right;">Total</th>
              </tr>
            </thead>
            <tbody>
              ${items.map(item => `
                <tr>
                  <td style="border: 1px solid #ddd; padding: 12px;">${item.description}</td>
                  <td style="border: 1px solid #ddd; padding: 12px; text-align: center;">${item.quantity}</td>
                  <td style="border: 1px solid #ddd; padding: 12px; text-align: right;">${formatCurrency(item.unit_price)}</td>
                  <td style="border: 1px solid #ddd; padding: 12px; text-align: right;">${formatCurrency(item.total_price)}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>

          <div style="text-align: right; margin-top: 20px;">
            <div style="display: inline-block; min-width: 200px;">
              <div style="display: flex; justify-content: space-between; margin-bottom: 5px;">
                <span>Subtotal:</span>
                <span>${formatCurrency(invoice.subtotal)}</span>
              </div>
              ${invoice.tax_rate && invoice.tax_rate > 0 ? `
                <div style="display: flex; justify-content: space-between; margin-bottom: 5px;">
                  <span>Tax (${invoice.tax_rate}%):</span>
                  <span>${formatCurrency(invoice.tax_amount || 0)}</span>
                </div>
              ` : ''}
              <div style="display: flex; justify-content: space-between; font-weight: bold; border-top: 2px solid #333; padding-top: 10px; font-size: 18px;">
                <span>Total:</span>
                <span>${formatCurrency(invoice.total)}</span>
              </div>
            </div>
          </div>

          ${invoice.notes ? `
            <div style="margin-top: 40px; border-top: 1px solid #ddd; padding-top: 20px;">
              <h3 style="color: #333; margin-bottom: 10px;">Notes:</h3>
              <p style="line-height: 1.5;">${invoice.notes}</p>
            </div>
          ` : ''}

          ${company?.bank_name ? `
            <div style="margin-top: 40px; border-top: 1px solid #ddd; padding-top: 20px;">
              <h3 style="color: #333; margin-bottom: 10px;">Payment Information:</h3>
              <p style="margin: 3px 0;"><strong>Bank:</strong> ${company.bank_name}</p>
              ${company.bank_account ? `<p style="margin: 3px 0;"><strong>Account:</strong> ${company.bank_account}</p>` : ''}
              ${company.bank_account_holder ? `<p style="margin: 3px 0;"><strong>Account Holder:</strong> ${company.bank_account_holder}</p>` : ''}
              ${company.swift_code ? `<p style="margin: 3px 0;"><strong>SWIFT:</strong> ${company.swift_code}</p>` : ''}
            </div>
          ` : ''}
        </div>
      `;

      // Configure html2pdf options
      const options = {
        margin: 1,
        filename: `Invoice-${invoice.invoice_number}.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2 },
        jsPDF: { unit: 'in', format: 'letter', orientation: 'portrait' }
      };

      // Generate and download PDF
      await html2pdf().set(options).from(element).save();
      
    } catch (error) {
      console.error('Error generating PDF:', error);
    } finally {
      setIsDownloading(false);
    }
  };

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
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="outline" onClick={onBack}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Invoices
          </Button>
          <div className="flex items-center gap-2">
            <FileText className="h-6 w-6" />
            <h1 className="text-2xl font-bold">{invoice.invoice_number}</h1>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Button 
            variant="outline" 
            onClick={handleDownloadPDF}
            disabled={isDownloading}
          >
            <Download className="h-4 w-4 mr-2" />
            {isDownloading ? 'Downloading...' : 'Download Invoice'}
          </Button>
          
          {canEdit && (
            <Button variant="outline" onClick={() => setShowEditForm(true)}>
              <Edit className="h-4 w-4 mr-2" />
              Edit Invoice
            </Button>
          )}
          
          {canEdit && invoice.status !== 'Void' && (
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
                    onClick={handleVoidInvoice}
                    disabled={isVoiding}
                    className="bg-red-600 hover:bg-red-700"
                  >
                    {isVoiding ? 'Voiding...' : 'Void Invoice'}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
          
          <Badge className={getStatusColor(invoice.status)}>
            {invoice.status}
          </Badge>
          
          {invoice.status !== 'Void' && (
            <Select
              value={invoice.status}
              onValueChange={handleStatusUpdate}
              disabled={isUpdatingStatus}
            >
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {statusOptions.map(status => (
                  <SelectItem key={status} value={status}>
                    {status}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>
      </div>

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

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Invoice Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-gray-500" />
              <span className="text-sm font-medium">Created:</span>
              <span>{format(new Date(invoice.created_at), 'MMM dd, yyyy')}</span>
            </div>
            {invoice.due_date && (
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-gray-500" />
                <span className="text-sm font-medium">Due:</span>
                <span>{format(new Date(invoice.due_date), 'MMM dd, yyyy')}</span>
              </div>
            )}
            <div className="flex items-center gap-2">
              <User className="h-4 w-4 text-gray-500" />
              <span className="text-sm font-medium">Created by:</span>
              <span>{getUserNameById(invoice.created_by)}</span>
            </div>
            {company && (
              <div className="flex items-center gap-2">
                <Building className="h-4 w-4 text-gray-500" />
                <span>{company.name}</span>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Contact Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {contact ? (
              <>
                <div>
                  <h3 className="font-semibold">{contact.name}</h3>
                  <p className="text-gray-600">{contact.phone_number}</p>
                  {contact.email && <p className="text-gray-600">{contact.email}</p>}
                </div>
                {contact.company && (
                  <div className="flex items-center gap-2">
                    <Building className="h-4 w-4 text-gray-500" />
                    <span>{contact.company}</span>
                  </div>
                )}
                {contact.address && (
                  <p className="text-sm text-gray-600">{contact.address}</p>
                )}
              </>
            ) : (
              <p className="text-gray-500">Contact information not available</p>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Invoice Items</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {items.map((item, index) => (
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
              <span className="flex items-center gap-1">
                <DollarSign className="h-4 w-4" />
                {formatCurrency(invoice.total).replace(/^\S+/, '')}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {invoice.notes && (
        <Card>
          <CardHeader>
            <CardTitle>Notes</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-700">{invoice.notes}</p>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Activity History</CardTitle>
        </CardHeader>
        <CardContent>
          {activities.length === 0 ? (
            <p className="text-gray-500">No activities logged yet</p>
          ) : (
            <div className="space-y-4">
              {activities.map(activity => (
                <div key={activity.id} className="border-l-2 border-gray-200 pl-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-medium">{activity.activity_type}</h4>
                      {activity.details && (
                        <p className="text-gray-600 text-sm">{activity.details}</p>
                      )}
                    </div>
                    <span className="text-sm text-gray-500">
                      {format(new Date(activity.created_at), 'MMM dd, yyyy HH:mm')}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
