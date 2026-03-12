-- Update handle_new_user to also link accounts table
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  -- Always create the profile
  INSERT INTO public.profiles (user_id, email, name)
  VALUES (NEW.id, NEW.email, NEW.raw_user_meta_data ->> 'name');
  
  -- Only merge if email is confirmed (prevents account takeover)
  IF NEW.email_confirmed_at IS NOT NULL THEN
    UPDATE public.leads 
    SET user_id = NEW.id, updated_at = now()
    WHERE email = NEW.email AND user_id IS NULL;

    UPDATE public.accounts
    SET supabase_user_id = NEW.id, updated_at = now()
    WHERE email = NEW.email AND supabase_user_id IS NULL;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Update handle_email_confirmed to also link accounts table
CREATE OR REPLACE FUNCTION public.handle_email_confirmed()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  IF NEW.email_confirmed_at IS NOT NULL 
     AND (OLD.email_confirmed_at IS NULL OR OLD.email_confirmed_at != NEW.email_confirmed_at) THEN
    UPDATE public.leads 
    SET user_id = NEW.id, updated_at = now()
    WHERE email = NEW.email AND user_id IS NULL;

    UPDATE public.accounts
    SET supabase_user_id = NEW.id, updated_at = now()
    WHERE email = NEW.email AND supabase_user_id IS NULL;
  END IF;
  
  RETURN NEW;
END;
$$;