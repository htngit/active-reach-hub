
import React, { useState } from 'react';
import { useProductData } from '@/hooks/useProductData';
import { useTeamData } from '@/hooks/useTeamData';
import { Product } from '@/types/product';
import { ProductListHeader } from './ProductListHeader';
import { ProductFilters } from './ProductFilters';
import { ProductStats } from './ProductStats';
import { ProductGrid } from './ProductGrid';
import { ProductListSkeleton } from './ProductListSkeleton';

interface ProductListProps {
  onSelectProduct: (product: Product) => void;
  onAddProduct: () => void;
  canAddProducts: boolean;
}

export const ProductList: React.FC<ProductListProps> = ({
  onSelectProduct,
  onAddProduct,
  canAddProducts,
}) => {
  const { products, loading } = useProductData();
  const { teams } = useTeamData();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [teamFilter, setTeamFilter] = useState<string>('all');

  // Filter products based on search term, status, and team
  const filteredProducts = products.filter((product) => {
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         product.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         product.category?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || product.status === statusFilter;
    const matchesTeam = teamFilter === 'all' || product.team_id === teamFilter;
    
    return matchesSearch && matchesStatus && matchesTeam;
  });

  if (loading) {
    return <ProductListSkeleton />;
  }

  return (
    <div className="space-y-6">
      <ProductListHeader
        onAddProduct={onAddProduct}
        canAddProducts={canAddProducts}
      />

      <ProductFilters
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        statusFilter={statusFilter}
        setStatusFilter={setStatusFilter}
        teamFilter={teamFilter}
        setTeamFilter={setTeamFilter}
        teams={teams}
      />

      <ProductStats products={products} />

      <ProductGrid
        filteredProducts={filteredProducts}
        products={products}
        onSelectProduct={onSelectProduct}
        onAddProduct={onAddProduct}
        canAddProducts={canAddProducts}
        teams={teams}
      />
    </div>
  );
};
