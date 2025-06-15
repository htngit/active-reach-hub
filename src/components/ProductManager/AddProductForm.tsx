
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useTeamData } from '@/hooks/useTeamData';
import { useProductData } from '@/hooks/useProductData';
import { ProductFormFields } from './ProductFormFields';
import { useProductFormValidation } from './ProductFormValidation';
import { NoOwnershipMessage } from './NoOwnershipMessage';

interface AddProductFormProps {
  onBack: () => void;
  onProductAdded: () => void;
}

export const AddProductForm: React.FC<AddProductFormProps> = ({
  onBack,
  onProductAdded,
}) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState<number | null>(null);
  const [stock, setStock] = useState(0);
  const [status, setStatus] = useState('Draft');
  const [category, setCategory] = useState('');
  const [selectedTeamId, setSelectedTeamId] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const { user } = useAuth();
  const { teams, isTeamOwner } = useTeamData();
  const { addProduct } = useProductData();
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
      const result = await addProduct(formData);
      if (result) {
        onProductAdded();
      }
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
