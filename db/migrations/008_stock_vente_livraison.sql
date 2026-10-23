-- ============================================================
--  008 — Stock réel, façon de vendre, modes de réception,
--        réglages de la boutique et collections vides.
--
--  Ce que le back-office gagne ici :
--    · un compteur de stock qui fait passer le produit en
--      « épuisé » tout seul, avec un seuil d'alerte ;
--    · une façon de vendre explicite (au kg, par format, par pot)
--      au lieu d'être devinée à partir du texte des libellés ;
--    · les trois modes de réception cochés produit par produit ;
--    · les tarifs de livraison et le mode vacances rangés dans une
--      table `settings`, au lieu d'être écrits dans le code ;
--    · le sort d'une collection restée vide.
-- ============================================================

-- ------------------------------------------------------------
--  1. Stock
-- ------------------------------------------------------------
ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS stock_qty integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS stock_alert integer NOT NULL DEFAULT 3,
  ADD COLUMN IF NOT EXISTS stock_unlimited boolean NOT NULL DEFAULT true;

ALTER TABLE public.products
  DROP CONSTRAINT IF EXISTS products_stock_positive;
ALTER TABLE public.products
  ADD CONSTRAINT products_stock_positive
  CHECK (stock_qty >= 0 AND stock_alert >= 0);

COMMENT ON COLUMN public.products.stock_qty IS
  'Quantité en réserve. Ignorée quand stock_unlimited est vrai.';
COMMENT ON COLUMN public.products.stock_alert IS
  'Seuil d''alerte : en dessous, le produit remonte dans les alertes du back-office.';
COMMENT ON COLUMN public.products.stock_unlimited IS
  'Produit fait à la demande : aucun compteur, il ne s''épuise jamais tout seul.';

-- `in_stock` reste la colonne lue par la boutique. Elle devient le
-- reflet du compteur : à zéro le produit est épuisé, sans intervention.
CREATE OR REPLACE FUNCTION public.products_sync_stock()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.stock_unlimited THEN
    NEW.in_stock := true;
  ELSE
    NEW.in_stock := NEW.stock_qty > 0;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS products_stock_sync ON public.products;
CREATE TRIGGER products_stock_sync
  BEFORE INSERT OR UPDATE OF stock_qty, stock_unlimited ON public.products
  FOR EACH ROW EXECUTE FUNCTION public.products_sync_stock();

-- Reprise de l'existant : un produit déjà en vente reçoit une réserve
-- de départ, un produit marqué épuisé reste à zéro et compté.
UPDATE public.products
   SET stock_unlimited = false,
       stock_qty = CASE WHEN in_stock THEN 12 ELSE 0 END
 WHERE NOT archived;

-- ------------------------------------------------------------
--  2. Façon de vendre
--     '' (un seul prix) · 'kg' · 'format' · 'pot'
--     sell_options : [{ "label": "500 g", "price": 25 }, …]
--     La première entrée est celle cochée par défaut en boutique.
-- ------------------------------------------------------------
ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS sell_mode text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS sell_options jsonb NOT NULL DEFAULT '[]'::jsonb;

ALTER TABLE public.products
  DROP CONSTRAINT IF EXISTS products_sell_mode_valid;
ALTER TABLE public.products
  ADD CONSTRAINT products_sell_mode_valid
  CHECK (sell_mode IN ('', 'kg', 'format', 'pot'));

COMMENT ON COLUMN public.products.sell_mode IS
  'Comment la cliente choisit : '''' = un seul prix, kg = quantité, format = taille, pot = contenance.';

-- Les variantes existantes deviennent des options de vente. Le mode est
-- déduit une seule fois, ici, à partir de ce que disent les libellés —
-- ensuite c''est l''administratrice qui décide, plus le texte.
UPDATE public.products
   SET sell_options = variants,
       sell_mode = CASE
         WHEN variants::text ~* 'personne' THEN 'format'
         WHEN variants::text ~* '(^|[^a-z])pot|bol'  THEN 'pot'
         WHEN variants::text ~* 'format'   THEN 'format'
         WHEN variants::text ~* '\d\s*(g|kg)\b' THEN 'kg'
         ELSE 'format'
       END
 WHERE variants IS NOT NULL
   AND jsonb_typeof(variants) = 'array'
   AND jsonb_array_length(variants) > 0;

-- ------------------------------------------------------------
--  3. Modes de réception, produit par produit
-- ------------------------------------------------------------
ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS ship_pickup  boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS ship_local   boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS ship_national boolean NOT NULL DEFAULT true;

COMMENT ON COLUMN public.products.ship_pickup IS 'Retrait à l''atelier possible.';
COMMENT ON COLUMN public.products.ship_local IS 'Livraison locale possible.';
COMMENT ON COLUMN public.products.ship_national IS 'Expédition en France possible.';

-- Un produit frais ne voyage pas : la règle était déjà portée par
-- `local_only` et `requires_cold`, on la reprend telle quelle.
UPDATE public.products
   SET ship_national = false
 WHERE local_only OR requires_cold;

-- ------------------------------------------------------------
--  4. Pastille sur la photo — deux valeurs de plus
-- ------------------------------------------------------------
ALTER TABLE public.products DROP CONSTRAINT IF EXISTS products_badge_valid;
ALTER TABLE public.products
  ADD CONSTRAINT products_badge_valid
  CHECK (badge IS NULL OR badge IN ('bestseller', 'nouveau', 'commande', 'promo', 'limitee'));

-- ------------------------------------------------------------
--  5. Brouillon et archive ne font plus qu'un
--     Un produit est publié, ou il est archivé. Rien entre les deux.
-- ------------------------------------------------------------
UPDATE public.products SET archived = true WHERE draft AND NOT archived;
UPDATE public.products SET draft = false WHERE draft;

-- ------------------------------------------------------------
--  6. Une collection restée vide
--     'soon' : sa page reste en ligne et recueille les inscriptions.
--     'hide' : elle disparaît du menu tant qu'elle n'a aucun produit.
-- ------------------------------------------------------------
ALTER TABLE public.collections
  ADD COLUMN IF NOT EXISTS empty_behavior text NOT NULL DEFAULT 'soon';

ALTER TABLE public.collections DROP CONSTRAINT IF EXISTS collections_empty_valid;
ALTER TABLE public.collections
  ADD CONSTRAINT collections_empty_valid
  CHECK (empty_behavior IN ('soon', 'hide'));

-- ------------------------------------------------------------
--  7. Réglages de la boutique
--     Tarifs de livraison et fermeture de l'atelier. Une ligne par
--     réglage, valeur en texte : c'est l'écran Réglages qui les lit.
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.settings (
  key text PRIMARY KEY,
  value text NOT NULL DEFAULT '',
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT settings_key_format CHECK (key ~ '^[a-z0-9_]+$')
);

DROP TRIGGER IF EXISTS settings_touch ON public.settings;
CREATE TRIGGER settings_touch
  BEFORE UPDATE ON public.settings
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

INSERT INTO public.settings (key, value) VALUES
  ('delivery_start',      '5.00'),   -- prix de départ, en euros
  ('delivery_per_km',     '1.20'),   -- par kilomètre, en euros
  ('delivery_radius_km',  '30'),     -- au-delà, pas de livraison locale
  ('delivery_free_from',  '150'),    -- livraison locale offerte à partir de
  ('shipping_price',      '9.90'),   -- prix d'un colis
  ('shipping_free_from',  '80'),     -- colis offert à partir de
  ('holiday_mode',        'off'),    -- 'on' = aucune commande possible
  ('holiday_from',        ''),       -- texte libre : « 12 août »
  ('holiday_until',       '')        -- texte libre : « 26 août »
ON CONFLICT (key) DO NOTHING;
