import React, { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { Team } from '@/types/team';
import { useAuth } from '@/contexts/AuthContext';
import { useTeamData } from '@/hooks/useTeamData';
import { ProductFormFields } from './ProductFormFields';
import { useProductFormValidation } from './ProductFormValidation';
import { NoOwnershipMessage } from './NoOwnershipMessage';

interface AddProductFormProps {
  teams: Team[];
  onBack: () => void;
  onProductAdded: () => void;
}

export const AddProductForm: React.FC<AddProductFormProps> = ({
  teams,
  onBack,
  onProductAdded,
}) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState<number | null>(null);
  const [stock, setStock] = useState(0);
  const [status, setStatus] = useState('active');
  const [category, setCategory] = useState('');
  const [selectedTeamId, setSelectedTeamId] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const { user } = useAuth();
  const { isTeamOwner } = useTeamData();
  const { validateForm } = useProductFormValidation();

  // Filter teams to only show those where user is owner
  const ownedTeams = teams.filter(team => isTeamOwner(team.id));

  if (ownedTeams.length === 0) {
    return <NoOwnershipMessage onBack={onBack} />;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const formData = {
      name,
      description,
      price,
      stock,
      status,
      category,
      team_id: selectedTeamId,
    };

    if (!validateForm(formData)) {
      return;
    }

    setSubmitting(true);
    try {
      const { error } = await supabase
        .from('products')
        .insert({
          name,
          description,
          price,
          stock_quantity: stock,
          status,
          category,
          team_id: selectedTeamId,
          created_by: user?.id,
        });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Product added successfully",
      });

      onProductAdded();
    } catch (error: any) {
      console.error('Error adding product:', error);
      toast({
        title: "Error",
        description: "Failed to add product",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center space-x-4">
        <Button variant="outline" onClick={onBack}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Products
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Add New Product</CardTitle>
          <CardDescription>Fill in the details to add a new product</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <ProductFormFields
              name={name}
              setName={setName}
              description={description}
              setDescription={setDescription}
              price={price}
              setPrice={setPrice}
              stock={stock}
              setStock={setStock}
              status={status}
              setStatus={setStatus}
              category={category}
              setCategory={setCategory}
              selectedTeamId={selectedTeamId}
              setSelectedTeamId={setSelectedTeamId}
              teams={ownedTeams}
              submitting={submitting}
            />

            <div className="flex gap-2">
              <Button type="submit" disabled={submitting}>
                {submitting ? 'Adding...' : 'Add Product'}
              </Button>
              <Button type="button" variant="outline" onClick={onBack}>
                Cancel
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};
