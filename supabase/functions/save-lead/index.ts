import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";

// ============= Input Validation Schemas =============

const phoneRegex = /^[+]?[0-9\s\-()]{10,20}$/;

const allowedSourceTools = [
  'expert-system',
  'comparison-tool',
  'cost-calculator',
  'claim-survival-kit',
  'fast-win',
  'intel-library',
  'risk-diagnostic',
  'reality-check',
  'evidence-locker',
  'kitchen-table-guide',
  'sales-tactics-guide',
  'spec-checklist-guide',
  'insurance-savings-guide'
] as const;

// Session data schema with size limit
const sessionDataSchema = z.record(z.unknown()).refine(
  (data) => JSON.stringify(data).length < 50000,
  { message: 'Session data too large (max 50KB)' }
).optional().nullable();

// Chat history schema with limits
const chatHistorySchema = z.array(
  z.object({
    role: z.enum(['user', 'assistant']),
    content: z.string().max(5000, 'Chat message too long')
  })
).max(100, 'Too many chat messages (max 100)').optional().nullable();

// Consultation schema
const consultationSchema = z.object({
  name: z.string().trim().min(1, 'Name is required').max(100, 'Name too long'),
  email: z.string().trim().email('Invalid email').max(255, 'Email too long').optional(),
  phone: z.string().regex(phoneRegex, 'Invalid phone format').max(20, 'Phone too long'),
  preferredTime: z.string().trim().min(1, 'Preferred time is required').max(100, 'Preferred time too long'),
  notes: z.string().max(2000, 'Notes too long').optional().nullable()
}).optional().nullable();

// Main lead schema
const leadSchema = z.object({
  email: z.string().trim().email('Invalid email format').max(255, 'Email too long'),
  name: z.string().trim().max(100, 'Name too long').optional().nullable(),
  phone: z.string().regex(phoneRegex, 'Invalid phone format').max(20, 'Phone too long').optional().nullable().or(z.literal('')),
  sourceTool: z.enum(allowedSourceTools).default('expert-system'),
  sessionData: sessionDataSchema,
  chatHistory: chatHistorySchema,
  consultation: consultationSchema
});

// ============= Helper Functions =============

// Sanitize session data for admin emails (remove sensitive details)
function sanitizeSessionDataForEmail(sessionData: unknown): Record<string, unknown> {
  if (!sessionData || typeof sessionData !== 'object') {
    return { toolsCompletedCount: 0, estimatedValue: 'Not calculated' };
  }

  const data = sessionData as Record<string, unknown>;
  
  return {
    toolsCompletedCount: Array.isArray(data.toolsCompleted) ? data.toolsCompleted.length : 0,
    lastToolCompleted: Array.isArray(data.toolsCompleted) && data.toolsCompleted.length > 0
      ? data.toolsCompleted[data.toolsCompleted.length - 1]
      : 'None',
    hasRealityCheckScore: !!data.realityCheckScore,
    estimatedValue: typeof data.costOfInactionTotal === 'number'
      ? `$${Math.round(data.costOfInactionTotal / 1000)}k+`
      : 'Not calculated',
    hasCompletedComparison: !!data.comparisonViewed
  };
}

// Helper to trigger email notification (fire-and-forget)
async function triggerEmailNotification(payload: {
  email: string;
  type: string;
  data: Record<string, unknown>;
}) {
  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    const response = await fetch(`${supabaseUrl}/functions/v1/send-email-notification`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${supabaseServiceKey}`,
      },
      body: JSON.stringify(payload),
    });
    
    const result = await response.json();
    console.log('Email notification triggered:', result);
  } catch (error) {
    // Don't fail the main request if email fails
    console.error('Email notification failed (non-blocking):', error);
  }
}

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json();

    // ============= Validate All Inputs with Zod =============
    const parseResult = leadSchema.safeParse(body);
    
    if (!parseResult.success) {
      console.error('Validation failed:', parseResult.error.errors);
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Invalid input', 
          details: parseResult.error.errors.map(e => ({
            field: e.path.join('.'),
            message: e.message
          }))
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { email, name, phone, sourceTool, sessionData, chatHistory, consultation } = parseResult.data;

    // Create Supabase client with service role for bypassing RLS
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    let leadId: string;
    const normalizedEmail = email.trim().toLowerCase();

    // Try to find existing lead by email
    try {
      const { data: existingLead, error: selectError } = await supabase
        .from('leads')
        .select('id')
        .eq('email', normalizedEmail)
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
            source_tool: sourceTool,
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
            email: normalizedEmail,
            name: name || null,
            phone: phone || null,
            source_tool: sourceTool,
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
        
        // Trigger admin notification for new lead with SANITIZED data
        triggerEmailNotification({
          email: 'admin@thewindowman.com',
          type: 'new-lead',
          data: {
            leadEmail: normalizedEmail,
            leadId,
            sourceTool,
            sessionSummary: sanitizeSessionDataForEmail(sessionData),
          },
        });
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
        const { data: newConsultation, error: consultError } = await supabase
          .from('consultations')
          .insert({
            lead_id: leadId,
            name: consultation.name,
            email: consultation.email || normalizedEmail,
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

    // Trigger customer email based on source tool (fire-and-forget)
    // Only include safe, non-sensitive data
    const safeSessionData = {
      windowCount: sessionData?.windowCount,
      currentEnergyBill: sessionData?.currentEnergyBill,
      windowAge: sessionData?.windowAge,
    };

    if (sourceTool === 'comparison-tool') {
      triggerEmailNotification({
        email: normalizedEmail,
        type: 'comparison-report',
        data: safeSessionData,
      });
    } else if (sourceTool === 'cost-calculator') {
      triggerEmailNotification({
        email: normalizedEmail,
        type: 'cost-calculator-report',
        data: safeSessionData,
      });
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
