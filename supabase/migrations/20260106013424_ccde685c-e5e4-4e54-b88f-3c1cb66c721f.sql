-- Fix: Only merge anonymous leads when email is verified
-- This prevents account takeover where attacker signs up with victim's email

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  -- Always create the profile
  INSERT INTO public.profiles (user_id, email, name)
  VALUES (NEW.id, NEW.email, NEW.raw_user_meta_data ->> 'name');
  
  -- Only merge leads if email is confirmed (prevents account takeover)
  IF NEW.email_confirmed_at IS NOT NULL THEN
    UPDATE public.leads 
    SET user_id = NEW.id, updated_at = now()
    WHERE email = NEW.email AND user_id IS NULL;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Add trigger to handle email confirmation separately
-- This ensures leads are merged when a user confirms their email after signup
CREATE OR REPLACE FUNCTION public.handle_email_confirmed()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  -- Only merge when email transitions to confirmed
  IF NEW.email_confirmed_at IS NOT NULL 
     AND (OLD.email_confirmed_at IS NULL OR OLD.email_confirmed_at != NEW.email_confirmed_at) THEN
    UPDATE public.leads 
    SET user_id = NEW.id, updated_at = now()
    WHERE email = NEW.email AND user_id IS NULL;
  END IF;
  
  RETURN NEW;
END;
$$;