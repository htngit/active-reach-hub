
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, Target } from 'lucide-react';
import { EngagementDialog } from './EngagementDialog';
import { EngagementCard } from './EngagementCard';
import { EngagementQualificationDialog } from './EngagementQualificationDialog';
import { useEngagements } from '@/hooks/useEngagements';

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
  const [showNewEngagementDialog, setShowNewEngagementDialog] = useState(false);
  const [selectedEngagementId, setSelectedEngagementId] = useState<string>('');
  const [showQualificationDialog, setShowQualificationDialog] = useState(false);
  
  const { engagements, loading, refetchEngagements } = useEngagements(contactId);

  const handleNewEngagement = () => {
    setShowNewEngagementDialog(true);
  };

  const handleEngagementCreated = () => {
    refetchEngagements();
    onQualificationUpdate();
  };

  const handleQualifyEngagement = (engagementId: string) => {
    setSelectedEngagementId(engagementId);
    setShowQualificationDialog(true);
  };

  const handleQualificationUpdate = () => {
    refetchEngagements();
    onQualificationUpdate();
  };

  const selectedEngagement = engagements.find(e => e.id === selectedEngagementId);

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5" />
              Engagement Management
            </CardTitle>
            <Button onClick={handleNewEngagement}>
              <Plus className="h-4 w-4 mr-2" />
              New Engagement
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">Loading engagements...</div>
          ) : engagements.length === 0 ? (
            <div className="text-center py-8 space-y-4">
              <div className="text-gray-500">
                No engagements yet. Create your first engagement to start the qualification process.
              </div>
              <Button onClick={handleNewEngagement} variant="outline">
                <Plus className="h-4 w-4 mr-2" />
                Create First Engagement
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="text-sm text-gray-600">
                Manage multiple sales opportunities with this contact. Each engagement can have its own BANT qualification.
              </div>
              <div className="grid gap-4">
                {engagements.map((engagement) => (
                  <EngagementCard
                    key={engagement.id}
                    engagement={engagement}
                    onQualify={handleQualifyEngagement}
                  />
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <EngagementDialog
        open={showNewEngagementDialog}
        onOpenChange={setShowNewEngagementDialog}
        contactId={contactId}
        contactName={contactName}
        onEngagementCreated={handleEngagementCreated}
      />

      {selectedEngagement && (
        <EngagementQualificationDialog
          open={showQualificationDialog}
          onOpenChange={setShowQualificationDialog}
          engagementId={selectedEngagement.id}
          engagementName={selectedEngagement.name}
          contactId={contactId}
          onQualificationUpdate={handleQualificationUpdate}
        />
      )}
    </>
  );
};
