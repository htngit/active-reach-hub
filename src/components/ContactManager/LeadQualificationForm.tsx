
import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Target, Save, CheckCircle, AlertCircle } from 'lucide-react';
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

interface LeadQualificationFormProps {
  contactId: string;
  contactName: string;
  currentStatus: string;
  onQualificationUpdate: () => void;
}

export const LeadQualificationForm: React.FC<LeadQualificationFormProps> = ({
  contactId,
  contactName,
  currentStatus,
  onQualificationUpdate,
}) => {
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

  const saveQualificationCriteria = async () => {
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

  const currentScore = calculateScore();
  const isQualified = currentScore >= 75;

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center">Loading qualification criteria...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Target className="h-5 w-5" />
          Lead Qualification - {contactName}
        </CardTitle>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600">Qualification Score:</span>
            <Badge variant={isQualified ? "default" : "secondary"}>
              {currentScore}/100
            </Badge>
          </div>
          {isQualified && (
            <div className="flex items-center gap-1 text-green-600">
              <CheckCircle className="h-4 w-4" />
              <span className="text-sm font-medium">Qualified Lead</span>
            </div>
          )}
        </div>
        <Progress value={currentScore} className="w-full" />
      </CardHeader>
      <CardContent className="space-y-6">
        {/* BANT Criteria */}
        <div className="space-y-4">
          <h4 className="font-medium text-gray-900">BANT Qualification Criteria</h4>
          
          <div className="space-y-3">
            <div className="flex items-center space-x-3">
              <Checkbox
                id="budget"
                checked={criteria.budget_confirmed}
                onCheckedChange={(checked) => 
                  handleCriteriaChange('budget_confirmed', checked as boolean)
                }
              />
              <label htmlFor="budget" className="text-sm font-medium">
                Budget Confirmed (25 points)
              </label>
              {criteria.budget_confirmed && <CheckCircle className="h-4 w-4 text-green-500" />}
            </div>

            <div className="flex items-center space-x-3">
              <Checkbox
                id="authority"
                checked={criteria.authority_confirmed}
                onCheckedChange={(checked) => 
                  handleCriteriaChange('authority_confirmed', checked as boolean)
                }
              />
              <label htmlFor="authority" className="text-sm font-medium">
                Authority Confirmed (25 points)
              </label>
              {criteria.authority_confirmed && <CheckCircle className="h-4 w-4 text-green-500" />}
            </div>

            <div className="flex items-center space-x-3">
              <Checkbox
                id="need"
                checked={criteria.need_identified}
                onCheckedChange={(checked) => 
                  handleCriteriaChange('need_identified', checked as boolean)
                }
              />
              <label htmlFor="need" className="text-sm font-medium">
                Need Identified (25 points)
              </label>
              {criteria.need_identified && <CheckCircle className="h-4 w-4 text-green-500" />}
            </div>

            <div className="flex items-center space-x-3">
              <Checkbox
                id="timeline"
                checked={criteria.timeline_defined}
                onCheckedChange={(checked) => 
                  handleCriteriaChange('timeline_defined', checked as boolean)
                }
              />
              <label htmlFor="timeline" className="text-sm font-medium">
                Timeline Defined (25 points)
              </label>
              {criteria.timeline_defined && <CheckCircle className="h-4 w-4 text-green-500" />}
            </div>
          </div>
        </div>

        {/* Qualification Notes */}
        <div className="space-y-2">
          <label htmlFor="notes" className="text-sm font-medium text-gray-700">
            Qualification Notes
          </label>
          <Textarea
            id="notes"
            placeholder="Add notes about the qualification process..."
            value={criteria.qualification_notes}
            onChange={(e) => handleCriteriaChange('qualification_notes', e.target.value)}
            rows={3}
          />
        </div>

        {/* Qualification Status */}
        {currentScore < 75 && (
          <div className="flex items-center gap-2 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
            <AlertCircle className="h-4 w-4 text-yellow-600" />
            <span className="text-sm text-yellow-800">
              Need {75 - currentScore} more points to automatically qualify this lead
            </span>
          </div>
        )}

        {isQualified && (
          <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-lg">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <span className="text-sm text-green-800">
              This lead meets qualification criteria and will be marked as Qualified
            </span>
          </div>
        )}

        {/* Save Button */}
        <Button 
          onClick={saveQualificationCriteria} 
          disabled={saving}
          className="w-full"
        >
          <Save className="h-4 w-4 mr-2" />
          {saving ? 'Saving...' : 'Save Qualification'}
        </Button>
      </CardContent>
    </Card>
  );
};
