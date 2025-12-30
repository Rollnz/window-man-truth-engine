import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface EmailPayload {
  email: string;
  type: 'new-lead' | 'comparison-report' | 'consultation-booked' | 'cost-calculator-report';
  data: Record<string, unknown>;
}

// Email templates based on type
function generateEmailContent(payload: EmailPayload): { subject: string; html: string } {
  const { type, data } = payload;

  switch (type) {
    case 'new-lead':
      return {
        subject: `🎯 New Lead from ${data.sourceTool || 'Website'}`,
        html: `
          <h1>New Lead Captured!</h1>
          <p><strong>Email:</strong> ${payload.email}</p>
          <p><strong>Source Tool:</strong> ${data.sourceTool || 'Unknown'}</p>
          <p><strong>Time:</strong> ${new Date().toISOString()}</p>
          ${data.sessionData ? `<p><strong>Session Data:</strong> <pre>${JSON.stringify(data.sessionData, null, 2)}</pre></p>` : ''}
        `,
      };

    case 'comparison-report':
      return {
        subject: '📊 Your Window Comparison Report - The Window Man',
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
          <p><a href="https://thewindowman.com/consultation">Book Your Free Consultation</a></p>
          
          <p>Best regards,<br>The Window Man Team</p>
        `,
      };

    case 'cost-calculator-report':
      return {
        subject: '💰 Your Energy Cost Analysis - The Window Man',
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
          
          <p>Best regards,<br>The Window Man Team</p>
        `,
      };

    case 'consultation-booked':
      return {
        subject: '✅ Consultation Confirmed - The Window Man',
        html: `
          <h1>Your Consultation is Booked!</h1>
          <p>Thank you for scheduling a consultation with The Window Man.</p>
          
          <h2>Consultation Details</h2>
          <ul>
            <li><strong>Name:</strong> ${data.name || 'Not provided'}</li>
            <li><strong>Preferred Time:</strong> ${data.preferredTime || 'Not specified'}</li>
            <li><strong>Phone:</strong> ${data.phone || 'Not provided'}</li>
          </ul>
          
          <p>One of our window experts will contact you shortly to confirm your appointment.</p>
          
          <p>Best regards,<br>The Window Man Team</p>
        `,
      };

    default:
      return {
        subject: 'Notification from The Window Man',
        html: `<p>Thank you for your interest in The Window Man.</p>`,
      };
  }
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
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
      console.log('Body (HTML):');
      console.log(html);
      console.log('------------------------------------------------');
      console.log(`Data: ${JSON.stringify(data, null, 2)}`);
      console.log('================================================');
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
        from: 'The Window Man <notifications@thewindowman.com>',
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
