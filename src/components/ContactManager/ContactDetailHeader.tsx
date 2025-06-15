
import React from 'react';
import { Button } from '@/components/ui/button';
import { Edit, Save, X, Trash2 } from 'lucide-react';
import { ContactDetailDeleteDialog } from './ContactDetailDeleteDialog';

interface ContactDetailHeaderProps {
  isEditing: boolean;
  onBack: () => void;
  onEdit: () => void;
  onSave: () => void;
  onCancel: () => void;
  onDelete: () => void;
  contactName: string;
}

export const ContactDetailHeader: React.FC<ContactDetailHeaderProps> = ({
  isEditing,
  onBack,
  onEdit,
  onSave,
  onCancel,
  onDelete,
  contactName,
}) => {
  return (
    <div className="flex items-center justify-between">
      <Button variant="outline" onClick={onBack}>
        ← Back to Contacts
      </Button>
      <div className="flex gap-2">
        {!isEditing ? (
          <>
            <Button onClick={onEdit}>
              <Edit className="h-4 w-4 mr-2" />
              Edit
            </Button>
            <ContactDetailDeleteDialog 
              contactName={contactName}
              onDelete={onDelete}
            />
          </>
        ) : (
          <>
            <Button onClick={onSave}>
              <Save className="h-4 w-4 mr-2" />
              Save
            </Button>
            <Button variant="outline" onClick={onCancel}>
              <X className="h-4 w-4 mr-2" />
              Cancel
            </Button>
          </>
        )}
      </div>
    </div>
  );
};
