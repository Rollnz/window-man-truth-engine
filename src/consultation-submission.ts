import { ConsultationSubmission, ConsultationAnalytics } from '@/types/consultation';

/**
 * Consultation Submission Handler
 * 
 * Handles the authoritative order for submission:
 * 1. Form validation passes (handled in form component)
 * 2. Backend submission succeeds
 * 3. Confirmation state renders (handled in page component)
 * 4. Tracking fires
 * 5. Email + CRM triggers
 * 
 * If step 2 fails, nothing else fires.
 */

/**
 * Build a sanitized analytics payload for a consultation submission, omitting any PII.
 *
 * @param data - Consultation submission object; only non-PII fields from this object are included in the payload
 * @returns An analytics object containing event name, source, property and project details, timestamp, and session identifier
 */
function createAnalyticsPayload(data: ConsultationSubmission): ConsultationAnalytics {
  return {
    event: 'form_submit_success',
    source: data.source,
    propertyType: data.propertyType,
    windowCount: data.windowCount,
    impactRequired: data.impactRequired,
    hasQuote: data.hasQuote,
    timestamp: data.timestamp,
    sessionId: data.sessionId,
  };
}

/**
 * Pushes a sanitized analytics payload to the page's global data layer if present.
 *
 * No personally identifiable information is included in the payload; if the global
 * `dataLayer` is not available this function does nothing.
 *
 * @param analytics - Consultation analytics payload (sanitized, non-PII) to push to `window.dataLayer`
 */
function pushToDataLayer(analytics: ConsultationAnalytics): void {
  if (typeof window !== 'undefined' && window.dataLayer) {
    window.dataLayer.push(analytics);
  }
}

/**
 * Submit consultation form data to Supabase
 * 
 * Replace with your actual Supabase implementation:
 * 
 * import { supabase } from '@/integrations/supabase/client';
 * 
 * export async function submitConsultation(data: ConsultationSubmission): Promise<void> {
 *   const { error } = await supabase
 *     .from('consultation_submissions')
 *     .insert({
 *       first_name: data.firstName,
 *       last_name: data.lastName,
 *       email: data.email,
 *       phone: data.phone,
 *       property_type: data.propertyType,
 *       city_zip: data.cityZip,
 *       window_count: data.windowCount,
 *       window_types: data.windowTypes,
 *       impact_required: data.impactRequired,
 *       has_quote: data.hasQuote,
 *       quote_count: data.quoteCount,
 *       quote_details: data.quoteDetails,
 *       concern: data.concern,
 *       concern_other: data.concernOther,
 *       source: data.source,
 *       created_at: data.timestamp,
 *     });
 * 
 *   if (error) throw new Error(error.message);
 * 
 *   // Push analytics after successful submission
 *   pushToDataLayer(createAnalyticsPayload(data));
 * }
 */

/**
 * Simulates submitting a consultation during development by delaying, logging the submission, and pushing a sanitized analytics payload.
 *
 * @param data - ConsultationSubmission containing contact and project details used for logging, CRM tagging, and analytics
 */
export async function submitConsultation(data: ConsultationSubmission): Promise<void> {
  // Simulate network request
  await new Promise(resolve => setTimeout(resolve, 1500));
  
  // Log for development
  console.log('[Consultation Submission]', {
    contact: {
      name: `${data.firstName} ${data.lastName}`,
      email: data.email,
      phone: data.phone,
    },
    project: {
      propertyType: data.propertyType,
      cityZip: data.cityZip,
      windowCount: data.windowCount,
      windowTypes: data.windowTypes,
      impactRequired: data.impactRequired,
    },
    quotes: {
      hasQuote: data.hasQuote,
      quoteCount: data.quoteCount,
      quoteDetails: data.quoteDetails?.substring(0, 100),
    },
    concern: data.concern,
    source: data.source,
    timestamp: data.timestamp,
  });
  
  // Push analytics
  pushToDataLayer(createAnalyticsPayload(data));
  
  // Uncomment to test error handling:
  // throw new Error('Network error - please try again');
}

/**
 * Generate CRM tag identifiers for a consultation submission.
 *
 * Produces a base set of tags for routing and verification and adds conditional tags:
 * - `lead:<source>` derived from `data.source`
 * - `intent:window-replacement`
 * - `stage:verification`
 * - `product:impact-windows` when `data.impactRequired === 'yes'`
 * - `behavior:comparison-shopping` when `data.hasQuote === 'yes'` and `data.quoteCount === '3+'`
 * - `concern:<value>` when `data.concern` is present
 *
 * @param data - Consultation submission values used to derive CRM tags
 * @returns An array of tag strings to attach to the CRM record (see summary for conditional tags)
 */
export function generateCRMTags(data: ConsultationSubmission): string[] {
  const tags: string[] = [
    `lead:${data.source}`,
    'intent:window-replacement',
    'stage:verification',
  ];
  
  if (data.impactRequired === 'yes') {
    tags.push('product:impact-windows');
  }
  
  if (data.hasQuote === 'yes' && data.quoteCount === '3+') {
    tags.push('behavior:comparison-shopping');
  }
  
  if (data.concern) {
    tags.push(`concern:${data.concern}`);
  }
  
  return tags;
}

/**
 * Email Templates
 * 
 * Transactional confirmation email (trust-preserving):
 * - Subject: We're reviewing your window project
 * - Tone: Calm, short, no CTA, no selling
 * - Purpose: Prevent anxiety if text is delayed
 */
export const emailTemplates = {
  confirmation: {
    subject: "We're reviewing your window project",
    getBody: (firstName: string) => `
Hi ${firstName},

We received your project details and our window expert is reviewing them now.

What happens next:
• You'll receive a text message within 5 minutes
• Our expert will share insights on pricing, scope, or red flags
• There's no obligation and no pressure

If you have any questions before your call, just reply to this email.

—The Window Man Team

P.S. Sometimes the outcome is confirmation that your quote is fair. Either way, you'll have certainty.
    `.trim(),
  },
};

/**
 * Build a plain-text notification summarizing a consultation submission for internal channels.
 *
 * @param data - The consultation submission to summarize
 * @returns A formatted string containing contact details, project attributes, quote status, concern, source, and a locale-formatted submission timestamp
 */
export function formatInternalNotification(data: ConsultationSubmission): string {
  return `
🏠 New Consultation Request

Contact: ${data.firstName} ${data.lastName}
Email: ${data.email}
Phone: ${data.phone}

Project:
• Property: ${data.propertyType}
• Location: ${data.cityZip}
• Windows: ${data.windowCount}
• Types: ${data.windowTypes?.join(', ') || 'Not specified'}
• Impact required: ${data.impactRequired}

Quote Status:
• Has quote: ${data.hasQuote}
${data.quoteCount ? `• Quote count: ${data.quoteCount}` : ''}

Concern: ${data.concern || 'None specified'}

Source: ${data.source}
Submitted: ${new Date(data.timestamp).toLocaleString()}
  `.trim();
}