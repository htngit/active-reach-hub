import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { QualificationCriteriaChecklist } from './QualificationCriteriaChecklist';
import { QualificationNotes } from './QualificationNotes';
import { ActivityStatusSelection } from './ActivityStatusSelection';
import { QualificationScoreDisplay } from './QualificationScoreDisplay';
import { ConversionInvoiceSelection } from './ConversionInvoiceSelection';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { Save } from 'lucide-react';

interface EngagementQualificationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  engagementId: string;
  engagementName: string;
  contactId: string;
  onQualificationUpdate: () => void;
}

interface QualificationCriteria {
  id?: string;
  engagement_id: string;
  contact_id: string;
  budget_confirmed: boolean;
  authority_confirmed: boolean;
  need_identified: boolean;
  timeline_defined: boolean;
  qualification_score: number;
  qualification_method: string;
  qualification_notes: string;
  contact_status?: string;
}

// Define status hierarchy: New < Qualified < Converted
const STATUS_HIERARCHY = {
  'New': 1,
  'Qualified': 2,
  'Converted': 3
};

const getStatusRank = (status: string): number => {
  return STATUS_HIERARCHY[status as keyof typeof STATUS_HIERARCHY] || 0;
};

export const EngagementQualificationDialog: React.FC<EngagementQualificationDialogProps> = ({
  open,
  onOpenChange,
  engagementId,
  engagementName,
  contactId,
  onQualificationUpdate,
}) => {
  const { user } = useAuth();
  const [criteria, setCriteria] = useState<QualificationCriteria>({
    engagement_id: engagementId,
    contact_id: contactId,
    budget_confirmed: false,
    authority_confirmed: false,
    need_identified: false,
    timeline_defined: false,
    qualification_score: 0,
    qualification_method: 'initial_contact',
    qualification_notes: '',
    contact_status: 'New',
  });
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showInvoiceSelection, setShowInvoiceSelection] = useState(false);

  useEffect(() => {
    if (open && engagementId) {
      fetchQualificationCriteria();
    }
  }, [open, engagementId]);

  const fetchQualificationCriteria = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('qualification_criteria')
        .select('*')
        .eq('engagement_id', engagementId)
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

  const handleSaveQualification = async () => {
    if (!user) {
      toast.error('You must be logged in to save qualification criteria');
      return;
    }

    if (!criteria.contact_status || !criteria.qualification_method) {
      toast.error('Please select contact status and current activity');
      return;
    }

    // Check if user is trying to mark as converted
    if (criteria.contact_status === 'Converted') {
      setShowInvoiceSelection(true);
      return;
    }

    await saveQualification();
  };

  const saveQualification = async (invoiceId?: string) => {
    setSaving(true);
    try {
      const score = calculateScore();
      const currentStatus = criteria.contact_status || 'New';
      
      // Implement proper status hierarchy logic
      let finalStatus = currentStatus;
      
      // Only auto-promote to Qualified if:
      // 1. Score is >= 75 AND
      // 2. Current status is lower than Qualified (i.e., "New")
      // 3. User hasn't explicitly selected a higher status like "Converted"
      if (score >= 75 && getStatusRank(currentStatus) < getStatusRank('Qualified')) {
        finalStatus = 'Qualified';
        console.log('Auto-promoting status from', currentStatus, 'to Qualified due to high BANT score');
      } else {
        // Keep the user-selected status (including "Converted")
        finalStatus = currentStatus;
        console.log('Keeping user-selected status:', finalStatus);
      }

      const qualificationData = {
        ...criteria,
        qualification_score: score,
        contact_status: finalStatus,
      };

      console.log('Saving qualification with final status:', finalStatus);

      if (criteria.id) {
        const { error } = await supabase
          .from('qualification_criteria')
          .update(qualificationData)
          .eq('id', criteria.id);

        if (error) throw error;
      } else {
        const { data, error } = await supabase
          .from('qualification_criteria')
          .insert([qualificationData])
          .select()
          .single();

        if (error) throw error;
        setCriteria(data);
      }

      // Update engagement status
      await supabase
        .from('engagements')
        .update({ status: finalStatus })
        .eq('id', engagementId);

      // If marking as converted and invoice selected, create conversion record
      if (finalStatus === 'Converted' && invoiceId) {
        await supabase
          .from('engagement_conversions')
          .insert([{
            engagement_id: engagementId,
            invoice_id: invoiceId,
            converted_by: user.id,
          }]);
        
        console.log('Created conversion record for engagement:', engagementId);
      }

      toast.success(`Engagement status updated to ${finalStatus}`);
      onQualificationUpdate();
      onOpenChange(false);
    } catch (error: any) {
      console.error('Error saving qualification:', error);
      toast.error(`Failed to save qualification: ${error.message}`);
    } finally {
      setSaving(false);
      setShowInvoiceSelection(false);
    }
  };

  const currentScore = calculateScore();
  const isQualified = currentScore >= 75;

  if (loading) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-2xl">
          <div className="p-6 text-center">Loading qualification criteria...</div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              <QualificationScoreDisplay 
                contactName={`${engagementName} Engagement`}
                currentScore={currentScore}
                isQualified={isQualified}
              />
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-6">
            <QualificationCriteriaChecklist 
              budgetConfirmed={criteria.budget_confirmed}
              authorityConfirmed={criteria.authority_confirmed}
              needIdentified={criteria.need_identified}
              timelineDefined={criteria.timeline_defined}
              onCriteriaChange={handleCriteriaChange}
            />

            <ActivityStatusSelection
              currentStatus={criteria.contact_status || 'New'}
              currentActivity={criteria.qualification_method || 'initial_contact'}
              onStatusChange={(status) => handleCriteriaChange('contact_status', status)}
              onActivityChange={(activity) => handleCriteriaChange('qualification_method', activity)}
            />

            <QualificationNotes 
              notes={criteria.qualification_notes}
              onNotesChange={(notes) => handleCriteriaChange('qualification_notes', notes)}
            />

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button onClick={handleSaveQualification} disabled={saving}>
                <Save className="h-4 w-4 mr-2" />
                {saving ? 'Saving...' : 'Save Qualification'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <ConversionInvoiceSelection
        open={showInvoiceSelection}
        onOpenChange={setShowInvoiceSelection}
        contactId={contactId}
        onInvoiceSelected={(invoiceId) => saveQualification(invoiceId)}
        onCancel={() => setShowInvoiceSelection(false)}
      />
    </>
  );
};
