
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Phone, Mail, Building, MapPin } from 'lucide-react';

interface Contact {
  id: string;
  name: string;
  phone_number: string;
  email?: string;
  company?: string;
  address?: string;
  notes?: string;
  labels?: string[];
  status: string;
  potential_product?: string[];
  created_at: string;
}

interface ContactDetailInfoProps {
  contact: Contact;
  onContactUpdated: () => void;
}

export const ContactDetailInfo: React.FC<ContactDetailInfoProps> = ({
  contact,
  onContactUpdated,
}) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Contact Information</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-start justify-between">
          <div className="space-y-2">
            <h2 className="text-2xl font-bold">{contact.name}</h2>
            <div className="flex items-center gap-2 text-gray-600">
              <Phone className="h-4 w-4" />
              {contact.phone_number}
            </div>
            {contact.email && (
              <div className="flex items-center gap-2 text-gray-600">
                <Mail className="h-4 w-4" />
                {contact.email}
              </div>
            )}
            {contact.company && (
              <div className="flex items-center gap-2 text-gray-600">
                <Building className="h-4 w-4" />
                {contact.company}
              </div>
            )}
            {contact.address && (
              <div className="flex items-center gap-2 text-gray-600">
                <MapPin className="h-4 w-4" />
                {contact.address}
              </div>
            )}
          </div>
          <div className="text-right space-y-2">
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="mb-2">{contact.status}</Badge>
            </div>
            {contact.labels && contact.labels.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {contact.labels.map(label => (
                  <Badge key={label} variant="secondary" className="text-xs">
                    {label}
                  </Badge>
                ))}
              </div>
            )}
          </div>
        </div>
        {contact.notes && (
          <div className="mt-4">
            <h3 className="font-medium mb-1">Notes</h3>
            <p className="text-gray-600">{contact.notes}</p>
          </div>
        )}
        {contact.potential_product && contact.potential_product.length > 0 && (
          <div className="mt-4">
            <h3 className="font-medium mb-1">Potential Products</h3>
            <div className="flex flex-wrap gap-1">
              {contact.potential_product.map(product => (
                <Badge key={product} variant="outline">{product}</Badge>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
