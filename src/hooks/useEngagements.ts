
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface Engagement {
  id: string;
  contact_id: string;
  name: string;
  description?: string;
  status: string;
  potential_product?: string[];
  created_by: string;
  created_at: string;
  updated_at: string;
  qualification_score?: number;
}

export const useEngagements = (contactId?: string) => {
  const [engagements, setEngagements] = useState<Engagement[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchEngagements = useCallback(async (id?: string) => {
    if (!id && !contactId) return;
    
    setLoading(true);
    setError(null);

    try {
      let query = supabase
        .from('engagements')
        .select(`
          *,
          qualification_criteria (
            qualification_score
          )
        `)
        .order('created_at', { ascending: false });

      if (id || contactId) {
        query = query.eq('contact_id', id || contactId);
      }

      const { data, error: fetchError } = await query;

      if (fetchError) throw fetchError;

      // Flatten the qualification score
      const engagementsWithScore = (data || []).map(engagement => ({
        ...engagement,
        qualification_score: engagement.qualification_criteria?.[0]?.qualification_score || 0
      }));

      setEngagements(engagementsWithScore);
    } catch (err: any) {
      console.error('Error fetching engagements:', err);
      setError(err.message || 'Failed to fetch engagements');
      toast.error('Failed to load engagements');
    } finally {
      setLoading(false);
    }
  }, [contactId]);

  const refetchEngagements = useCallback(() => {
    if (contactId) {
      fetchEngagements(contactId);
    }
  }, [contactId, fetchEngagements]);

  useEffect(() => {
    if (contactId) {
      fetchEngagements(contactId);
    }
  }, [contactId, fetchEngagements]);

  return {
    engagements,
    loading,
    error,
    refetchEngagements,
    fetchEngagements,
  };
};
