
import React, { useState, useEffect } from 'react';
import { useProductData } from '@/hooks/useProductData';
import { useTeamData } from '@/hooks/useTeamData';
import { Product } from '@/types/product';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { ProductDetailHeader } from './ProductDetailHeader';
import { ProductDetailActions } from './ProductDetailActions';
import { ProductDetailForm } from './ProductDetailForm';
import { ProductDetailView } from './ProductDetailView';

interface ProductDetailProps {
  product: Product;
  onBack: () => void;
  onProductUpdated: () => void;
}

export const ProductDetail: React.FC<ProductDetailProps> = ({
  product,
  onBack,
  onProductUpdated,
}) => {
  const [formData, setFormData] = useState<Partial<Product>>({});
  const [isEditing, setIsEditing] = useState(false);
  const { updateProduct, deleteProduct, isTeamOwner } = useProductData();
  const { teams } = useTeamData();
  const { toast } = useToast();
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  // Check if user is owner of the product's team
  const canEdit = isTeamOwner(product.team_id);

  useEffect(() => {
    setFormData({
      name: product.name,
      description: product.description,
      price: product.price,
      stock: product.stock,
      status: product.status,
      category: product.category,
    });
  }, [product]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'price' || name === 'stock' ? parseFloat(value) || 0 : value,
    }));
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSave = async () => {
    if (!canEdit) {
      toast({
        title: 'Permission Denied',
        description: 'Only team owners can edit products',
        variant: 'destructive',
      });
      return;
    }

    const success = await updateProduct(product.id, formData);
    if (success) {
      setIsEditing(false);
      onProductUpdated();
    }
  };

  const handleDelete = async () => {
    if (!canEdit) {
      toast({
        title: 'Permission Denied',
        description: 'Only team owners can delete products',
        variant: 'destructive',
      });
      return;
    }

    const success = await deleteProduct(product.id);
    if (success) {
      onBack();
    }
  };

  return (
    <div className="space-y-4">
      <ProductDetailHeader
        isEditing={isEditing}
        productName={product.name}
        onBack={onBack}
      />

      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>{product.name}</CardTitle>
            <ProductDetailActions
              canEdit={canEdit}
              isEditing={isEditing}
              onEdit={() => setIsEditing(true)}
              onSave={handleSave}
              onDelete={handleDelete}
              isDeleteDialogOpen={isDeleteDialogOpen}
              setIsDeleteDialogOpen={setIsDeleteDialogOpen}
            />
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {isEditing ? (
            <ProductDetailForm
              formData={formData}
              onInputChange={handleInputChange}
              onSelectChange={handleSelectChange}
            />
          ) : (
            <ProductDetailView
              product={product}
              teams={teams}
            />
          )}
        </CardContent>
        {isEditing && (
          <CardFooter className="flex justify-between">
            <Button variant="outline" onClick={() => setIsEditing(false)}>Cancel</Button>
            <Button onClick={handleSave}>Save Changes</Button>
          </CardFooter>
        )}
      </Card>
    </div>
  );
};
