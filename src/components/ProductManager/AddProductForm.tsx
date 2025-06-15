
import { useState } from 'react';
import { useProductData } from '@/hooks/useProductData';
import { useTeamData } from '@/hooks/useTeamData';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, Save } from 'lucide-react';
import { ProductFormFields } from './ProductFormFields';
import { ProductFormValidation, useProductFormValidation } from './ProductFormValidation';
import { NoOwnershipMessage } from './NoOwnershipMessage';

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
  const { toast } = useToast();
  const { validateForm } = useProductFormValidation();

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

    if (!validateForm(formData)) {
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
    return <NoOwnershipMessage onBack={onBack} />;
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
            <ProductFormFields
              formData={formData}
              teams={ownedTeams}
              onInputChange={handleInputChange}
              onSelectChange={handleSelectChange}
            />
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
