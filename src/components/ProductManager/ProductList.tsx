import React, { useState } from 'react';
import { useProductData } from '@/hooks/useProductData';
import { useTeamData } from '@/hooks/useTeamData';
import { useCurrency } from '@/hooks/useCurrency';
import { Product } from '@/types/product';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Plus, Search, Package, DollarSign, Archive } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

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
  const { formatCurrency } = useCurrency();
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

  if (loading) {
    return (
      <div className="space-y-4">
        {/* Header Skeleton */}
        <div className="flex items-center justify-between">
          <Skeleton className="h-8 w-[150px]" />
          <Skeleton className="h-10 w-[120px]" />
        </div>

        {/* Filters Skeleton */}
        <div className="flex flex-col space-y-4 md:flex-row md:space-y-0 md:space-x-4">
          <Skeleton className="h-10 flex-1" />
          <Skeleton className="h-10 w-[180px]" />
          <Skeleton className="h-10 w-[180px]" />
        </div>

        {/* Product Grid Skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(9)].map((_, i) => (
            <div key={i} className="border rounded-lg p-4 space-y-3">
              <div className="flex justify-between items-start">
                <Skeleton className="h-5 w-[150px]" />
                <Skeleton className="h-6 w-[60px]" />
              </div>
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-[80%]" />
              <div className="flex justify-between items-center">
                <Skeleton className="h-4 w-[60px]" />
                <Skeleton className="h-6 w-[80px]" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Product Manager</h1>
          <p className="text-gray-600">Manage your products and inventory</p>
        </div>
        {canAddProducts && (
          <Button onClick={onAddProduct}>
            <Plus className="h-4 w-4 mr-2" />
            Add Product
          </Button>
        )}
      </div>

      {/* Show message if user cannot add products */}
      {!canAddProducts && (
        <Card className="bg-amber-50 border-amber-200">
          <CardContent className="pt-6">
            <div className="flex items-center space-x-2 text-amber-800">
              <Package className="h-5 w-5" />
              <p className="text-sm">
                Only team owners can add new products. You can view and manage existing products.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Filters */}
      <div className="flex flex-col space-y-4 md:flex-row md:space-y-0 md:space-x-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="Search products..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="Published">Published</SelectItem>
            <SelectItem value="Draft">Draft</SelectItem>
            <SelectItem value="Inactive">Inactive</SelectItem>
            <SelectItem value="Out of Stock">Out of Stock</SelectItem>
          </SelectContent>
        </Select>

        <Select value={teamFilter} onValueChange={setTeamFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filter by team" />
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
      </div>

      {/* Product Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Products</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{products.length}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Published</CardTitle>
            <Package className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {products.filter(p => p.status === 'Published').length}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Draft</CardTitle>
            <Archive className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {products.filter(p => p.status === 'Draft').length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Out of Stock</CardTitle>
            <Archive className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {products.filter(p => p.status === 'Out of Stock').length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Products Grid */}
      {filteredProducts.length === 0 ? (
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
      ) : (
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
      )}
    </div>
  );
};
