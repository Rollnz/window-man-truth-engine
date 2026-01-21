/**
 * Profitability Schema Types
 * 
 * Relationships:
 * - leads (capture) → wm_leads (CRM warehouse)
 * - wm_leads ← opportunities (pipeline/forecast)
 * - wm_leads → deals (money truth)
 * - ad_spend_daily (standalone, joined by date + campaign for ROAS)
 */

// ============================================
// ENUM TYPES
// ============================================

export type OpportunityStage = 
  | 'new'
  | 'qualifying'
  | 'quoted'
  | 'negotiating'
  | 'won'
  | 'lost';

export type DealOutcome = 'won' | 'lost';

export type PlatformType = 'meta' | 'google' | 'other';

export type DealPaymentStatus = 
  | 'unpaid'
  | 'deposit_paid'
  | 'paid_in_full'
  | 'refunded';

// ============================================
// TABLE INTERFACES
// ============================================

export interface Opportunity {
  id: string;
  wm_lead_id: string;
  stage: OpportunityStage;
  expected_value: number;
  probability: number; // 0-100
  assigned_to: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface OpportunityInsert {
  wm_lead_id: string;
  stage?: OpportunityStage;
  expected_value?: number;
  probability?: number;
  assigned_to?: string | null;
  notes?: string | null;
}

export interface OpportunityUpdate {
  stage?: OpportunityStage;
  expected_value?: number;
  probability?: number;
  assigned_to?: string | null;
  notes?: string | null;
}

export interface Deal {
  id: string;
  wm_lead_id: string;
  opportunity_id: string | null;
  outcome: DealOutcome;
  close_date: string | null;
  gross_revenue: number;
  cogs: number;
  labor_cost: number;
  commissions: number;
  other_cost: number;
  net_profit: number; // Generated column
  payment_status: DealPaymentStatus;
  invoice_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface DealInsert {
  wm_lead_id: string;
  opportunity_id?: string | null;
  outcome?: DealOutcome;
  close_date?: string | null;
  gross_revenue?: number;
  cogs?: number;
  labor_cost?: number;
  commissions?: number;
  other_cost?: number;
  payment_status?: DealPaymentStatus;
  invoice_id?: string | null;
}

export interface DealUpdate {
  opportunity_id?: string | null;
  outcome?: DealOutcome;
  close_date?: string | null;
  gross_revenue?: number;
  cogs?: number;
  labor_cost?: number;
  commissions?: number;
  other_cost?: number;
  payment_status?: DealPaymentStatus;
  invoice_id?: string | null;
}

export interface AdSpendDaily {
  id: string;
  spend_date: string;
  platform: PlatformType;
  account_id: string | null;
  campaign_id: string | null;
  campaign_name: string | null;
  adset_id: string | null;
  adset_name: string | null;
  spend: number;
  impressions: number;
  clicks: number;
  leads_reported: number;
  created_at: string;
}

export interface AdSpendDailyInsert {
  spend_date: string;
  platform: PlatformType;
  account_id?: string | null;
  campaign_id?: string | null;
  campaign_name?: string | null;
  adset_id?: string | null;
  adset_name?: string | null;
  spend?: number;
  impressions?: number;
  clicks?: number;
  leads_reported?: number;
}

export interface AdSpendDailyUpdate {
  spend_date?: string;
  platform?: PlatformType;
  account_id?: string | null;
  campaign_id?: string | null;
  campaign_name?: string | null;
  adset_id?: string | null;
  adset_name?: string | null;
  spend?: number;
  impressions?: number;
  clicks?: number;
  leads_reported?: number;
}

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Derives source platform from attribution fields.
 * Use this instead of storing source_platform to prevent data staleness.
 */
export function deriveSourcePlatform(attribution: {
  gclid?: string | null;
  fbclid?: string | null;
  fbc?: string | null;
  utm_source?: string | null;
}): PlatformType {
  // Google click ID takes precedence
  if (attribution.gclid) {
    return 'google';
  }
  
  // Facebook click ID or cookie
  if (attribution.fbclid || attribution.fbc) {
    return 'meta';
  }
  
  // Fall back to utm_source
  const source = attribution.utm_source?.toLowerCase();
  if (source) {
    if (source.includes('google') || source.includes('gclid')) {
      return 'google';
    }
    if (source.includes('facebook') || source.includes('meta') || source.includes('instagram') || source.includes('fb')) {
      return 'meta';
    }
  }
  
  return 'other';
}

/**
 * Calculate weighted pipeline value from opportunities.
 */
export function calculateWeightedValue(opportunities: Pick<Opportunity, 'expected_value' | 'probability'>[]): number {
  return opportunities.reduce((sum, opp) => {
    return sum + (opp.expected_value * (opp.probability / 100));
  }, 0);
}

/**
 * Calculate ROAS from revenue and spend.
 */
export function calculateROAS(revenue: number, spend: number): number | null {
  if (spend <= 0) return null;
  return revenue / spend;
}

/**
 * Calculate CPL (Cost Per Lead).
 */
export function calculateCPL(spend: number, leads: number): number | null {
  if (leads <= 0) return null;
  return spend / leads;
}

/**
 * Calculate CPA (Cost Per Acquisition/Deal).
 */
export function calculateCPA(spend: number, deals: number): number | null {
  if (deals <= 0) return null;
  return spend / deals;
}

// ============================================
// STAGE CONFIGURATION
// ============================================

export const OPPORTUNITY_STAGE_CONFIG: Record<OpportunityStage, {
  label: string;
  color: string;
  defaultProbability: number;
}> = {
  new: { label: 'New', color: 'bg-slate-500', defaultProbability: 10 },
  qualifying: { label: 'Qualifying', color: 'bg-blue-500', defaultProbability: 20 },
  quoted: { label: 'Quoted', color: 'bg-purple-500', defaultProbability: 40 },
  negotiating: { label: 'Negotiating', color: 'bg-amber-500', defaultProbability: 60 },
  won: { label: 'Won', color: 'bg-green-500', defaultProbability: 100 },
  lost: { label: 'Lost', color: 'bg-red-500', defaultProbability: 0 },
};

export const DEAL_PAYMENT_STATUS_CONFIG: Record<DealPaymentStatus, {
  label: string;
  color: string;
}> = {
  unpaid: { label: 'Unpaid', color: 'bg-slate-500' },
  deposit_paid: { label: 'Deposit Paid', color: 'bg-amber-500' },
  paid_in_full: { label: 'Paid in Full', color: 'bg-green-500' },
  refunded: { label: 'Refunded', color: 'bg-red-500' },
};

export const PLATFORM_CONFIG: Record<PlatformType, {
  label: string;
  color: string;
}> = {
  meta: { label: 'Meta (Facebook/Instagram)', color: 'bg-blue-600' },
  google: { label: 'Google Ads', color: 'bg-green-600' },
  other: { label: 'Other', color: 'bg-slate-500' },
};
