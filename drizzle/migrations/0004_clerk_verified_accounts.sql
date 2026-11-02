CREATE TABLE public.clerk_accounts (
  clerk_id text PRIMARY KEY,
  user_id uuid NOT NULL UNIQUE REFERENCES public.profiles(id) ON DELETE CASCADE,
  verified_email text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT ALL ON public.clerk_accounts TO service_role;
REVOKE ALL ON public.clerk_accounts FROM anon, authenticated;
ALTER TABLE public.clerk_accounts ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
 SELECT EXISTS (
  SELECT 1 FROM public.user_roles r
  WHERE r.user_id = _user_id AND r.role = _role
  AND (_role <> 'admin' OR EXISTS (
   SELECT 1 FROM public.clerk_accounts c
   WHERE c.user_id = _user_id AND c.verified_email = 'naildairiesbymuskiii@gmail.com'
  ))
 )
$$;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE uname text := NULLIF(trim(NEW.raw_user_meta_data->>'username'), '');
BEGIN
 IF lower(coalesce(uname, '')) = 'admin_nbm_1' THEN
  RAISE EXCEPTION 'This username is reserved';
 END IF;
 INSERT INTO public.profiles (id, full_name, email, username)
 VALUES (NEW.id, NULLIF(NEW.raw_user_meta_data->>'full_name', ''), NEW.email, uname)
 ON CONFLICT (id) DO NOTHING;
 RETURN NEW;
END;
$$;
REVOKE ALL ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;

CREATE OR REPLACE FUNCTION public.protect_profile_fields()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
 IF NEW.username IS DISTINCT FROM OLD.username AND lower(coalesce(NEW.username,'')) = 'admin_nbm_1'
 AND NOT public.has_role(NEW.id, 'admin') THEN
  RAISE EXCEPTION 'This username is reserved';
 END IF;
 IF auth.role() = 'authenticated' THEN
  NEW.email := OLD.email;
  NEW.username := OLD.username;
  NEW.discount_code := OLD.discount_code;
  NEW.discount_percent := OLD.discount_percent;
  NEW.free_delivery := OLD.free_delivery;
 END IF;
 RETURN NEW;
END;
$$;
REVOKE ALL ON FUNCTION public.protect_profile_fields() FROM PUBLIC, anon, authenticated;