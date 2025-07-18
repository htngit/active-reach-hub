-- Fix profile trigger to properly handle email and username
-- This migration fixes the issue where email is used as username causing RLS conflicts

-- First, add email column to profiles table for proper email reference
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS email TEXT;

-- Create unique constraint on email to prevent duplicates
CREATE UNIQUE INDEX IF NOT EXISTS profiles_email_unique ON public.profiles(email);

-- Update existing profiles to have proper email reference
UPDATE public.profiles 
SET email = (
  SELECT u.email 
  FROM auth.users u 
  WHERE u.id = profiles.id
)
WHERE email IS NULL;

-- Create improved trigger function that properly handles email and username
CREATE OR REPLACE FUNCTION public.create_profile_for_user()
RETURNS TRIGGER AS $$
DECLARE
  base_username TEXT;
  final_username TEXT;
  counter INTEGER := 0;
BEGIN
  -- Extract base username from email (part before @)
  base_username := SPLIT_PART(NEW.email, '@', 1);
  final_username := base_username;
  
  -- Check if username already exists and make it unique
  WHILE EXISTS (SELECT 1 FROM public.profiles WHERE username = final_username) LOOP
    counter := counter + 1;
    final_username := base_username || '.' || counter;
  END LOOP;
  
  -- Insert profile with proper email reference and unique username
  INSERT INTO public.profiles (id, full_name, username, email)
  VALUES (
    NEW.id, 
    NEW.email,  -- Use email as temporary full_name until user updates it
    final_username,  -- Unique username
    NEW.email  -- Proper email reference
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update RLS policies to use email reference properly
-- Drop existing policies that might be using incorrect email checks
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;

-- Create new policy that uses proper email reference
CREATE POLICY "Users can update their own profile" 
  ON public.profiles 
  FOR UPDATE 
  USING (
    auth.uid() = id 
    OR 
    auth.email() = email  -- Use email reference from auth schema
  );

-- Add policy for users to view their own profile by email
CREATE POLICY "Users can view their own profile by email"
  ON public.profiles
  FOR SELECT
  USING (
    auth.uid() = id
    OR
    auth.email() = email
  );

-- Create function to get user profile by email (for RLS checks)
CREATE OR REPLACE FUNCTION public.get_profile_by_email(user_email TEXT)
RETURNS UUID AS $$
DECLARE
  profile_id UUID;
BEGIN
  SELECT id INTO profile_id
  FROM public.profiles
  WHERE email = user_email;
  
  RETURN profile_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to validate user access by email
CREATE OR REPLACE FUNCTION public.validate_user_by_email(user_email TEXT)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 
    FROM auth.users u
    JOIN public.profiles p ON u.id = p.id
    WHERE u.email = user_email
    AND u.id = auth.uid()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add comment explaining the fix
COMMENT ON FUNCTION public.create_profile_for_user() IS 
'Fixed trigger function that creates unique usernames and maintains proper email reference from auth.users table';

COMMENT ON COLUMN public.profiles.email IS 
'Email reference from auth.users table for proper RLS policy checks';

COMMENT ON FUNCTION public.validate_user_by_email(TEXT) IS 
'Helper function to validate user access using email reference instead of username equality';