import React, { useState, useEffect } from 'react';
import { useProductData } from '@/hooks/useProductData';
import { useTeamData } from '@/hooks/useTeamData';
import { Product } from '@/types/product';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, Save, Trash2 } from 'lucide-react';
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

  // Get team name
  const getTeamName = (teamId: string) => {
    const team = teams.find(t => t.id === teamId);
    return team ? team.name : 'Unknown Team';
  };

  // Format date
  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString();
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center space-x-4">
        <Button variant="outline" onClick={onBack}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Products
        </Button>
        <h2 className="text-2xl font-bold">{isEditing ? 'Edit Product' : 'Product Details'}</h2>
      </div>

      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>{product.name}</CardTitle>
            {canEdit && (
              <div className="flex space-x-2">
                {isEditing ? (
                  <Button onClick={handleSave}>
                    <Save className="h-4 w-4 mr-2" />
                    Save Changes
                  </Button>
                ) : (
                  <Button variant="outline" onClick={() => setIsEditing(true)}>
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
                      <AlertDialogAction onClick={handleDelete}>Delete</AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {isEditing ? (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Product Name</Label>
                  <Input
                    id="name"
                    name="name"
                    value={formData.name || ''}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="category">Category</Label>
                  <Input
                    id="category"
                    name="category"
                    value={formData.category || ''}
                    onChange={handleInputChange}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  name="description"
                  value={formData.description || ''}
                  onChange={handleInputChange}
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
                    onChange={handleInputChange}
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
                    onChange={handleInputChange}
                    min={0}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="status">Status</Label>
                  <Select
                    value={formData.status || ''}
                    onValueChange={(value) => handleSelectChange('status', value)}
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
          ) : (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Team</h3>
                  <p>{getTeamName(product.team_id)}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Category</h3>
                  <p>{product.category || 'Uncategorized'}</p>
                </div>
              </div>

              <div>
                <h3 className="text-sm font-medium text-gray-500">Description</h3>
                <p className="whitespace-pre-line">{product.description || 'No description provided'}</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Price</h3>
                  <p>${product.price?.toFixed(2) || '0.00'}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Stock</h3>
                  <p>{product.stock || 0} units</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Status</h3>
                  <p>{product.status || 'Unknown'}</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Created At</h3>
                  <p>{formatDate(product.created_at)}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Last Updated</h3>
                  <p>{formatDate(product.updated_at)}</p>
                </div>
              </div>
            </div>
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