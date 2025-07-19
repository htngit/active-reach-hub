
import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Mail, User, Save, AlertCircle } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

export const PersonalSettings = () => {
  const { user, signOut } = useAuth();
  const [newEmail, setNewEmail] = useState(user?.email || '');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [isUpdatingEmail, setIsUpdatingEmail] = useState(false);
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);
  const [isUpdatingName, setIsUpdatingName] = useState(false);
  const [isUpdatingUsername, setIsUpdatingUsername] = useState(false);

  // Fetch current profile data from profiles table when component mounts
  useEffect(() => {
    const fetchProfileData = async () => {
      if (user) {
        const { data, error } = await supabase
          .from('profiles')
          .select('username, full_name')
          .eq('id', user.id)
          .single();
        
        if (data && !error) {
          setUsername(data.username || '');
          setName(data.full_name || user?.user_metadata?.full_name || '');
        } else {
          // Fallback to user metadata if profile data is not available
          setName(user?.user_metadata?.full_name || '');
        }
      }
    };
    
    fetchProfileData();
  }, [user]);

  const handleUpdateEmail = async () => {
    if (!newEmail || newEmail === user?.email) {
      toast({
        title: "Error",
        description: "Please enter a new email address",
        variant: "destructive",
      });
      return;
    }

    setIsUpdatingEmail(true);
    try {
      const { error } = await supabase.auth.updateUser({
        email: newEmail
      });

      if (error) throw error;

      toast({
        title: "Email Update Initiated",
        description: "Please check both your old and new email addresses for confirmation links.",
      });
      
      setNewEmail(user?.email || '');
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsUpdatingEmail(false);
    }
  };

  const handleUpdatePassword = async () => {
    if (!currentPassword || !newPassword) {
      toast({
        title: "Error",
        description: "Please fill in all password fields",
        variant: "destructive",
      });
      return;
    }

    if (newPassword !== confirmPassword) {
      toast({
        title: "Error",
        description: "New passwords do not match",
        variant: "destructive",
      });
      return;
    }

    if (newPassword.length < 6) {
      toast({
        title: "Error",
        description: "Password must be at least 6 characters long",
        variant: "destructive",
      });
      return;
    }

    setIsUpdatingPassword(true);
    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      });

      if (error) throw error;

      toast({
        title: "Password Updated",
        description: "Your password has been successfully updated",
      });
      
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsUpdatingPassword(false);
    }
  };

  const handleUpdateName = async () => {
    if (!name.trim()) {
      toast({
        title: "Error",
        description: "Please enter your name",
        variant: "destructive",
      });
      return;
    }

    setIsUpdatingName(true);
    try {
      // Update the full_name in the profiles table
      const { error: profileError } = await supabase
        .from('profiles')
        .update({ full_name: name.trim() })
        .eq('id', user?.id);

      if (profileError) throw profileError;
      
      // Also update the name in user metadata for backward compatibility
      const { error: authError } = await supabase.auth.updateUser({
        data: { name: name.trim() }
      });

      if (authError) throw authError;

      toast({
        title: "Name Updated",
        description: "Your name has been successfully updated",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsUpdatingName(false);
    }
  };

  const handleUpdateUsername = async () => {
    if (!username.trim()) {
      toast({
        title: "Error",
        description: "Please enter a username",
        variant: "destructive",
      });
      return;
    }

    // Basic validation for username format
    const usernameRegex = /^[a-zA-Z0-9_]+$/;
    if (!usernameRegex.test(username)) {
      toast({
        title: "Error",
        description: "Username can only contain letters, numbers, and underscores",
        variant: "destructive",
      });
      return;
    }

    setIsUpdatingUsername(true);
    try {
      // Update the username in the profiles table
      const { error } = await supabase
        .from('profiles')
        .update({ username: username.trim() })
        .eq('id', user?.id);

      if (error) {
        // Check if it's a unique constraint violation
        if (error.code === '23505') {
          throw new Error('This username is already taken. Please choose another one.');
        }
        throw error;
      }

      toast({
        title: "Username Updated",
        description: "Your username has been successfully updated",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsUpdatingUsername(false);
    }
  };

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h2 className="text-2xl font-bold">Personal Settings</h2>
        <p className="text-gray-600">Manage your account settings and preferences</p>
      </div>

      {/* Account Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Account Information
          </CardTitle>
          <CardDescription>
            View and update your account details
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="text-sm font-medium">User ID</label>
            <p className="text-sm text-gray-600 font-mono">{user?.id}</p>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Name</label>
            <div className="flex gap-2">
              <Input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter your name"
              />
              <Button 
                onClick={handleUpdateName}
                disabled={isUpdatingName}
                size="sm"
              >
                <Save className="h-4 w-4 mr-2" />
                {isUpdatingName ? 'Saving...' : 'Save'}
              </Button>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Username</label>
            <div className="flex gap-2">
              <Input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Enter your username"
              />
              <Button 
                onClick={handleUpdateUsername}
                disabled={isUpdatingUsername}
                size="sm"
              >
                <Save className="h-4 w-4 mr-2" />
                {isUpdatingUsername ? 'Saving...' : 'Save'}
              </Button>
            </div>
            <p className="text-xs text-gray-500 mt-1">Username can only contain letters, numbers, and underscores</p>
          </div>
          <div>
            <label className="text-sm font-medium">Current Email</label>
            <p className="text-sm text-gray-600">{user?.email}</p>
          </div>
        </CardContent>
      </Card>

      {/* Email Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Email Settings
          </CardTitle>
          <CardDescription>
            Change your email address. You will need to verify the new email.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">New Email Address</label>
            <Input
              type="email"
              value={newEmail}
              onChange={(e) => setNewEmail(e.target.value)}
              placeholder="Enter new email address"
            />
          </div>
          <Button 
            onClick={handleUpdateEmail}
            disabled={isUpdatingEmail || newEmail === user?.email}
          >
            <Save className="h-4 w-4 mr-2" />
            {isUpdatingEmail ? 'Updating...' : 'Update Email'}
          </Button>
        </CardContent>
      </Card>

      {/* Password Settings */}
      <Card>
        <CardHeader>
          <CardTitle>Password Settings</CardTitle>
          <CardDescription>
            Change your account password
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Current Password</label>
            <Input
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              placeholder="Enter current password"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">New Password</label>
            <Input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Enter new password"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Confirm New Password</label>
            <Input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Confirm new password"
            />
          </div>
          <Button 
            onClick={handleUpdatePassword}
            disabled={isUpdatingPassword}
          >
            <Save className="h-4 w-4 mr-2" />
            {isUpdatingPassword ? 'Updating...' : 'Update Password'}
          </Button>
        </CardContent>
      </Card>

      {/* Danger Zone */}
      <Card className="border-red-200">
        <CardHeader>
          <CardTitle className="text-red-700">Danger Zone</CardTitle>
          <CardDescription>
            Actions that cannot be undone
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button 
            variant="destructive" 
            onClick={signOut}
          >
            Sign Out
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};
