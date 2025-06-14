
import React, { useState, useEffect } from 'react';
import { useProductData } from '@/hooks/useProductData';
import { useTeamData } from '@/hooks/useTeamData';
import { useAuth } from '@/contexts/AuthContext';
import { Product } from '@/types/product';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Search, Plus, Filter } from 'lucide-react';

interface ProductListProps {
  onSelectProduct: (product: Product) => void;
  onAddProduct: () => void;
}

export const ProductList: React.FC<ProductListProps> = ({
  onSelectProduct,
  onAddProduct,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTeam, setSelectedTeam] = useState<string>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const { user } = useAuth();
  const { products, loading, error } = useProductData();
  const { teams, loading: teamsLoading } = useTeamData();

  // Get unique categories from products
  const categories = [...new Set(products.map(product => product.category).filter(Boolean))];

  // Filter products based on search term, selected team, and category
  useEffect(() => {
    let filtered = [...products];

    // Filter by search term
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(product =>
        product.name.toLowerCase().includes(term) ||
        (product.description && product.description.toLowerCase().includes(term)) ||
        (product.category && product.category.toLowerCase().includes(term))
      );
    }

    // Filter by team
    if (selectedTeam !== 'all') {
      filtered = filtered.filter(product => product.team_id === selectedTeam);
    }

    // Filter by category
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(product => product.category === selectedCategory);
    }

    setFilteredProducts(filtered);
  }, [products, searchTerm, selectedTeam, selectedCategory]);

  // Get team name by ID
  const getTeamName = (teamId: string) => {
    const team = teams.find(t => t.id === teamId);
    return team ? team.name : 'Unknown Team';
  };

  // Format price - handle null/undefined properly
  const formatPrice = (price?: number | null) => {
    if (price === undefined || price === null) return '-';
    return `$${price.toFixed(2)}`;
  };

  // Get status badge variant
  const getStatusBadge = (status: string) => {
    switch (status.toLowerCase()) {
      case 'published':
        return <Badge className="bg-green-500">Published</Badge>;
      case 'draft':
        return <Badge variant="outline">Draft</Badge>;
      case 'inactive':
        return <Badge variant="secondary">Inactive</Badge>;
      case 'out of stock':
        return <Badge variant="destructive">Out of Stock</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  if (loading || teamsLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-red-500">Error loading products: {error}</p>
      </div>
    );
  }

  if (teams.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 space-y-4">
        <p className="text-center text-gray-500">You need to be part of a team to access products.</p>
        <Button variant="outline" onClick={() => window.location.href = '/team'}>
          Go to Teams
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Products</h2>
        <div className="flex items-center space-x-2">
          <Button onClick={onAddProduct} disabled={!teams.some(team => team.owner_id === user?.id)}>
            <Plus className="h-4 w-4 mr-2" />
            Add Product
          </Button>
        </div>
      </div>

      <div className="flex flex-col space-y-4 md:flex-row md:space-y-0 md:space-x-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
          <Input
            placeholder="Search products..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>

        <Select value={selectedTeam} onValueChange={setSelectedTeam}>
          <SelectTrigger className="w-full md:w-[180px]">
            <SelectValue placeholder="Filter by Team" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Teams</SelectItem>
            {teams.map((team) => (
              <SelectItem key={team.id} value={team.id}>
                {team.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={selectedCategory} onValueChange={setSelectedCategory}>
          <SelectTrigger className="w-full md:w-[180px]">
            <SelectValue placeholder="Filter by Category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            {categories.map((category) => (
              <SelectItem key={category} value={category}>
                {category}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {filteredProducts.length === 0 ? (
        <div className="flex items-center justify-center h-64">
          <p className="text-gray-500">No products found</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredProducts.map((product) => (
            <Card 
              key={product.id} 
              className="cursor-pointer hover:shadow-md transition-shadow"
              onClick={() => onSelectProduct(product)}
            >
              <CardContent className="p-4">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-medium truncate">{product.name}</h3>
                  {getStatusBadge(product.status)}
                </div>
                <p className="text-sm text-gray-500 mb-2 line-clamp-2">
                  {product.description || 'No description'}
                </p>
                <div className="flex justify-between items-center text-sm">
                  <span>{formatPrice(product.price)}</span>
                  <Badge variant="outline">{getTeamName(product.team_id)}</Badge>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};
