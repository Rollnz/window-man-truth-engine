// ═══════════════════════════════════════════════════════════════════════════
// NOTIFY DEAD LETTER EDGE FUNCTION
// Sends admin notifications when a call is moved to dead_letter status
// ═══════════════════════════════════════════════════════════════════════════

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface DeadLetterPayload {
  call_request_id: string;
}

interface NotificationContext {
  call_request_id: string;
  source_tool: string;
  scheduled_for: string;
  attempt_count: number;
  phone_masked: string;
  last_error: string;
  lead_name?: string;
  lead_email?: string;
}

/**
 * Masks a phone number by replacing all but the last four digits with asterisks.
 *
 * @returns The masked phone string: `'****'` if `phone` is missing or shorter than four characters, otherwise `'****'` followed by the last four digits.
 */
function maskPhone(phone: string): string {
  if (!phone || phone.length < 4) return '****';
  return `****${phone.slice(-4)}`;
}

/**
 * Send a contextual dead-letter notification email to the admin via Resend.
 *
 * Uses fields from `context` (call and optional lead details, masked phone, error, etc.)
 * to build an HTML message and posts it to the Resend Emails API using `resendApiKey`.
 *
 * @param context - NotificationContext containing call metadata and optional lead information used in the email body
 * @param resendApiKey - Resend API key used to authenticate the request
 * @param adminEmail - Destination email address for the notification
 * @returns `true` if the email was sent successfully, `false` otherwise
 */
async function sendEmailNotification(
  context: NotificationContext,
  resendApiKey: string,
  adminEmail: string
): Promise<boolean> {
  try {
    const subject = `🚨 Dead Letter Alert: ${context.source_tool} call failed`;
    const htmlBody = `
      <h2>Phone Call Dead-Lettered</h2>
      <p>A call has been moved to dead_letter after exhausting all retry attempts.</p>
      
      <h3>Call Details</h3>
      <table style="border-collapse: collapse; width: 100%; max-width: 600px;">
        <tr style="border-bottom: 1px solid #ddd;">
          <td style="padding: 8px; font-weight: bold;">Call Request ID</td>
          <td style="padding: 8px;">${context.call_request_id}</td>
        </tr>
        <tr style="border-bottom: 1px solid #ddd;">
          <td style="padding: 8px; font-weight: bold;">Source Tool</td>
          <td style="padding: 8px;">${context.source_tool}</td>
        </tr>
        <tr style="border-bottom: 1px solid #ddd;">
          <td style="padding: 8px; font-weight: bold;">Scheduled For</td>
          <td style="padding: 8px;">${context.scheduled_for}</td>
        </tr>
        <tr style="border-bottom: 1px solid #ddd;">
          <td style="padding: 8px; font-weight: bold;">Attempts</td>
          <td style="padding: 8px;">${context.attempt_count}</td>
        </tr>
        <tr style="border-bottom: 1px solid #ddd;">
          <td style="padding: 8px; font-weight: bold;">Phone</td>
          <td style="padding: 8px;">${context.phone_masked}</td>
        </tr>
        ${context.lead_name ? `
        <tr style="border-bottom: 1px solid #ddd;">
          <td style="padding: 8px; font-weight: bold;">Lead Name</td>
          <td style="padding: 8px;">${context.lead_name}</td>
        </tr>
        ` : ''}
        ${context.lead_email ? `
        <tr style="border-bottom: 1px solid #ddd;">
          <td style="padding: 8px; font-weight: bold;">Lead Email</td>
          <td style="padding: 8px;">${context.lead_email}</td>
        </tr>
        ` : ''}
      </table>
      
      <h3>Error</h3>
      <pre style="background: #f5f5f5; padding: 12px; border-radius: 4px; overflow-x: auto;">${context.last_error}</pre>
      
      <p style="margin-top: 20px;">
        <a href="https://window-man-truth-engine.lovable.app/admin" 
           style="background: #dc2626; color: white; padding: 10px 20px; text-decoration: none; border-radius: 4px;">
          View Admin Dashboard
        </a>
      </p>
    `;

    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${resendApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'Window Man Alerts <alerts@windowman.com>',
        to: adminEmail,
        subject,
        html: htmlBody,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[NotifyDeadLetter] Resend API error:', response.status, errorText);
      return false;
    }

    console.log('[NotifyDeadLetter] Email sent successfully');
    return true;
  } catch (error) {
    console.error('[NotifyDeadLetter] Failed to send email:', error);
    return false;
  }
}

/**
 * Send a `dead_letter` event payload (including the notification context and timestamp) to a webhook URL.
 *
 * @param context - Notification context containing call and lead details
 * @param webhookUrl - Full URL of the webhook endpoint to receive the JSON payload
 * @returns `true` if the webhook responded with a successful HTTP status, `false` otherwise
 */
async function sendWebhookNotification(
  context: NotificationContext,
  webhookUrl: string
): Promise<boolean> {
  try {
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        event: 'dead_letter',
        timestamp: new Date().toISOString(),
        ...context,
      }),
    });

    if (!response.ok) {
      console.error('[NotifyDeadLetter] Webhook error:', response.status);
      return false;
    }

    console.log('[NotifyDeadLetter] Webhook notification sent');
    return true;
  } catch (error) {
    console.error('[NotifyDeadLetter] Failed to send webhook:', error);
    return false;
  }
}

/**
 * Post a formatted dead-letter alert to a Slack incoming webhook.
 *
 * @param context - Notification context containing call details and optional lead info
 * @param slackWebhookUrl - Slack incoming webhook URL to receive the alert
 * @returns `true` if Slack accepted the message, `false` otherwise.
 */
async function sendSlackNotification(
  context: NotificationContext,
  slackWebhookUrl: string
): Promise<boolean> {
  try {
    const blocks = [
      {
        type: 'header',
        text: {
          type: 'plain_text',
          text: '🚨 Dead Letter Alert',
          emoji: true,
        },
      },
      {
        type: 'section',
        fields: [
          { type: 'mrkdwn', text: `*Source Tool:*\n${context.source_tool}` },
          { type: 'mrkdwn', text: `*Attempts:*\n${context.attempt_count}` },
          { type: 'mrkdwn', text: `*Phone:*\n${context.phone_masked}` },
          { type: 'mrkdwn', text: `*Scheduled:*\n${context.scheduled_for}` },
        ],
      },
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `*Error:*\n\`\`\`${context.last_error.slice(0, 500)}\`\`\``,
        },
      },
      {
        type: 'context',
        elements: [
          {
            type: 'mrkdwn',
            text: `Call Request ID: \`${context.call_request_id}\``,
          },
        ],
      },
    ];

    const response = await fetch(slackWebhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ blocks }),
    });

    if (!response.ok) {
      console.error('[NotifyDeadLetter] Slack error:', response.status);
      return false;
    }

    console.log('[NotifyDeadLetter] Slack notification sent');
    return true;
  } catch (error) {
    console.error('[NotifyDeadLetter] Failed to send Slack:', error);
    return false;
  }
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

  if (!supabaseUrl || !serviceRoleKey) {
    console.error('[NotifyDeadLetter] Missing Supabase credentials');
    return new Response(
      JSON.stringify({ error: 'Server configuration error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey);

  try {
    const body = await req.json() as DeadLetterPayload;
    const { call_request_id } = body;

    if (!call_request_id) {
      return new Response(
        JSON.stringify({ error: 'call_request_id is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('[NotifyDeadLetter] Processing notification for:', call_request_id);

    // Fetch call details
    const { data: callData, error: callError } = await supabase
      .from('pending_calls')
      .select('*')
      .eq('call_request_id', call_request_id)
      .single();

    if (callError || !callData) {
      console.error('[NotifyDeadLetter] Call not found:', callError);
      return new Response(
        JSON.stringify({ error: 'Call not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Fetch lead details if available
    let leadName: string | undefined;
    let leadEmail: string | undefined;

    if (callData.lead_id) {
      const { data: leadData } = await supabase
        .from('leads')
        .select('name, email')
        .eq('id', callData.lead_id)
        .single();

      if (leadData) {
        leadName = leadData.name || undefined;
        leadEmail = leadData.email || undefined;
      }
    }

    // Build notification context
    const context: NotificationContext = {
      call_request_id,
      source_tool: callData.source_tool,
      scheduled_for: callData.scheduled_for,
      attempt_count: callData.attempt_count,
      phone_masked: maskPhone(callData.phone_e164),
      last_error: callData.last_error || 'Unknown error',
      lead_name: leadName,
      lead_email: leadEmail,
    };

    // Try notification methods in order of preference
    const resendApiKey = Deno.env.get('RESEND_API_KEY');
    const adminAlertEmail = Deno.env.get('ADMIN_ALERT_EMAIL') || 'vansiclenp@gmail.com';
    const slackWebhookUrl = Deno.env.get('SLACK_WEBHOOK_URL');
    const adminAlertWebhook = Deno.env.get('ADMIN_ALERT_WEBHOOK_URL');

    let notificationSent = false;

    // Try Slack first (fastest feedback)
    if (slackWebhookUrl && !notificationSent) {
      notificationSent = await sendSlackNotification(context, slackWebhookUrl);
    }

    // Try email
    if (resendApiKey && !notificationSent) {
      notificationSent = await sendEmailNotification(context, resendApiKey, adminAlertEmail);
    }

    // Try generic webhook
    if (adminAlertWebhook && !notificationSent) {
      notificationSent = await sendWebhookNotification(context, adminAlertWebhook);
    }

    if (!notificationSent) {
      console.warn('[NotifyDeadLetter] No notification method configured or all failed');
      // Still return success since the call was already dead-lettered
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        notification_sent: notificationSent,
        call_request_id,
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('[NotifyDeadLetter] Unexpected error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});