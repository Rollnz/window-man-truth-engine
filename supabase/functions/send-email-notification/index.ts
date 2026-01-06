import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface EmailPayload {
  email: string;
  type: 'new-lead' | 'comparison-report' | 'consultation-booked' | 'cost-calculator-report' | 'risk-diagnostic-report' | 'fast-win-report' | 'evidence-locker-report' | 'intel-resource-delivery' | 'claim-vault-upload-confirmation';
  data: Record<string, unknown>;
}

// Email templates based on type
function generateEmailContent(payload: EmailPayload): { subject: string; html: string } {
  const { type, data } = payload;

  switch (type) {
    case 'new-lead': {
      // Use sanitized session summary instead of raw session data
      const sessionSummary = data.sessionSummary as Record<string, unknown> | undefined;
      return {
        subject: `🎯 New Lead from ${data.sourceTool || 'Website'}`,
        html: `
          <h1>New Lead Captured!</h1>
          <p><strong>Email:</strong> ${payload.email}</p>
          <p><strong>Source Tool:</strong> ${data.sourceTool || 'Unknown'}</p>
          <p><strong>Time:</strong> ${new Date().toISOString()}</p>
          ${sessionSummary ? `
          <h2>Lead Summary</h2>
          <ul>
            <li><strong>Tools Completed:</strong> ${sessionSummary.toolsCompletedCount || 0}</li>
            <li><strong>Last Tool:</strong> ${sessionSummary.lastToolCompleted || 'None'}</li>
            <li><strong>Est. Value:</strong> ${sessionSummary.estimatedValue || 'N/A'}</li>
            <li><strong>Scored:</strong> ${sessionSummary.hasRealityCheckScore ? 'Yes' : 'No'}</li>
          </ul>
          ` : ''}
          ${data.leadId ? `<p><a href="https://itswindowman.com/admin/leads/${data.leadId}">View Full Details in Dashboard</a></p>` : ''}
        `,
      };
    }

    case 'comparison-report':
      return {
        subject: '📊 Your Window Comparison Report - Its Window Man',
        html: `
          <h1>Your Personalized Window Comparison</h1>
          <p>Thank you for using our Window Comparison Tool!</p>
          
          <h2>Your Settings</h2>
          <ul>
            <li><strong>Window Count:</strong> ${data.windowCount || 'Not specified'}</li>
            <li><strong>Monthly Energy Bill:</strong> ${data.currentEnergyBill || 'Not specified'}</li>
          </ul>
          
          <h2>Key Findings</h2>
          <p>Based on your inputs, here's what we found:</p>
          <ul>
            <li><strong>10-Year Savings with High-Performance Windows:</strong> Up to 40% less than cheap alternatives</li>
            <li><strong>Energy Efficiency:</strong> Our recommended Tier 3 windows have a U-Factor of 0.24 (best in class)</li>
            <li><strong>Warranty:</strong> Lifetime parts AND labor coverage</li>
          </ul>
          
          <h2>Next Steps</h2>
          <p>Ready to see the difference in person? Schedule a free consultation with our window experts.</p>
          <p><a href="https://itswindowman.com/consultation">Book Your Free Consultation</a></p>
          
          <p>Best regards,<br>Its Window Man Team</p>
        `,
      };

    case 'cost-calculator-report':
      return {
        subject: '💰 Your Energy Cost Analysis - Its Window Man',
        html: `
          <h1>Your Personalized Energy Cost Report</h1>
          <p>Here's your detailed analysis of potential energy savings with high-performance windows.</p>
          
          <h2>Your Current Situation</h2>
          <ul>
            <li><strong>Window Count:</strong> ${data.windowCount || 'Not specified'}</li>
            <li><strong>Window Age:</strong> ${data.windowAge || 'Not specified'}</li>
            <li><strong>Monthly Energy Bill:</strong> ${data.currentEnergyBill || 'Not specified'}</li>
          </ul>
          
          <p>Contact us to learn more about how you can reduce your energy costs!</p>
          
          <p>Best regards,<br>Its Window Man Team</p>
        `,
      };

    case 'risk-diagnostic-report':
      return {
        subject: '🛡️ Your Window Protection Gap Analysis - Its Window Man',
        html: `
          <h1>Your Protection Score: ${data.protectionScore || 0}/100</h1>
          
          <h2>Risk Breakdown</h2>
          <ul>
            <li><strong>Storm Protection:</strong> ${data.stormRiskScore || 0}% protected</li>
            <li><strong>Security:</strong> ${data.securityRiskScore || 0}% protected</li>
            <li><strong>Insurance Coverage:</strong> ${data.insuranceRiskScore || 0}% protected</li>
            <li><strong>Warranty Status:</strong> ${data.warrantyRiskScore || 0}% protected</li>
          </ul>
          
          <h2>💰 Insurance Savings Opportunity</h2>
          <p>Impact windows can save Florida homeowners up to <strong>20% on insurance premiums</strong>.</p>
          
          <h2>Next Steps</h2>
          <p>Schedule a free consultation to discuss how to close your protection gaps.</p>
          <p><a href="https://itswindowman.com/consultation">Book Your Free Consultation</a></p>
          
          <p>Best regards,<br>Its Window Man Team</p>
        `,
      };

    case 'consultation-booked':
      return {
        subject: '✅ Consultation Confirmed - Its Window Man',
        html: `
          <h1>Your Consultation is Booked!</h1>
          <p>Thank you for scheduling a consultation with Its Window Man.</p>
          
          <h2>Consultation Details</h2>
          <ul>
            <li><strong>Name:</strong> ${data.name || 'Not provided'}</li>
            <li><strong>Preferred Time:</strong> ${data.preferredTime || 'Not specified'}</li>
            <li><strong>Phone:</strong> ${data.phone || 'Not provided'}</li>
          </ul>
          
          <p>One of our window experts will contact you shortly to confirm your appointment.</p>
          
          <p>Best regards,<br>Its Window Man Team</p>
        `,
      };

    case 'evidence-locker-report':
      return {
        subject: `📁 Case Study: ${data.caseNumber || 'Verified Mission'} - Its Window Man`,
        html: `
          <h1>CASE FILE: ${data.caseNumber || 'Verified Mission'}</h1>
          <p><strong>Agent:</strong> ${data.agentName || 'Verified Agent'}</p>
          <p><strong>Location:</strong> ${data.location || 'Florida'}</p>
          <p><strong>Mission:</strong> ${data.missionObjective || 'Window Upgrade'}</p>
          
          <h2>The Problem</h2>
          <p>${data.theProblem || 'Homeowner faced significant window-related challenges.'}</p>
          
          <h2>The Solution</h2>
          <p><strong>${data.theSolution || 'High-performance impact windows'}</strong></p>
          
          <h2>Verified Results</h2>
          <ul>
            ${data.verifiedStats && Array.isArray(data.verifiedStats) 
              ? (data.verifiedStats as Array<{icon: string; label: string; change: string}>).map(stat => 
                  `<li>${stat.icon} <strong>${stat.label}:</strong> ${stat.change}</li>`
                ).join('') 
              : '<li>Significant improvements verified</li>'}
          </ul>
          
          ${data.testimonialQuote ? `
          <h2>Testimonial</h2>
          <blockquote style="border-left: 4px solid #00D4FF; padding-left: 16px; font-style: italic;">
            "${data.testimonialQuote}"
          </blockquote>
          ` : ''}
          
          <h2>Ready to Open Your Own Case?</h2>
          <p><a href="https://itswindowman.com/consultation" style="background: #00D4FF; color: #000; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">Schedule Your Free Consultation</a></p>
          
          <p>Best regards,<br>Its Window Man Team</p>
        `,
      };

    case 'fast-win-report':
      return {
        subject: '🏆 Your #1 Window Upgrade - Its Window Man',
        html: `
          <h1>Your Fast Win: ${data.productName || 'Your Top Upgrade'}</h1>
          
          <div style="background: linear-gradient(135deg, #FFD700, #FFA500); padding: 24px; border-radius: 12px; margin: 20px 0;">
            <h2 style="margin: 0 0 10px 0; color: #1a1a1a;">${data.headline || 'Your #1 Upgrade'}</h2>
            <p style="font-size: 18px; margin: 0; color: #333;">"${data.statistic || 'Maximum impact for your investment'}"</p>
          </div>
          
          <h3>Why This Is Your Best Move</h3>
          <p><strong>💡 80% of results for 20% of cost</strong></p>
          <p>${data.roiStatement || 'This upgrade delivers the highest ROI based on your specific situation.'}</p>
          
          ${data.honorableMentions && Array.isArray(data.honorableMentions) && data.honorableMentions.length > 0 ? `
          <h3>Honorable Mentions</h3>
          <ul>
            ${(data.honorableMentions as Array<{name: string; reason: string}>).map((m) => `<li><strong>${m.name}:</strong> ${m.reason}</li>`).join('')}
          </ul>
          ` : ''}
          
          <h3>Ready to Get Started?</h3>
          <p>Schedule a free consultation to discuss your ${data.productName || 'upgrade'} options.</p>
          <p><a href="https://itswindowman.com/consultation" style="background: #00D4FF; color: #000; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">Get a Price Quote</a></p>
          
          <p>Best regards,<br>Its Window Man Team</p>
        `,
      };

    case 'intel-resource-delivery':
      return {
        subject: `📂 Your Document: ${data.resourceTitle || 'Declassified Intel'} - Its Window Man`,
        html: `
          <h1>🔓 DECLASSIFIED: ${data.resourceTitle || 'Your Document'}</h1>
          <p style="color: #00D4FF; font-weight: bold;">${data.resourceTagline || 'Intel Library Document'}</p>
          
          <p>${data.resourceDescription || 'Your requested document is ready for download.'}</p>
          
          <h2>What's Inside</h2>
          <ul>
            ${data.previewPoints && Array.isArray(data.previewPoints) 
              ? (data.previewPoints as string[]).map(point => `<li>${point}</li>`).join('') 
              : '<li>Expert insights and actionable strategies</li>'}
          </ul>
          
          <p style="margin: 24px 0;">
            <a href="${data.pdfUrl || '#'}" style="background: #00D4FF; color: #000; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: bold;">Download PDF (${data.pageCount || '?'} pages)</a>
          </p>
          
          <h2>Ready for Personalized Intel?</h2>
          <p>These guides are just the beginning. Get a custom analysis of your specific situation.</p>
          <p><a href="https://itswindowman.com/consultation">Schedule Your Free Consultation</a></p>
          
          <p>Best regards,<br>Its Window Man Team</p>
        `,
      };

    case 'claim-vault-upload-confirmation':
      return {
        subject: `✅ CONFIRMED: Your ${data.documentName || 'Document'} is Secured in the Vault`,
        html: `
          <h1 style="color: #00D4FF;">🔒 Document Secured</h1>
          
          <div style="background: linear-gradient(135deg, #1a1a2e, #0d0d1a); padding: 24px; border-radius: 12px; margin: 20px 0; border: 1px solid #00D4FF;">
            <h2 style="margin: 0 0 10px 0; color: #fff;">Your ${data.documentName || 'document'} has been received.</h2>
            <p style="font-size: 16px; margin: 0; color: #ccc;">It is now encrypted and stored in your Claim Survival Vault.</p>
          </div>
          
          <h3 style="color: #00D4FF;">✓ What This Means</h3>
          <ul style="color: #333;">
            <li>Your document is safely backed up in the cloud</li>
            <li>You can access it anytime from your vault</li>
            <li>One step closer to a bulletproof claim</li>
          </ul>
          
          <h3 style="color: #00D4FF;">📋 Your Progress</h3>
          <p>Every document you upload strengthens your claim documentation. A complete vault = maximum protection against claim denials.</p>
          
          <p style="margin: 24px 0;">
            <a href="https://itswindowman.com/claim-survival" style="background: #00D4FF; color: #000; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: bold;">Return to Your Vault</a>
          </p>
          
          <p>Best regards,<br>Its Window Man Team</p>
        `,
      };

    default:
      return {
        subject: 'Notification from Its Window Man',
        html: `<p>Thank you for your interest in Its Window Man.</p>`,
      };
  }
}

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
    
    const supabaseAuth = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } }
    });

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
    console.log(`Authenticated user: ${userId}`);
    // ===== END AUTHENTICATION CHECK =====

    const payload: EmailPayload = await req.json();
    const { email, type, data } = payload;

    // Validate required fields
    if (!email || !type) {
      return new Response(
        JSON.stringify({ success: false, error: 'Email and type are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Generate email content
    const { subject, html } = generateEmailContent(payload);

    // Check for Resend API key
    const resendApiKey = Deno.env.get('RESEND_API_KEY');
    const isSimulationMode = !resendApiKey || 
                              resendApiKey === '' || 
                              resendApiKey === 'placeholder' ||
                              resendApiKey === 'your-resend-api-key';

    if (isSimulationMode) {
      // SIMULATION MODE - Log to console instead of sending
      console.log('================================================');
      console.log('📧 SIMULATED EMAIL SENT');
      console.log('================================================');
      console.log(`To: ${email}`);
      console.log(`Type: ${type}`);
      console.log(`Subject: ${subject}`);
      console.log('------------------------------------------------');
      console.log('Note: Set RESEND_API_KEY to enable real email sending');
      console.log('================================================');

      return new Response(
        JSON.stringify({ 
          success: true, 
          simulated: true,
          message: 'Email simulated (no API key configured)',
          emailDetails: { to: email, subject, type }
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // REAL MODE - Send via Resend
    console.log(`Sending real email to ${email} via Resend...`);
    
    const resendResponse = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${resendApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'Its Window Man <notifications@itswindowman.com>',
        to: [email],
        subject,
        html,
      }),
    });

    if (!resendResponse.ok) {
      const errorData = await resendResponse.json().catch(() => ({}));
      console.error('Resend API error:', errorData);
      throw new Error(errorData.message || 'Failed to send email via Resend');
    }

    const resendData = await resendResponse.json();
    console.log('Email sent successfully:', resendData);

    return new Response(
      JSON.stringify({ 
        success: true, 
        simulated: false,
        emailId: resendData.id,
        message: 'Email sent successfully'
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to send notification';
    console.error('Email notification error:', error);
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
