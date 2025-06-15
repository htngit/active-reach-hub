
import { useToast } from '@/hooks/use-toast';

interface ProductFormData {
  name: string;
  description: string;
  price: number | null;
  stock: number;
  status: string;
  category: string;
  team_id: string;
}

export const useProductFormValidation = () => {
  const { toast } = useToast();

  const validateForm = (formData: ProductFormData): boolean => {
    if (!formData.name) {
      toast({
        title: 'Validation Error',
        description: 'Product name is required',
        variant: 'destructive',
      });
      return false;
    }

    if (!formData.team_id) {
      toast({
        title: 'Validation Error',
        description: 'Please select a team',
        variant: 'destructive',
      });
      return false;
    }

    return true;
  };

  return { validateForm };
};
