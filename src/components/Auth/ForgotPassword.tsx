
import React, { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { toast } from '@/hooks/use-toast';
import { ArrowLeft, AlertCircle, CheckCircle, Mail } from 'lucide-react';
import { useAuthValidation } from '@/hooks/useAuthValidation';
import { mapAuthError } from '@/utils/authErrors';

interface ForgotPasswordProps {
  onBack: () => void;
}

export const ForgotPassword = ({ onBack }: ForgotPasswordProps) => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  
  const {
    validationState,
    validateEmailInput,
    clearValidation
  } = useAuthValidation();

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setEmail(value);
    if (value) {
      validateEmailInput(value);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate email before proceeding
    if (!validationState.emailValidation?.isValid) {
      toast({
        title: "Invalid Email",
        description: "Please enter a valid email address.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (error) {
        const friendlyMessage = mapAuthError(error);
        throw new Error(friendlyMessage);
      }

      setEmailSent(true);
      toast({
        title: "Reset Link Sent",
        description: "Check your email for the password reset link. It may take a few minutes to arrive.",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (emailSent) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Check your email</CardTitle>
            <CardDescription>
              We've sent password reset instructions to {email}
            </CardDescription>
          </CardHeader>
          <CardContent>
          <div className="text-center space-y-4">
            <div className="mx-auto w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
              <Mail className="h-6 w-6 text-green-600" />
            </div>
            <div className="space-y-2">
              <h3 className="font-semibold text-lg">Check Your Email</h3>
              <p className="text-sm text-muted-foreground">
                We've sent a password reset link to <strong>{email}</strong>
              </p>
              <p className="text-xs text-muted-foreground">
                The link will expire in 1 hour. If you don't see the email, check your spam folder.
              </p>
            </div>
            <div className="space-y-2">
              <Button 
                onClick={() => {
                  setEmailSent(false);
                  setEmail('');
                  clearValidation();
                }} 
                variant="outline" 
                className="w-full"
              >
                Send to Different Email
              </Button>
              <Button onClick={onBack} variant="outline" className="w-full">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Sign In
              </Button>
            </div>
          </div>
        </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Forgot Password</CardTitle>
          <CardDescription>
            Enter your email address and we'll send you a link to reset your password
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email Field */}
            <div className="space-y-2">
              <div className="relative">
                <Input
                  type="email"
                  placeholder="Enter your email address"
                  value={email}
                  onChange={handleEmailChange}
                  required
                  className={`pr-10 ${
                    validationState.emailValidation?.isValid === false 
                      ? 'border-red-500 focus:border-red-500' 
                      : validationState.emailValidation?.isValid === true 
                      ? 'border-green-500 focus:border-green-500' 
                      : ''
                  }`}
                />
                {validationState.emailValidation && (
                  <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                    {validationState.emailValidation.isValid ? (
                      <CheckCircle className="h-4 w-4 text-green-500" />
                    ) : (
                      <AlertCircle className="h-4 w-4 text-red-500" />
                    )}
                  </div>
                )}
              </div>
              {validationState.emailValidation?.errors.map((error, index) => (
                <Alert key={index} variant="destructive" className="py-2">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription className="text-sm">{error}</AlertDescription>
                </Alert>
              ))}
              {validationState.emailValidation?.warnings?.map((warning, index) => (
                <Alert key={index} className="py-2 border-orange-200 bg-orange-50">
                  <AlertCircle className="h-4 w-4 text-orange-500" />
                  <AlertDescription className="text-sm text-orange-700">{warning}</AlertDescription>
                </Alert>
              ))}
            </div>
            
            <div className="space-y-2">
              <Button 
                type="submit" 
                className="w-full" 
                disabled={loading || !validationState.emailValidation?.isValid}
              >
                {loading ? 'Sending Reset Link...' : 'Send Reset Link'}
              </Button>
              <Button onClick={onBack} variant="outline" className="w-full">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Sign In
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};
