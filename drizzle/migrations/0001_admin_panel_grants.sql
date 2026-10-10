GRANT SELECT ON public.custom_products TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.custom_products TO authenticated;
GRANT SELECT, INSERT, DELETE ON public.customer_bans TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.product_inventory TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
GRANT SELECT, UPDATE ON public.shop_orders TO authenticated;
GRANT SELECT ON public.user_roles, public.user_spins, public.user_vouchers TO authenticated;
GRANT ALL ON public.custom_products, public.customer_bans, public.product_inventory, public.profiles, public.shop_orders, public.user_roles, public.user_spins, public.user_vouchers TO service_role;
GRANT EXECUTE ON FUNCTION public.get_stock_status() TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.spin_wheel() TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_banned(uuid) TO authenticated;
REVOKE EXECUTE ON FUNCTION public.spin_wheel() FROM anon;

CREATE UNIQUE INDEX IF NOT EXISTS profiles_username_lower_uniq ON public.profiles (lower(username));

CREATE OR REPLACE FUNCTION public.protect_profile_fields()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.username IS DISTINCT FROM OLD.username AND lower(coalesce(NEW.username,'')) = 'admin_nbm_1'
     AND NOT public.has_role(NEW.id, 'admin') THEN
    RAISE EXCEPTION 'This username is reserved';
  END IF;
  IF current_user = 'authenticated' THEN
    NEW.discount_code := OLD.discount_code;
    NEW.discount_percent := OLD.discount_percent;
    NEW.free_delivery := OLD.free_delivery;
  END IF;
  RETURN NEW;
END $$;
REVOKE ALL ON FUNCTION public.protect_profile_fields() FROM PUBLIC, anon, authenticated;
DROP TRIGGER IF EXISTS protect_profile_fields ON public.profiles;
CREATE TRIGGER protect_profile_fields BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.protect_profile_fields();

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='storage' AND tablename='objects' AND policyname='Admins read product images') THEN
    CREATE POLICY "Admins read product images" ON storage.objects FOR SELECT TO authenticated USING (bucket_id = 'product-images' AND public.has_role(auth.uid(), 'admin'));
  END IF;
END $$;