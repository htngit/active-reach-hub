import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { AcceptInvitationResponse } from '@/types/team';

const JoinTeamPage: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [authLoading, setAuthLoading] = useState(true); // Add state for auth loading
  const [needsPassword, setNeedsPassword] = useState(false);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [token, setToken] = useState('');
  const [tokenFromUrl, setTokenFromUrl] = useState<string | null>(null);

  useEffect(() => {
    // Check if there's a token in the URL for convenience
    const params = new URLSearchParams(location.search);
    const urlToken = params.get('token');
    
    if (urlToken) {
      console.log('Token found in URL:', urlToken);
      setTokenFromUrl(urlToken);
      setToken(urlToken); // Pre-fill the form
    }

    // Give Supabase Auth time to process any tokens in the URL
    const processAuth = async () => {
      try {
        // Small delay to ensure Supabase Auth has time to process any tokens
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // Now check authentication status
        if (!user) {
          console.log('User not authenticated, redirecting to login');
          toast({
            title: 'Authentication Required',
            description: 'Please log in to accept the team invitation.',
            variant: 'default',
          });
          navigate('/login');
          return;
        }

        // Check if user needs to set up password
        await checkUserPasswordStatus();
      } finally {
        // Mark auth loading as complete
        setAuthLoading(false);
      }
    };

    processAuth();
  }, [location.search, navigate, user, toast]);

  const checkUserPasswordStatus = async () => {
    if (!user) return;
    
    console.log('Checking user password status for user:', user.id);
    
    // For users who signed up via invitation link, they might not have a password set
    const { data: userData } = await supabase.auth.getUser();
    
    // Check if email is confirmed but user was created recently
    // This is a better indicator for users who just clicked an invitation link
    const userCreatedAt = new Date(userData.user?.created_at || '');
    const emailConfirmedAt = userData.user?.email_confirmed_at;
    const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000);
    
    console.log('User created at:', userCreatedAt);
    console.log('Email confirmed at:', emailConfirmedAt);
    console.log('Ten minutes ago:', tenMinutesAgo);
    
    // User needs password setup if they were created recently AND their email is confirmed
    // This typically happens when they sign up via an invitation link
    const needsPasswordSetup = userCreatedAt > tenMinutesAgo && emailConfirmedAt;
    console.log('User needs password setup:', needsPasswordSetup);
    
    if (needsPasswordSetup) {
      setNeedsPassword(true);
    }
  };

  const handlePasswordSetup = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (password !== confirmPassword) {
      toast({
        title: 'Password Mismatch',
        description: 'The passwords you entered do not match.',
        variant: 'destructive',
      });
      return;
    }
    
    if (password.length < 6) {
      toast({
        title: 'Password Too Short',
        description: 'Password must be at least 6 characters long.',
        variant: 'destructive',
      });
      return;
    }
    
    // The password validation is already handled in handleAcceptInvitation
    // Just call it directly to process both password update and team joining
    await handleAcceptInvitation();
  };

  const handleAcceptInvitation = async () => {
    if (!user) {
      toast({
        title: 'Authentication Required',
        description: 'Please log in to accept the team invitation.',
        variant: 'default',
      });
      navigate('/login');
      return;
    }

    if (needsPassword && (password !== confirmPassword || password.length < 6)) {
      toast({
        title: 'Password Error',
        description: 'Passwords must match and be at least 6 characters long.',
        variant: 'destructive',
      });
      return;
    }

    try {
      setIsLoading(true);

      // If user needs to set a password, update it first
      if (needsPassword && password) {
        const { error: passwordError } = await supabase.auth.updateUser({
          password: password,
        });

        if (passwordError) {
          throw new Error(`Error setting password: ${passwordError.message}`);
        }

        toast({
          title: 'Password Set',
          description: 'Your password has been set successfully.',
        });
      }

      // Get the final token from URL or input field
      const finalToken = tokenFromUrl || token;
      if (!finalToken) {
        throw new Error('No invitation token provided');
      }

      console.log('Accepting invitation with token:', finalToken);
      
      // Use the RPC function to accept the invitation
      // This handles all validation and database updates in a single transaction
      const { data: result, error: rpcError } = await supabase
        .rpc('accept_team_invitation', {
          p_token: finalToken,
          p_user_id: user.id
        });

      if (rpcError) {
        throw new Error(rpcError.message || 'Error accepting invitation');
      }

      // Type assertion for the RPC result - convert through unknown first
      const invitationResult = result as unknown as AcceptInvitationResponse;

      if (!invitationResult || !invitationResult.success) {
        throw new Error(invitationResult?.message || 'Failed to accept invitation');
      }

      // Success! Redirect to the team page
      toast({
        title: 'Team Joined',
        description: invitationResult.message || 'You have successfully joined the team!',
      });

      // Navigate to the team page
      if (invitationResult.team_id) {
        navigate(`/teams/${invitationResult.team_id}`);
      } else {
        // Fallback to teams list if team_id is not returned
        navigate('/teams');
      }
    } catch (error: any) {
      console.error('Error accepting invitation:', error);
      toast({
        title: 'Error',
        description: error.message || 'An error occurred while accepting the invitation.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (needsPassword) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-900 p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Complete Your Account Setup</CardTitle>
            <CardDescription>
              Please create a password to complete your account setup and join the team.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handlePasswordSetup} className="space-y-4">
              <div>
                <Input
                  type="password"
                  placeholder="Create password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                />
              </div>
              <div>
                <Input
                  type="password"
                  placeholder="Confirm password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  minLength={6}
                />
              </div>
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    Setting up...
                  </>
                ) : (
                  'Complete Setup & Join Team'
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Show loading indicator while authentication is being processed
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-900 p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Checking Authentication</CardTitle>
            <CardDescription>
              Please wait while we verify your account...
            </CardDescription>
          </CardHeader>
          <CardContent className="flex justify-center py-6">
            <Loader2 className="h-8 w-8 animate-spin" />
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-900 p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Join Team</CardTitle>
          <CardDescription>
            Enter your invitation token to join the team.
            {tokenFromUrl && (
              <span className="block mt-2 text-sm text-blue-600">
                We found a token in the URL and pre-filled it for you.
              </span>
            )}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={(e) => { e.preventDefault(); handleAcceptInvitation(); }} className="space-y-4">
            <div>
              <Label htmlFor="token">Invitation Token</Label>
              <Input
                id="token"
                type="text"
                placeholder="Enter your invitation token"
                value={token}
                onChange={(e) => setToken(e.target.value)}
                required
                className="mt-1"
              />
              <p className="text-sm text-gray-500 mt-1">
                This token was provided in your invitation email or link.
              </p>
            </div>
            <Button type="submit" className="w-full" disabled={isLoading || !token.trim()}>
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Joining team...
                </>
              ) : (
                'Join Team'
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default JoinTeamPage;
