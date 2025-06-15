
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

interface QualificationCriteria {
  id?: string;
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
}

export const useQualificationCriteria = (contactId: string) => {
  const { user } = useAuth();
  const [criteria, setCriteria] = useState<QualificationCriteria>({
    contact_id: contactId,
    budget_confirmed: false,
    authority_confirmed: false,
    need_identified: false,
    timeline_defined: false,
    qualification_score: 0,
    qualification_method: 'manual',
    qualification_notes: '',
  });
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchQualificationCriteria();
  }, [contactId]);

  const fetchQualificationCriteria = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('qualification_criteria')
        .select('*')
        .eq('contact_id', contactId)
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      if (data) {
        setCriteria(data);
      }
    } catch (error: any) {
      console.error('Error fetching qualification criteria:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCriteriaChange = (field: keyof QualificationCriteria, value: boolean | string) => {
    setCriteria(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  const calculateScore = () => {
    let score = 0;
    if (criteria.budget_confirmed) score += 25;
    if (criteria.authority_confirmed) score += 25;
    if (criteria.need_identified) score += 25;
    if (criteria.timeline_defined) score += 25;
    return score;
  };

  const saveQualificationCriteria = async (currentStatus: string, onQualificationUpdate: () => void) => {
    if (!user) return;

    setSaving(true);
    try {
      const score = calculateScore();
      const qualificationData = {
        ...criteria,
        qualification_score: score,
        qualification_method: 'manual',
      };

      if (criteria.id) {
        // Update existing
        const { error } = await supabase
          .from('qualification_criteria')
          .update(qualificationData)
          .eq('id', criteria.id);

        if (error) throw error;
      } else {
        // Create new
        const { data, error } = await supabase
          .from('qualification_criteria')
          .insert([qualificationData])
          .select()
          .single();

        if (error) throw error;
        setCriteria(data);
      }

      // Update contact status if score is high enough
      if (score >= 75 && currentStatus !== 'Qualified') {
        const { error: contactError } = await supabase
          .from('contacts')
          .update({ status: 'Qualified' })
          .eq('id', contactId);

        if (contactError) throw contactError;
      }

      toast.success('Qualification criteria saved successfully');
      onQualificationUpdate();
    } catch (error: any) {
      console.error('Error saving qualification criteria:', error);
      toast.error('Failed to save qualification criteria');
    } finally {
      setSaving(false);
    }
  };

  return {
    criteria,
    loading,
    saving,
    handleCriteriaChange,
    calculateScore,
    saveQualificationCriteria,
  };
};
