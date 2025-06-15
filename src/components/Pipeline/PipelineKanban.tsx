
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useDeals } from '@/hooks/useDeals';
import { Deal } from '@/types/deal';
import { DollarSign, Calendar, User, Plus } from 'lucide-react';
import { CreateDealDialog } from './CreateDealDialog';
import { DealCard } from './DealCard';

const PIPELINE_STAGES = [
  { key: 'Lead', label: 'Lead', color: 'bg-gray-100' },
  { key: 'Qualified', label: 'Qualified', color: 'bg-blue-100' },
  { key: 'Proposal', label: 'Proposal', color: 'bg-yellow-100' },
  { key: 'Negotiation', label: 'Negotiation', color: 'bg-orange-100' },
  { key: 'Closed Won', label: 'Closed Won', color: 'bg-green-100' },
  { key: 'Closed Lost', label: 'Closed Lost', color: 'bg-red-100' },
];

export const PipelineKanban = () => {
  const { deals, updateDealStage, loading } = useDeals();
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [draggedDeal, setDraggedDeal] = useState<Deal | null>(null);

  const getDealsByStage = (stage: string) => {
    return deals.filter(deal => deal.stage === stage);
  };

  const handleDragStart = (e: React.DragEvent, deal: Deal) => {
    setDraggedDeal(deal);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = async (e: React.DragEvent, targetStage: string) => {
    e.preventDefault();
    
    if (draggedDeal && draggedDeal.stage !== targetStage) {
      await updateDealStage(draggedDeal.id, targetStage as Deal['stage']);
    }
    
    setDraggedDeal(null);
  };

  const calculateStageValue = (stage: string) => {
    return getDealsByStage(stage).reduce((sum, deal) => sum + (deal.value || 0), 0);
  };

  if (loading) {
    return <div className="p-8 text-center">Loading pipeline...</div>;
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold">Sales Pipeline</h2>
        <Button onClick={() => setCreateDialogOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          New Deal
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4 overflow-x-auto">
        {PIPELINE_STAGES.map((stage) => {
          const stageDeals = getDealsByStage(stage.key);
          const stageValue = calculateStageValue(stage.key);

          return (
            <Card
              key={stage.key}
              className={`min-h-[600px] ${stage.color}`}
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, stage.key)}
            >
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium flex items-center justify-between">
                  <span>{stage.label}</span>
                  <Badge variant="secondary" className="text-xs">
                    {stageDeals.length}
                  </Badge>
                </CardTitle>
                <div className="text-xs text-gray-600">
                  ${stageValue.toLocaleString()}
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {stageDeals.map((deal) => (
                  <DealCard
                    key={deal.id}
                    deal={deal}
                    onDragStart={handleDragStart}
                  />
                ))}
              </CardContent>
            </Card>
          );
        })}
      </div>

      <CreateDealDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
      />
    </div>
  );
};
