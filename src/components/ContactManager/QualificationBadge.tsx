
import React from 'react';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, Clock, AlertCircle } from 'lucide-react';

interface QualificationBadgeProps {
  status: string;
  score?: number;
}

export const QualificationBadge: React.FC<QualificationBadgeProps> = ({ status, score }) => {
  const getStatusDisplay = () => {
    switch (status.toLowerCase()) {
      case 'qualified':
        return {
          icon: <CheckCircle className="h-3 w-3" />,
          text: 'Qualified',
          variant: 'default' as const,
          className: 'bg-green-100 text-green-800 border-green-200'
        };
      case 'new':
        return {
          icon: <Clock className="h-3 w-3" />,
          text: 'New Lead',
          variant: 'secondary' as const,
          className: 'bg-blue-100 text-blue-800 border-blue-200'
        };
      case 'contacted':
        return {
          icon: <Clock className="h-3 w-3" />,
          text: 'Contacted',
          variant: 'secondary' as const,
          className: 'bg-yellow-100 text-yellow-800 border-yellow-200'
        };
      case 'converted':
        return {
          icon: <CheckCircle className="h-3 w-3" />,
          text: 'Converted',
          variant: 'default' as const,
          className: 'bg-green-100 text-green-800 border-green-200'
        };
      case 'lost':
        return {
          icon: <AlertCircle className="h-3 w-3" />,
          text: 'Lost',
          variant: 'destructive' as const,
          className: 'bg-red-100 text-red-800 border-red-200'
        };
      default:
        return {
          icon: <Clock className="h-3 w-3" />,
          text: status,
          variant: 'secondary' as const,
          className: 'bg-gray-100 text-gray-800 border-gray-200'
        };
    }
  };

  const { icon, text, className } = getStatusDisplay();

  return (
    <Badge className={`flex items-center gap-1 ${className}`}>
      {icon}
      {text}
      {score !== undefined && score > 0 && (
        <span className="ml-1 text-xs">({score}/100)</span>
      )}
    </Badge>
  );
};
