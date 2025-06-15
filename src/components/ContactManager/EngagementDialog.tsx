
import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { EngagementForm } from './EngagementForm';

interface EngagementDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  contactId: string;
  contactName: string;
  onEngagementCreated: () => void;
}

export const EngagementDialog: React.FC<EngagementDialogProps> = ({
  open,
  onOpenChange,
  contactId,
  contactName,
  onEngagementCreated,
}) => {
  const handleSuccess = () => {
    onEngagementCreated();
    onOpenChange(false);
  };

  const handleCancel = () => {
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Create New Engagement for {contactName}</DialogTitle>
        </DialogHeader>
        <EngagementForm
          contactId={contactId}
          onSuccess={handleSuccess}
          onCancel={handleCancel}
        />
      </DialogContent>
    </Dialog>
  );
};
