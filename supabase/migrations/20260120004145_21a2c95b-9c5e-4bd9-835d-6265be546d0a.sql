-- Update the handle_new_lead_to_crm trigger to capture full UTM set
CREATE OR REPLACE FUNCTION public.handle_new_lead_to_crm()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  -- Insert into wm_leads (CRM warehouse) when a new lead is created
  INSERT INTO public.wm_leads (
    lead_id,
    email,
    phone,
    first_name,
    original_session_id,
    original_source_tool,
    engagement_score,
    lead_quality,
    status,
    estimated_deal_value,
    gclid,
    fbclid,
    utm_source,
    utm_medium,
    utm_campaign,
    utm_content,
    utm_term
  ) VALUES (
    NEW.id,
    NEW.email,
    NEW.phone,
    NEW.name,
    NEW.client_id,
    NEW.source_tool,
    COALESCE(NEW.lead_score_total, 0),
    CASE 
      WHEN COALESCE(NEW.lead_score_total, 0) >= 45 THEN 'hot'::lead_quality
      WHEN COALESCE(NEW.lead_score_total, 0) >= 25 THEN 'warm'::lead_quality
      ELSE 'cold'::lead_quality
    END,
    'new'::lead_status,
    COALESCE(NEW.window_count, 0) * 500,
    NEW.gclid,
    NEW.fbc,
    NEW.utm_source,
    NEW.utm_medium,
    NEW.utm_campaign,
    NEW.utm_content,
    NEW.utm_term
  )
  ON CONFLICT (email) DO UPDATE SET
    phone = COALESCE(EXCLUDED.phone, wm_leads.phone),
    first_name = COALESCE(EXCLUDED.first_name, wm_leads.first_name),
    engagement_score = GREATEST(EXCLUDED.engagement_score, wm_leads.engagement_score),
    estimated_deal_value = GREATEST(EXCLUDED.estimated_deal_value, wm_leads.estimated_deal_value),
    updated_at = now(),
    gclid = COALESCE(EXCLUDED.gclid, wm_leads.gclid),
    fbclid = COALESCE(EXCLUDED.fbclid, wm_leads.fbclid),
    utm_source = COALESCE(EXCLUDED.utm_source, wm_leads.utm_source),
    utm_medium = COALESCE(EXCLUDED.utm_medium, wm_leads.utm_medium),
    utm_campaign = COALESCE(EXCLUDED.utm_campaign, wm_leads.utm_campaign),
    utm_content = COALESCE(EXCLUDED.utm_content, wm_leads.utm_content),
    utm_term = COALESCE(EXCLUDED.utm_term, wm_leads.utm_term);
  
  RETURN NEW;
END;
$function$;