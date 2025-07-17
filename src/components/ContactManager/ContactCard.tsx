
import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Phone, Mail, Building, MessageCircle } from 'lucide-react';
import { TemplateSelectionModal } from './TemplateSelectionModal';
import { Contact } from '@/types/contact';

interface ContactCardProps {
  contact: Contact;
  currentUserId?: string;
  onSelectContact: (contact: Contact) => void;
  getOwnerDisplay: (contact: Contact) => string;
  isSelected?: boolean;
  onToggleSelect?: (contact: Contact) => void;
  selectionMode?: boolean;
}

export const ContactCard: React.FC<ContactCardProps> = ({
  contact,
  currentUserId,
  onSelectContact,
  getOwnerDisplay,
  isSelected = false,
  onToggleSelect,
  selectionMode = false,
}) => {
  return (
    <Card className={`hover:shadow-md transition-shadow max-w-full ${isSelected ? 'ring-2 ring-primary' : ''}`}>
      <CardContent className="p-3 sm:p-4">
        <div className="flex flex-col space-y-3 sm:space-y-4">
          <div className="flex items-start gap-3">
            {selectionMode && (
              <div className="flex items-center justify-center mt-1" onClick={(e) => {
                e.stopPropagation();
                onToggleSelect?.(contact);
              }}>
                <Checkbox checked={isSelected} />
              </div>
            )}
            <div 
              className="flex flex-col space-y-2 cursor-pointer flex-1 min-w-0"
              onClick={() => selectionMode ? onToggleSelect?.(contact) : onSelectContact(contact)}
            >
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                <h3 className="font-semibold text-sm sm:text-base truncate text-left">{contact.name}</h3>
                <Badge 
                  variant={contact.user_id === currentUserId ? "default" : "outline"} 
                  className="text-xs w-fit self-start sm:self-center"
                >
                  {getOwnerDisplay(contact)}
                </Badge>
              </div>
              <div className="flex flex-col space-y-1">
                <div className="flex items-center gap-2 text-xs sm:text-sm text-gray-600">
                  <Phone className="h-3 w-3 shrink-0" />
                  <span className="truncate text-left">{contact.phone_number}</span>
                </div>
                {contact.email && (
                  <div className="flex items-center gap-2 text-xs sm:text-sm text-gray-600">
                    <Mail className="h-3 w-3 shrink-0" />
                    <span className="truncate text-left">{contact.email}</span>
                  </div>
                )}
                {contact.company && (
                  <div className="flex items-center gap-2 text-xs sm:text-sm text-gray-600">
                    <Building className="h-3 w-3 shrink-0" />
                    <span className="truncate text-left">{contact.company}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
          
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-3">
            <div className="flex flex-wrap items-center gap-1">
              <Badge variant="outline" className="text-xs">{contact.status}</Badge>
              {contact.labels && contact.labels.length > 0 && (
                <>
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
                </>
              )}
            </div>
            
            <div className="w-full sm:w-auto flex justify-center sm:justify-end">
              <TemplateSelectionModal contact={contact}>
                <Button variant="outline" size="sm" className="w-full sm:w-auto text-xs sm:text-sm flex items-center justify-center gap-1">
                  <MessageCircle className="h-3 w-3" />
                  <span className="hidden sm:inline">Template Follow Up</span>
                  <span className="sm:hidden">Template</span>
                </Button>
              </TemplateSelectionModal>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
