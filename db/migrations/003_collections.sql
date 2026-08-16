-- ============================================================
--  COLLECTIONS — univers « Pâtisserie Tunisienne »
--  Les six collections quittent le code pour la base : titres,
--  textes, référencement, visuel, ordre et publication deviennent
--  pilotables depuis le back-office.
--
--  `slug` est figé (il correspond à une page du site et à ses liens),
--  `product_key` est l'étiquette portée par les produits.
-- ============================================================

CREATE TABLE IF NOT EXISTS public.collections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_key text NOT NULL UNIQUE,
  slug text NOT NULL UNIQUE,
  label text NOT NULL,
  h1 text NOT NULL,
  title text NOT NULL DEFAULT '',
  description text NOT NULL DEFAULT '',
  subtitle text NOT NULL DEFAULT '',
  image_key text,
  image_url text,
  sort_order integer NOT NULL DEFAULT 0,
  published boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT collections_slug_format CHECK (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  CONSTRAINT collections_key_format CHECK (product_key ~ '^[a-z0-9]+(-[a-z0-9]+)*$')
);

DROP TRIGGER IF EXISTS collections_touch ON public.collections;
CREATE TRIGGER collections_touch
  BEFORE UPDATE ON public.collections
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- Une collection ne se supprime pas : elle se dépublie. Sa page existe
-- dans le site et ses liens sont indexés.
CREATE OR REPLACE FUNCTION public.collections_no_delete()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  RAISE EXCEPTION 'Une collection ne se supprime pas : passez published = false.';
END;
$$;

DROP TRIGGER IF EXISTS collections_block_delete ON public.collections;
CREATE TRIGGER collections_block_delete
  BEFORE DELETE ON public.collections
  FOR EACH ROW EXECUTE FUNCTION public.collections_no_delete();

INSERT INTO public.collections
  (product_key, slug, label, h1, title, description, subtitle, sort_order)
VALUES
  ('amandes', 'amandes', 'Amandes', 'Amandes', 'Pâtisseries aux Amandes — Ghraïba, Samsa, Hrisset Louz | Ö'' Sweets', 'Nos pâtisseries tunisiennes aux amandes façonnées à la main à Évry-Courcouronnes : Ghraïba fondante, Samsa croustillante, Hrisset Louz et dattes farcies à la pâte d''amandes.', 'L''amande sous toutes ses formes — travaillée en pâte, en poudre ou entière, elle est le cœur de la pâtisserie tunisienne.', 10),
  ('pistache', 'pistache-machmoum-pignon', 'Pistache, Machmoum & Pignon', 'Pistache, Machmoum & Pignon', 'Pistache, Machmoum & Pignon — Baklawa, Kounefa, Samsa | Ö'' Sweets', 'Les saveurs nobles de la pâtisserie tunisienne : pistache d''Iran, machmoum et pignon de pin. Baklawa, Kounefa et Samsa façonnées à la main dans notre atelier.', 'Les saveurs nobles. Pistache d''Iran, pignon de pin, et le machmoum — cette bouchée délicate qui doit son nom au bouquet de jasmin.', 20),
  ('perles', 'perles', 'Perles', 'Perles', 'Collection Perles — Bouchées rondes précieuses | Ö'' Sweets', 'Nos Perles : petites bouchées rondes et raffinées de la pâtisserie tunisienne Ö'' Sweets, façonnées à la main à Évry-Courcouronnes.', 'Petites bouchées rondes, pralinées et précieuses — une collection en préparation dans notre atelier.', 30),
  ('tradition', 'tradition', 'Tradition', 'Tradition', 'Collection Tradition — Ghraïba, Bechkoutou, Youyou, Sablé | Ö'' Sweets', 'Les quatre classiques tunisiens transmis de génération en génération : Ghraïba, Bechkoutou, Youyou et Sablé pur beurre AOP, façonnés à la main à Évry-Courcouronnes.', 'Les classiques de la maison — ceux que l''on retrouve sur toutes les tables tunisiennes.', 40),
  ('ramadan', 'ramadan', 'Ramadan', 'Ramadan', 'Collection Ramadan — Samsa, Kounefa, Assida, Zlebia | Ö'' Sweets', 'Les douceurs du mois sacré préparées chaque jour dans notre atelier d''Évry-Courcouronnes : Samsa, Kounefa, Assida, Zlebia & Mkharek, Bouza, Sablé, Hrisset Louz et dattes farcies.', 'Les douceurs du mois sacré. Samsa, kaak, assida, bouza et kounefa, préparées chaque matin dans notre atelier.', 50),
  ('aid', 'aid', 'Aïd', 'Aïd', 'Collection Aïd Mubarak — Kaak Warka, Samsa, Hrisset Louz | Ö'' Sweets', 'Célébrez l''Aïd avec nos pâtisseries tunisiennes signature : Kaak Warka, Baklawa pistache, Samsa aux amandes, Sablé pur beurre, Hrisset Louz et dattes farcies.', 'Pour célébrer l''Aïd — les pâtisseries que l''on offre et que l''on partage.', 60)
ON CONFLICT (slug) DO NOTHING;
