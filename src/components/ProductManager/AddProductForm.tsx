
import { useState } from 'react';
import { useProductData } from '@/hooks/useProductData';
import { useTeamData } from '@/hooks/useTeamData';
import { useCurrency } from '@/hooks/useCurrency';
import { Product } from '@/types/product';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, Save } from 'lucide-react';

interface AddProductFormProps {
  onBack: () => void;
  onProductAdded: () => void;
}

export const AddProductForm: React.FC<AddProductFormProps> = ({
  onBack,
  onProductAdded,
}) => {
  const initialFormState = {
    name: '',
    description: '',
    price: null as number | null,
    stock: 0,
    status: 'Draft',
    category: '',
    team_id: '',
  };

  const [formData, setFormData] = useState(initialFormState);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { addProduct } = useProductData();
  const { teams, isTeamOwner } = useTeamData();
  const { symbol } = useCurrency();
  const { toast } = useToast();

  // Filter teams where user is owner
  const ownedTeams = teams.filter(team => isTeamOwner(team.id));

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => {
      if (name === 'price') {
        // Convert to number or null if empty
        const numValue = value === '' ? null : parseFloat(value);
        return {
          ...prev,
          [name]: numValue,
        };
      }
      if (name === 'stock') {
        // Convert to number, default to 0 if empty
        const numValue = value === '' ? 0 : parseInt(value);
        return {
          ...prev,
          [name]: numValue,
        };
      }
      return {
        ...prev,
        [name]: value,
      };
    });
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name) {
      toast({
        title: 'Validation Error',
        description: 'Product name is required',
        variant: 'destructive',
      });
      return;
    }

    if (!formData.team_id) {
      toast({
        title: 'Validation Error',
        description: 'Please select a team',
        variant: 'destructive',
      });
      return;
    }

    try {
      setIsSubmitting(true);
      const result = await addProduct(formData);
      if (result) {
        toast({
          title: 'Success',
          description: 'Product added successfully',
        });
        onProductAdded();
      }
    } catch (error) {
      console.error('Error adding product:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (ownedTeams.length === 0) {
    return (
      <div className="space-y-4">
        <div className="flex items-center space-x-4">
          <Button variant="outline" onClick={onBack}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Products
          </Button>
        </div>

        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <h3 className="text-lg font-medium mb-2">You need to be a team owner to add products</h3>
              <p className="text-gray-500 mb-4">
                Only team owners can add new products. Please create a team or ask your team owner to add products.
              </p>
              <Button variant="outline" onClick={() => window.location.href = '/team'}>
                Go to Teams
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center space-x-4">
        <Button variant="outline" onClick={onBack}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Products
        </Button>
        <h2 className="text-2xl font-bold">Add New Product</h2>
      </div>

      <form onSubmit={handleSubmit}>
        <Card>
          <CardHeader>
            <CardTitle>Product Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="team_id">Team *</Label>
              <Select
                value={formData.team_id}
                onValueChange={(value) => handleSelectChange('team_id', value)}
                required
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a team" />
                </SelectTrigger>
                <SelectContent>
                  {ownedTeams.map((team) => (
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
                  onChange={handleInputChange}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="category">Category</Label>
                <Input
                  id="category"
                  name="category"
                  value={formData.category}
                  onChange={handleInputChange}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleInputChange}
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
                  onChange={handleInputChange}
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
                  onChange={handleInputChange}
                  min={0}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <Select
                  value={formData.status}
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
          </CardContent>
          <CardFooter className="flex justify-between">
            <Button type="button" variant="outline" onClick={onBack}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <div className="animate-spin mr-2 h-4 w-4 border-2 border-current border-t-transparent rounded-full"></div>
                  Saving...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Save Product
                </>
              )}
            </Button>
          </CardFooter>
        </Card>
      </form>
    </div>
  );
};
