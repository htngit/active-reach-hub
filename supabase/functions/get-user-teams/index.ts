
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
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

    // First, get teams where user is owner (bypass RLS by using service role)
    const supabaseService = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Get all teams where user is a member
    const { data: userMemberships, error: membershipError } = await supabaseService
      .from('team_members')
      .select('team_id, role')
      .eq('user_id', user.id);

    if (membershipError) {
      console.error('Membership error:', membershipError);
      return new Response(JSON.stringify({ error: 'Failed to fetch memberships' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const teamIds = userMemberships?.map(m => m.team_id) || [];

    if (teamIds.length === 0) {
      return new Response(JSON.stringify({
        teams: [],
        teamMembers: []
      }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Get team details
    const { data: teams, error: teamsError } = await supabaseService
      .from('teams')
      .select('*')
      .in('id', teamIds);

    if (teamsError) {
      console.error('Teams error:', teamsError);
      return new Response(JSON.stringify({ error: 'Failed to fetch teams' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Get all team members for these teams
    const { data: teamMembers, error: membersError } = await supabaseService
      .from('team_members')
      .select('*')
      .in('team_id', teamIds);

    if (membersError) {
      console.error('Members error:', membersError);
      return new Response(JSON.stringify({ error: 'Failed to fetch team members' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({
      teams: teams || [],
      teamMembers: teamMembers || []
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Edge function error:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
