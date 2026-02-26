
-- ═══════════════════════════════════════════════════════════════════════
-- TRAFFIC COP: Create accounts table for Vault signups
-- Mirrors leadRecord columns + 4 CRM columns
-- ═══════════════════════════════════════════════════════════════════════

CREATE TABLE public.accounts (
  -- PK
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Auth linkage
  supabase_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  
  -- Core PII
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  phone TEXT NOT NULL,
  name TEXT,
  
  -- Internal CRM & Bot Integration
  account_status TEXT DEFAULT 'pending_verification',
  wmlead_id TEXT,
  phonecall_bot_status TEXT DEFAULT 'idle',
  external_crm_id TEXT,
  
  -- Identity (Golden Thread)
  client_id TEXT,
  original_session_id UUID,
  identity_version SMALLINT DEFAULT 2,
  
  -- Source
  source_tool TEXT DEFAULT 'vault',
  source_page TEXT,
  source_form TEXT,
  
  -- UTM (last-touch)
  utm_source TEXT,
  utm_medium TEXT,
  utm_campaign TEXT,
  utm_term TEXT,
  utm_content TEXT,
  
  -- Click IDs
  gclid TEXT,
  fbclid TEXT,
  fbc TEXT,
  fbp TEXT,
  msclkid TEXT,
  gbraid TEXT,
  wbraid TEXT,
  ttclid TEXT,
  
  -- Meta granular
  meta_placement TEXT,
  meta_campaign_id TEXT,
  meta_adset_id TEXT,
  meta_ad_id TEXT,
  meta_site_source_name TEXT,
  meta_creative_id TEXT,
  
  -- Last Non-Direct
  last_non_direct_utm_source TEXT,
  last_non_direct_utm_medium TEXT,
  last_non_direct_gclid TEXT,
  last_non_direct_fbclid TEXT,
  last_non_direct_channel TEXT,
  last_non_direct_landing_page TEXT,
  
  -- Geo
  city TEXT,
  state TEXT,
  zip TEXT,
  
  -- Device/fingerprint
  device_type TEXT,
  referrer TEXT,
  landing_page TEXT,
  ip_hash TEXT,
  client_user_agent TEXT,
  landing_page_url TEXT,
  
  -- Session
  session_data JSONB DEFAULT '{}',
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ═══ RLS ═══
ALTER TABLE public.accounts ENABLE ROW LEVEL SECURITY;

-- Authenticated users can read their own account
CREATE POLICY "Users can read own account"
  ON public.accounts FOR SELECT
  TO authenticated
  USING (supabase_user_id = auth.uid());

-- Admins can read all accounts
CREATE POLICY "Admins can read all accounts"
  ON public.accounts FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Admins can update accounts
CREATE POLICY "Admins can update accounts"
  ON public.accounts FOR UPDATE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Anonymous insert (defense-in-depth; edge function uses service_role)
CREATE POLICY "Anon insert for vault signups"
  ON public.accounts FOR INSERT
  TO anon
  WITH CHECK (true);

-- ═══ updated_at trigger ═══
CREATE TRIGGER set_accounts_updated_at
  BEFORE UPDATE ON public.accounts
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

-- ═══ Index on email for fast lookups ═══
CREATE INDEX idx_accounts_email ON public.accounts(email);
CREATE INDEX idx_accounts_supabase_user_id ON public.accounts(supabase_user_id) WHERE supabase_user_id IS NOT NULL;
