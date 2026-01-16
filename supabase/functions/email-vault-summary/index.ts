import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { logAttributionEvent } from "../_shared/attributionLogger.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface SessionData {
  realityCheckScore?: number;
  overallProtectionScore?: number;
  quizScore?: number;
  quizVulnerability?: string;
  costOfInactionTotal?: number;
  stormRiskScore?: number;
  securityRiskScore?: number;
  insuranceRiskScore?: number;
  warrantyRiskScore?: number;
  fastWinResult?: string;
  toolsCompleted?: string[];
  claimVaultProgress?: Record<string, boolean>;
  unlockedResources?: string[];
  caseStudiesViewed?: string[];
}

interface EmailRequest {
  email: string;
  sessionData: SessionData;
  // Golden Thread: Attribution tracking
  leadId?: string;
  sessionId?: string;
}

function generateVaultSummaryEmail(data: SessionData): { subject: string; html: string } {
  const toolsCompleted = data.toolsCompleted || [];
  const completionRate = Math.round((toolsCompleted.length / 10) * 100);
  
  // Calculate claim readiness
  const claimProgress = data.claimVaultProgress || {};
  const checkedItems = Object.values(claimProgress).filter(Boolean).length;
  const totalItems = 12; // Total checklist items
  const claimReadiness = Math.round((checkedItems / totalItems) * 100);

  return {
    subject: `📊 Your Window Protection Dashboard Summary`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #0d0d1a; color: #ffffff;">
        <div style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
          
          <!-- Header -->
          <div style="text-align: center; margin-bottom: 32px;">
            <h1 style="color: #00D4FF; margin: 0 0 8px 0; font-size: 28px;">🔒 Your Vault Summary</h1>
            <p style="color: #888; margin: 0;">Its Window Man Protection Dashboard</p>
          </div>
          
          <!-- Progress Overview -->
          <div style="background: linear-gradient(135deg, #1a1a2e, #16213e); border-radius: 12px; padding: 24px; margin-bottom: 24px; border: 1px solid #00D4FF33;">
            <h2 style="color: #00D4FF; margin: 0 0 16px 0; font-size: 18px;">📈 Your Progress</h2>
            <div style="display: flex; justify-content: space-between; margin-bottom: 12px;">
              <span style="color: #ccc;">Tools Completed</span>
              <span style="color: #00D4FF; font-weight: bold;">${toolsCompleted.length} of 10</span>
            </div>
            <div style="background: #333; border-radius: 4px; height: 8px; overflow: hidden;">
              <div style="background: linear-gradient(90deg, #00D4FF, #0066FF); height: 100%; width: ${completionRate}%;"></div>
            </div>
          </div>
          
          <!-- Scores Section -->
          <div style="background: #1a1a2e; border-radius: 12px; padding: 24px; margin-bottom: 24px;">
            <h2 style="color: #fff; margin: 0 0 20px 0; font-size: 18px;">🎯 Your Scores</h2>
            
            ${data.realityCheckScore !== undefined ? `
            <div style="display: flex; justify-content: space-between; padding: 12px 0; border-bottom: 1px solid #333;">
              <span style="color: #ccc;">Reality Check Score</span>
              <span style="color: ${data.realityCheckScore >= 70 ? '#22c55e' : data.realityCheckScore >= 40 ? '#eab308' : '#ef4444'}; font-weight: bold;">${data.realityCheckScore}/100</span>
            </div>
            ` : ''}
            
            ${data.overallProtectionScore !== undefined ? `
            <div style="display: flex; justify-content: space-between; padding: 12px 0; border-bottom: 1px solid #333;">
              <span style="color: #ccc;">Protection Score</span>
              <span style="color: ${data.overallProtectionScore >= 70 ? '#22c55e' : data.overallProtectionScore >= 40 ? '#eab308' : '#ef4444'}; font-weight: bold;">${data.overallProtectionScore}/100</span>
            </div>
            ` : ''}
            
            ${data.quizScore !== undefined ? `
            <div style="display: flex; justify-content: space-between; padding: 12px 0; border-bottom: 1px solid #333;">
              <span style="color: #ccc;">Window IQ</span>
              <span style="color: #00D4FF; font-weight: bold;">${data.quizScore}/10 (${data.quizVulnerability || 'N/A'})</span>
            </div>
            ` : ''}
            
            ${data.costOfInactionTotal !== undefined ? `
            <div style="display: flex; justify-content: space-between; padding: 12px 0; border-bottom: 1px solid #333;">
              <span style="color: #ccc;">10-Year Cost of Waiting</span>
              <span style="color: #ef4444; font-weight: bold;">$${data.costOfInactionTotal.toLocaleString()}</span>
            </div>
            ` : ''}
            
            ${data.fastWinResult ? `
            <div style="display: flex; justify-content: space-between; padding: 12px 0;">
              <span style="color: #ccc;">Fast Win Recommendation</span>
              <span style="color: #22c55e; font-weight: bold;">${data.fastWinResult}</span>
            </div>
            ` : ''}
          </div>
          
          <!-- Risk Breakdown -->
          ${data.stormRiskScore !== undefined ? `
          <div style="background: #1a1a2e; border-radius: 12px; padding: 24px; margin-bottom: 24px;">
            <h2 style="color: #fff; margin: 0 0 20px 0; font-size: 18px;">🛡️ Risk Breakdown</h2>
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px;">
              <div style="background: #0d0d1a; padding: 16px; border-radius: 8px; text-align: center;">
                <div style="color: #888; font-size: 12px; margin-bottom: 4px;">Storm</div>
                <div style="color: #00D4FF; font-size: 24px; font-weight: bold;">${data.stormRiskScore}%</div>
              </div>
              <div style="background: #0d0d1a; padding: 16px; border-radius: 8px; text-align: center;">
                <div style="color: #888; font-size: 12px; margin-bottom: 4px;">Security</div>
                <div style="color: #00D4FF; font-size: 24px; font-weight: bold;">${data.securityRiskScore || 0}%</div>
              </div>
              <div style="background: #0d0d1a; padding: 16px; border-radius: 8px; text-align: center;">
                <div style="color: #888; font-size: 12px; margin-bottom: 4px;">Insurance</div>
                <div style="color: #00D4FF; font-size: 24px; font-weight: bold;">${data.insuranceRiskScore || 0}%</div>
              </div>
              <div style="background: #0d0d1a; padding: 16px; border-radius: 8px; text-align: center;">
                <div style="color: #888; font-size: 12px; margin-bottom: 4px;">Warranty</div>
                <div style="color: #00D4FF; font-size: 24px; font-weight: bold;">${data.warrantyRiskScore || 0}%</div>
              </div>
            </div>
          </div>
          ` : ''}
          
          <!-- Claim Readiness -->
          <div style="background: linear-gradient(135deg, #1a1a2e, #16213e); border-radius: 12px; padding: 24px; margin-bottom: 24px; border: 1px solid #00D4FF33;">
            <h2 style="color: #00D4FF; margin: 0 0 16px 0; font-size: 18px;">📋 Claim Readiness</h2>
            <div style="display: flex; justify-content: space-between; margin-bottom: 12px;">
              <span style="color: #ccc;">Documents & Checklist</span>
              <span style="color: #00D4FF; font-weight: bold;">${claimReadiness}%</span>
            </div>
            <div style="background: #333; border-radius: 4px; height: 8px; overflow: hidden;">
              <div style="background: linear-gradient(90deg, #22c55e, #16a34a); height: 100%; width: ${claimReadiness}%;"></div>
            </div>
          </div>
          
          <!-- CTA -->
          <div style="text-align: center; padding: 24px 0;">
            <a href="https://itswindowman.com/vault" style="display: inline-block; background: #00D4FF; color: #000; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-weight: bold; font-size: 16px;">
              Return to Your Vault
            </a>
          </div>
          
          <!-- Footer -->
          <div style="text-align: center; padding-top: 24px; border-top: 1px solid #333;">
            <p style="color: #666; font-size: 12px; margin: 0;">
              This summary was generated from your Its Window Man Vault.<br>
              Questions? Reply to this email.
            </p>
          </div>
          
        </div>
      </body>
      </html>
    `,
  };
}

// Attribution logging now uses shared utility from _shared/attributionLogger.ts

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // ===== AUTHENTICATION CHECK =====
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(
        JSON.stringify({ success: false, error: 'Authentication required' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const supabaseServiceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    // Auth client for user verification
    const supabaseAuth = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } }
    });

    // Note: Admin client created inside logAttributionEvent to avoid type inference issues

    const token = authHeader.replace('Bearer ', '');
    const { data: claimsData, error: claimsError } = await supabaseAuth.auth.getClaims(token);
    
    if (claimsError || !claimsData?.claims) {
      console.error('Auth error:', claimsError);
      return new Response(
        JSON.stringify({ success: false, error: 'Invalid authentication' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const userId = claimsData.claims.sub;
    const userEmail = claimsData.claims.email;
    console.log(`Authenticated user: ${userId}`);
    // ===== END AUTHENTICATION CHECK =====

    const { email, sessionData, leadId, sessionId }: EmailRequest = await req.json();

    // ===== GOLDEN THREAD ATTRIBUTION LOGGING =====
    console.log('Attribution - Vault Email - Lead ID:', leadId || 'anonymous');
    console.log('Attribution - Vault Email - Session ID:', sessionId || 'not provided');
    console.log('Attribution - Vault Email - User ID:', userId);
    // ===== END ATTRIBUTION LOGGING =====

    // Use authenticated user's email if not provided, or validate email matches
    const targetEmail = email || userEmail;
    
    if (!targetEmail) {
      return new Response(
        JSON.stringify({ success: false, error: 'Email is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { subject, html } = generateVaultSummaryEmail(sessionData);

    // Check for Resend API key
    const resendApiKey = Deno.env.get('RESEND_API_KEY');
    const isSimulationMode = !resendApiKey || 
                              resendApiKey === '' || 
                              resendApiKey === 'placeholder';

    if (isSimulationMode) {
      console.log('================================================');
      console.log('📧 SIMULATED VAULT SUMMARY EMAIL');
      console.log('================================================');
      console.log(`To: ${targetEmail}`);
      console.log(`Subject: ${subject}`);
      console.log(`Lead ID: ${leadId || 'anonymous'}`);
      console.log(`Session ID: ${sessionId || 'not provided'}`);
      console.log('================================================');

      // Still log the attribution event even in simulation mode
      if (sessionId) {
        await logAttributionEvent({
          sessionId,
          eventName: 'vault_email_sent',
          eventCategory: 'vault',
          pagePath: '/vault',
          pageTitle: 'Vault Summary Email',
          leadId,
          eventData: { recipient_email: targetEmail, user_id: userId },
          anonymousIdFallback: `vault-email-${userId}`,
        });
      }

      return new Response(
        JSON.stringify({ 
          success: true, 
          simulated: true,
          message: 'Email simulated (no API key configured)',
          leadId: leadId || null,
          sessionId: sessionId || null,
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Send via Resend
    const resendResponse = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${resendApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'Its Window Man <notifications@itswindowman.com>',
        to: [targetEmail],
        subject,
        html,
      }),
    });

    if (!resendResponse.ok) {
      const errorData = await resendResponse.json().catch(() => ({}));
      throw new Error(errorData.message || 'Failed to send email');
    }

    const resendData = await resendResponse.json();
    console.log('Vault summary email sent:', { 
      ...resendData, 
      leadId: leadId || 'anonymous',
      sessionId: sessionId || 'not provided',
    });

    // ===== PERSIST ATTRIBUTION EVENT =====
    if (sessionId) {
      await logAttributionEvent({
        sessionId,
        eventName: 'vault_email_sent',
        eventCategory: 'vault',
        pagePath: '/vault',
        pageTitle: 'Vault Summary Email',
        leadId,
        eventData: { recipient_email: targetEmail, user_id: userId, email_id: resendData.id },
        anonymousIdFallback: `vault-email-${userId}`,
      });
    } else {
      console.warn('No sessionId provided - attribution event not persisted');
    }
    // ===== END ATTRIBUTION EVENT =====

    return new Response(
      JSON.stringify({ 
        success: true, 
        emailId: resendData.id, 
        leadId: leadId || null,
        sessionId: sessionId || null,
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to send email';
    console.error('Email error:', error);
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});