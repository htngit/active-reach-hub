
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from './use-toast';

interface SystemSettings {
  id: string;
  user_id: string;
  currency: string;
  created_at: string;
  updated_at: string;
}

export const useSystemSettings = () => {
  const [settings, setSettings] = useState<SystemSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { toast } = useToast();

  const fetchSettings = useCallback(async () => {
    if (!user) return;

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('system_settings')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      if (data) {
        setSettings(data);
      } else {
        // Create default settings if none exist
        const { data: newSettings, error: createError } = await supabase
          .from('system_settings')
          .insert({
            user_id: user.id,
            currency: 'USD'
          })
          .select()
          .single();

        if (createError) throw createError;
        setSettings(newSettings);
      }
    } catch (err: any) {
      console.error('Error fetching system settings:', err);
      toast({
        title: 'Error',
        description: 'Failed to load system settings',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [user, toast]);

  const updateCurrency = async (currency: string) => {
    if (!user || !settings) return false;

    try {
      const { error } = await supabase
        .from('system_settings')
        .update({ 
          currency,
          updated_at: new Date().toISOString()
        })
        .eq('id', settings.id);

      if (error) throw error;

      setSettings(prev => prev ? { ...prev, currency } : null);
      
      toast({
        title: 'Success',
        description: 'Currency updated successfully',
      });

      return true;
    } catch (err: any) {
      console.error('Error updating currency:', err);
      toast({
        title: 'Error',
        description: 'Failed to update currency',
        variant: 'destructive',
      });
      return false;
    }
  };

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  return {
    settings,
    loading,
    updateCurrency,
    refetch: fetchSettings,
  };
};
