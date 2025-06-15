
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
  contact_status?: string; // Add this for managing contact status
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
      console.log('Fetching qualification criteria for contact:', contactId);
      console.log('Current user:', user?.id);

      // First, let's check the contact details
      const { data: contactData, error: contactError } = await supabase
        .from('contacts')
        .select('*')
        .eq('id', contactId)
        .single();

      console.log('Contact data:', contactData);
      if (contactError) {
        console.error('Error fetching contact:', contactError);
      }

      const { data, error } = await supabase
        .from('qualification_criteria')
        .select('*')
        .eq('contact_id', contactId)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching qualification criteria:', error);
        throw error;
      }

      if (data) {
        console.log('Found existing qualification criteria:', data);
        setCriteria(data);
      } else {
        console.log('No existing qualification criteria found');
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
    if (!user) {
      toast.error('You must be logged in to save qualification criteria');
      return;
    }

    setSaving(true);
    try {
      const score = calculateScore();
      const qualificationData = {
        ...criteria,
        qualification_score: score,
        qualification_method: 'manual',
      };

      console.log('Attempting to save qualification data:', qualificationData);
      console.log('Current user ID:', user.id);

      // First, let's verify the contact exists and get its details
      const { data: contactCheck, error: contactCheckError } = await supabase
        .from('contacts')
        .select('id, owner_id, user_id, team_id, status')
        .eq('id', contactId)
        .single();

      if (contactCheckError) {
        console.error('Error checking contact:', contactCheckError);
        throw new Error('Contact not found or inaccessible');
      }

      console.log('Contact check result:', contactCheck);
      console.log('Current contact status:', contactCheck.status);
      console.log('Calculated score:', score);

      if (criteria.id) {
        // Update existing
        console.log('Updating existing qualification criteria with ID:', criteria.id);
        const { error } = await supabase
          .from('qualification_criteria')
          .update(qualificationData)
          .eq('id', criteria.id);

        if (error) {
          console.error('Update error:', error);
          throw error;
        }
      } else {
        // Create new
        console.log('Creating new qualification criteria');
        const { data, error } = await supabase
          .from('qualification_criteria')
          .insert([qualificationData])
          .select()
          .single();

        if (error) {
          console.error('Insert error:', error);
          throw error;
        }
        console.log('Successfully created qualification criteria:', data);
        setCriteria(data);
      }

      // IMPORTANT: Always update contact status if score is high enough
      if (score >= 75) {
        console.log('Score is 75+, updating contact status to Qualified');
        const { error: contactError } = await supabase
          .from('contacts')
          .update({ status: 'Qualified' })
          .eq('id', contactId);

        if (contactError) {
          console.error('Error updating contact status:', contactError);
          toast.error('Qualification saved but failed to update contact status');
        } else {
          console.log('Successfully updated contact status to Qualified');
        }
      } else if (score < 75 && contactCheck.status === 'Qualified') {
        // If score drops below 75, revert to previous status
        console.log('Score below 75, reverting contact status');
        const { error: contactError } = await supabase
          .from('contacts')
          .update({ status: 'New' })
          .eq('id', contactId);

        if (contactError) {
          console.error('Error reverting contact status:', contactError);
        }
      }

      toast.success('Qualification criteria saved successfully');
      onQualificationUpdate();
    } catch (error: any) {
      console.error('Error saving qualification criteria:', error);
      toast.error(`Failed to save qualification criteria: ${error.message}`);
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
