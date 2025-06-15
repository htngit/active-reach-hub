
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Package, Plus } from 'lucide-react';
import { Product } from '@/types/product';
import { Team } from '@/types/team';
import { useCurrency } from '@/hooks/useCurrency';

interface ProductGridProps {
  filteredProducts: Product[];
  products: Product[];
  onSelectProduct: (product: Product) => void;
  onAddProduct: () => void;
  canAddProducts: boolean;
  teams: Team[];
}

export const ProductGrid: React.FC<ProductGridProps> = ({
  filteredProducts,
  products,
  onSelectProduct,
  onAddProduct,
  canAddProducts,
  teams,
}) => {
  const { formatCurrency } = useCurrency();

  const getTeamName = (teamId: string) => {
    const team = teams.find(t => t.id === teamId);
    return team?.name || 'Unknown Team';
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Published':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'Draft':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'Inactive':
        return 'bg-gray-100 text-gray-800 border-gray-200';
      case 'Out of Stock':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  if (filteredProducts.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-8">
          <Package className="h-12 w-12 text-gray-400 mb-4" />
          <h3 className="text-lg font-medium mb-2">
            {products.length === 0 ? 'No products yet' : 'No products found'}
          </h3>
          <p className="text-gray-500 mb-4 text-center">
            {products.length === 0 
              ? canAddProducts 
                ? 'Get started by adding your first product'
                : 'No products are available in your teams yet'
              : 'Try adjusting your search or filter criteria'
            }
          </p>
          {products.length === 0 && canAddProducts && (
            <Button onClick={onAddProduct}>
              <Plus className="h-4 w-4 mr-2" />
              Add Your First Product
            </Button>
          )}
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {filteredProducts.map((product) => (
        <Card 
          key={product.id} 
          className="cursor-pointer hover:shadow-md transition-shadow"
          onClick={() => onSelectProduct(product)}
        >
          <CardHeader>
            <div className="flex justify-between items-start">
              <CardTitle className="text-lg line-clamp-1">{product.name}</CardTitle>
              <Badge className={getStatusColor(product.status)}>
                {product.status}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {product.description && (
              <p className="text-gray-600 text-sm line-clamp-2">{product.description}</p>
            )}
            
            <div className="flex justify-between items-center">
              <div className="text-sm text-gray-500">
                Team: {getTeamName(product.team_id)}
              </div>
              {product.category && (
                <Badge variant="outline" className="text-xs">
                  {product.category}
                </Badge>
              )}
            </div>

            <div className="flex justify-between items-center">
              <div className="text-sm text-gray-500">
                Stock: {product.stock}
              </div>
              <div className="text-lg font-semibold">
                {product.price ? formatCurrency(product.price) : 'No price set'}
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};
