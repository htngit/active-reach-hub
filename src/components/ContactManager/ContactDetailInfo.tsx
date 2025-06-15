
import React, { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Phone, Mail, Building, MapPin, Edit, Save, X } from 'lucide-react';
import { toast } from 'sonner';

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

const statusOptions = ['New', 'Approached', 'Follow-up Required', 'Paid', 'Lost'];

export const ContactDetailInfo: React.FC<ContactDetailInfoProps> = ({
  contact,
  onContactUpdated,
}) => {
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [newStatus, setNewStatus] = useState(contact.status);
  const { user } = useAuth();

  const handleStatusUpdate = async () => {
    if (newStatus === contact.status) {
      setIsUpdatingStatus(false);
      return;
    }

    if (!user) {
      toast.error("You must be logged in to update contact status");
      return;
    }

    try {
      console.log('Updating contact status:', { contactId: contact.id, newStatus, userId: user.id });

      const { error } = await supabase
        .from('contacts')
        .update({ status: newStatus })
        .eq('id', contact.id);

      if (error) {
        console.error('Supabase error updating status:', error);
        throw error;
      }

      toast.success("Contact status updated successfully");
      setIsUpdatingStatus(false);
      onContactUpdated();
    } catch (error: any) {
      console.error('Error updating contact status:', error);
      toast.error(error.message || "Failed to update contact status");
      setNewStatus(contact.status);
      setIsUpdatingStatus(false);
    }
  };

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
              {!isUpdatingStatus ? (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsUpdatingStatus(true)}
                >
                  <h5 className="text-xs font-normal italic">Update Status</h5>
                  <Edit className="h-3 w-3" />
                </Button>
              ) : (
                <div className="flex items-center gap-2">
                  <Select value={newStatus} onValueChange={setNewStatus}>
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {statusOptions.map(status => (
                        <SelectItem key={status} value={status}>{status}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button size="sm" onClick={handleStatusUpdate}>
                    <Save className="h-3 w-3" />
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => {
                      setIsUpdatingStatus(false);
                      setNewStatus(contact.status);
                    }}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              )}
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
