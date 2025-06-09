
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

interface AcceptInvitationResponse {
  success: boolean;
  message: string;
  team_name?: string;
}

const JoinTeamPage: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
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
    checkUserPasswordStatus();
  }, [location.search, navigate, user, toast]);

  const checkUserPasswordStatus = async () => {
    if (!user) return;
    
    console.log('Checking user password status for user:', user.id);
    
    // For users who signed up via invitation link, they might not have a password set
    // We'll assume they need to set a password if this is their first time accessing via invitation
    const { data: userData } = await supabase.auth.getUser();
    
    // Check if user was created recently (within last 10 minutes) which might indicate they just signed up
    const userCreatedAt = new Date(userData.user?.created_at || '');
    const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000);
    
    console.log('User created at:', userCreatedAt);
    console.log('Ten minutes ago:', tenMinutesAgo);
    console.log('User needs password setup:', userCreatedAt > tenMinutesAgo);
    
    if (userCreatedAt > tenMinutesAgo) {
      setNeedsPassword(true);
    }
  };

  const handlePasswordSetup = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (password !== confirmPassword) {
      toast({
        title: 'Error',
        description: 'Passwords do not match.',
        variant: 'destructive',
      });
      return;
    }

    if (password.length < 6) {
      toast({
        title: 'Error',
        description: 'Password must be at least 6 characters long.',
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);

    try {
      const { error } = await supabase.auth.updateUser({
        password: password
      });

      if (error) {
        throw error;
      }

      toast({
        title: 'Success',
        description: 'Password created successfully!',
        variant: 'default',
      });

      setNeedsPassword(false);
    } catch (error: any) {
      console.error('Error setting password:', error);
      toast({
        title: 'Error',
        description: `Failed to set password: ${error.message}`,
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleTokenSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!token.trim()) {
      toast({
        title: 'Error',
        description: 'Please enter an invitation token.',
        variant: 'destructive',
      });
      return;
    }

    if (!user) {
      toast({
        title: 'Error',
        description: 'User not authenticated.',
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);

    try {
      const trimmedToken = token.trim();
      console.log('Attempting to join team with token:', trimmedToken);
      console.log('User ID:', user.id);
      console.log('Token length:', trimmedToken.length);
      
      // First, let's check if the invitation exists in the database
      const { data: invitationCheck, error: checkError } = await supabase
        .from('team_invitations')
        .select('*')
        .eq('token', trimmedToken)
        .single();

      console.log('Invitation check result:', invitationCheck);
      console.log('Invitation check error:', checkError);

      // Check if invitation exists and is not expired
      if (!invitationCheck) {
        console.error('No invitation found with this token');
        
        // Let's also try to see all invitations for debugging
        const { data: allInvitations } = await supabase
          .from('team_invitations')
          .select('*')
          .limit(5);
        
        console.log('Sample invitations from database:', allInvitations);
        
        toast({
          title: 'Error',
          description: 'Invalid invitation token.',
          variant: 'destructive',
        });
        return;
      }

      // Check if invitation is expired
      if (new Date(invitationCheck.expires_at) < new Date()) {
        console.error('Invitation has expired');
        toast({
          title: 'Error',
          description: 'This invitation has expired.',
          variant: 'destructive',
        });
        return;
      }

      // Check if invitation has already been used
      if (invitationCheck.used_at) {
        console.error('Invitation has already been used');
        toast({
          title: 'Error',
          description: 'This invitation has already been used.',
          variant: 'destructive',
        });
        return;
      }

      const { data, error } = await supabase.rpc('accept_team_invitation', { 
        p_token: trimmedToken, 
        p_user_id: user.id 
      }) as { data: AcceptInvitationResponse | null, error: any };

      console.log('RPC response data:', data);
      console.log('RPC response error:', error);

      if (error) {
        console.error('Error accepting invitation:', error);
        toast({
          title: 'Error',
          description: `Failed to accept invitation: ${error.message}`,
          variant: 'destructive',
        });
        return;
      }

      if (data && data.success) {
        toast({
          title: 'Success',
          description: `Successfully joined team: ${data.team_name || ''}`,
          variant: 'default',
        });
        navigate('/team');
      } else {
        console.error('RPC returned failure:', data);
        toast({
          title: 'Error',
          description: data?.message || 'Failed to accept invitation.',
          variant: 'destructive',
        });
      }
    } catch (err) {
      console.error('Unexpected error:', err);
      toast({
        title: 'Error',
        description: 'An unexpected error occurred.',
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
          <form onSubmit={handleTokenSubmit} className="space-y-4">
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
