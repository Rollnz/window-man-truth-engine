-- Create trigger to sync leads -> wm_leads on INSERT
CREATE TRIGGER on_new_lead_sync_to_crm
  AFTER INSERT ON public.leads
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_lead_to_crm();

-- Backfill existing leads from `leads` to `wm_leads`
INSERT INTO public.wm_leads (
  lead_id,
  email,
  first_name,
  phone,
  original_source_tool,
  engagement_score,
  lead_quality,
  status
)
SELECT 
  l.id,
  l.email,
  COALESCE(l.name, ''),
  l.phone,
  l.source_tool,
  0,
  'cold',
  'new'
FROM public.leads l
ON CONFLICT (email) DO NOTHING;