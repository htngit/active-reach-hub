
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { X } from 'lucide-react';

interface PotentialProductsInputProps {
  potentialProducts: string[];
  onProductsChange: (products: string[]) => void;
}

export const PotentialProductsInput: React.FC<PotentialProductsInputProps> = ({
  potentialProducts,
  onProductsChange,
}) => {
  const [newProduct, setNewProduct] = useState('');

  const handleAddProduct = () => {
    if (newProduct.trim() && !potentialProducts.includes(newProduct.trim())) {
      onProductsChange([...potentialProducts, newProduct.trim()]);
      setNewProduct('');
    }
  };

  const handleRemoveProduct = (product: string) => {
    onProductsChange(potentialProducts.filter(p => p !== product));
  };

  return (
    <div>
      <Label>Potential Products/Services</Label>
      <div className="flex gap-2 mb-2">
        <Input
          value={newProduct}
          onChange={(e) => setNewProduct(e.target.value)}
          placeholder="Add product/service"
          onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddProduct())}
        />
        <Button type="button" onClick={handleAddProduct} variant="outline">
          Add
        </Button>
      </div>
      {potentialProducts.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {potentialProducts.map((product) => (
            <Badge key={product} variant="secondary" className="flex items-center gap-1">
              {product}
              <X
                className="h-3 w-3 cursor-pointer"
                onClick={() => handleRemoveProduct(product)}
              />
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
};
