import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";
import { logAttributionEvent } from "../_shared/attributionLogger.ts";

// ============= Rate Limiting Configuration =============
const RATE_LIMITS = {
  ipPerHour: 10,      // Max 10 leads per IP per hour
  ipPerDay: 50,       // Max 50 leads per IP per day
  emailPerHour: 3     // Max 3 submissions per email per hour
};

// ============= Input Validation Schemas =============

import { SOURCE_TOOLS } from '../_shared/sourceTools.ts';

const phoneRegex = /^[+]?[0-9\s\-()]{10,20}$/;

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
  sourceTool: z.enum(SOURCE_TOOLS).default('expert-system'),
  sessionData: sessionDataSchema,
  chatHistory: chatHistorySchema,
  consultation: consultationSchema,
  attribution: attributionSchema,
  aiContext: aiContextSchema,
  // Golden Thread: Optional lead ID for identity persistence
  // If provided, UPDATE existing record instead of creating new one
  leadId: z.string().uuid('Invalid lead ID format').optional().nullable(),
  // Golden Thread: Session ID for attribution tracking
  sessionId: z.string().uuid('Invalid session ID format').optional().nullable(),
  // Quote File linking: If provided, update the quote_files record to link to this lead
  quoteFileId: z.string().uuid('Invalid quote file ID format').optional().nullable(),
});

// ============= Helper Functions =============

// Extract client IP from request headers
function getClientIp(req: Request): string {
  // Try common proxy headers in order of preference
  const cfConnectingIp = req.headers.get('cf-connecting-ip');
  if (cfConnectingIp) return cfConnectingIp;

  const xForwardedFor = req.headers.get('x-forwarded-for');
  if (xForwardedFor) {
    // Take the first IP in the chain (original client)
    return xForwardedFor.split(',')[0].trim();
  }

  const xRealIp = req.headers.get('x-real-ip');
  if (xRealIp) return xRealIp;

  return 'unknown';
}

// Check rate limit against the rate_limits table
async function checkRateLimit(
  supabase: any,
  identifier: string,
  endpoint: string,
  maxRequests: number,
  windowHours: number
): Promise<{ allowed: boolean; count: number }> {
  try {
    const windowStart = new Date(Date.now() - windowHours * 60 * 60 * 1000).toISOString();

    const { count, error } = await supabase
      .from('rate_limits')
      .select('*', { count: 'exact', head: true })
      .eq('identifier', identifier)
      .eq('endpoint', endpoint)
      .gte('created_at', windowStart);

    if (error) {
      console.error('Rate limit check failed:', error);
      // Fail open - allow the request if rate limiting check fails
      return { allowed: true, count: 0 };
    }

    const currentCount = count || 0;
    return { allowed: currentCount < maxRequests, count: currentCount };
  } catch (error) {
    console.error('Rate limit check error:', error);
    // Fail open
    return { allowed: true, count: 0 };
  }
}

// Record a rate limit entry
async function recordRateLimitEntry(
  supabase: any,
  identifier: string,
  endpoint: string
): Promise<void> {
  try {
    await supabase.from('rate_limits').insert({
      identifier,
      endpoint,
    });
  } catch (error) {
    console.error('Failed to record rate limit entry:', error);
    // Non-blocking - don't fail the request
  }
}

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

  // Create Supabase client early for rate limiting
  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  // ============= Rate Limiting =============
  const clientIp = getClientIp(req);
  
  // Check IP hourly limit first (quick reject for spam)
  const ipHourlyCheck = await checkRateLimit(
    supabase,
    clientIp,
    'save-lead',
    RATE_LIMITS.ipPerHour,
    1
  );

  if (!ipHourlyCheck.allowed) {
    console.warn(`Rate limit exceeded for IP ${clientIp}: ${ipHourlyCheck.count}/${RATE_LIMITS.ipPerHour} per hour`);
    return new Response(
      JSON.stringify({
        success: false,
        error: 'Too many requests. Please try again later.',
        retryAfter: 3600
      }),
      { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  // Check IP daily limit
  const ipDailyCheck = await checkRateLimit(
    supabase,
    clientIp,
    'save-lead-daily',
    RATE_LIMITS.ipPerDay,
    24
  );

  if (!ipDailyCheck.allowed) {
    console.warn(`Daily rate limit exceeded for IP ${clientIp}: ${ipDailyCheck.count}/${RATE_LIMITS.ipPerDay} per day`);
    return new Response(
      JSON.stringify({
        success: false,
        error: 'Daily limit reached. Please try again tomorrow.',
        retryAfter: 86400
      }),
      { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
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
      attribution, aiContext, leadId: providedLeadId, sessionId, quoteFileId 
    } = parseResult.data;

    // Check email hourly limit (after validation so we have a valid email)
    const normalizedEmail = email.trim().toLowerCase();
    const emailHourlyCheck = await checkRateLimit(
      supabase,
      normalizedEmail,
      'save-lead-email',
      RATE_LIMITS.emailPerHour,
      1
    );

    if (!emailHourlyCheck.allowed) {
      console.warn(`Email rate limit exceeded for ${normalizedEmail}: ${emailHourlyCheck.count}/${RATE_LIMITS.emailPerHour} per hour`);
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Too many submissions with this email. Please try again later.',
          retryAfter: 3600
        }),
        { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    let leadId: string;

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
      // AI Context fields
      source_form: aiContext?.source_form || null,
      specific_detail: aiContext?.specific_detail || null,
      emotional_state: aiContext?.emotional_state || null,
      urgency_level: aiContext?.urgency_level || null,
      insurance_carrier: aiContext?.insurance_carrier || null,
      window_count: aiContext?.window_count || null,
    };

    // ═══════════════════════════════════════════════════════════════════════════
    // GOLDEN THREAD LOGIC: leadId takes precedence over email matching
    // ═══════════════════════════════════════════════════════════════════════════
    try {
      let existingLead: { id: string; utm_source: string | null; gclid: string | null; fbc: string | null; msclkid: string | null } | null = null;

      // PRIORITY 1: If leadId is provided, use it directly (Golden Thread)
      if (providedLeadId) {
        const { data: leadById, error: leadByIdError } = await supabase
          .from('leads')
          .select('id, utm_source, gclid, fbc, msclkid')
          .eq('id', providedLeadId)
          .maybeSingle();

        if (leadByIdError) {
          console.error('Error fetching lead by ID:', leadByIdError);
          // Don't throw - fall through to email lookup
        } else if (leadById) {
          existingLead = leadById;
          console.log('Golden Thread: Found lead by ID:', providedLeadId);
        } else {
          console.warn('Golden Thread: Provided leadId not found, falling back to email lookup:', providedLeadId);
        }
      }

      // PRIORITY 2: Fallback to email lookup if no lead found by ID
      if (!existingLead) {
        const { data: leadByEmail, error: emailSelectError } = await supabase
          .from('leads')
          .select('id, utm_source, gclid, fbc, msclkid')
          .eq('email', normalizedEmail)
          .maybeSingle();

        if (emailSelectError) {
          console.error('Error checking existing lead by email:', emailSelectError);
          throw new Error('Database error while checking lead');
        }

        existingLead = leadByEmail;
        if (existingLead) {
          console.log('Found lead by email:', existingLead.id);
        }
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
          // AI Context always updates (last-touch for context)
          source_form: aiContext?.source_form || undefined,
          specific_detail: aiContext?.specific_detail || undefined,
          emotional_state: aiContext?.emotional_state || undefined,
          urgency_level: aiContext?.urgency_level || undefined,
          insurance_carrier: aiContext?.insurance_carrier || undefined,
          window_count: aiContext?.window_count || undefined,
        };
        
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

      // Extract detailed Postgres error information for debugging
      const errorMessage = dbError instanceof Error ? dbError.message : 'Unknown database error';
      const errorCode = (dbError as any)?.code || 'UNKNOWN';
      const errorDetails = (dbError as any)?.details || null;
      const errorHint = (dbError as any)?.hint || null;

      // Log full error details server-side
      console.error('Postgres Error Details:', {
        code: errorCode,
        message: errorMessage,
        details: errorDetails,
        hint: errorHint
      });

      return new Response(
        JSON.stringify({
          success: false,
          error: 'Database error',
          // Include debug info in development/staging (filtered by env var)
          ...(Deno.env.get('ENVIRONMENT') !== 'production' && {
            debug: {
              code: errorCode,
              message: errorMessage,
              details: errorDetails
            }
          })
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // QUOTE FILE LINKING: If quoteFileId provided, link it to this lead
    // ═══════════════════════════════════════════════════════════════════════════
    let quoteFileLinked = false;
    if (quoteFileId) {
      try {
        const { error: linkError } = await supabase
          .from('quote_files')
          .update({ lead_id: leadId })
          .eq('id', quoteFileId)
          .is('lead_id', null); // Only update if not already linked

        if (linkError) {
          console.error('Error linking quote file to lead:', linkError);
          // Non-blocking - don't fail the lead save
        } else {
          quoteFileLinked = true;
          console.log('Linked quote file to lead:', { quoteFileId, leadId });

          // Log quote_file_linked event for funnel tracking
          if (sessionId) {
            logAttributionEvent({
              sessionId,
              eventName: 'quote_file_linked',
              eventCategory: 'conversion',
              pagePath: '/beat-your-quote',
              pageTitle: 'Quote File Linked - Beat Your Quote',
              leadId,
              eventData: {
                quote_file_id: quoteFileId,
                source_tool: sourceTool,
              },
              anonymousIdFallback: `quote-${quoteFileId}`,
            });
          }

          // ═══════════════════════════════════════════════════════════════════════
          // QUOTE ALERT: Notify sales team about new quote upload
          // ═══════════════════════════════════════════════════════════════════════
          try {
            // Get file details for the email
            const { data: fileData } = await supabase
              .from('quote_files')
              .select('file_path, file_name')
              .eq('id', quoteFileId)
              .maybeSingle();

            // Generate a 24-hour signed URL for the file
            let signedUrl: string | undefined;
            if (fileData?.file_path) {
              const { data: urlData } = await supabase.storage
                .from('quotes')
                .createSignedUrl(fileData.file_path, 60 * 60 * 24); // 24 hours
              signedUrl = urlData?.signedUrl;
            }

            // Send alert to admin emails
            const adminEmails = ['vansiclenp@gmail.com', 'mongoloyd@protonmail.com'];
            for (const adminEmail of adminEmails) {
              triggerEmailNotification({
                email: adminEmail,
                type: 'quote-alert',
                data: {
                  leadId,
                  leadName: name || 'Anonymous',
                  leadEmail: normalizedEmail,
                  leadPhone: phone || 'Not provided',
                  fileName: fileData?.file_name || 'quote-document',
                  signedUrl,
                  quoteFileId,
                },
              });
            }
            console.log('Quote alert emails triggered for:', adminEmails);
          } catch (alertErr) {
            console.error('Quote alert failed (non-blocking):', alertErr);
          }
        }
      } catch (linkErr) {
        console.error('Quote file linking failed (non-blocking):', linkErr);
      }
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
        
        // Log consultation_booked event for funnel tracking
        if (sessionId) {
          logAttributionEvent({
            sessionId,
            eventName: 'consultation_booked',
            eventCategory: 'conversion',
            pagePath: aiContext?.source_form || '/consultation',
            pageTitle: `Consultation Booked - ${sourceTool}`,
            leadId,
            eventData: {
              consultation_id: consultationId,
              preferred_time: consultation.preferredTime,
              source_tool: sourceTool,
            },
            anonymousIdFallback: `consult-${consultationId}`,
          });
        }
      } catch (consultDbError) {
        console.error('Consultation creation failed:', consultDbError);

        // Extract detailed error information
        const errorMessage = consultDbError instanceof Error ? consultDbError.message : 'Unknown error';
        const errorCode = (consultDbError as any)?.code || 'UNKNOWN';

        console.error('Consultation Error Details:', {
          code: errorCode,
          message: errorMessage
        });

        return new Response(
          JSON.stringify({
            success: false,
            error: 'Failed to schedule consultation',
            ...(Deno.env.get('ENVIRONMENT') !== 'production' && {
              debug: {
                code: errorCode,
                message: errorMessage
              }
            })
          }),
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

    // Record successful request for rate limiting (fire-and-forget)
    // We record both IP and email entries to track limits
    recordRateLimitEntry(supabase, clientIp, 'save-lead');
    recordRateLimitEntry(supabase, clientIp, 'save-lead-daily');
    recordRateLimitEntry(supabase, normalizedEmail, 'save-lead-email');

    // ═══════════════════════════════════════════════════════════════════════════
    // GOLDEN THREAD: Log attribution event to wm_events
    // ═══════════════════════════════════════════════════════════════════════════
    if (sessionId) {
      logAttributionEvent({
        sessionId,
        eventName: 'lead_captured',
        eventCategory: 'conversion',
        pagePath: aiContext?.source_form || '/unknown',
        pageTitle: `Lead Capture - ${sourceTool}`,
        leadId,
        eventData: {
          source_tool: sourceTool,
          email: normalizedEmail,
          has_phone: !!phone,
          has_name: !!name,
          has_consultation: !!consultationId,
          utm_source: attribution?.utm_source || null,
          utm_medium: attribution?.utm_medium || null,
        },
        anonymousIdFallback: `lead-${leadId}`,
      });
    } else {
      console.warn('Golden Thread: No sessionId provided - attribution event not persisted');
    }
    // ═══════════════════════════════════════════════════════════════════════════

    // Return success
    return new Response(
      JSON.stringify({
        success: true,
        leadId,
        consultationId,
        quoteFileLinked,
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
