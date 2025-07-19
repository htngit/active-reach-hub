
import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { AlertTriangle, Mail, X } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

export const EmailVerificationBanner = () => {
  const { user } = useAuth();
  const [isResending, setIsResending] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);

  // Don't show if user is not logged in, email is verified, or banner is dismissed
  if (!user || isDismissed) {
    return null;
  }

  const handleResendVerification = async () => {
    if (!user?.email) return;
    
    setIsResending(true);
    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: user.email,
      });

      if (error) throw error;

      toast({
        title: "Email Sent",
        description: "Verification email has been resent. Please check your inbox.",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to resend verification email",
        variant: "destructive",
      });
    } finally {
      setIsResending(false);
    }
  };

  return (
    <Card className="border-orange-200 bg-orange-50 mb-4">
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <AlertTriangle className="h-5 w-5 text-orange-600" />
            <div>
              <h4 className="text-sm font-medium text-orange-800">
                Email Not Verified
              </h4>
              <p className="text-sm text-orange-700">
                Please verify your email address ({user.email}) to secure your account and prevent data loss.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={handleResendVerification}
              disabled={isResending}
              className="border-orange-300 text-orange-700 hover:bg-orange-100"
            >
              <Mail className="h-4 w-4 mr-2" />
              {isResending ? 'Sending...' : 'Resend Email'}
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setIsDismissed(true)}
              className="text-orange-600 hover:bg-orange-100"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
