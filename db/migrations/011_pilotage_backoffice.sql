-- ════════════════════════════════════════════════════════════════════
--  011 — Ce qui restait écrit dans le code passe en base
--
--  Cette migration ne change rien à ce que voit la cliente aujourd'hui :
--  chaque valeur est semée avec exactement ce que le code affichait déjà.
--  Elle déplace seulement le lieu de la décision — du fichier vers la
--  table, donc du développeur vers le back-office.
-- ════════════════════════════════════════════════════════════════════

-- ------------------------------------------------------------
--  1. Réglages qui manquaient
--     L'adresse de l'atelier et les délais annoncés étaient écrits dans
--     `fulfillment.ts` et dans la fiche produit. Le prix de l'emballage
--     cadeau était écrit dans le JSX — et n'était même pas facturé.
-- ------------------------------------------------------------
INSERT INTO public.settings (key, value) VALUES
  ('gift_wrap_price',  '5.00'),
  ('workshop_address', 'Atelier Ö''Sweets — Évry-Courcouronnes (91)'),
  ('shipping_delay',   'Colis 48-72h'),
  ('pickup_delay',     'Sur rendez-vous à l''atelier')
ON CONFLICT (key) DO NOTHING;

-- ------------------------------------------------------------
--  2. Le calendrier saisonnier
--
--     Les dates de Ramadan et de l'Aïd vivaient dans `season.ts`,
--     écrites jusqu'en 2028. En 2029 la collection Ramadan ne se serait
--     plus jamais ouverte, et personne n'aurait su pourquoi.
--
--     Une ligne par occurrence. `preorder_days` avance l'ouverture :
--     mettre 7 fait apparaître la collection une semaine plus tôt, sans
--     toucher aux dates de la fête.
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.seasons (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  season_key    text NOT NULL,
  label         text NOT NULL DEFAULT '',
  starts_on     date NOT NULL,
  ends_on       date NOT NULL,
  preorder_days integer NOT NULL DEFAULT 0,
  active        boolean NOT NULL DEFAULT true,
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT seasons_key_format CHECK (season_key ~ '^[a-z0-9-]+$'),
  CONSTRAINT seasons_dates_ordered CHECK (ends_on >= starts_on),
  CONSTRAINT seasons_preorder_positive CHECK (preorder_days >= 0)
);

COMMENT ON TABLE public.seasons IS
  'Fenêtres d''ouverture des collections saisonnières, pilotées depuis le back-office.';

CREATE INDEX IF NOT EXISTS seasons_key_idx ON public.seasons (season_key, starts_on);

DROP TRIGGER IF EXISTS seasons_touch ON public.seasons;
CREATE TRIGGER seasons_touch
  BEFORE UPDATE ON public.seasons
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- Reprise à l'identique des fenêtres qui étaient dans le code.
INSERT INTO public.seasons (season_key, label, starts_on, ends_on)
SELECT * FROM (VALUES
  ('ramadan', 'Ramadan 2026',        DATE '2026-02-10', DATE '2026-03-19'),
  ('ramadan', 'Ramadan 2027',        DATE '2027-01-31', DATE '2027-03-09'),
  ('ramadan', 'Ramadan 2028',        DATE '2028-01-20', DATE '2028-02-26'),
  ('aid',     'Aïd el-Fitr 2026',    DATE '2026-03-13', DATE '2026-03-23'),
  ('aid',     'Aïd el-Fitr 2027',    DATE '2027-03-02', DATE '2027-03-12'),
  ('aid',     'Aïd el-Fitr 2028',    DATE '2028-02-19', DATE '2028-03-01'),
  ('aid',     'Aïd el-Adha 2026',    DATE '2026-05-20', DATE '2026-05-30'),
  ('aid',     'Aïd el-Adha 2027',    DATE '2027-05-09', DATE '2027-05-19'),
  ('aid',     'Aïd el-Adha 2028',    DATE '2028-04-27', DATE '2028-05-07')
) AS v(season_key, label, starts_on, ends_on)
WHERE NOT EXISTS (SELECT 1 FROM public.seasons);

-- ------------------------------------------------------------
--  3. Les produits recommandés
--     « Vous aimerez aussi » prenait les quatre premiers de la même
--     catégorie. On garde ce repli, mais l'admin peut désormais choisir.
-- ------------------------------------------------------------
ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS recommended text[] NOT NULL DEFAULT '{}';

COMMENT ON COLUMN public.products.recommended IS
  'Slugs mis en avant sous la fiche. Vide = choix automatique.';

-- ------------------------------------------------------------
--  4. Les anciennes adresses de fiches
--
--     Renommer un produit depuis le back-office cassait son ancienne
--     adresse jusqu'à ce qu'un développeur ajoute une ligne dans le code.
--     Le déclencheur ci-dessous mémorise l'ancien slug tout seul.
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.product_slug_history (
  old_slug   text PRIMARY KEY,
  product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.product_slug_history IS
  'Anciens slugs de fiches, alimenté automatiquement à chaque renommage.';

CREATE INDEX IF NOT EXISTS product_slug_history_product_idx
  ON public.product_slug_history (product_id);

CREATE OR REPLACE FUNCTION public.products_record_slug_change() RETURNS trigger AS $$
BEGIN
  IF NEW.slug IS DISTINCT FROM OLD.slug THEN
    -- L'ancienne adresse mène désormais à la nouvelle fiche.
    INSERT INTO public.product_slug_history (old_slug, product_id)
    VALUES (OLD.slug, NEW.id)
    ON CONFLICT (old_slug) DO UPDATE SET product_id = EXCLUDED.product_id;
    -- Un slug réutilisé par un vrai produit cesse d'être une redirection.
    DELETE FROM public.product_slug_history WHERE old_slug = NEW.slug;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS products_slug_history ON public.products;
CREATE TRIGGER products_slug_history
  AFTER UPDATE OF slug ON public.products
  FOR EACH ROW EXECUTE FUNCTION public.products_record_slug_change();

-- ------------------------------------------------------------
--  5. Le prix barré s'en va
--
--     Décision de la propriétaire : le futur système de promotions
--     reposera sur le compte cliente, son historique et des règles de
--     fidélité — pas sur un prix barré. La colonne n'est renseignée sur
--     aucun produit, aucun univers ne la lit : on la retire plutôt que
--     de la garder « pour plus tard ».
-- ------------------------------------------------------------
ALTER TABLE public.products DROP COLUMN IF EXISTS compare_at_price;
