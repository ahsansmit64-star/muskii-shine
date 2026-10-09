CREATE TYPE public.app_role AS ENUM ('admin', 'user');

CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role public.app_role NOT NULL,
  UNIQUE (user_id, role)
);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role)
$$;

CREATE POLICY "Own roles read" ON public.user_roles FOR SELECT TO authenticated USING (auth.uid() = user_id);

ALTER TABLE public.profiles ADD COLUMN email text;
ALTER TABLE public.profiles ADD COLUMN username text;
ALTER TABLE public.profiles ADD COLUMN last_seen_at timestamptz;
ALTER TABLE public.profiles ADD COLUMN signed_in boolean NOT NULL DEFAULT false;
CREATE UNIQUE INDEX profiles_username_lower_idx ON public.profiles (lower(username));

REVOKE UPDATE ON public.profiles FROM authenticated;
GRANT UPDATE (full_name, phone, last_seen_at, signed_in) ON public.profiles TO authenticated;
REVOKE INSERT ON public.profiles FROM authenticated;

CREATE POLICY "Admins read all profiles" ON public.profiles FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE TABLE public.customer_bans (
  user_id uuid PRIMARY KEY,
  banned_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, DELETE ON public.customer_bans TO authenticated;
GRANT ALL ON public.customer_bans TO service_role;
ALTER TABLE public.customer_bans ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Own ban read" ON public.customer_bans FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Admins read bans" ON public.customer_bans FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins add bans" ON public.customer_bans FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin') AND NOT public.has_role(user_id, 'admin'));
CREATE POLICY "Admins remove bans" ON public.customer_bans FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

CREATE OR REPLACE FUNCTION public.is_banned(_user_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.customer_bans WHERE user_id = _user_id)
$$;

CREATE TABLE public.custom_products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text NOT NULL DEFAULT '',
  price_pkr integer NOT NULL CHECK (price_pkr BETWEEN 100 AND 100000),
  image_urls text[] NOT NULL DEFAULT '{}',
  sizes text[] NOT NULL DEFAULT '{}',
  colors text[] NOT NULL DEFAULT '{}',
  shape text NOT NULL DEFAULT 'Almond',
  finish text NOT NULL DEFAULT 'Glossy',
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.custom_products TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.custom_products TO authenticated;
GRANT ALL ON public.custom_products TO service_role;
ALTER TABLE public.custom_products ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Custom products public" ON public.custom_products FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Admins insert products" ON public.custom_products FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins update products" ON public.custom_products FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins delete products" ON public.custom_products FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

CREATE TABLE public.product_inventory (
  product_ref text PRIMARY KEY,
  stock integer CHECK (stock IS NULL OR stock >= 0),
  oos_sizes text[] NOT NULL DEFAULT '{}',
  oos_colors text[] NOT NULL DEFAULT '{}',
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.product_inventory TO authenticated;
GRANT ALL ON public.product_inventory TO service_role;
ALTER TABLE public.product_inventory ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage inventory" ON public.product_inventory FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE OR REPLACE FUNCTION public.get_stock_status()
RETURNS TABLE(product_ref text, in_stock boolean, oos_sizes text[], oos_colors text[])
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT i.product_ref, (i.stock IS NULL OR i.stock > 0), i.oos_sizes, i.oos_colors FROM public.product_inventory i
$$;
GRANT EXECUTE ON FUNCTION public.get_stock_status() TO anon, authenticated;

CREATE TABLE public.shop_orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  email text,
  full_name text NOT NULL,
  street text NOT NULL,
  area text NOT NULL,
  city text NOT NULL,
  postal_code text NOT NULL,
  phone text NOT NULL,
  items jsonb NOT NULL DEFAULT '[]'::jsonb,
  subtotal_pkr integer NOT NULL,
  discount_pkr integer NOT NULL DEFAULT 0,
  delivery_pkr integer NOT NULL DEFAULT 0,
  total_pkr integer NOT NULL,
  voucher_code text,
  payment_method text NOT NULL DEFAULT 'Easypaisa / JazzCash',
  transaction_id text NOT NULL,
  payment_status text NOT NULL DEFAULT 'Pending Verification',
  status text NOT NULL DEFAULT 'Pending',
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX shop_orders_user_idx ON public.shop_orders (user_id, created_at DESC);
GRANT SELECT, UPDATE ON public.shop_orders TO authenticated;
GRANT ALL ON public.shop_orders TO service_role;
ALTER TABLE public.shop_orders ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Own shop orders read" ON public.shop_orders FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Admins read shop orders" ON public.shop_orders FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins update shop orders" ON public.shop_orders FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

COMMENT ON TABLE public.orders IS 'DEPRECATED: replaced by shop_orders';
COMMENT ON TABLE public.order_items IS 'DEPRECATED: replaced by shop_orders.items';

CREATE TABLE public.user_vouchers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  code text NOT NULL UNIQUE,
  prize_label text NOT NULL,
  discount_percent integer NOT NULL DEFAULT 0,
  free_delivery boolean NOT NULL DEFAULT false,
  won_at timestamptz NOT NULL DEFAULT now(),
  used boolean NOT NULL DEFAULT false
);
GRANT SELECT ON public.user_vouchers TO authenticated;
GRANT ALL ON public.user_vouchers TO service_role;
ALTER TABLE public.user_vouchers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Own vouchers read" ON public.user_vouchers FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.spin_wheel()
RETURNS TABLE(prize_label text, discount_percent integer, free_delivery boolean, discount_code text, spun_at timestamptz, cooling_down boolean)
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  uid uuid := auth.uid();
  existing public.user_spins;
  roll integer;
  p_label text; p_pct integer := 0; p_free boolean := false; v_code text;
BEGIN
  IF uid IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;
  IF public.is_banned(uid) THEN RAISE EXCEPTION 'Account banned'; END IF;

  SELECT * INTO existing FROM public.user_spins s WHERE s.user_id = uid FOR UPDATE;
  IF FOUND AND existing.spun_at > now() - interval '15 days' THEN
    RETURN QUERY SELECT existing.prize_label, existing.discount_percent, existing.free_delivery,
      (SELECT v.code FROM public.user_vouchers v WHERE v.user_id = uid ORDER BY v.won_at DESC LIMIT 1),
      existing.spun_at, true;
    RETURN;
  END IF;

  roll := floor(random() * 6)::int;
  CASE roll
    WHEN 0 THEN p_label := '5% Off'; p_pct := 5;
    WHEN 1 THEN p_label := '10% Off'; p_pct := 10;
    WHEN 2 THEN p_label := '15% Off'; p_pct := 15;
    WHEN 3 THEN p_label := 'Free Delivery'; p_free := true;
    WHEN 4 THEN p_label := '20% Off'; p_pct := 20;
    ELSE p_label := 'Better Luck Next Time';
  END CASE;

  INSERT INTO public.user_spins AS s (user_id, has_spun, prize_label, discount_percent, free_delivery, spun_at)
  VALUES (uid, true, p_label, p_pct, p_free, now())
  ON CONFLICT (user_id) DO UPDATE SET prize_label = EXCLUDED.prize_label,
    discount_percent = EXCLUDED.discount_percent, free_delivery = EXCLUDED.free_delivery, spun_at = now();

  IF p_pct > 0 OR p_free THEN
    v_code := 'MUSKII-' || upper(substr(md5(uid::text || clock_timestamp()::text), 1, 6));
    INSERT INTO public.user_vouchers (user_id, code, prize_label, discount_percent, free_delivery)
    VALUES (uid, v_code, p_label, p_pct, p_free);
  END IF;

  RETURN QUERY SELECT p_label, p_pct, p_free, v_code, now(), false;
END;
$$;
REVOKE EXECUTE ON FUNCTION public.spin_wheel() FROM anon, public;
GRANT EXECUTE ON FUNCTION public.spin_wheel() TO authenticated;
REVOKE EXECUTE ON FUNCTION public.perform_spin() FROM anon, authenticated, public;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  uname text := NULLIF(trim(NEW.raw_user_meta_data->>'username'), '');
BEGIN
  IF NEW.email = 'admin_nbm_1@nailbymuskii.app' THEN
    uname := 'Admin_NbM_1';
  ELSIF uname IS NOT NULL AND lower(uname) = 'admin_nbm_1' THEN
    RAISE EXCEPTION 'This username is reserved';
  END IF;

  INSERT INTO public.profiles (id, full_name, email, username)
  VALUES (NEW.id, NULLIF(NEW.raw_user_meta_data->>'full_name', ''), NEW.email, uname)
  ON CONFLICT (id) DO NOTHING;

  IF NEW.email = 'admin_nbm_1@nailbymuskii.app' THEN
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'admin') ON CONFLICT DO NOTHING;
  END IF;
  RETURN NEW;
END;
$$;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM anon, authenticated, public;

CREATE POLICY "Admins read product images" ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'product-images' AND public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins upload product images" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'product-images' AND public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins delete product images" ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'product-images' AND public.has_role(auth.uid(), 'admin'));