import React from 'react';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';

interface ForgotPasswordProps {
  onBack: () => void;
}

export const ForgotPassword: React.FC<ForgotPasswordProps> = ({ onBack }) => {
  return (
    <div className="space-y-4">
      <Button 
        variant="ghost" 
        className="mb-4 p-0 h-auto" 
        onClick={onBack}
      >
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back to Login
      </Button>
      <div className="text-center">
        <h2 className="text-2xl font-bold">Reset Password</h2>
        <p className="text-muted-foreground">This feature is temporarily disabled</p>
      </div>
    </div>
  );
};