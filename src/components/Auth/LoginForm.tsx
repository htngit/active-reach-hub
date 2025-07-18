
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ForgotPassword } from './ForgotPassword';
import { useAuthValidation } from '@/hooks/useAuthValidation';
import { Eye, EyeOff, AlertCircle, CheckCircle, Shield } from 'lucide-react';

export const LoginForm = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLogin, setIsLogin] = useState(true);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  const {
    validationState,
    loading,
    validateEmailInput,
    validatePasswordInput,
    validatePasswordConfirmationInput,
    signInWithValidation,
    signUpWithValidation,
    clearValidation
  } = useAuthValidation();

  // Clear validation when switching between login/signup
  useEffect(() => {
    clearValidation();
  }, [isLogin, clearValidation]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (isLogin) {
      await signInWithValidation(email, password);
    } else {
      await signUpWithValidation(email, password, confirmPassword);
    }
  };

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setEmail(value);
    if (value) {
      validateEmailInput(value);
    }
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setPassword(value);
    if (value && !isLogin) {
      validatePasswordInput(value, email);
    }
  };

  const handleConfirmPasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setConfirmPassword(value);
    if (value && password) {
      validatePasswordConfirmationInput(password, value);
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

  if (showForgotPassword) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <div className="w-full max-w-md">
          <ForgotPassword onBack={() => setShowForgotPassword(false)} />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex items-center justify-center gap-2 mb-4">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 2L2 7l10 5 10-5-10-5z"/>
                <path d="M2 17l10 5 10-5"/>
                <path d="M2 12l10 5 10-5"/>
              </svg>
            </div>
            <span className="text-xl font-bold">XalesIn CRM</span>
          </div>
          <CardTitle>{isLogin ? 'Welcome Back' : 'Create Account'}</CardTitle>
          <CardDescription>
            {isLogin ? 'Sign in to your account to continue' : 'Create your account to get started'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email Field */}
            <div className="space-y-2">
              <div className="relative">
                <Input
                  type="email"
                  placeholder="Email"
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

            {/* Password Field */}
            <div className="space-y-2">
              <div className="relative">
                <Input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Password"
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
              {!isLogin && validationState.passwordValidation?.strength && (
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

            {/* Confirm Password Field (Sign Up Only) */}
            {!isLogin && (
              <div className="space-y-2">
                <div className="relative">
                  <Input
                    type={showConfirmPassword ? 'text' : 'password'}
                    placeholder="Confirm Password"
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
            )}

            {/* Rate Limit Warning */}
            {validationState.isRateLimited && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Too many attempts. Please wait {Math.ceil(validationState.remainingTime / (1000 * 60))} minute(s) before trying again.
                </AlertDescription>
              </Alert>
            )}

            <Button 
              type="submit" 
              className="w-full" 
              disabled={loading || validationState.isRateLimited || validationState.isValidating}
            >
              {loading ? 'Processing...' : (isLogin ? 'Sign In' : 'Create Account')}
            </Button>
          </form>
          
          {isLogin && (
            <div className="mt-3 text-center">
              <button
                type="button"
                onClick={() => setShowForgotPassword(true)}
                className="text-sm text-primary hover:underline"
              >
                Forgot your password?
              </button>
            </div>
          )}
          
          <div className="mt-4 text-center">
            <button
              type="button"
              onClick={() => setIsLogin(!isLogin)}
              className="text-sm text-primary hover:underline"
            >
              {isLogin ? "Don't have an account? Sign Up" : "Already have an account? Sign In"}
            </button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
