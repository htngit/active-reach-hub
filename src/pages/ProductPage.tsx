import React from 'react';
import { ProductManager } from '@/components/ProductManager/ProductManager';
import { useAuth } from '@/contexts/AuthContext';
import { useTeamData } from '@/hooks/useTeamData';

const ProductPage: React.FC = () => {
  const { user, loading: authLoading } = useAuth();
  const { teams, loading: teamsLoading } = useTeamData();
  
  // Show loading state while auth or teams are loading
  if (authLoading || teamsLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  // If user is not authenticated, redirect to login
  if (!user) {
    window.location.href = '/login';
    return null;
  }

  return (
    <div className="container mx-auto py-6">
      <ProductManager />
    </div>
  );
};

export default ProductPage;