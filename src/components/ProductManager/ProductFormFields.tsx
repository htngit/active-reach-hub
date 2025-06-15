
import React from 'react';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { useCurrency } from '@/hooks/useCurrency';

interface ProductFormData {
  name: string;
  description: string;
  price: number | null;
  stock: number;
  status: string;
  category: string;
  team_id: string;
}

interface Team {
  id: string;
  name: string;
}

interface ProductFormFieldsProps {
  formData: ProductFormData;
  teams: Team[];
  onInputChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  onSelectChange: (name: string, value: string) => void;
}

export const ProductFormFields: React.FC<ProductFormFieldsProps> = ({
  formData,
  teams,
  onInputChange,
  onSelectChange,
}) => {
  const { symbol } = useCurrency();

  return (
    <>
      <div className="space-y-2">
        <Label htmlFor="team_id">Team *</Label>
        <Select
          value={formData.team_id}
          onValueChange={(value) => onSelectChange('team_id', value)}
          required
        >
          <SelectTrigger>
            <SelectValue placeholder="Select a team" />
          </SelectTrigger>
          <SelectContent>
            {teams.map((team) => (
              <SelectItem key={team.id} value={team.id}>
                {team.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="name">Product Name *</Label>
          <Input
            id="name"
            name="name"
            value={formData.name}
            onChange={onInputChange}
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="category">Category</Label>
          <Input
            id="category"
            name="category"
            value={formData.category}
            onChange={onInputChange}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          name="description"
          value={formData.description}
          onChange={onInputChange}
          rows={4}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="space-y-2">
          <Label htmlFor="price">Price ({symbol}) (optional)</Label>
          <Input
            id="price"
            name="price"
            type="number"
            value={formData.price === null ? '' : formData.price}
            onChange={onInputChange}
            min={0}
            step="0.01"
            placeholder="Leave empty if no price"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="stock">Stock</Label>
          <Input
            id="stock"
            name="stock"
            type="number"
            value={formData.stock}
            onChange={onInputChange}
            min={0}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="status">Status</Label>
          <Select
            value={formData.status}
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
    </>
  );
};
