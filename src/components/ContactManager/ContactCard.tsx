
import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Phone, Mail, Building, MessageCircle } from 'lucide-react';
import { TemplateSelectionModal } from './TemplateSelectionModal';
import { Contact } from '@/types/contact';

interface ContactCardProps {
  contact: Contact;
  currentUserId?: string;
  onSelectContact: (contact: Contact) => void;
  getOwnerDisplay: (contact: Contact) => string;
}

export const ContactCard: React.FC<ContactCardProps> = ({
  contact,
  currentUserId,
  onSelectContact,
  getOwnerDisplay,
}) => {
  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4">
          <div 
            className="space-y-1 cursor-pointer flex-1"
            onClick={() => onSelectContact(contact)}
          >
            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-base sm:text-lg">{contact.name}</h3>
              <Badge 
                variant={contact.user_id === currentUserId ? "default" : "outline"} 
                className="text-xs"
              >
                {getOwnerDisplay(contact)}
              </Badge>
            </div>
            <div className="flex flex-col sm:flex-row sm:items-center gap-2 text-sm text-gray-600">
              <div className="flex items-center gap-2">
                <Phone className="h-3 w-3 shrink-0" />
                {contact.phone_number}
              </div>
              {contact.email && (
                <div className="flex items-center gap-2">
                  <Mail className="h-3 w-3 shrink-0" />
                  {contact.email}
                </div>
              )}
              {contact.company && (
                <div className="flex items-center gap-2">
                  <Building className="h-3 w-3 shrink-0" />
                  {contact.company}
                </div>
              )}
            </div>
          </div>
          <div className="flex flex-col gap-2 items-start sm:items-end">
            <Badge variant="outline">{contact.status}</Badge>
            {contact.labels && contact.labels.length > 0 && (
              <div className="flex flex-wrap gap-1 justify-end">
                {contact.labels.slice(0, 2).map(label => (
                  <Badge key={label} variant="secondary" className="text-xs">
                    {label}
                  </Badge>
                ))}
                {contact.labels.length > 2 && (
                  <Badge variant="secondary" className="text-xs">
                    +{contact.labels.length - 2}
                  </Badge>
                )}
              </div>
            )}
            <div className="w-full sm:w-auto">
              <TemplateSelectionModal contact={contact}>
                <Button variant="outline" size="sm" className="w-full sm:w-auto">
                  <MessageCircle className="h-3 w-3 mr-1" />
                  Template Follow Up
                </Button>
              </TemplateSelectionModal>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
