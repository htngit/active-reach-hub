
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

/**
 * ContactCard Component - Fully Responsive Contact Display Card
 * 
 * Features:
 * - Grid-based responsive layout for optimal viewing across all devices
 * - Adaptive spacing and typography scaling
 * - Smart badge overflow handling with horizontal scroll on mobile
 * - Responsive button sizing and positioning
 * - Improved text truncation and content flow
 * 
 * Responsive Breakpoints:
 * - xs (0-480px): Compact mobile layout
 * - sm (481-768px): Enhanced mobile/tablet layout  
 * - md (769px+): Desktop layout with horizontal arrangement
 */
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
    <Card className={`hover:shadow-md transition-all duration-200 w-full max-w-full overflow-hidden ${
      isSelected ? 'ring-2 ring-primary shadow-lg' : ''
    }`}>
      <CardContent className="p-2 xs:p-3 sm:p-4 md:p-5">
        {/* Main Grid Container */}
        <div className="grid grid-cols-1 gap-3 xs:gap-4 sm:gap-5">
          
          {/* Header Section - Contact Info & Owner Badge */}
          <div className="grid grid-cols-1 sm:grid-cols-[1fr_auto] gap-2 sm:gap-4 items-start">
            <div className="flex items-start gap-2 xs:gap-3 min-w-0">
              {/* Selection Checkbox */}
              {selectionMode && (
                <div 
                  className="flex items-center justify-center mt-0.5 xs:mt-1 shrink-0" 
                  onClick={(e) => {
                    e.stopPropagation();
                    onToggleSelect?.(contact);
                  }}
                >
                  <Checkbox checked={isSelected} className="h-4 w-4 xs:h-5 xs:w-5" />
                </div>
              )}
              
              {/* Contact Name & Details */}
              <div 
                className="flex flex-col space-y-1.5 xs:space-y-2 cursor-pointer flex-1 min-w-0"
                onClick={() => selectionMode ? onToggleSelect?.(contact) : onSelectContact(contact)}
              >
                {/* Contact Name */}
                <h3 className="font-semibold text-sm xs:text-base sm:text-lg truncate text-left leading-tight">
                  {contact.name}
                </h3>
                
                {/* Contact Details */}
                <div className="flex flex-col space-y-1 xs:space-y-1.5">
                  <div className="flex items-center gap-1.5 xs:gap-2 text-xs xs:text-sm text-gray-600">
                    <Phone className="h-3 w-3 xs:h-4 xs:w-4 shrink-0" />
                    <span className="truncate text-left font-medium">{contact.phone_number}</span>
                  </div>
                  
                  {contact.email && (
                    <div className="flex items-center gap-1.5 xs:gap-2 text-xs xs:text-sm text-gray-600">
                      <Mail className="h-3 w-3 xs:h-4 xs:w-4 shrink-0" />
                      <span className="truncate text-left">{contact.email}</span>
                    </div>
                  )}
                  
                  {contact.company && (
                    <div className="flex items-center gap-1.5 xs:gap-2 text-xs xs:text-sm text-gray-600">
                      <Building className="h-3 w-3 xs:h-4 xs:w-4 shrink-0" />
                      <span className="truncate text-left">{contact.company}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
            
            {/* Owner Badge */}
            <div className="flex justify-start sm:justify-end">
              <Badge 
                variant={contact.user_id === currentUserId ? "default" : "outline"} 
                className="text-xs xs:text-sm w-fit shrink-0"
              >
                {getOwnerDisplay(contact)}
              </Badge>
            </div>
          </div>
          
          {/* Footer Section - Status/Labels & Action Button */}
          <div className="grid grid-cols-1 sm:grid-cols-[1fr_auto] gap-3 xs:gap-4 items-start sm:items-center">
            
            {/* Status & Labels Container */}
            <div className="min-w-0">
              {/* Status Badge */}
              <div className="flex items-center gap-1 xs:gap-2 mb-2">
                <Badge variant="outline" className="text-xs xs:text-sm font-medium">
                  {contact.status}
                </Badge>
              </div>
              
              {/* Labels with Horizontal Scroll on Mobile */}
              {contact.labels && contact.labels.length > 0 && (
                <div className="w-full">
                  <div className="flex gap-1 xs:gap-2 overflow-x-auto scrollbar-hide pb-1">
                    <div className="flex gap-1 xs:gap-2 shrink-0">
                      {contact.labels.slice(0, 3).map(label => (
                        <Badge key={label} variant="secondary" className="text-xs whitespace-nowrap">
                          {label}
                        </Badge>
                      ))}
                      {contact.labels.length > 3 && (
                        <Badge variant="secondary" className="text-xs whitespace-nowrap">
                          +{contact.labels.length - 3}
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
            
            {/* Action Button */}
            <div className="w-full sm:w-auto flex justify-stretch sm:justify-end">
              <TemplateSelectionModal contact={contact}>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="w-full sm:w-auto min-w-0 sm:min-w-[140px] text-xs xs:text-sm flex items-center justify-center gap-1 xs:gap-2 px-2 xs:px-3 py-1.5 xs:py-2"
                >
                  <MessageCircle className="h-3 w-3 xs:h-4 xs:w-4 shrink-0" />
                  <span className="hidden xs:inline sm:inline truncate">Template Follow Up</span>
                  <span className="xs:hidden">Template</span>
                </Button>
              </TemplateSelectionModal>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
