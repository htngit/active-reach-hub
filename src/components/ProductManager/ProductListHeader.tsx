
import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Plus, Package } from 'lucide-react';

interface ProductListHeaderProps {
  onAddProduct: () => void;
  canAddProducts: boolean;
}

export const ProductListHeader: React.FC<ProductListHeaderProps> = ({
  onAddProduct,
  canAddProducts,
}) => {
  return (
    <>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Product Manager</h1>
          <p className="text-gray-600">Manage your products and inventory</p>
        </div>
        {canAddProducts && (
          <Button onClick={onAddProduct}>
            <Plus className="h-4 w-4 mr-2" />
            Add Product
          </Button>
        )}
      </div>

      {/* Show message if user cannot add products */}
      {!canAddProducts && (
        <Card className="bg-amber-50 border-amber-200">
          <CardContent className="pt-6">
            <div className="flex items-center space-x-2 text-amber-800">
              <Package className="h-5 w-5" />
              <p className="text-sm">
                Only team owners can add new products. You can view and manage existing products.
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </>
  );
};
