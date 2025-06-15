
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface QualificationCriteria {
  id: string;
  contact_id: string;
  budget_confirmed: boolean;
  authority_confirmed: boolean;
  need_identified: boolean;
  timeline_defined: boolean;
  qualification_score: number;
  qualification_method: string;
  qualification_notes: string;
  qualified_at?: string;
  qualified_by?: string;
  created_at: string;
  updated_at: string;
}

export const useQualificationData = (contactId?: string) => {
  const [qualificationData, setQualificationData] = useState<QualificationCriteria | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchQualificationData = useCallback(async (id: string) => {
    setLoading(true);
    setError(null);
    
    try {
      const { data, error: fetchError } = await supabase
        .from('qualification_criteria')
        .select('*')
        .eq('contact_id', id)
        .single();

      if (fetchError && fetchError.code !== 'PGRST116') {
        throw fetchError;
      }

      setQualificationData(data || null);
    } catch (err: any) {
      console.error('Error fetching qualification data:', err);
      setError(err.message || 'Failed to fetch qualification data');
    } finally {
      setLoading(false);
    }
  }, []);

  const updateQualificationData = useCallback(async (
    id: string,
    updates: Partial<QualificationCriteria>
  ) => {
    try {
      const { data, error: updateError } = await supabase
        .from('qualification_criteria')
        .update(updates)
        .eq('contact_id', id)
        .select()
        .single();

      if (updateError) throw updateError;

      setQualificationData(data);
      return data;
    } catch (err: any) {
      console.error('Error updating qualification data:', err);
      setError(err.message || 'Failed to update qualification data');
      throw err;
    }
  }, []);

  const createQualificationData = useCallback(async (
    data: Omit<QualificationCriteria, 'id' | 'created_at' | 'updated_at'>
  ) => {
    try {
      const { data: newData, error: createError } = await supabase
        .from('qualification_criteria')
        .insert([data])
        .select()
        .single();

      if (createError) throw createError;

      setQualificationData(newData);
      return newData;
    } catch (err: any) {
      console.error('Error creating qualification data:', err);
      setError(err.message || 'Failed to create qualification data');
      throw err;
    }
  }, []);

  useEffect(() => {
    if (contactId) {
      fetchQualificationData(contactId);
    }
  }, [contactId, fetchQualificationData]);

  return {
    qualificationData,
    loading,
    error,
    fetchQualificationData,
    updateQualificationData,
    createQualificationData,
    refetch: () => contactId && fetchQualificationData(contactId),
  };
};
