
import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Edit, Save, X, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { LeadQualificationForm } from './LeadQualificationForm';
import { ContactDetailHeader } from './ContactDetailHeader';
import { ContactDetailInfo } from './ContactDetailInfo';
import { ContactDetailActions } from './ContactDetailActions';
import { ContactDetailEditForm } from './ContactDetailEditForm';
import { ContactDetailActivities } from './ContactDetailActivities';
import { ContactDetailDeleteDialog } from './ContactDetailDeleteDialog';

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

interface ContactDetailProps {
  contact: Contact;
  onBack: () => void;
  onContactUpdated: () => void;
}

export const ContactDetail: React.FC<ContactDetailProps> = ({
  contact: initialContact,
  onBack,
  onContactUpdated,
}) => {
  const [contact, setContact] = useState(initialContact);
  const [isEditing, setIsEditing] = useState(false);
  const [editedContact, setEditedContact] = useState(contact);
  const { user } = useAuth();

  useEffect(() => {
    setContact(initialContact);
    setEditedContact(initialContact);
  }, [initialContact]);

  const handleSaveContact = async () => {
    if (!user) {
      toast.error("You must be logged in to update contacts");
      return;
    }

    try {
      console.log('Updating contact with data:', editedContact);

      const { error } = await supabase
        .from('contacts')
        .update({
          name: editedContact.name,
          phone_number: editedContact.phone_number,
          email: editedContact.email || null,
          company: editedContact.company || null,
          address: editedContact.address || null,
          notes: editedContact.notes || null,
          labels: editedContact.labels && editedContact.labels.length > 0 ? editedContact.labels : null,
          status: editedContact.status,
          potential_product: editedContact.potential_product && editedContact.potential_product.length > 0 ? editedContact.potential_product : null,
        })
        .eq('id', contact.id);

      if (error) {
        console.error('Supabase error updating contact:', error);
        throw error;
      }

      setContact(editedContact);
      toast.success("Contact updated successfully");
      setIsEditing(false);
      onContactUpdated();
    } catch (error: any) {
      console.error('Error updating contact:', error);
      toast.error(error.message || "Failed to update contact");
    }
  };

  const handleDeleteContact = async () => {
    if (!user) {
      toast.error("You must be logged in to delete contacts");
      return;
    }

    try {
      console.log('Deleting contact:', contact.id);

      const { error } = await supabase
        .from('contacts')
        .delete()
        .eq('id', contact.id);

      if (error) {
        console.error('Supabase error deleting contact:', error);
        throw error;
      }

      toast.success("Contact deleted successfully");
      onContactUpdated();
      onBack();
    } catch (error: any) {
      console.error('Error deleting contact:', error);
      toast.error(error.message || "Failed to delete contact");
    }
  };

  return (
    <div className="space-y-6">
      <ContactDetailHeader 
        isEditing={isEditing}
        onBack={onBack}
        onEdit={() => setIsEditing(true)}
        onSave={handleSaveContact}
        onCancel={() => {
          setIsEditing(false);
          setEditedContact(contact);
        }}
        onDelete={handleDeleteContact}
        contactName={contact.name}
      />

      <LeadQualificationForm 
        contactId={contact.id}
        contactName={contact.name}
        currentStatus={contact.status}
        onQualificationUpdate={onContactUpdated}
      />

      {isEditing ? (
        <ContactDetailEditForm 
          contact={editedContact}
          onContactChange={setEditedContact}
        />
      ) : (
        <ContactDetailInfo 
          contact={contact}
          onContactUpdated={onContactUpdated}
        />
      )}

      {!isEditing && (
        <ContactDetailActions contact={contact} />
      )}

      <ContactDetailActivities contactId={contact.id} />
    </div>
  );
};
