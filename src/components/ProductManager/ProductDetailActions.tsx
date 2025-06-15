
import React from 'react';
import { Button } from '@/components/ui/button';
import { Save, Trash2 } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

interface ProductDetailActionsProps {
  canEdit: boolean;
  isEditing: boolean;
  onEdit: () => void;
  onSave: () => void;
  onDelete: () => void;
  isDeleteDialogOpen: boolean;
  setIsDeleteDialogOpen: (open: boolean) => void;
}

export const ProductDetailActions: React.FC<ProductDetailActionsProps> = ({
  canEdit,
  isEditing,
  onEdit,
  onSave,
  onDelete,
  isDeleteDialogOpen,
  setIsDeleteDialogOpen,
}) => {
  if (!canEdit) return null;

  return (
    <div className="flex space-x-2">
      {isEditing ? (
        <Button onClick={onSave}>
          <Save className="h-4 w-4 mr-2" />
          Save Changes
        </Button>
      ) : (
        <Button variant="outline" onClick={onEdit}>
          Edit Product
        </Button>
      )}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogTrigger asChild>
          <Button variant="destructive">
            <Trash2 className="h-4 w-4 mr-2" />
            Delete
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the product
              and remove it from our servers.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={onDelete}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};
