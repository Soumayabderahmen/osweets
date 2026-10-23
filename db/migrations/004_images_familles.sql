-- ============================================================
--  004 — Galerie d'images, familles pilotables, champs SEO
--  Le back-office prend la main sur tout l'univers
--  « Pâtisserie Tunisienne » : images, familles, parfums,
--  référencement et suppression définitive depuis les archives.
-- ============================================================

-- ------------------------------------------------------------
--  Champs manquants sur la fiche produit
-- ------------------------------------------------------------
ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS compare_at_price numeric(10,2),
  ADD COLUMN IF NOT EXISTS seo_title text,
  ADD COLUMN IF NOT EXISTS seo_description text;

-- ------------------------------------------------------------
--  Familles (Samsa, Kounefa, Baklawa…)
--  Une famille regroupe un TYPE de gâteau. Elle n'appartient à
--  aucune collection : c'est le produit qui porte ses collections.
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.families (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key text NOT NULL UNIQUE,
  label text NOT NULL,
  description text NOT NULL DEFAULT '',
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT families_key_format CHECK (key ~ '^[a-z0-9]+(-[a-z0-9]+)*$')
);

DROP TRIGGER IF EXISTS families_touch ON public.families;
CREATE TRIGGER families_touch
  BEFORE UPDATE ON public.families
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- Reprise des familles déjà portées par les fiches existantes.
INSERT INTO public.families (key, label)
SELECT DISTINCT p.family, initcap(replace(p.family, '-', ' '))
  FROM public.products p
 WHERE p.family IS NOT NULL AND p.family <> ''
ON CONFLICT (key) DO NOTHING;

-- ------------------------------------------------------------
--  Galerie d'images
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.product_images (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  url text NOT NULL,
  alt text NOT NULL DEFAULT '',
  sort_order integer NOT NULL DEFAULT 0,
  is_primary boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS product_images_product_idx
  ON public.product_images (product_id, sort_order);

-- Une seule image principale par produit.
CREATE UNIQUE INDEX IF NOT EXISTS product_images_one_primary
  ON public.product_images (product_id) WHERE is_primary;

-- ------------------------------------------------------------
--  Suppression définitive : autorisée uniquement depuis les archives
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.products_no_delete()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF OLD.archived THEN
    RETURN OLD;
  END IF;
  RAISE EXCEPTION 'Un produit se supprime uniquement depuis les archives : passez archived = true.';
END;
$$;
