
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar, User, Building } from 'lucide-react';
import { format } from 'date-fns';
import { Invoice } from '@/types/invoice';
import { Contact } from '@/types/contact';
import { Team } from '@/types/team';

interface InvoiceDetailInfoProps {
  invoice: Invoice;
  contact: Contact | undefined;
  company: Team | undefined;
  getUserNameById: (id: string) => string;
}

export const InvoiceDetailInfo: React.FC<InvoiceDetailInfoProps> = ({
  invoice,
  contact,
  company,
  getUserNameById,
}) => {
  return (
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
  );
};
