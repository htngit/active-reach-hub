// Updated Edge Function for cached-contacts
// This file is for reference only and should be manually deployed to Supabase Edge Functions

import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, if-none-match, if-modified-since',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    );

    // Get user from JWT token
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser();
    
    if (userError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Get cache headers from request
    const ifNoneMatch = req.headers.get('if-none-match');
    const ifModifiedSince = req.headers.get('if-modified-since');

    // Use service role to bypass RLS issues
    const supabaseService = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // First get teams where user is a member
    const { data: userMemberships, error: membershipError } = await supabaseService
      .from('team_members')
      .select('team_id, role')
      .eq('user_id', user.id);

    if (membershipError) {
      console.error('Membership error:', membershipError);
    }

    // Get teams where user is an owner
    const { data: ownedTeams, error: ownedTeamsError } = await supabaseService
      .from('teams')
      .select('id')
      .eq('owner_id', user.id);

    if (ownedTeamsError) {
      console.error('Owned teams error:', ownedTeamsError);
    }

    const ownedTeamIds = ownedTeams?.map(team => team.id) || [];
    const memberTeamIds = userMemberships
      ?.filter(membership => membership.role !== 'owner')
      .map(membership => membership.team_id) || [];

    // Build the query based on user's role
    let contactsQuery;

    // Start with base query for user's own contacts
    let query = `user_id.eq.${user.id},owner_id.eq.${user.id}`;

    // Add owned teams (user can see all contacts in teams they own)
    if (ownedTeamIds.length > 0) {
      query += `,team_id.in.(${ownedTeamIds.join(',')})`;
    }

    // For teams where user is a member (not owner), they can only see their own contacts
    // This is already covered by the user_id.eq condition above

    // Final query
    contactsQuery = supabaseService
      .from('contacts')
      .select('*, created_at')
      .or(query)
      .order('created_at', { ascending: false });

    const { data: contacts, error } = await contactsQuery;

    if (error) {
      console.error('Database error:', error);
      return new Response(JSON.stringify({ error: 'Database error' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Generate ETag based on data content and last modified time
    const lastModified = contacts && contacts.length > 0 
      ? new Date(Math.max(...contacts.map(c => new Date(c.created_at).getTime())))
      : new Date();
    
    const dataHash = await crypto.subtle.digest(
      'SHA-256',
      new TextEncoder().encode(JSON.stringify(contacts || []))
    );
    const etag = Array.from(new Uint8Array(dataHash))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('')
      .substring(0, 16);

    // Check if client has cached version
    if (ifNoneMatch === etag || 
        (ifModifiedSince && new Date(ifModifiedSince) >= lastModified)) {
      return new Response(null, {
        status: 304,
        headers: {
          ...corsHeaders,
          'ETag': etag,
          'Last-Modified': lastModified.toUTCString(),
          'Cache-Control': 'max-age=300, must-revalidate', // 5 minutes
        },
      });
    }

    // Return fresh data with cache headers
    return new Response(JSON.stringify({
      data: contacts || [],
      cached_at: new Date().toISOString(),
    }), {
      status: 200,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json',
        'ETag': etag,
        'Last-Modified': lastModified.toUTCString(),
        'Cache-Control': 'max-age=300, must-revalidate', // 5 minutes
      },
    });

  } catch (error) {
    console.error('Edge function error:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});