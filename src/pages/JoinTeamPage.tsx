
import React, { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';

const JoinTeamPage: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    const joinTeam = async () => {
      const params = new URLSearchParams(location.search);
      const token = params.get('token');

      if (!token) {
        toast({
          title: 'Error',
          description: 'No invitation token found.',
          variant: 'destructive',
        });
        navigate('/contacts'); // Redirect to contacts or a suitable page
        return;
      }

      if (!user) {
        // If user is not logged in, redirect to login with a message
        toast({
          title: 'Authentication Required',
          description: 'Please log in to accept the team invitation.',
          variant: 'default',
        });
        navigate('/login'); // Assuming a /login route exists
        return;
      }

      try {
        // Call Supabase RPC to accept the invitation
        const { data, error } = await supabase.rpc('accept_team_invitation', { p_token: token, p_user_id: user.id });

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
          navigate('/team'); // Redirect to team management page
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
      }
    };

    joinTeam();
  }, [location.search, navigate, user, toast]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 dark:bg-gray-900">
      <Loader2 className="h-12 w-12 animate-spin text-blue-500" />
      <p className="mt-4 text-lg text-gray-700 dark:text-gray-300">Accepting team invitation...</p>
    </div>
  );
};

export default JoinTeamPage;
