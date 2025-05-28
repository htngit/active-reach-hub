
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Initialize Supabase client
const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    
    // Handle GET request for webhook verification (WhatsApp requirement)
    if (req.method === 'GET') {
      const mode = url.searchParams.get('hub.mode');
      const token = url.searchParams.get('hub.verify_token');
      const challenge = url.searchParams.get('hub.challenge');
      
      console.log('Webhook verification request:', { mode, token, challenge });
      
      // Verify the token (you should set this in your WhatsApp Business settings)
      const verifyToken = Deno.env.get('WHATSAPP_VERIFY_TOKEN') || 'your_verify_token';
      
      if (mode === 'subscribe' && token === verifyToken) {
        console.log('Webhook verified successfully');
        return new Response(challenge, {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'text/plain' },
        });
      } else {
        console.log('Webhook verification failed');
        return new Response('Forbidden', {
          status: 403,
          headers: corsHeaders,
        });
      }
    }

    // Handle POST request for webhook notifications
    if (req.method === 'POST') {
      const body = await req.json();
      console.log('WhatsApp webhook received:', JSON.stringify(body, null, 2));

      // Process webhook data
      if (body.entry && body.entry.length > 0) {
        for (const entry of body.entry) {
          if (entry.changes && entry.changes.length > 0) {
            for (const change of entry.changes) {
              if (change.field === 'messages') {
                const value = change.value;
                
                // Handle message status updates
                if (value.statuses && value.statuses.length > 0) {
                  for (const status of value.statuses) {
                    console.log('Message status update:', {
                      id: status.id,
                      status: status.status,
                      timestamp: status.timestamp,
                      recipient_id: status.recipient_id
                    });

                    // Update activity status in database
                    if (status.status === 'sent' || status.status === 'delivered' || status.status === 'read') {
                      try {
                        // Find the activity record and update status
                        const { data: activities, error: fetchError } = await supabase
                          .from('activities')
                          .select('*')
                          .eq('type', 'WhatsApp Attempt')
                          .ilike('details', `%${status.recipient_id}%`)
                          .order('timestamp', { ascending: false })
                          .limit(1);

                        if (fetchError) {
                          console.error('Error fetching activity:', fetchError);
                        } else if (activities && activities.length > 0) {
                          const activity = activities[0];
                          const updatedDetails = `${activity.details} - Status: ${status.status}`;
                          
                          const { error: updateError } = await supabase
                            .from('activities')
                            .update({ 
                              api_call_status: status.status,
                              details: updatedDetails
                            })
                            .eq('id', activity.id);

                          if (updateError) {
                            console.error('Error updating activity:', updateError);
                          } else {
                            console.log('Activity updated successfully');
                          }
                        }
                      } catch (dbError) {
                        console.error('Database operation failed:', dbError);
                      }
                    }
                  }
                }

                // Handle incoming messages (if needed)
                if (value.messages && value.messages.length > 0) {
                  for (const message of value.messages) {
                    console.log('Incoming message:', {
                      id: message.id,
                      from: message.from,
                      type: message.type,
                      timestamp: message.timestamp
                    });
                    
                    // You can add logic here to handle incoming messages
                    // For example, log them or trigger auto-responses
                  }
                }
              }
            }
          }
        }
      }

      return new Response(JSON.stringify({ success: true }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response('Method not allowed', {
      status: 405,
      headers: corsHeaders,
    });

  } catch (error) {
    console.error('Error in whatsapp-webhook function:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
