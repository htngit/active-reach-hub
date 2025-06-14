
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Copy } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { TeamInvitation } from '@/types/team';

interface PendingInvitationsProps {
  invitations: TeamInvitation[];
}

export const PendingInvitations: React.FC<PendingInvitationsProps> = ({ invitations }) => {
  const copyInvitationLink = (token: string) => {
    // Use URL path parameter instead of query parameter
    const link = `${window.location.origin}/join-team/${encodeURIComponent(token)}`;
    navigator.clipboard.writeText(link);
    
    toast({
      title: "Success",
      description: "Invitation link copied to clipboard",
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Pending Invitations</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {invitations.map((invitation) => (
            <div key={invitation.id} className="flex items-center justify-between p-3 border rounded">
              <div>
                <p className="font-medium">{invitation.email}</p>
                <p className="text-sm text-gray-600">
                  Expires: {new Date(invitation.expires_at).toLocaleDateString()}
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => copyInvitationLink(invitation.token)}
              >
                <Copy className="h-4 w-4 mr-2" />
                Copy Link
              </Button>
            </div>
          ))}
        </div>
      </CardContent>
    </Dialog>
  );
};
