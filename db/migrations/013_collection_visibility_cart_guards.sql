-- ============================================================
-- 013 — Visibilite des collections et garde-fous panier
--
-- Cette migration est additive : aucune collection existante n'est masquee
-- par defaut, aucun produit n'est supprime, et les associations existantes
-- sont preservees.
-- ============================================================

-- ------------------------------------------------------------
-- 1. Masquage explicite d'une collection
-- ------------------------------------------------------------
ALTER TABLE public.collections
  ADD COLUMN IF NOT EXISTS hidden boolean NOT NULL DEFAULT false;

COMMENT ON COLUMN public.collections.hidden IS
  'Masque completement la collection des surfaces publiques sans supprimer ses produits ni ses associations.';

CREATE INDEX IF NOT EXISTS collections_public_idx
  ON public.collections (published, hidden, sort_order, label);

-- ------------------------------------------------------------
-- 2. Les collections organise les produits, elles ne les possedent pas
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.collections_detach_products_before_delete()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  UPDATE public.products
     SET collections = array_remove(collections, OLD.product_key)
   WHERE OLD.product_key = ANY(collections);
  RETURN OLD;
END;
$$;

DROP TRIGGER IF EXISTS collections_detach_products ON public.collections;
CREATE TRIGGER collections_detach_products
  BEFORE DELETE ON public.collections
  FOR EACH ROW EXECUTE FUNCTION public.collections_detach_products_before_delete();

COMMENT ON FUNCTION public.collections_detach_products_before_delete() IS
  'Supprimer une collection retire seulement son etiquette des produits. Les produits ne sont jamais supprimes.';

-- ------------------------------------------------------------
-- 3. Nettoyage defensif des tableaux de collections sur les produits
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.products_normalize_collections()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  SELECT COALESCE(array_agg(DISTINCT trim(v) ORDER BY trim(v)), ARRAY[]::text[])
    INTO NEW.collections
    FROM unnest(COALESCE(NEW.collections, ARRAY[]::text[])) AS v
   WHERE trim(v) <> '';
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS products_normalize_collections ON public.products;
CREATE TRIGGER products_normalize_collections
  BEFORE INSERT OR UPDATE OF collections ON public.products
  FOR EACH ROW EXECUTE FUNCTION public.products_normalize_collections();

COMMENT ON FUNCTION public.products_normalize_collections() IS
  'Evite les valeurs vides et les doublons dans products.collections.';
