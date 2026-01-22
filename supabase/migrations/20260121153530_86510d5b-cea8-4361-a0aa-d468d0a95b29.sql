-- Add unique index on wm_leads.lead_id for dual-ID resolution performance
-- This enables O(log n) lookups in admin-lead-detail fallback path
-- Also enforces 1:1 integrity between leads and wm_leads
CREATE UNIQUE INDEX IF NOT EXISTS idx_wm_leads_lead_id 
ON wm_leads (lead_id) 
WHERE lead_id IS NOT NULL;