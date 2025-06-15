
import React from 'react';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Product } from '@/types/product';

interface ProductDetailFormProps {
  formData: Partial<Product>;
  onInputChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  onSelectChange: (name: string, value: string) => void;
}

export const ProductDetailForm: React.FC<ProductDetailFormProps> = ({
  formData,
  onInputChange,
  onSelectChange,
}) => {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="name">Product Name</Label>
          <Input
            id="name"
            name="name"
            value={formData.name || ''}
            onChange={onInputChange}
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="category">Category</Label>
          <Input
            id="category"
            name="category"
            value={formData.category || ''}
            onChange={onInputChange}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          name="description"
          value={formData.description || ''}
          onChange={onInputChange}
          rows={4}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="space-y-2">
          <Label htmlFor="price">Price</Label>
          <Input
            id="price"
            name="price"
            type="number"
            value={formData.price || 0}
            onChange={onInputChange}
            min={0}
            step="0.01"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="stock">Stock</Label>
          <Input
            id="stock"
            name="stock"
            type="number"
            value={formData.stock || 0}
            onChange={onInputChange}
            min={0}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="status">Status</Label>
          <Select
            value={formData.status || ''}
            onValueChange={(value) => onSelectChange('status', value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Published">Published</SelectItem>
              <SelectItem value="Draft">Draft</SelectItem>
              <SelectItem value="Inactive">Inactive</SelectItem>
              <SelectItem value="Out of Stock">Out of Stock</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );
};
