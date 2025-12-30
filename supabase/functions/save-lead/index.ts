import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Simple email validation
function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const { email, name, phone, sourceTool, sessionData, chatHistory, consultation } = body;

    // Validate email
    if (!email || typeof email !== 'string') {
      return new Response(
        JSON.stringify({ success: false, error: 'Email is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!isValidEmail(email.trim())) {
      return new Response(
        JSON.stringify({ success: false, error: 'Invalid email format' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create Supabase client with service role for bypassing RLS
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    let leadId: string;

    // Try to find existing lead by email
    try {
      const { data: existingLead, error: selectError } = await supabase
        .from('leads')
        .select('id')
        .eq('email', email.trim().toLowerCase())
        .maybeSingle();

      if (selectError) {
        console.error('Error checking existing lead:', selectError);
        throw new Error('Database error while checking lead');
      }

      if (existingLead) {
        // Update existing lead
        leadId = existingLead.id;
        const { error: updateError } = await supabase
          .from('leads')
          .update({
            name: name || undefined,
            phone: phone || undefined,
            source_tool: sourceTool || 'expert-system',
            session_data: sessionData || {},
            chat_history: chatHistory || [],
            updated_at: new Date().toISOString(),
          })
          .eq('id', leadId);

        if (updateError) {
          console.error('Error updating lead:', updateError);
          throw new Error('Database error while updating lead');
        }

        console.log('Updated existing lead:', leadId);
      } else {
        // Create new lead
        const { data: newLead, error: insertError } = await supabase
          .from('leads')
          .insert({
            email: email.trim().toLowerCase(),
            name: name || null,
            phone: phone || null,
            source_tool: sourceTool || 'expert-system',
            session_data: sessionData || {},
            chat_history: chatHistory || [],
          })
          .select('id')
          .single();

        if (insertError || !newLead) {
          console.error('Error creating lead:', insertError);
          throw new Error('Database error while creating lead');
        }

        leadId = newLead.id;
        console.log('Created new lead:', leadId);
      }
    } catch (dbError) {
      console.error('Database operation failed:', dbError);
      return new Response(
        JSON.stringify({ success: false, error: 'Database error' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // If consultation data provided, create consultation record
    let consultationId: string | null = null;
    if (consultation && consultation.preferredTime) {
      try {
        // Validate consultation fields
        if (!consultation.name || !consultation.phone) {
          return new Response(
            JSON.stringify({ success: false, error: 'Name and phone are required for consultation' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        const { data: newConsultation, error: consultError } = await supabase
          .from('consultations')
          .insert({
            lead_id: leadId,
            name: consultation.name,
            email: email.trim().toLowerCase(),
            phone: consultation.phone,
            preferred_time: consultation.preferredTime,
            notes: consultation.notes || null,
            status: 'pending',
          })
          .select('id')
          .single();

        if (consultError || !newConsultation) {
          console.error('Error creating consultation:', consultError);
          throw new Error('Database error while creating consultation');
        }

        consultationId = newConsultation.id;
        console.log('Created consultation:', consultationId);
      } catch (consultDbError) {
        console.error('Consultation creation failed:', consultDbError);
        return new Response(
          JSON.stringify({ success: false, error: 'Failed to schedule consultation' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    // Return success
    return new Response(
      JSON.stringify({
        success: true,
        leadId,
        consultationId,
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Unexpected error:', error);
    return new Response(
      JSON.stringify({ success: false, error: 'An unexpected error occurred' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
