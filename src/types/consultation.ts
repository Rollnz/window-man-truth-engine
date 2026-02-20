/**
 * Consultation Form Types
 * 
 * Normalized data model that feeds:
 * - CRM
 * - Email triggers
 * - Analytics (sanitized)
 */

export type PropertyType = 'single-family' | 'condo' | 'townhome' | 'other';

export type WindowType = 
  | 'sliding'
  | 'single-hung'
  | 'double-hung'
  | 'picture'
  | 'doors'
  | 'not-sure';

export type ImpactRequired = 'yes' | 'no' | 'not-sure';

export type QuoteStatus = 'yes' | 'no' | 'in-progress';

export type QuoteCount = '1' | '2' | '3+';

export type ConcernType = 'price' | 'timeline' | 'quality' | 'trust' | 'other';

export type SubmissionSource = 'consultation' | 'beat-your-quote';

export interface ConsultationFormData {
  // Contact Information
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  
  // Project Details
  propertyType: PropertyType;
  cityZip: string;
  windowCount: number;
  windowTypes: WindowType[];
  impactRequired: ImpactRequired;
  
  // Quote Status
  hasQuote: QuoteStatus;
  quoteCount?: QuoteCount;
  
  // Optional
  quoteDetails?: string;
  quoteFileId?: string;
  quoteFileName?: string;
  concern?: ConcernType;
  concernOther?: string;
}

export interface ConsultationSubmission extends ConsultationFormData {
  source: SubmissionSource;
  timestamp: string;
  sessionId?: string;
}

// Form validation state
export interface FormErrors {
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  propertyType?: string;
  cityZip?: string;
  windowCount?: string;
  windowTypes?: string;
  impactRequired?: string;
  hasQuote?: string;
}

// Tracking events
export type ConsultationTrackingEvent = 
  | 'form_view'
  | 'form_start'
  | 'form_submit_success'
  | 'form_submit_error'
  | 'confirmation_view';

// Analytics payload (no PII)
export interface ConsultationAnalytics {
  event: ConsultationTrackingEvent;
  source: SubmissionSource;
  propertyType?: PropertyType;
  windowCount?: number;
  impactRequired?: ImpactRequired;
  hasQuote?: QuoteStatus;
  timestamp: string;
  sessionId?: string;
}
