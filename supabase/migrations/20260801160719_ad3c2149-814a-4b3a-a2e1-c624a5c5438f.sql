-- PRODUCTS
CREATE TABLE public.products (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  slug TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  price_pkr INTEGER NOT NULL CHECK (price_pkr >= 0),
  image_url TEXT NOT NULL,
  shape TEXT NOT NULL DEFAULT 'Almond',
  finish TEXT NOT NULL DEFAULT 'Glossy',
  palette TEXT NOT NULL DEFAULT 'nude',
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.products TO anon, authenticated;
GRANT ALL ON public.products TO service_role;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Active products are public" ON public.products FOR SELECT USING (is_active);

-- PROFILES
CREATE TABLE public.profiles (
  id UUID NOT NULL PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  phone TEXT,
  discount_code TEXT,
  discount_percent INTEGER NOT NULL DEFAULT 0 CHECK (discount_percent BETWEEN 0 AND 100),
  free_delivery BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Own profile read" ON public.profiles FOR SELECT TO authenticated USING (auth.uid() = id);
CREATE POLICY "Own profile insert" ON public.profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);
CREATE POLICY "Own profile update" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

-- USER SPINS (one row per user, insert only via secure function)
CREATE TABLE public.user_spins (
  user_id UUID NOT NULL PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  has_spun BOOLEAN NOT NULL DEFAULT true,
  prize_label TEXT NOT NULL,
  discount_percent INTEGER NOT NULL DEFAULT 0,
  free_delivery BOOLEAN NOT NULL DEFAULT false,
  spun_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.user_spins TO authenticated;
GRANT ALL ON public.user_spins TO service_role;
ALTER TABLE public.user_spins ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Own spin read" ON public.user_spins FOR SELECT TO authenticated USING (auth.uid() = user_id);

-- ORDERS
CREATE TABLE public.orders (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  street TEXT NOT NULL,
  area TEXT NOT NULL,
  city TEXT NOT NULL,
  postal_code TEXT NOT NULL,
  phone TEXT NOT NULL,
  subtotal_pkr INTEGER NOT NULL,
  discount_pkr INTEGER NOT NULL DEFAULT 0,
  delivery_pkr INTEGER NOT NULL DEFAULT 0,
  total_pkr INTEGER NOT NULL,
  discount_code TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.orders TO authenticated;
GRANT ALL ON public.orders TO service_role;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Own orders read" ON public.orders FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE TABLE public.order_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES public.products(id),
  product_name TEXT NOT NULL,
  unit_price_pkr INTEGER NOT NULL,
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  size TEXT NOT NULL,
  custom_mm TEXT,
  shape TEXT NOT NULL,
  finish TEXT NOT NULL
);
GRANT SELECT ON public.order_items TO authenticated;
GRANT ALL ON public.order_items TO service_role;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Own order items read" ON public.order_items FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.orders o WHERE o.id = order_id AND o.user_id = auth.uid()));

-- PROFILE AUTO-CREATION
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name)
  VALUES (NEW.id, NULLIF(NEW.raw_user_meta_data->>'full_name', ''))
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- SECURE SPIN
CREATE OR REPLACE FUNCTION public.perform_spin()
RETURNS TABLE (prize_label TEXT, discount_percent INTEGER, free_delivery BOOLEAN, already_spun BOOLEAN)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  uid UUID := auth.uid();
  existing public.user_spins;
  roll INTEGER;
  p_label TEXT;
  p_pct INTEGER := 0;
  p_free BOOLEAN := false;
  code TEXT;
BEGIN
  IF uid IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  SELECT * INTO existing FROM public.user_spins WHERE user_id = uid;
  IF FOUND THEN
    RETURN QUERY SELECT existing.prize_label, existing.discount_percent, existing.free_delivery, true;
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

  INSERT INTO public.user_spins (user_id, has_spun, prize_label, discount_percent, free_delivery)
  VALUES (uid, true, p_label, p_pct, p_free);

  IF p_pct > 0 OR p_free THEN
    code := 'MUSKII-' || upper(substr(md5(uid::text || clock_timestamp()::text), 1, 6));
  END IF;

  INSERT INTO public.profiles (id, discount_code, discount_percent, free_delivery)
  VALUES (uid, code, p_pct, p_free)
  ON CONFLICT (id) DO UPDATE
    SET discount_code = code,
        discount_percent = p_pct,
        free_delivery = p_free,
        updated_at = now();

  RETURN QUERY SELECT p_label, p_pct, p_free, false;
END;
$$;
REVOKE ALL ON FUNCTION public.perform_spin() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.perform_spin() TO authenticated;

-- SEED PRODUCTS
INSERT INTO public.products (slug, name, description, price_pkr, image_url, shape, finish, palette) VALUES
('blush-nude-almond', 'Blush Nude Almond', 'Soft nude pink with a thin gold line. Everyday set, 10 nails plus glue tabs.', 2800, '/__l5e/assets-v1/8498628d-e9b0-44f8-a482-c8d62bb553b2/nails-1.jpg', 'Almond', 'Glossy', 'nude'),
('cocoa-matte-coffin', 'Cocoa Matte Coffin', 'Deep chocolate brown in matte with gold foil flecks.', 3200, '/__l5e/assets-v1/0f1ed5d2-df0c-4004-8a54-224e5a69867a/nails-2.jpg', 'Coffin', 'Matte', 'brown'),
('gold-tip-french', 'Gold Tip French', 'Classic milky french tip finished with fine gold glitter.', 3000, '/__l5e/assets-v1/8b5854da-8909-4fb6-a9ee-e75755373c82/nails-3.jpg', 'Stiletto', 'Glossy', 'white'),
('toffee-square', 'Toffee Square', 'Caramel brown gloss with one gold chrome accent nail.', 2600, '/__l5e/assets-v1/9ad89e64-00ef-4104-ac3e-1cdb33719269/nails-4.jpg', 'Square', 'Glossy', 'brown'),
('mocha-marble', 'Mocha Marble', 'Beige and mocha swirl with fine gold veins.', 3400, '/__l5e/assets-v1/d51c2c8c-80ac-4468-b852-aad877b0093b/nails-5.jpg', 'Almond', 'Glossy', 'nude'),
('liquid-gold', 'Liquid Gold', 'Full gold chrome mirror finish for events.', 3800, '/__l5e/assets-v1/04fdcff5-b89c-4cbc-b8fe-5d1656e76e9b/nails-6.jpg', 'Coffin', 'Glossy', 'gold');