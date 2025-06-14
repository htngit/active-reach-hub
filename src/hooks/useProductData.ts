import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Product } from '@/types/product';
import { useTeamData } from './useTeamData';
import { useToast } from './use-toast';

export const useProductData = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();
  const { teams, loading: teamsLoading, isTeamOwner } = useTeamData();
  const { toast } = useToast();

  const fetchProducts = useCallback(async () => {
    if (!user || teamsLoading) return;

    try {
      setLoading(true);
      setError(null);

      if (teams.length === 0) {
        setProducts([]);
        return;
      }

      const { data, error: fetchError } = await supabase
        .from('products')
        .select('*')
        .order('created_at', { ascending: false });

      if (fetchError) {
        throw fetchError;
      }

      setProducts(data || []);
    } catch (err: any) {
      console.error('Error fetching products:', err);
      setError(err.message || 'Failed to fetch products');
      toast({
        title: 'Error',
        description: 'Failed to load products. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [user, teams, teamsLoading, toast]);

  useEffect(() => {
    if (user && !teamsLoading) {
      fetchProducts();
    }
  }, [user, teamsLoading, fetchProducts]);

  const addProduct = async (product: Omit<Product, 'id' | 'created_at' | 'updated_at' | 'created_by'>) => {
    if (!user) return null;

    try {
      const isOwner = isTeamOwner(product.team_id);
      if (!isOwner) {
        throw new Error('Only team owners can add products');
      }

      // Ensure stock is present (default to 0 if missing), price can be null
      const stock = product.stock !== undefined && product.stock !== null ? product.stock : 0;

      const newProduct = {
        ...product,
        price: product.price || null,
        stock,
        created_by: user.id,
      };

      console.log('Inserting product:', newProduct);

      const { data, error: insertError } = await supabase
        .from('products')
        .insert([newProduct])
        .select()
        .single();

      if (insertError) {
        throw insertError;
      }

      setProducts(prevProducts => [data, ...prevProducts]);
      toast({
        title: 'Success',
        description: 'Product added successfully',
      });

      return data;
    } catch (err: any) {
      console.error('Error adding product:', err);
      toast({
        title: 'Error',
        description: err.message || 'Failed to add product',
        variant: 'destructive',
      });
      return null;
    }
  };

  const updateProduct = async (id: string, updates: Partial<Omit<Product, 'id' | 'created_at' | 'updated_at' | 'created_by' | 'team_id'>>) => {
    if (!user) return false;

    try {
      const { error: updateError } = await supabase
        .from('products')
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id);

      if (updateError) {
        throw updateError;
      }

      // Update local state
      setProducts(prevProducts =>
        prevProducts.map(product =>
          product.id === id ? { ...product, ...updates, updated_at: new Date().toISOString() } : product
        )
      );

      toast({
        title: 'Success',
        description: 'Product updated successfully',
      });

      return true;
    } catch (err: any) {
      console.error('Error updating product:', err);
      toast({
        title: 'Error',
        description: err.message || 'Failed to update product',
        variant: 'destructive',
      });
      return false;
    }
  };

  const deleteProduct = async (id: string) => {
    if (!user) return false;

    try {
      const { error: deleteError } = await supabase
        .from('products')
        .delete()
        .eq('id', id);

      if (deleteError) {
        throw deleteError;
      }

      // Update local state
      setProducts(prevProducts => prevProducts.filter(product => product.id !== id));

      toast({
        title: 'Success',
        description: 'Product deleted successfully',
      });

      return true;
    } catch (err: any) {
      console.error('Error deleting product:', err);
      toast({
        title: 'Error',
        description: err.message || 'Failed to delete product',
        variant: 'destructive',
      });
      return false;
    }
  };

  return {
    products,
    loading,
    error,
    fetchProducts,
    addProduct,
    updateProduct,
    deleteProduct,
    isTeamOwner,
  };
};
