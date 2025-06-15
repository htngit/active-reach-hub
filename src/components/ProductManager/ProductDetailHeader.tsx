
import React from 'react';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';

interface ProductDetailHeaderProps {
  isEditing: boolean;
  productName: string;
  onBack: () => void;
}

export const ProductDetailHeader: React.FC<ProductDetailHeaderProps> = ({
  isEditing,
  productName,
  onBack,
}) => {
  return (
    <div className="flex items-center space-x-4">
      <Button variant="outline" onClick={onBack}>
        <ArrowLeft className="h-4 w-4 mr-2" />
        Back to Products
      </Button>
      <h2 className="text-2xl font-bold">
        {isEditing ? 'Edit Product' : 'Product Details'}
      </h2>
    </div>
  );
};
