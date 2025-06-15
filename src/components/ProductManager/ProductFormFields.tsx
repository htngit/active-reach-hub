
import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Team } from '@/types/team';

interface ProductFormFieldsProps {
  name: string;
  setName: (value: string) => void;
  description: string;
  setDescription: (value: string) => void;
  price: number | null;
  setPrice: (value: number | null) => void;
  stock: number;
  setStock: (value: number) => void;
  status: string;
  setStatus: (value: string) => void;
  category: string;
  setCategory: (value: string) => void;
  selectedTeamId: string;
  setSelectedTeamId: (value: string) => void;
  teams: Team[];
  submitting: boolean;
}

export const ProductFormFields: React.FC<ProductFormFieldsProps> = ({
  name,
  setName,
  description,
  setDescription,
  price,
  setPrice,
  stock,
  setStock,
  status,
  setStatus,
  category,
  setCategory,
  selectedTeamId,
  setSelectedTeamId,
  teams,
  submitting,
}) => {
  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="name">Product Name *</Label>
          <Input
            id="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Enter product name"
            disabled={submitting}
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="team">Team *</Label>
          <Select value={selectedTeamId} onValueChange={setSelectedTeamId} disabled={submitting}>
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
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Enter product description"
          disabled={submitting}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="space-y-2">
          <Label htmlFor="price">Price</Label>
          <Input
            id="price"
            type="number"
            value={price || ''}
            onChange={(e) => setPrice(e.target.value ? parseFloat(e.target.value) : null)}
            placeholder="0.00"
            disabled={submitting}
            step="0.01"
            min="0"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="stock">Stock Quantity *</Label>
          <Input
            id="stock"
            type="number"
            value={stock}
            onChange={(e) => setStock(parseInt(e.target.value) || 0)}
            placeholder="0"
            disabled={submitting}
            min="0"
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="status">Status *</Label>
          <Select value={status} onValueChange={setStatus} disabled={submitting}>
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

      <div className="space-y-2">
        <Label htmlFor="category">Category</Label>
        <Input
          id="category"
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          placeholder="Enter product category"
          disabled={submitting}
        />
      </div>
    </>
  );
};
