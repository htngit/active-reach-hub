import React, { useState } from 'react';
import { ProductList } from './ProductList';
import { ProductDetail } from './ProductDetail';
import { AddProductForm } from './AddProductForm';
import { Product } from '@/types/product';
import { useTeamData } from '@/hooks/useTeamData';

enum ProductView {
  LIST = 'list',
  DETAIL = 'detail',
  ADD = 'add',
}

export const ProductManager: React.FC = () => {
  const [currentView, setCurrentView] = useState<ProductView>(ProductView.LIST);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const { teams, loading } = useTeamData();

  const handleSelectProduct = (product: Product) => {
    setSelectedProduct(product);
    setCurrentView(ProductView.DETAIL);
  };

  const handleAddProduct = () => {
    setCurrentView(ProductView.ADD);
  };

  const handleBackToList = () => {
    setCurrentView(ProductView.LIST);
    setSelectedProduct(null);
  };

  const handleProductAdded = () => {
    setCurrentView(ProductView.LIST);
  };

  const handleProductUpdated = () => {
    // Stay on the detail view but refresh data if needed
    // This could be handled by the useProductData hook's state management
  };

  // Show loading state while teams are loading
  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  // If user has no teams, show message to join or create a team
  if (teams.length === 0 && currentView === ProductView.LIST) {
    return (
      <div className="flex flex-col items-center justify-center h-64 space-y-4">
        <h2 className="text-xl font-semibold">Team Required</h2>
        <p className="text-center text-gray-500">
          You need to be part of a team to access the Product Manager.
          <br />
          Please join or create a team first.
        </p>
        <a 
          href="/team" 
          className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2"
        >
          Go to Teams
        </a>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6">
      {currentView === ProductView.LIST && (
        <ProductList
          onSelectProduct={handleSelectProduct}
          onAddProduct={handleAddProduct}
        />
      )}

      {currentView === ProductView.DETAIL && selectedProduct && (
        <ProductDetail
          product={selectedProduct}
          onBack={handleBackToList}
          onProductUpdated={handleProductUpdated}
        />
      )}

      {currentView === ProductView.ADD && (
        <AddProductForm
          onBack={handleBackToList}
          onProductAdded={handleProductAdded}
        />
      )}
    </div>
  );
};