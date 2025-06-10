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
      console.log('Processing token:', trimmedToken);
      console.log('User ID:', user.id);
      
      // First, fetch the invitation from the database using the token
      const { data: invitation, error: fetchError } = await supabase
        .from('team_invitations')
        .select(`
          *,
          teams:team_id (
            id,
            name,
            description,
            owner_id
          )
        `)
        .eq('token', trimmedToken)
        .single();

      console.log('Invitation fetch result:', invitation);
      console.log('Invitation fetch error:', fetchError);

      if (fetchError || !invitation) {
        console.error('No invitation found with this token');
        toast({
          title: 'Error',
          description: 'Invalid invitation token. Please check your token and try again.',
          variant: 'destructive',
        });
        return;
      }

      // Check if invitation is expired
      if (new Date(invitation.expires_at) < new Date()) {
        console.error('Invitation has expired');
        toast({
          title: 'Error',
          description: 'This invitation has expired.',
          variant: 'destructive',
        });
        return;
      }

      // Check if invitation has already been used
      if (invitation.used_at) {
        console.error('Invitation has already been used');
        toast({
          title: 'Error',
          description: 'This invitation has already been used.',
          variant: 'destructive',
        });
        return;
      }

      // Check if user is already a member of this team
      const { data: existingMember, error: memberCheckError } = await supabase
        .from('team_members')
        .select('id')
        .eq('team_id', invitation.team_id)
        .eq('user_id', user.id)
        .single();

      if (existingMember) {
        console.log('User is already a member of this team');
        toast({
          title: 'Info',
          description: 'You are already a member of this team.',
          variant: 'default',
        });
        navigate('/team');
        return;
      }

      // Add user to team_members
      const { error: memberInsertError } = await supabase
        .from('team_members')
        .insert({
          team_id: invitation.team_id,
          user_id: user.id,
          role: 'member'
        });

      if (memberInsertError) {
        console.error('Error adding user to team:', memberInsertError);
        throw memberInsertError;
      }

      // Mark invitation as used
      const { error: updateError } = await supabase
        .from('team_invitations')
        .update({ used_at: new Date().toISOString() })
        .eq('id', invitation.id);

      if (updateError) {
        console.error('Error marking invitation as used:', updateError);
        // This is not critical, continue with success
      }

      console.log('Successfully joined team:', invitation.teams?.name);
      
      toast({
        title: 'Success',
        description: `Successfully joined team: ${invitation.teams?.name || 'Unknown Team'}`,
        variant: 'default',
      });

      navigate('/team');

    } catch (err: any) {
      console.error('Unexpected error:', err);
      toast({
        title: 'Error',
        description: err.message || 'An unexpected error occurred.',
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
