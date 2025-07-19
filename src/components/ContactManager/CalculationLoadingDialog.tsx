import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Progress } from '@/components/ui/progress';
import { Loader2, Calculator } from 'lucide-react';

/**
 * Props for CalculationLoadingDialog component
 */
interface CalculationLoadingDialogProps {
  /** Whether the dialog is open */
  isOpen: boolean;
  /** Current calculation progress (0-100) */
  progress?: number;
  /** Current step description */
  currentStep?: string;
  /** Total number of contacts being processed */
  totalContacts?: number;
  /** Number of contacts processed so far */
  processedContacts?: number;
}

/**
 * Loading dialog component for follow-up calculations
 * Blocks user interaction during intensive calculations
 * Uses existing shadcn UI components for consistency
 */
export const CalculationLoadingDialog: React.FC<CalculationLoadingDialogProps> = ({
  isOpen,
  progress = 0,
  currentStep = 'Calculating follow-ups...',
  totalContacts = 0,
  processedContacts = 0,
}) => {
  return (
    <Dialog open={isOpen} onOpenChange={() => {}}>
      <DialogContent 
        className="sm:max-w-md"
        // Prevent closing during calculation
        onPointerDownOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calculator className="h-5 w-5 text-blue-600" />
            Processing Follow-ups
          </DialogTitle>
          <DialogDescription>
            Please wait while we calculate your follow-up contacts.
            This may take a few moments.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          {/* Progress bar */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>Progress</span>
              <span>{Math.round(progress)}%</span>
            </div>
            <Progress value={progress} className="w-full" />
          </div>
          
          {/* Current step */}
          <div className="flex items-center gap-2 text-sm">
            <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
            <span>{currentStep}</span>
          </div>
          
          {/* Contact processing info */}
          {totalContacts > 0 && (
            <div className="text-sm text-muted-foreground">
              Processing {processedContacts} of {totalContacts} contacts
            </div>
          )}
          
          {/* Helpful message */}
          <div className="text-xs text-muted-foreground bg-muted p-3 rounded-md">
            💡 <strong>Tip:</strong> We're only calculating the contacts you'll see on this page 
            to keep things fast. Pagination will load additional contacts as needed.
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

/**
 * Hook for managing calculation loading state
 * Provides consistent loading dialog behavior across components
 */
export const useCalculationLoading = () => {
  const [isLoading, setIsLoading] = React.useState(false);
  const [progress, setProgress] = React.useState(0);
  const [currentStep, setCurrentStep] = React.useState('');
  const [totalContacts, setTotalContacts] = React.useState(0);
  const [processedContacts, setProcessedContacts] = React.useState(0);
  
  const startCalculation = React.useCallback((total: number, step: string = 'Starting calculation...') => {
    setIsLoading(true);
    setProgress(0);
    setCurrentStep(step);
    setTotalContacts(total);
    setProcessedContacts(0);
  }, []);
  
  const updateProgress = React.useCallback((processed: number, step?: string) => {
    setProcessedContacts(processed);
    if (step) setCurrentStep(step);
    
    // Calculate progress percentage
    const progressPercent = totalContacts > 0 ? (processed / totalContacts) * 100 : 0;
    setProgress(Math.min(progressPercent, 100));
  }, [totalContacts]);
  
  const finishCalculation = React.useCallback(() => {
    setProgress(100);
    setCurrentStep('Calculation complete!');
    
    // Small delay to show completion before closing
    setTimeout(() => {
      setIsLoading(false);
      setProgress(0);
      setCurrentStep('');
      setTotalContacts(0);
      setProcessedContacts(0);
    }, 500);
  }, []);
  
  return {
    isLoading,
    progress,
    currentStep,
    totalContacts,
    processedContacts,
    startCalculation,
    updateProgress,
    finishCalculation,
  };
};