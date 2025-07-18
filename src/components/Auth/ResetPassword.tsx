
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/hooks/use-toast';
import { Loader2, Eye, EyeOff, AlertCircle, CheckCircle, Shield } from 'lucide-react';
import { useAuthValidation } from '@/hooks/useAuthValidation';
import { mapAuthError, parseAuthErrorFromUrl, mapUrlAuthError } from '@/utils/authErrors';

export const ResetPassword = () => {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [isRecoveryMode, setIsRecoveryMode] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [hasUrlError, setHasUrlError] = useState(false);
  const [urlErrorMessage, setUrlErrorMessage] = useState<{title: string; description: string} | null>(null);
  const navigate = useNavigate();
  
  const {
    validationState,
    validatePasswordInput,
    validatePasswordConfirmationInput,
    resetPasswordWithValidation,
    clearValidation
  } = useAuthValidation();

  useEffect(() => {
    // Check for URL error parameters first
    const checkUrlErrors = () => {
      const urlError = parseAuthErrorFromUrl();
      const errorMessage = mapUrlAuthError(urlError);
      
      if (errorMessage) {
        console.error('URL Error detected:', urlError);
        setHasUrlError(true);
        setUrlErrorMessage(errorMessage);
        
        // Clear the URL hash to prevent showing error again
        window.history.replaceState(null, '', window.location.pathname);
        
        return true;
      }
      return false;
    };

    // Check if we're in password recovery mode by examining URL hash
    const checkRecoveryMode = async () => {
      try {
        // First check for URL errors
        if (checkUrlErrors()) {
          return;
        }

        // Get the current session to check if user is in recovery mode
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('Error getting session:', error);
          const authError = mapAuthError(error);
          toast({
            title: authError.title,
            description: authError.description,
            variant: "destructive",
          });
          navigate('/login');
          return;
        }

        if (session) {
          console.log('User session found, password recovery mode activated');
          setIsRecoveryMode(true);
        } else {
          console.log('No session found, redirecting to login');
          toast({
            title: "Session Required",
            description: "Please use the reset link from your email to access this page.",
            variant: "destructive",
          });
          navigate('/login');
        }
      } catch (error) {
        console.error('Error checking recovery mode:', error);
        const authError = mapAuthError(error);
        toast({
          title: authError.title,
          description: authError.description,
          variant: "destructive",
        });
        navigate('/login');
      }
    };

    // Handle the auth callback from the email link
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      console.log('Auth state change:', event, 'Session:', !!session);
      
      if (event === 'PASSWORD_RECOVERY') {
        console.log('Password recovery mode activated');
        setIsRecoveryMode(true);
      } else if (event === 'SIGNED_IN' && session) {
        console.log('User signed in after password reset');
        setIsRecoveryMode(true);
      }
    });

    checkRecoveryMode();

    return () => {
      subscription.unsubscribe();
    };
  }, [navigate]);

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setPassword(value);
    if (value) {
      validatePasswordInput(value);
    }
  };

  const handleConfirmPasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setConfirmPassword(value);
    if (value && password) {
      validatePasswordConfirmationInput(password, value);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Use the validation hook for password reset
    const success = await resetPasswordWithValidation(password, confirmPassword);
    
    if (success) {
      // Navigate to home page after successful password reset
      navigate('/');
    }
  };

  const getPasswordStrengthColor = (strength?: string) => {
    switch (strength) {
      case 'weak': return 'bg-red-500';
      case 'fair': return 'bg-orange-500';
      case 'good': return 'bg-yellow-500';
      case 'strong': return 'bg-green-500';
      default: return 'bg-gray-300';
    }
  };

  const getPasswordStrengthText = (strength?: string) => {
    switch (strength) {
      case 'weak': return 'Weak';
      case 'fair': return 'Fair';
      case 'good': return 'Good';
      case 'strong': return 'Strong';
      default: return '';
    }
  };

  // Show error page if URL contains error parameters
  if (hasUrlError && urlErrorMessage) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-600">
              <AlertCircle className="h-5 w-5" />
              {urlErrorMessage.title}
            </CardTitle>
            <CardDescription className="text-red-700">
              {urlErrorMessage.description}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                The password reset link you clicked is no longer valid. This can happen if:
                <ul className="list-disc list-inside mt-2 space-y-1">
                  <li>The link has expired (links are valid for 1 hour)</li>
                  <li>The link has already been used</li>
                  <li>A newer reset request was made</li>
                </ul>
              </AlertDescription>
            </Alert>
            
            <div className="space-y-3">
               <Button 
                 onClick={() => navigate('/forgot-password')} 
                 className="w-full"
                 variant="outline"
               >
                 Request New Password Reset
               </Button>
               
               <Button 
                 onClick={() => navigate('/login')} 
                 className="w-full"
                 variant="secondary"
               >
                 Back to Login
               </Button>
             </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!isRecoveryMode) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Verifying Reset Link</CardTitle>
            <CardDescription>
              Please wait while we verify your password reset link...
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Reset Password</CardTitle>
          <CardDescription>
            Enter your new password below
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* New Password Field */}
            <div className="space-y-2">
              <div className="relative">
                <Input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="New Password"
                  value={password}
                  onChange={handlePasswordChange}
                  required
                  className={`pr-20 ${
                    validationState.passwordValidation?.isValid === false 
                      ? 'border-red-500 focus:border-red-500' 
                      : validationState.passwordValidation?.isValid === true 
                      ? 'border-green-500 focus:border-green-500' 
                      : ''
                  }`}
                />
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2 flex items-center space-x-1">
                  {validationState.passwordValidation && (
                    <div>
                      {validationState.passwordValidation.isValid ? (
                        <CheckCircle className="h-4 w-4 text-green-500" />
                      ) : (
                        <AlertCircle className="h-4 w-4 text-red-500" />
                      )}
                    </div>
                  )}
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="text-gray-500 hover:text-gray-700"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
              
              {/* Password Strength Indicator */}
              {validationState.passwordValidation?.strength && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Password Strength:</span>
                    <Badge 
                      variant="outline" 
                      className={`text-xs ${
                        validationState.passwordValidation.strength === 'weak' ? 'border-red-500 text-red-700' :
                        validationState.passwordValidation.strength === 'fair' ? 'border-orange-500 text-orange-700' :
                        validationState.passwordValidation.strength === 'good' ? 'border-yellow-500 text-yellow-700' :
                        'border-green-500 text-green-700'
                      }`}
                    >
                      <Shield className="h-3 w-3 mr-1" />
                      {getPasswordStrengthText(validationState.passwordValidation.strength)}
                    </Badge>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className={`h-2 rounded-full transition-all duration-300 ${
                        getPasswordStrengthColor(validationState.passwordValidation.strength)
                      }`}
                      style={{
                        width: 
                          validationState.passwordValidation.strength === 'weak' ? '25%' :
                          validationState.passwordValidation.strength === 'fair' ? '50%' :
                          validationState.passwordValidation.strength === 'good' ? '75%' :
                          '100%'
                      }}
                    ></div>
                  </div>
                </div>
              )}
              
              {validationState.passwordValidation?.errors.map((error, index) => (
                <Alert key={index} variant="destructive" className="py-2">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription className="text-sm">{error}</AlertDescription>
                </Alert>
              ))}
              {validationState.passwordValidation?.warnings?.map((warning, index) => (
                <Alert key={index} className="py-2 border-orange-200 bg-orange-50">
                  <AlertCircle className="h-4 w-4 text-orange-500" />
                  <AlertDescription className="text-sm text-orange-700">{warning}</AlertDescription>
                </Alert>
              ))}
            </div>

            {/* Confirm Password Field */}
            <div className="space-y-2">
              <div className="relative">
                <Input
                  type={showConfirmPassword ? 'text' : 'password'}
                  placeholder="Confirm New Password"
                  value={confirmPassword}
                  onChange={handleConfirmPasswordChange}
                  required
                  className={`pr-20 ${
                    validationState.confirmPasswordValidation?.isValid === false 
                      ? 'border-red-500 focus:border-red-500' 
                      : validationState.confirmPasswordValidation?.isValid === true 
                      ? 'border-green-500 focus:border-green-500' 
                      : ''
                  }`}
                />
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2 flex items-center space-x-1">
                  {validationState.confirmPasswordValidation && (
                    <div>
                      {validationState.confirmPasswordValidation.isValid ? (
                        <CheckCircle className="h-4 w-4 text-green-500" />
                      ) : (
                        <AlertCircle className="h-4 w-4 text-red-500" />
                      )}
                    </div>
                  )}
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="text-gray-500 hover:text-gray-700"
                  >
                    {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
              {validationState.confirmPasswordValidation?.errors.map((error, index) => (
                <Alert key={index} variant="destructive" className="py-2">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription className="text-sm">{error}</AlertDescription>
                </Alert>
              ))}
            </div>

            <Button 
              type="submit" 
              className="w-full" 
              disabled={loading || validationState.isValidating || !validationState.passwordValidation?.isValid || !validationState.confirmPasswordValidation?.isValid}
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Updating Password...
                </>
              ) : (
                'Update Password'
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};
