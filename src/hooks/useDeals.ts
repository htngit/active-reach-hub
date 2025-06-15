
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Deal, DealActivity, PipelineAnalytics } from '@/types/deal';
import { toast } from 'sonner';

export const useDeals = () => {
  const [deals, setDeals] = useState<Deal[]>([]);
  const [analytics, setAnalytics] = useState<PipelineAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  const fetchDeals = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('deals')
        .select(`
          *,
          contacts(name, company, email)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setDeals(data || []);
    } catch (error) {
      console.error('Error fetching deals:', error);
      toast.error('Failed to fetch deals');
    } finally {
      setLoading(false);
    }
  };

  const fetchAnalytics = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase.rpc('get_pipeline_analytics');
      if (error) throw error;
      setAnalytics(data);
    } catch (error) {
      console.error('Error fetching analytics:', error);
      toast.error('Failed to fetch pipeline analytics');
    }
  };

  const createDeal = async (dealData: Partial<Deal>) => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('deals')
        .insert({
          ...dealData,
          created_by: user.id,
        })
        .select()
        .single();

      if (error) throw error;
      
      setDeals(prev => [data, ...prev]);
      toast.success('Deal created successfully');
      return data;
    } catch (error) {
      console.error('Error creating deal:', error);
      toast.error('Failed to create deal');
      throw error;
    }
  };

  const updateDeal = async (id: string, updates: Partial<Deal>) => {
    try {
      const { data, error } = await supabase
        .from('deals')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      setDeals(prev => prev.map(deal => 
        deal.id === id ? { ...deal, ...data } : deal
      ));
      
      return data;
    } catch (error) {
      console.error('Error updating deal:', error);
      toast.error('Failed to update deal');
      throw error;
    }
  };

  const updateDealStage = async (id: string, stage: Deal['stage']) => {
    try {
      await updateDeal(id, { stage });
      toast.success(`Deal moved to ${stage}`);
    } catch (error) {
      toast.error('Failed to move deal');
    }
  };

  const deleteDeal = async (id: string) => {
    try {
      const { error } = await supabase
        .from('deals')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setDeals(prev => prev.filter(deal => deal.id !== id));
      toast.success('Deal deleted successfully');
    } catch (error) {
      console.error('Error deleting deal:', error);
      toast.error('Failed to delete deal');
    }
  };

  useEffect(() => {
    fetchDeals();
    fetchAnalytics();
  }, [user]);

  return {
    deals,
    analytics,
    loading,
    createDeal,
    updateDeal,
    updateDealStage,
    deleteDeal,
    refetch: () => {
      fetchDeals();
      fetchAnalytics();
    }
  };
};
