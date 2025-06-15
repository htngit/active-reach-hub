
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Deal } from '@/types/deal';
import { DollarSign, Calendar, User } from 'lucide-react';

interface DealCardProps {
  deal: Deal;
  onDragStart: (e: React.DragEvent, deal: Deal) => void;
}

export const DealCard = ({ deal, onDragStart }: DealCardProps) => {
  const getProbabilityColor = (probability: number) => {
    if (probability >= 75) return 'bg-green-500';
    if (probability >= 50) return 'bg-yellow-500';
    if (probability >= 25) return 'bg-orange-500';
    return 'bg-red-500';
  };

  return (
    <Card
      className="cursor-move hover:shadow-md transition-shadow bg-white"
      draggable
      onDragStart={(e) => onDragStart(e, deal)}
    >
      <CardContent className="p-3">
        <div className="space-y-2">
          <div className="flex items-start justify-between">
            <h4 className="text-sm font-medium line-clamp-2">{deal.title}</h4>
            <Badge
              variant="secondary"
              className={`text-xs text-white ${getProbabilityColor(deal.probability)}`}
            >
              {deal.probability}%
            </Badge>
          </div>
          
          {deal.description && (
            <p className="text-xs text-gray-600 line-clamp-2">{deal.description}</p>
          )}
          
          <div className="flex items-center gap-2 text-xs text-gray-500">
            <DollarSign className="h-3 w-3" />
            <span>${deal.value?.toLocaleString() || '0'}</span>
          </div>
          
          {deal.expected_close_date && (
            <div className="flex items-center gap-2 text-xs text-gray-500">
              <Calendar className="h-3 w-3" />
              <span>{new Date(deal.expected_close_date).toLocaleDateString()}</span>
            </div>
          )}
          
          {deal.assigned_to && (
            <div className="flex items-center gap-2 text-xs text-gray-500">
              <User className="h-3 w-3" />
              <span>Assigned</span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
