import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@2.0.0";
import { Webhook } from "https://esm.sh/standardwebhooks@1.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));
const hookSecret = Deno.env.get("SEND_EMAIL_HOOK_SECRET") as string;

interface AuthEmailPayload {
  user: {
    id: string;
    email: string;
    user_metadata?: {
      name?: string;
    };
  };
  email_data: {
    token: string;
    token_hash: string;
    redirect_to: string;
    email_action_type: "recovery" | "magiclink" | "signup" | "email_change";
    site_url: string;
  };
}

function getEmailContent(
  emailType: string,
  userName: string,
  actionUrl: string
): { subject: string; html: string } {
  const commonStyles = `
    <style>
      body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, sans-serif; line-height: 1.6; color: #333; }
      .container { max-width: 600px; margin: 0 auto; padding: 40px 20px; }
      .header { text-align: center; margin-bottom: 30px; }
      .logo { font-size: 24px; font-weight: bold; color: #0F766E; }
      .content { background: #f9fafb; border-radius: 12px; padding: 30px; margin-bottom: 30px; }
      .button { display: inline-block; background: #0F766E; color: white; padding: 14px 28px; border-radius: 8px; text-decoration: none; font-weight: 600; margin: 20px 0; }
      .button:hover { background: #0D6460; }
      .footer { text-align: center; color: #6b7280; font-size: 14px; }
      .note { background: #fef3c7; border-radius: 8px; padding: 16px; margin-top: 20px; font-size: 14px; }
    </style>
  `;

  switch (emailType) {
    case "recovery":
      return {
        subject: "Reset Your Window Truth Engine Password",
        html: `
          <!DOCTYPE html>
          <html>
          <head>${commonStyles}</head>
          <body>
            <div class="container">
              <div class="header">
                <div class="logo">🏠 Window Truth Engine</div>
              </div>
              <div class="content">
                <h2>Reset Your Password</h2>
                <p>Hi${userName ? ` ${userName}` : ""},</p>
                <p>We received a request to reset your password. Click the button below to create a new password:</p>
                <p style="text-align: center;">
                  <a href="${actionUrl}" class="button">Reset Password</a>
                </p>
                <div class="note">
                  <strong>⏰ This link expires in 1 hour.</strong><br>
                  If you didn't request this, you can safely ignore this email.
                </div>
              </div>
              <div class="footer">
                <p>© ${new Date().getFullYear()} Window Truth Engine. All rights reserved.</p>
              </div>
            </div>
          </body>
          </html>
        `,
      };

    case "magiclink":
      return {
        subject: "Sign In to Window Truth Engine",
        html: `
          <!DOCTYPE html>
          <html>
          <head>${commonStyles}</head>
          <body>
            <div class="container">
              <div class="header">
                <div class="logo">🏠 Window Truth Engine</div>
              </div>
              <div class="content">
                <h2>Sign In Request</h2>
                <p>Hi${userName ? ` ${userName}` : ""},</p>
                <p>Click the button below to sign in to your account:</p>
                <p style="text-align: center;">
                  <a href="${actionUrl}" class="button">Sign In</a>
                </p>
                <div class="note">
                  <strong>⏰ This link expires in 1 hour.</strong><br>
                  If you didn't request this, you can safely ignore this email.
                </div>
              </div>
              <div class="footer">
                <p>© ${new Date().getFullYear()} Window Truth Engine. All rights reserved.</p>
              </div>
            </div>
          </body>
          </html>
        `,
      };

    case "signup":
      return {
        subject: "Verify Your Window Truth Engine Email",
        html: `
          <!DOCTYPE html>
          <html>
          <head>${commonStyles}</head>
          <body>
            <div class="container">
              <div class="header">
                <div class="logo">🏠 Window Truth Engine</div>
              </div>
              <div class="content">
                <h2>Welcome! Verify Your Email</h2>
                <p>Hi${userName ? ` ${userName}` : ""},</p>
                <p>Thanks for signing up! Please verify your email address by clicking the button below:</p>
                <p style="text-align: center;">
                  <a href="${actionUrl}" class="button">Verify Email</a>
                </p>
                <div class="note">
                  <strong>⏰ This link expires in 24 hours.</strong>
                </div>
              </div>
              <div class="footer">
                <p>© ${new Date().getFullYear()} Window Truth Engine. All rights reserved.</p>
              </div>
            </div>
          </body>
          </html>
        `,
      };

    case "email_change":
      return {
        subject: "Confirm Your Email Change - Window Truth Engine",
        html: `
          <!DOCTYPE html>
          <html>
          <head>${commonStyles}</head>
          <body>
            <div class="container">
              <div class="header">
                <div class="logo">🏠 Window Truth Engine</div>
              </div>
              <div class="content">
                <h2>Confirm Email Change</h2>
                <p>Hi${userName ? ` ${userName}` : ""},</p>
                <p>You requested to change your email address. Click the button below to confirm:</p>
                <p style="text-align: center;">
                  <a href="${actionUrl}" class="button">Confirm Email Change</a>
                </p>
                <div class="note">
                  <strong>⏰ This link expires in 1 hour.</strong><br>
                  If you didn't request this change, please secure your account immediately.
                </div>
              </div>
              <div class="footer">
                <p>© ${new Date().getFullYear()} Window Truth Engine. All rights reserved.</p>
              </div>
            </div>
          </body>
          </html>
        `,
      };

    default:
      return {
        subject: "Window Truth Engine Notification",
        html: `
          <!DOCTYPE html>
          <html>
          <head>${commonStyles}</head>
          <body>
            <div class="container">
              <div class="header">
                <div class="logo">🏠 Window Truth Engine</div>
              </div>
              <div class="content">
                <p>Hi${userName ? ` ${userName}` : ""},</p>
                <p>You have a notification from Window Truth Engine.</p>
                <p style="text-align: center;">
                  <a href="${actionUrl}" class="button">Take Action</a>
                </p>
              </div>
              <div class="footer">
                <p>© ${new Date().getFullYear()} Window Truth Engine. All rights reserved.</p>
              </div>
            </div>
          </body>
          </html>
        `,
      };
  }
}

serve(async (req: Request): Promise<Response> => {
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  const payload = await req.text();
  const headers = Object.fromEntries(req.headers);

  try {
    // Verify the webhook signature
    const wh = new Webhook(hookSecret);
    const {
      user,
      email_data: { token, token_hash, redirect_to, email_action_type, site_url },
    } = wh.verify(payload, headers) as AuthEmailPayload;

    console.log(`Processing ${email_action_type} email for ${user.email}`);

    // Build the action URL
    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? site_url;
    const actionUrl = `${supabaseUrl}/auth/v1/verify?token=${token_hash}&type=${email_action_type}&redirect_to=${redirect_to}`;

    // Get email content based on type
    const userName = user.user_metadata?.name || "";
    const { subject, html } = getEmailContent(email_action_type, userName, actionUrl);

    // Send email via Resend
    const { data, error } = await resend.emails.send({
      from: "Window Truth Engine <noreply@windowman.com>",
      to: [user.email],
      subject,
      html,
    });

    if (error) {
      console.error("Resend error:", error);
      throw new Error(`Failed to send email: ${error.message}`);
    }

    console.log(`Email sent successfully: ${data?.id}`);

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error: any) {
    console.error("Auth email hook error:", error);
    return new Response(
      JSON.stringify({
        error: {
          http_code: error.code || 500,
          message: error.message,
        },
      }),
      {
        status: 401,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
});
