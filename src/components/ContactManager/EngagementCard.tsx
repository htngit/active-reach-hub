
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Calendar, Target, ArrowRight } from 'lucide-react';
import { format } from 'date-fns';

interface Engagement {
  id: string;
  name: string;
  description?: string;
  status: string;
  potential_product?: string[];
  created_at: string;
  qualification_score?: number;
}

interface EngagementCardProps {
  engagement: Engagement;
  onQualify: (engagementId: string) => void;
  onViewDetails?: (engagementId: string) => void;
}

export const EngagementCard: React.FC<EngagementCardProps> = ({
  engagement,
  onQualify,
  onViewDetails,
}) => {
  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'new': return 'bg-blue-100 text-blue-800';
      case 'active': return 'bg-yellow-100 text-yellow-800';
      case 'qualified': return 'bg-purple-100 text-purple-800';
      case 'proposal': return 'bg-orange-100 text-orange-800';
      case 'won': return 'bg-green-100 text-green-800';
      case 'lost': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 75) return 'bg-green-100 text-green-800';
    if (score >= 50) return 'bg-yellow-100 text-yellow-800';
    return 'bg-red-100 text-red-800';
  };

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <CardTitle className="text-lg">{engagement.name}</CardTitle>
          <div className="flex items-center gap-2">
            <Badge className={getStatusColor(engagement.status)}>
              {engagement.status}
            </Badge>
            {engagement.qualification_score !== undefined && (
              <Badge className={getScoreColor(engagement.qualification_score)}>
                BANT: {engagement.qualification_score}%
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {engagement.description && (
          <p className="text-sm text-gray-600">{engagement.description}</p>
        )}
        
        {engagement.potential_product && engagement.potential_product.length > 0 && (
          <div>
            <p className="text-xs font-medium text-gray-500 mb-1">Potential Products:</p>
            <div className="flex flex-wrap gap-1">
              {engagement.potential_product.slice(0, 3).map((product) => (
                <Badge key={product} variant="outline" className="text-xs">
                  {product}
                </Badge>
              ))}
              {engagement.potential_product.length > 3 && (
                <Badge variant="outline" className="text-xs">
                  +{engagement.potential_product.length - 3}
                </Badge>
              )}
            </div>
          </div>
        )}

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1 text-xs text-gray-500">
            <Calendar className="h-3 w-3" />
            {format(new Date(engagement.created_at), 'MMM dd, yyyy')}
          </div>
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => onQualify(engagement.id)}
            >
              <Target className="h-3 w-3 mr-1" />
              BANT Qualify
            </Button>
            {onViewDetails && (
              <Button
                size="sm"
                variant="ghost"
                onClick={() => onViewDetails(engagement.id)}
              >
                <ArrowRight className="h-3 w-3" />
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
