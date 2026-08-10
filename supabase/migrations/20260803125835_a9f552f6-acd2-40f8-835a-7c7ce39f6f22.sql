-- ============ ROLES ============
CREATE TYPE public.app_role AS ENUM ('admin', 'moderator', 'user');

CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);

GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role
  )
$$;

CREATE POLICY "Users can read their own roles"
  ON public.user_roles FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can read all roles"
  ON public.user_roles FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can manage roles"
  ON public.user_roles FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- ============ WAITLIST ============
CREATE TABLE public.patisserie_waitlist (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL,
  collection text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (email, collection)
);

GRANT INSERT ON public.patisserie_waitlist TO anon, authenticated;
GRANT SELECT, DELETE ON public.patisserie_waitlist TO authenticated;
GRANT ALL ON public.patisserie_waitlist TO service_role;
ALTER TABLE public.patisserie_waitlist ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can join the waitlist"
  ON public.patisserie_waitlist FOR INSERT TO anon, authenticated
  WITH CHECK (email ~ '^[^@\s]+@[^@\s]+\.[^@\s]+$' AND length(email) <= 255 AND length(collection) <= 64);

CREATE POLICY "Admins can read the waitlist"
  ON public.patisserie_waitlist FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete waitlist entries"
  ON public.patisserie_waitlist FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- ============ PRODUCT OVERRIDES ============
CREATE TABLE public.product_overrides (
  slug text PRIMARY KEY,
  name text,
  price numeric(10,2),
  image_url text,
  short_desc text,
  collections text[],
  seasonal_only boolean,
  family text,
  published boolean NOT NULL DEFAULT true,
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.product_overrides TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.product_overrides TO authenticated;
GRANT ALL ON public.product_overrides TO service_role;
ALTER TABLE public.product_overrides ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read product overrides"
  ON public.product_overrides FOR SELECT TO anon, authenticated
  USING (true);

CREATE POLICY "Admins can manage product overrides"
  ON public.product_overrides FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE OR REPLACE FUNCTION public.touch_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER product_overrides_touch
  BEFORE UPDATE ON public.product_overrides
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();