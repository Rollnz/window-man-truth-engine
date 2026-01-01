/**
 * Google Tag Manager Integration
 * 
 * This file provides helper functions to send events to GTM's dataLayer.
 * All conversion tracking (leads, consultations, tool completions) flows through here.
 */

// Replace with your actual GTM ID from Tag Manager
export const GTM_ID = 'GTM-XXXXXXX';

// Extend Window interface for TypeScript
declare global {
  interface Window {
    dataLayer: any[];
  }
}

/**
 * Generic GTM event pusher
 * @param event - Event name (use snake_case: 'lead_captured', 'tool_completed')
 * @param data - Additional data to send with event
 */
export const gtmEvent = (event: string, data: Record<string, any> = {}) => {
  if (typeof window !== 'undefined' && window.dataLayer) {
    window.dataLayer.push({
      event,
      timestamp: new Date().toISOString(),
      ...data,
    });
    console.log('[GTM Event]', event, data);
  } else {
    console.warn('[GTM] dataLayer not available');
  }
};

/**
 * Track lead capture (email submitted)
 * Fires when user provides email in any tool
 */
export const trackLeadCapture = (params: {
  sourceTool: string;
  email: string;
  leadScore?: number;
  hasPhone?: boolean;
}) => {
  const emailDomain = params.email.split('@')[1] || 'unknown';
  
  gtmEvent('lead_captured', {
    source_tool: params.sourceTool,
    email_domain: emailDomain, // Don't send full email to GTM (privacy)
    lead_score: params.leadScore || 0,
    has_phone: params.hasPhone || false,
    conversion_type: 'lead',
  });
  
  // Also fire standard conversion event for easier setup
  gtmEvent('conversion', {
    conversion_label: 'lead',
    value: 50.00, // Estimated lead value
    currency: 'USD',
  });
};

/**
 * Track consultation booking
 * Fires when user books a consultation
 */
export const trackConsultation = (params: {
  name: string;
  phone: string;
  email: string;
  leadScore?: number;
}) => {
  gtmEvent('consultation_booked', {
    has_name: !!params.name,
    has_phone: !!params.phone,
    has_email: !!params.email,
    lead_score: params.leadScore || 0,
    conversion_type: 'consultation',
  });
  
  // Higher value conversion
  gtmEvent('conversion', {
    conversion_label: 'consultation',
    value: 200.00, // Estimated consultation value
    currency: 'USD',
  });
};

/**
 * Track tool completion
 * Fires when user completes a tool (quiz, assessment, calculator)
 */
export const trackToolCompletion = (params: {
  toolName: string;
  score?: number;
  duration?: number; // milliseconds
}) => {
  gtmEvent('tool_completed', {
    tool_name: params.toolName,
    score: params.score,
    duration_seconds: params.duration ? Math.round(params.duration / 1000) : undefined,
  });
};

/**
 * Track tool start
 * Fires when user starts a tool
 */
export const trackToolStart = (toolName: string) => {
  gtmEvent('tool_started', {
    tool_name: toolName,
  });
};

/**
 * Track page view (for SPAs)
 * Call this on route changes
 */
export const trackPageView = (params: {
  path: string;
  title: string;
}) => {
  gtmEvent('page_view', {
    page_path: params.path,
    page_title: params.title,
  });
};

/**
 * Track document upload (Claim Survival)
 * Fires when user uploads a document
 */
export const trackDocumentUpload = (params: {
  documentType: string;
  fileSize: number;
}) => {
  gtmEvent('document_uploaded', {
    document_type: params.documentType,
    file_size_kb: Math.round(params.fileSize / 1024),
  });
};

/**
 * Track quote upload (Quote Scanner)
 * Fires when user uploads a quote for analysis
 */
export const trackQuoteUpload = () => {
  gtmEvent('quote_uploaded', {
    conversion_type: 'quote_analysis',
  });
};

/**
 * Track expert chat message
 * Fires when user sends a message in Expert Chat
 */
export const trackChatMessage = (params: {
  messageCount: number;
  isFirstMessage: boolean;
}) => {
  gtmEvent('chat_message_sent', {
    message_count: params.messageCount,
    is_first_message: params.isFirstMessage,
  });
};

/**
 * Track error events (for debugging)
 */
export const trackError = (params: {
  errorType: string;
  errorMessage: string;
  page: string;
}) => {
  gtmEvent('error_occurred', {
    error_type: params.errorType,
    error_message: params.errorMessage,
    page: params.page,
  });
};
