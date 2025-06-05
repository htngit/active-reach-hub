
import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

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
  const [token, setToken] = useState<string | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const inviteToken = params.get('token');
    setToken(inviteToken);

    if (!inviteToken) {
      toast({
        title: 'Error',
        description: 'No invitation token found.',
        variant: 'destructive',
      });
      navigate('/contacts');
      return;
    }

    if (!user) {
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
    
    // For users who signed up via invitation link, they might not have a password set
    // We'll assume they need to set a password if this is their first time accessing via invitation
    const { data: userData } = await supabase.auth.getUser();
    
    // Check if user was created recently (within last 10 minutes) which might indicate they just signed up
    const userCreatedAt = new Date(userData.user?.created_at || '');
    const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000);
    
    if (userCreatedAt > tenMinutesAgo) {
      setNeedsPassword(true);
    } else {
      // User already has account, proceed with invitation acceptance
      joinTeam();
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
      // Now proceed with joining the team
      joinTeam();
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

  const joinTeam = async () => {
    if (!token || !user) return;

    setIsLoading(true);

    try {
      const { data, error } = await supabase.rpc('accept_team_invitation', { 
        p_token: token, 
        p_user_id: user.id 
      }) as { data: AcceptInvitationResponse | null, error: any };

      if (error) {
        console.error('Error accepting invitation:', error);
        toast({
          title: 'Error',
          description: `Failed to accept invitation: ${error.message}`,
          variant: 'destructive',
        });
        navigate('/contacts');
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
        toast({
          title: 'Error',
          description: data?.message || 'Failed to accept invitation.',
          variant: 'destructive',
        });
        navigate('/contacts');
      }
    } catch (err) {
      console.error('Unexpected error:', err);
      toast({
        title: 'Error',
        description: 'An unexpected error occurred.',
        variant: 'destructive',
      });
      navigate('/contacts');
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
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 dark:bg-gray-900">
      <Loader2 className="h-12 w-12 animate-spin text-blue-500" />
      <p className="mt-4 text-lg text-gray-700 dark:text-gray-300">
        {isLoading ? 'Joining team...' : 'Processing invitation...'}
      </p>
    </div>
  );
};

export default JoinTeamPage;
