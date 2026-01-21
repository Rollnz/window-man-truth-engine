-- ============================================
-- PROFITABILITY SCHEMA MIGRATION
-- Creates: opportunities, deals, ad_spend_daily
-- ============================================

-- 1) CREATE ENUM TYPES
-- ============================================

-- Opportunity pipeline stages
CREATE TYPE opportunity_stage AS ENUM (
  'new',
  'qualifying', 
  'quoted',
  'negotiating',
  'won',
  'lost'
);

-- Simplified deal outcome (won/lost only)
CREATE TYPE deal_outcome AS ENUM (
  'won',
  'lost'
);

-- Ad platform types for spend tracking
CREATE TYPE platform_type AS ENUM (
  'meta',
  'google',
  'other'
);

-- Deal payment status
CREATE TYPE deal_payment_status AS ENUM (
  'unpaid',
  'deposit_paid',
  'paid_in_full',
  'refunded'
);

-- 2) CREATE OPPORTUNITIES TABLE
-- ============================================

CREATE TABLE public.opportunities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  wm_lead_id uuid NOT NULL REFERENCES public.wm_leads(id) ON DELETE RESTRICT,
  stage opportunity_stage NOT NULL DEFAULT 'new',
  expected_value numeric(12,2) NOT NULL DEFAULT 0 CHECK (expected_value >= 0),
  probability integer NOT NULL DEFAULT 10 CHECK (probability >= 0 AND probability <= 100),
  assigned_to text NULL,
  notes text NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Indexes for opportunities
CREATE INDEX idx_opportunities_wm_lead_id ON public.opportunities(wm_lead_id);
CREATE INDEX idx_opportunities_stage ON public.opportunities(stage);

-- Trigger for updated_at
CREATE TRIGGER update_opportunities_updated_at
  BEFORE UPDATE ON public.opportunities
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

-- 3) CREATE DEALS TABLE
-- ============================================

CREATE TABLE public.deals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  wm_lead_id uuid NOT NULL REFERENCES public.wm_leads(id) ON DELETE RESTRICT,
  opportunity_id uuid NULL REFERENCES public.opportunities(id) ON DELETE SET NULL,
  outcome deal_outcome NOT NULL DEFAULT 'won',
  close_date date NULL,
  gross_revenue numeric(12,2) NOT NULL DEFAULT 0 CHECK (gross_revenue >= 0),
  cogs numeric(12,2) NOT NULL DEFAULT 0 CHECK (cogs >= 0),
  labor_cost numeric(12,2) NOT NULL DEFAULT 0 CHECK (labor_cost >= 0),
  commissions numeric(12,2) NOT NULL DEFAULT 0 CHECK (commissions >= 0),
  other_cost numeric(12,2) NOT NULL DEFAULT 0 CHECK (other_cost >= 0),
  net_profit numeric(12,2) GENERATED ALWAYS AS (gross_revenue - cogs - labor_cost - commissions - other_cost) STORED,
  payment_status deal_payment_status NOT NULL DEFAULT 'unpaid',
  invoice_id text NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Indexes for deals
CREATE INDEX idx_deals_wm_lead_id ON public.deals(wm_lead_id);
CREATE INDEX idx_deals_opportunity_id ON public.deals(opportunity_id);
CREATE INDEX idx_deals_close_date ON public.deals(close_date);

-- Trigger for updated_at
CREATE TRIGGER update_deals_updated_at
  BEFORE UPDATE ON public.deals
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

-- 4) CREATE AD_SPEND_DAILY TABLE
-- ============================================

CREATE TABLE public.ad_spend_daily (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  spend_date date NOT NULL,
  platform platform_type NOT NULL,
  account_id text NULL,
  campaign_id text NULL,
  campaign_name text NULL,
  adset_id text NULL,
  adset_name text NULL,
  spend numeric(12,2) NOT NULL DEFAULT 0 CHECK (spend >= 0),
  impressions bigint NOT NULL DEFAULT 0,
  clicks bigint NOT NULL DEFAULT 0,
  leads_reported bigint NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Unique constraint to prevent duplicate spend entries
CREATE UNIQUE INDEX idx_ad_spend_daily_unique 
  ON public.ad_spend_daily(spend_date, platform, COALESCE(account_id, ''), COALESCE(campaign_id, ''), COALESCE(adset_id, ''));

-- Indexes for ad_spend_daily
CREATE INDEX idx_ad_spend_daily_spend_date ON public.ad_spend_daily(spend_date);
CREATE INDEX idx_ad_spend_daily_platform ON public.ad_spend_daily(platform);
CREATE INDEX idx_ad_spend_daily_campaign_id ON public.ad_spend_daily(campaign_id);

-- 5) ROW LEVEL SECURITY
-- ============================================

-- Enable RLS on all new tables
ALTER TABLE public.opportunities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.deals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ad_spend_daily ENABLE ROW LEVEL SECURITY;

-- Opportunities RLS (admin only)
CREATE POLICY "Admins can view opportunities"
  ON public.opportunities FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can insert opportunities"
  ON public.opportunities FOR INSERT
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update opportunities"
  ON public.opportunities FOR UPDATE
  USING (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete opportunities"
  ON public.opportunities FOR DELETE
  USING (public.has_role(auth.uid(), 'admin'::app_role));

-- Deals RLS (admin only)
CREATE POLICY "Admins can view deals"
  ON public.deals FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can insert deals"
  ON public.deals FOR INSERT
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update deals"
  ON public.deals FOR UPDATE
  USING (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete deals"
  ON public.deals FOR DELETE
  USING (public.has_role(auth.uid(), 'admin'::app_role));

-- Ad Spend Daily RLS (admin only)
CREATE POLICY "Admins can view ad_spend_daily"
  ON public.ad_spend_daily FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can insert ad_spend_daily"
  ON public.ad_spend_daily FOR INSERT
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update ad_spend_daily"
  ON public.ad_spend_daily FOR UPDATE
  USING (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete ad_spend_daily"
  ON public.ad_spend_daily FOR DELETE
  USING (public.has_role(auth.uid(), 'admin'::app_role));