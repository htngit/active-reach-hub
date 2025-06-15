
import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ArrowLeft } from 'lucide-react';

interface NoOwnershipMessageProps {
  onBack: () => void;
}

export const NoOwnershipMessage: React.FC<NoOwnershipMessageProps> = ({ onBack }) => {
  return (
    <div className="space-y-4">
      <div className="flex items-center space-x-4">
        <Button variant="outline" onClick={onBack}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Products
        </Button>
      </div>

      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <h3 className="text-lg font-medium mb-2">You need to be a team owner to add products</h3>
            <p className="text-gray-500 mb-4">
              Only team owners can add new products. Please create a team or ask your team owner to add products.
            </p>
            <Button variant="outline" onClick={() => window.location.href = '/team'}>
              Go to Teams
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
