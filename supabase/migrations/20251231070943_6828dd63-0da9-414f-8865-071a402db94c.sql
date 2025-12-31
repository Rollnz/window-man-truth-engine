-- Update RLS on leads to allow authenticated users to see their own leads
CREATE POLICY "Users can view their own leads by user_id"
ON public.leads FOR SELECT
USING (auth.uid() = user_id);

-- Function to auto-create profile on signup and merge leads
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, email, name)
  VALUES (NEW.id, NEW.email, NEW.raw_user_meta_data ->> 'name');
  
  -- Link any existing leads to this user (anonymous-to-authenticated merge)
  UPDATE public.leads 
  SET user_id = NEW.id, updated_at = now()
  WHERE email = NEW.email AND user_id IS NULL;
  
  RETURN NEW;
END;
$$;

-- Trigger to run on user creation
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Trigger for profiles updated_at
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();