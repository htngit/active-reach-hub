
import React, { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Send } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { Team } from '@/types/team';

interface InviteMemberDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  team: Team;
  user: any;
  onInvitationSent: () => void;
}

export const InviteMemberDialog: React.FC<InviteMemberDialogProps> = ({
  open,
  onOpenChange,
  team,
  user,
  onInvitationSent
}) => {
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviting, setInviting] = useState(false);

  const handleInviteUser = async () => {
    if (!team || !inviteEmail.trim()) return;

    setInviting(true);
    try {
      console.log('Starting invitation process for email:', inviteEmail);
      
      // Generate invitation token
      const { data: tokenData, error: tokenError } = await supabase
        .rpc('generate_invitation_token');

      console.log('Generated token:', tokenData);
      console.log('Token generation error:', tokenError);

      if (tokenError) {
        console.error('Token generation error:', tokenError);
        throw tokenError;
      }

      // Create expiration date (7 days from now)
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 7);
      
      console.log('Creating invitation with expiration:', expiresAt.toISOString());
      console.log('Team ID:', team.id);
      console.log('Invited by:', user?.id);
      console.log('Raw token before insert:', tokenData);

      const { data: insertData, error } = await supabase
        .from('team_invitations')
        .insert({
          team_id: team.id,
          invited_by: user?.id,
          email: inviteEmail.trim(),
          token: tokenData,
          expires_at: expiresAt.toISOString(),
        })
        .select()
        .single();

      console.log('Invitation insert result:', insertData);
      console.log('Invitation insert error:', error);

      if (error) {
        console.error('Invitation creation error:', error);
        throw error;
      }

      // Verify the invitation was created correctly
      const { data: verifyData, error: verifyError } = await supabase
        .from('team_invitations')
        .select('*')
        .eq('token', tokenData)
        .single();

      console.log('Verification data:', verifyData);
      console.log('Verification error:', verifyError);

      // Create the invitation link using URL path parameter
      const invitationLink = `${window.location.origin}/join-team/${encodeURIComponent(tokenData)}`;
      console.log('Generated invitation link:', invitationLink);
      console.log('Original token:', tokenData);
      console.log('URL encoded token:', encodeURIComponent(tokenData));

      toast({
        title: "Success",
        description: `Invitation sent! Share this link: ${invitationLink}`,
        variant: "default",
      });

      setInviteEmail('');
      onInvitationSent();
      onOpenChange(false);
    } catch (error: any) {
      console.error('Error sending invitation:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to send invitation",
        variant: "destructive",
      });
    } finally {
      setInviting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Invite Team Member</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Email Address</label>
            <Input
              type="email"
              value={inviteEmail}
              onChange={(e) => setInviteEmail(e.target.value)}
              placeholder="Enter email address"
              disabled={inviting}
            />
          </div>
          <div className="flex gap-2">
            <Button 
              onClick={handleInviteUser} 
              disabled={!inviteEmail.trim() || inviting}
            >
              <Send className="h-4 w-4 mr-2" />
              {inviting ? 'Sending...' : 'Send Invitation'}
            </Button>
            <Button 
              variant="outline" 
              onClick={() => onOpenChange(false)}
              disabled={inviting}
            >
              Cancel
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
