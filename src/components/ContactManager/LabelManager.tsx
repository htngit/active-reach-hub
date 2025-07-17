import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import { Settings, Trash2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

interface LabelManagerProps {
  availableLabels: string[];
  onLabelsChanged: () => void;
}

export const LabelManager: React.FC<LabelManagerProps> = ({
  availableLabels,
  onLabelsChanged,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [labelToDelete, setLabelToDelete] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const { user } = useAuth();

  const handleDeleteLabel = async (labelName: string) => {
    if (!user || isDeleting) return;

    setIsDeleting(true);
    try {
      // First, remove this label from all contacts that have it
      const { data: contactsWithLabel, error: fetchError } = await supabase
        .from('contacts')
        .select('id, labels')
        .eq('user_id', user.id)
        .not('labels', 'is', null);

      if (fetchError) throw fetchError;

      // Update contacts to remove the label
      const contactsToUpdate = contactsWithLabel
        ?.filter(contact => contact.labels?.includes(labelName))
        .map(contact => ({
          id: contact.id,
          labels: contact.labels?.filter(label => label !== labelName) || []
        })) || [];

      if (contactsToUpdate.length > 0) {
        const updatePromises = contactsToUpdate.map(contact =>
          supabase
            .from('contacts')
            .update({ labels: contact.labels.length > 0 ? contact.labels : null })
            .eq('id', contact.id)
        );

        await Promise.all(updatePromises);
      }

      // Then delete the label from the labels table
      const { error: deleteError } = await supabase
        .from('labels')
        .delete()
        .eq('user_id', user.id)
        .eq('name', labelName);

      if (deleteError) throw deleteError;

      toast.success(`Label "${labelName}" deleted successfully`);
      onLabelsChanged();
      setLabelToDelete(null);
    } catch (error: any) {
      console.error('Error deleting label:', error);
      toast.error(error.message || 'Failed to delete label');
    } finally {
      setIsDeleting(false);
    }
  };

  if (availableLabels.length === 0) return null;

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Settings className="h-4 w-4 mr-2" />
          Manage Labels
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Manage Labels</DialogTitle>
          <DialogDescription>
            Delete labels you no longer need. Contacts with deleted labels will have those labels removed.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-3 max-h-60 overflow-y-auto">
          {availableLabels.map(label => (
            <div key={label} className="flex items-center justify-between p-2 border rounded">
              <Badge variant="outline">{label}</Badge>
              
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button 
                    variant="ghost" 
                    size="sm"
                    disabled={isDeleting}
                    onClick={() => setLabelToDelete(label)}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Delete Label</AlertDialogTitle>
                    <AlertDialogDescription>
                      Are you sure you want to delete the label "{label}"? This will remove the label from all contacts that have it. This action cannot be undone.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={() => handleDeleteLabel(label)}
                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                      disabled={isDeleting}
                    >
                      {isDeleting ? 'Deleting...' : 'Delete Label'}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          ))}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setIsOpen(false)}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};