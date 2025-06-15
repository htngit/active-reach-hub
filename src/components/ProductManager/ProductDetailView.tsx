
import React from 'react';
import { Product } from '@/types/product';
import { Team } from '@/types/team';

interface ProductDetailViewProps {
  product: Product;
  teams: Team[];
}

export const ProductDetailView: React.FC<ProductDetailViewProps> = ({
  product,
  teams,
}) => {
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
  );
};
