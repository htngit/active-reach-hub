
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Save } from 'lucide-react';
import { QualificationScoreDisplay } from './QualificationScoreDisplay';
import { QualificationCriteriaChecklist } from './QualificationCriteriaChecklist';
import { QualificationNotes } from './QualificationNotes';
import { QualificationStatusMessages } from './QualificationStatusMessages';
import { ActivityStatusSelection } from './ActivityStatusSelection';
import { useQualificationCriteria } from '@/hooks/useQualificationCriteria';

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
  const {
    criteria,
    loading,
    saving,
    handleCriteriaChange,
    calculateScore,
    saveQualificationCriteria,
  } = useQualificationCriteria(contactId);

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
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>
            <QualificationScoreDisplay 
              contactName={contactName}
              currentScore={currentScore}
              isQualified={isQualified}
            />
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <QualificationCriteriaChecklist 
            budgetConfirmed={criteria.budget_confirmed}
            authorityConfirmed={criteria.authority_confirmed}
            needIdentified={criteria.need_identified}
            timelineDefined={criteria.timeline_defined}
            onCriteriaChange={handleCriteriaChange}
          />

          <QualificationNotes 
            notes={criteria.qualification_notes}
            onNotesChange={(notes) => handleCriteriaChange('qualification_notes', notes)}
          />

          <QualificationStatusMessages 
            currentScore={currentScore}
            isQualified={isQualified}
          />

          <Button 
            onClick={() => saveQualificationCriteria(currentStatus, onQualificationUpdate)} 
            disabled={saving}
            className="w-full"
          >
            <Save className="h-4 w-4 mr-2" />
            {saving ? 'Saving...' : 'Save Qualification'}
          </Button>
        </CardContent>
      </Card>

      <ActivityStatusSelection
        currentStatus={currentStatus}
        currentActivity={criteria.qualification_method || 'initial_contact'}
        onStatusChange={(status) => handleCriteriaChange('contact_status', status)}
        onActivityChange={(activity) => handleCriteriaChange('qualification_method', activity)}
      />
    </div>
  );
};
