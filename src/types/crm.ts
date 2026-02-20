/**
 * CRM Lead Warehouse Types
 */

export type LeadStatus =
  | "new"
  | "qualifying"
  | "mql"
  | "qualified"  // Sales qualified, ready for appointment
  | "appointment_set"
  | "sat"
  | "closed_won"
  | "closed_lost"
  | "dead";

export type LeadQuality = 
  | "cold" 
  | "warm" 
  | "hot" 
  | "qualified"
  | "window_shopper"  // Low intent browser
  | "curious"         // Medium interest
  | "engaged";        // Active but not yet qualified

// Disqualification reason codes for granular tracking
export type DisqualificationReason = 
  | "outside_service_area"
  | "non_window_inquiry"
  | "duplicate"
  | "price_shopper"
  | "spam";

export interface CRMLead {
  id: string;
  created_at: string;
  updated_at: string;
  lead_id: string | null;
  first_name: string | null;
  last_name: string | null;
  email: string;
  phone: string | null;
  original_session_id: string | null;
  original_source_tool: string | null;
  engagement_score: number;
  lead_quality: LeadQuality;
  status: LeadStatus;
  last_contacted_at: string | null;
  notes: string | null;
  estimated_deal_value: number;
  actual_deal_value: number | null;
  closed_at: string | null;
  assigned_to: string | null;
  
  // Ad attribution for visual indicators (last touch)
  gclid: string | null;
  fbclid: string | null;
  // UTM source fallback for attribution badges
  utm_source: string | null;
  utm_medium: string | null;
  utm_campaign: string | null;
  utm_content: string | null;
  utm_term: string | null;
  landing_page: string | null;
  
  // Phase 1B: Last Non-Direct Attribution (preserved from paid visits)
  last_non_direct_utm_source: string | null;
  last_non_direct_utm_medium: string | null;
  last_non_direct_gclid: string | null;
  last_non_direct_fbclid: string | null;
  last_non_direct_channel: string | null;
  last_non_direct_landing_page: string | null;
  
  // Phase 1A: Server truth columns
  qualified_cv_fired?: boolean;
  captured_at?: string | null;
  qualified_at?: string | null;
  disqualified_at?: string | null;
  disqualification_reason?: DisqualificationReason | null;

  // V2 Qualification (PreQuoteLeadModalV2)
  flow_version?: string | null;
  timeline?: string | null;
  has_quote?: string | null;
  homeowner?: boolean | null;
  window_scope?: string | null;
  lead_score?: number | null;
  lead_segment?: 'HOT' | 'WARM' | 'NURTURE' | 'LOW' | null;
  qualification_completed_at?: string | null;

  // Quote file indicators (derived server-side from quote_files table)
  has_quote_file?: boolean;
  has_analyzed_quote?: boolean;
  latest_quote_status?: 'none' | 'pending' | 'completed' | 'failed' | null;
}

export interface CRMColumn {
  id: LeadStatus;
  title: string;
  color: string;
  leads: CRMLead[];
}

// State machine: Allowed transitions for CRM
export const ALLOWED_TRANSITIONS: Record<LeadStatus, LeadStatus[]> = {
  new: ["qualifying", "mql", "dead"],
  qualifying: ["mql", "qualified", "dead"],
  mql: ["qualified", "appointment_set", "dead"],
  qualified: ["appointment_set", "dead"],
  appointment_set: ["sat", "closed_won", "closed_lost", "dead"],
  sat: ["closed_won", "closed_lost", "dead"],
  closed_won: [],
  closed_lost: [],
  dead: [],
};

export const LEAD_STATUS_CONFIG: Record<LeadStatus, { title: string; color: string; description: string }> = {
  new: {
    title: "New",
    color: "bg-blue-500",
    description: "Fresh leads from the site",
  },
  qualifying: {
    title: "Qualifying",
    color: "bg-purple-500",
    description: "Actively calling/SMSing",
  },
  mql: {
    title: "MQL",
    color: "bg-amber-500",
    description: "Verified, high interest",
  },
  qualified: {
    title: "Qualified",
    color: "bg-emerald-500",
    description: "Sales qualified, ready for appointment",
  },
  appointment_set: {
    title: "Appt Set",
    color: "bg-cyan-500",
    description: "Appointment on calendar",
  },
  sat: {
    title: "Sat",
    color: "bg-indigo-500",
    description: "Client showed up",
  },
  closed_won: {
    title: "Closed Won",
    color: "bg-green-500",
    description: "SOLD!",
  },
  closed_lost: {
    title: "Closed Lost",
    color: "bg-red-500",
    description: "No sale after appointment",
  },
  dead: {
    title: "Dead",
    color: "bg-gray-500",
    description: "Disqualified lead",
  },
};

export const KANBAN_COLUMNS: LeadStatus[] = ["new", "qualifying", "mql", "qualified", "appointment_set", "sat", "closed_won"];

export const LEAD_QUALITY_CONFIG: Record<LeadQuality, { label: string; color: string }> = {
  cold: { label: "Cold", color: "bg-blue-100 text-blue-800" },
  warm: { label: "Warm", color: "bg-amber-100 text-amber-800" },
  hot: { label: "Hot", color: "bg-orange-100 text-orange-800" },
  qualified: { label: "Qualified", color: "bg-green-100 text-green-800" },
  window_shopper: { label: "Window Shopper", color: "bg-slate-100 text-slate-600" },
  curious: { label: "Curious", color: "bg-sky-100 text-sky-700" },
  engaged: { label: "Engaged", color: "bg-purple-100 text-purple-700" },
};

export const DISQUALIFICATION_REASONS: Record<DisqualificationReason, { label: string; description: string }> = {
  outside_service_area: { label: "Outside Service Area", description: "Lead location not serviceable" },
  non_window_inquiry: { label: "Non-Window Inquiry", description: "Not interested in windows" },
  duplicate: { label: "Duplicate", description: "Already exists in system" },
  price_shopper: { label: "Price Shopper", description: "Only comparing prices, not serious" },
  spam: { label: "Spam", description: "Fake or bot submission" },
};
