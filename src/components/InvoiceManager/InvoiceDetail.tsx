
import React, { useState, useEffect } from 'react';
import { useInvoiceData } from '@/hooks/useInvoiceData';
import { useCachedContacts } from '@/hooks/useCachedContacts';
import { useUserData } from '@/hooks/useUserData';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { ArrowLeft, FileText, Calendar, DollarSign, User, Building } from 'lucide-react';
import { Invoice, InvoiceItem, InvoiceActivity } from '@/types/invoice';
import { format } from 'date-fns';

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
  
  const { updateInvoiceStatus, fetchInvoiceItems, fetchInvoiceActivities } = useInvoiceData();
  const { contacts } = useCachedContacts();
  const { getUserNameById } = useUserData();

  const contact = contacts.find(c => c.id === invoice.contact_id);
  const statusOptions = ['Draft', 'Sent', 'Viewed', 'Paid', 'Overdue'];

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

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'draft': return 'bg-gray-100 text-gray-800';
      case 'sent': return 'bg-blue-100 text-blue-800';
      case 'viewed': return 'bg-yellow-100 text-yellow-800';
      case 'paid': return 'bg-green-100 text-green-800';
      case 'overdue': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

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
          <Badge className={getStatusColor(invoice.status)}>
            {invoice.status}
          </Badge>
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
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Invoice Info */}
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
          </CardContent>
        </Card>

        {/* Contact Info */}
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

      {/* Invoice Items */}
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
                    Quantity: {item.quantity} × ${item.unit_price.toFixed(2)}
                  </p>
                </div>
                <div className="text-right">
                  <span className="font-semibold">${item.total_price.toFixed(2)}</span>
                </div>
              </div>
            ))}
          </div>
          
          <Separator className="my-4" />
          
          <div className="space-y-2">
            <div className="flex justify-between">
              <span>Subtotal:</span>
              <span>${invoice.subtotal.toFixed(2)}</span>
            </div>
            {invoice.tax_rate && invoice.tax_rate > 0 && (
              <div className="flex justify-between">
                <span>Tax ({invoice.tax_rate}%):</span>
                <span>${(invoice.tax_amount || 0).toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between text-lg font-semibold border-t pt-2">
              <span>Total:</span>
              <span className="flex items-center gap-1">
                <DollarSign className="h-4 w-4" />
                {invoice.total.toFixed(2)}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Notes */}
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

      {/* Activities */}
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
