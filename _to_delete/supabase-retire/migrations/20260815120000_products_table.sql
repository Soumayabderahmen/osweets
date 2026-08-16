-- ============================================================
--  CATALOGUE EN BASE — table `products`
--  La fiche produit vit désormais dans PostgreSQL : le backoffice
--  peut créer, modifier et archiver un produit sans toucher au code.
--  `src/data/products.ts` reste le rendu serveur (SEO) et le filet de
--  sécurité si la base est injoignable.
-- ============================================================

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

-- ------------------------------------------------------------
--  Droits — la boutique lit, l'administrateur écrit.
--  DELETE n'est volontairement accordé à personne : un produit se
--  dépublie ou s'archive, il ne se supprime jamais.
-- ------------------------------------------------------------
GRANT SELECT ON public.products TO anon, authenticated;
GRANT INSERT, UPDATE ON public.products TO authenticated;
GRANT ALL ON public.products TO service_role;

ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

-- La boutique lit aussi les fiches dépubliées : c'est ce qui lui permet de
-- masquer un produit encore présent dans le catalogue statique. Le filtrage
-- `published` se fait côté site (`isPublished`). Rien de confidentiel ici —
-- c'est exactement le modèle de l'ancienne table product_overrides.
CREATE POLICY "La boutique lit le catalogue"
  ON public.products FOR SELECT TO anon, authenticated
  USING (archived = false);

CREATE POLICY "Les administrateurs lisent tout le catalogue"
  ON public.products FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Les administrateurs créent des produits"
  ON public.products FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Les administrateurs modifient les produits"
  ON public.products FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER products_touch
  BEFORE UPDATE ON public.products
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
