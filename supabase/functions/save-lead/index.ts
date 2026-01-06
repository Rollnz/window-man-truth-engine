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
  'insurance-savings-guide',
  'quote-builder'
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

// Attribution schema
const attributionSchema = z.object({
  utm_source: z.string().max(255).optional().nullable(),
  utm_medium: z.string().max(255).optional().nullable(),
  utm_campaign: z.string().max(255).optional().nullable(),
  utm_term: z.string().max(255).optional().nullable(),
  utm_content: z.string().max(255).optional().nullable(),
  fbc: z.string().max(255).optional().nullable(),
  fbp: z.string().max(255).optional().nullable(),
  gclid: z.string().max(255).optional().nullable(),
  msclkid: z.string().max(255).optional().nullable(),
}).optional().nullable();

// AI Context schema
const aiContextSchema = z.object({
  source_form: z.string().max(100).optional().nullable(),
  specific_detail: z.string().max(1000).optional().nullable(),
  emotional_state: z.string().max(100).optional().nullable(),
  urgency_level: z.string().max(100).optional().nullable(),
  insurance_carrier: z.string().max(100).optional().nullable(),
  window_count: z.number().int().min(0).max(500).optional().nullable(),
}).optional().nullable();

// Main lead schema
const leadSchema = z.object({
  email: z.string().trim().email('Invalid email format').max(255, 'Email too long'),
  name: z.string().trim().max(100, 'Name too long').optional().nullable(),
  phone: z.string().regex(phoneRegex, 'Invalid phone format').max(20, 'Phone too long').optional().nullable().or(z.literal('')),
  sourceTool: z.enum(allowedSourceTools).default('expert-system'),
  sessionData: sessionDataSchema,
  chatHistory: chatHistorySchema,
  consultation: consultationSchema,
  attribution: attributionSchema,
  aiContext: aiContextSchema,
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

// Determine whether the client actually sent any attribution values
function hasClientAttribution(attribution: z.infer<typeof attributionSchema> | null | undefined): boolean {
  if (!attribution) return false;

  return Object.values(attribution).some((value) => {
    if (value === null || value === undefined) return false;
    if (typeof value === 'string') {
      return value.trim().length > 0;
    }
    return true;
  });
}

// Safely parse attribution from the referer header for server-side fallback
function buildFallbackAttribution(
  referer: string | null,
  shouldParseFromReferer: boolean,
) {
  const fallbackAttribution = {
    fallback_referer: referer || null,
    fallback_utm_source: null as string | null,
    fallback_utm_medium: null as string | null,
    fallback_utm_campaign: null as string | null,
    fallback_utm_term: null as string | null,
    fallback_utm_content: null as string | null,
    fallback_gclid: null as string | null,
    fallback_msclkid: null as string | null,
    fallback_fbc: null as string | null,
    fallback_fbp: null as string | null,
  };

  if (!referer || !shouldParseFromReferer) {
    return fallbackAttribution;
  }

  try {
    const parsedUrl = new URL(referer);
    const params = parsedUrl.searchParams;

    const getParam = (key: string) => {
      const value = params.get(key);
      return value && value.trim().length > 0 ? value : null;
    };

    return {
      ...fallbackAttribution,
      fallback_utm_source: getParam('utm_source'),
      fallback_utm_medium: getParam('utm_medium'),
      fallback_utm_campaign: getParam('utm_campaign'),
      fallback_utm_term: getParam('utm_term'),
      fallback_utm_content: getParam('utm_content'),
      fallback_gclid: getParam('gclid'),
      fallback_msclkid: getParam('msclkid'),
      fallback_fbc: getParam('fbclid'),
      fallback_fbp: getParam('fbp'),
    };
  } catch (error) {
    console.warn('Failed to parse referer for fallback attribution:', error);
    return fallbackAttribution;
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

    const { 
      email, name, phone, sourceTool, sessionData, chatHistory, consultation,
      attribution, aiContext 
    } = parseResult.data;

    // Capture server-side attribution when client-side data is missing (e.g., JS blocked)
    const refererHeader = req.headers.get('referer');
    const clientAttributionPresent = hasClientAttribution(attribution);
    const fallbackAttribution = buildFallbackAttribution(refererHeader, !clientAttributionPresent);

    // Create Supabase client with service role for bypassing RLS
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    let leadId: string;
    const normalizedEmail = email.trim().toLowerCase();

    // Build the lead record with all fields
    const leadRecord = {
      email: normalizedEmail,
      name: name || null,
      phone: phone || null,
      source_tool: sourceTool,
      session_data: sessionData || {},
      chat_history: chatHistory || [],
      // Attribution fields
      utm_source: attribution?.utm_source || null,
      utm_medium: attribution?.utm_medium || null,
      utm_campaign: attribution?.utm_campaign || null,
      utm_term: attribution?.utm_term || null,
      utm_content: attribution?.utm_content || null,
      fbc: attribution?.fbc || null,
      fbp: attribution?.fbp || null,
      gclid: attribution?.gclid || null,
      msclkid: attribution?.msclkid || null,
      // Spread fallback attribution so we capture referer + any parsed params in one place
      ...fallbackAttribution,
      // AI Context fields
      source_form: aiContext?.source_form || null,
      specific_detail: aiContext?.specific_detail || null,
      emotional_state: aiContext?.emotional_state || null,
      urgency_level: aiContext?.urgency_level || null,
      insurance_carrier: aiContext?.insurance_carrier || null,
      window_count: aiContext?.window_count || null,
    };

    // Try to find existing lead by email
    try {
      const { data: existingLead, error: selectError } = await supabase
        .from('leads')
        .select('id, utm_source, gclid, fbc, msclkid')
        .eq('email', normalizedEmail)
        .maybeSingle();

      if (selectError) {
        console.error('Error checking existing lead:', selectError);
        throw new Error('Database error while checking lead');
      }

      if (existingLead) {
        // Update existing lead - preserve first-touch attribution if already set
        leadId = existingLead.id;
        
        // Only update attribution if not already set (first-touch attribution model)
        const updateRecord: Record<string, unknown> = {
          name: name || undefined,
          phone: phone || undefined,
          source_tool: sourceTool,
          session_data: sessionData || {},
          chat_history: chatHistory || [],
          updated_at: new Date().toISOString(),
          fallback_referer: fallbackAttribution.fallback_referer,
          // AI Context always updates (last-touch for context)
          source_form: aiContext?.source_form || undefined,
          specific_detail: aiContext?.specific_detail || undefined,
          emotional_state: aiContext?.emotional_state || undefined,
          urgency_level: aiContext?.urgency_level || undefined,
          insurance_carrier: aiContext?.insurance_carrier || undefined,
          window_count: aiContext?.window_count || undefined,
        };

        // Only update fallback attribution when we have parsed values (avoid wiping prior data)
        for (const [key, value] of Object.entries(fallbackAttribution)) {
          if (key === 'fallback_referer') continue; // already set unconditionally above
          if (value) {
            updateRecord[key] = value;
          }
        }
        
        // Only set attribution if not already present (first-touch)
        if (!existingLead?.utm_source && attribution?.utm_source) {
          updateRecord.utm_source = attribution.utm_source;
          updateRecord.utm_medium = attribution?.utm_medium;
          updateRecord.utm_campaign = attribution?.utm_campaign;
          updateRecord.utm_term = attribution?.utm_term;
          updateRecord.utm_content = attribution?.utm_content;
        }
        if (!existingLead?.gclid && attribution?.gclid) {
          updateRecord.gclid = attribution.gclid;
        }
        if (!existingLead?.fbc && (attribution?.fbc || attribution?.fbp)) {
          updateRecord.fbc = attribution?.fbc;
          updateRecord.fbp = attribution?.fbp;
        }
        if (!existingLead?.msclkid && attribution?.msclkid) {
          updateRecord.msclkid = attribution.msclkid;
        }

        const { error: updateError } = await supabase
          .from('leads')
          .update(updateRecord)
          .eq('id', leadId);

        if (updateError) {
          console.error('Error updating lead:', updateError);
          throw new Error('Database error while updating lead');
        }

        console.log('Updated existing lead:', leadId);
      } else {
        // Create new lead with all fields
        const { data: newLead, error: insertError } = await supabase
          .from('leads')
          .insert(leadRecord)
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
            attribution: {
              utm_source: attribution?.utm_source,
              utm_medium: attribution?.utm_medium,
              gclid: attribution?.gclid ? 'present' : undefined,
              fbc: attribution?.fbc ? 'present' : undefined,
            },
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
