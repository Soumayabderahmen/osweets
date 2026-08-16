-- ============================================================
--  Ö' SWEETS — schéma PostgreSQL autonome
--  PostgreSQL pur : ni Supabase, ni RLS, ni schéma `auth`.
--  Les accès sont contrôlés par la couche serveur du site
--  (src/server), seule à connaître la chaîne de connexion.
-- ============================================================

-- Horodatage automatique des modifications.
CREATE OR REPLACE FUNCTION public.touch_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- ------------------------------------------------------------
--  CATALOGUE
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Identité
  slug text NOT NULL UNIQUE,
  name text NOT NULL,
  category text NOT NULL,
  family text,
  flavor_label text,

  -- Commercial
  price numeric(10,2) NOT NULL DEFAULT 0,
  price_per_piece numeric(10,2),
  unit text,
  weight text,
  pieces integer,
  serves integer,
  min_quantity text,
  prep_lead text,

  -- Éditorial
  short_desc text NOT NULL DEFAULT '',
  description text NOT NULL DEFAULT '',
  conservation text NOT NULL DEFAULT '',
  disclaimer text,
  delivery_mode text,

  -- Visuel : `image_key` = photo livrée avec le site (src/assets),
  -- `image_url` = photo téléversée ou distante, prioritaire si présente.
  image_key text,
  image_url text,

  -- Listes
  composition text[] NOT NULL DEFAULT '{}',
  ingredients text[] NOT NULL DEFAULT '{}',
  allergens text[] NOT NULL DEFAULT '{}',
  flavors text[] NOT NULL DEFAULT '{}',
  varieties text[] NOT NULL DEFAULT '{}',
  collections text[] NOT NULL DEFAULT '{}',
  availability text[] NOT NULL DEFAULT '{}',
  occasions text[] NOT NULL DEFAULT '{}',
  pack_includes text[] NOT NULL DEFAULT '{}',
  themes text[] NOT NULL DEFAULT '{}',

  badge text,
  variants jsonb,

  -- Drapeaux
  in_stock boolean NOT NULL DEFAULT true,
  published boolean NOT NULL DEFAULT true,
  archived boolean NOT NULL DEFAULT false,
  draft boolean NOT NULL DEFAULT false,
  seasonal_only boolean NOT NULL DEFAULT false,
  local_only boolean NOT NULL DEFAULT false,
  no_cart boolean NOT NULL DEFAULT false,
  hide_price boolean NOT NULL DEFAULT false,
  requires_cold boolean NOT NULL DEFAULT false,
  customizable boolean,

  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT products_slug_format CHECK (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  CONSTRAINT products_badge_valid CHECK (badge IS NULL OR badge IN ('bestseller', 'nouveau', 'commande')),
  CONSTRAINT products_price_positive CHECK (price >= 0)
);

CREATE INDEX IF NOT EXISTS products_category_idx ON public.products (category);
CREATE INDEX IF NOT EXISTS products_collections_idx ON public.products USING gin (collections);
CREATE INDEX IF NOT EXISTS products_visible_idx ON public.products (published, archived);

DROP TRIGGER IF EXISTS products_touch ON public.products;
CREATE TRIGGER products_touch
  BEFORE UPDATE ON public.products
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- Un produit ne se supprime jamais : il se dépublie ou s'archive.
-- Ce garde-fou bloque tout DELETE, y compris une fausse manœuvre en SQL.
CREATE OR REPLACE FUNCTION public.products_no_delete()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  RAISE EXCEPTION 'Un produit ne se supprime pas : passez archived = true.';
END;
$$;

DROP TRIGGER IF EXISTS products_block_delete ON public.products;
CREATE TRIGGER products_block_delete
  BEFORE DELETE ON public.products
  FOR EACH ROW EXECUTE FUNCTION public.products_no_delete();

-- ------------------------------------------------------------
--  LISTE D'ATTENTE
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.patisserie_waitlist (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL,
  collection text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (email, collection),
  CONSTRAINT waitlist_email_valid CHECK (email ~ '^[^@\s]+@[^@\s]+\.[^@\s]+$' AND length(email) <= 255),
  CONSTRAINT waitlist_collection_len CHECK (length(collection) <= 64)
);

-- ------------------------------------------------------------
--  ADMINISTRATEURS & SESSIONS
--  Remplace Supabase Auth. Le mot de passe n'est jamais stocké en
--  clair : `scrypt$<sel>$<empreinte>` (voir src/server/password.ts).
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.admin_users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL UNIQUE,
  password_hash text NOT NULL,
  display_name text,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

DROP TRIGGER IF EXISTS admin_users_touch ON public.admin_users;
CREATE TRIGGER admin_users_touch
  BEFORE UPDATE ON public.admin_users
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

CREATE TABLE IF NOT EXISTS public.admin_sessions (
  token text PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES public.admin_users(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NOT NULL
);

CREATE INDEX IF NOT EXISTS admin_sessions_expiry_idx ON public.admin_sessions (expires_at);
