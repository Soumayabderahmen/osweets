-- ════════════════════════════════════════════════════════════════════
--  009 — Les bandeaux passent en base
--
--  Jusqu'ici, l'image en haut d'une page collection ou d'une page
--  événement était un fichier livré avec le site
--  (`import heroImg from "@/assets/p-ghrayba.jpg"`). La changer voulait
--  dire modifier le code et redéployer : impossible depuis le
--  back-office.
--
--  Deux cas, deux solutions :
--
--  1. Les collections ont déjà `image_url` / `image_key` (migration 003).
--     Rien à créer : il suffit de les remplir, ce que fait
--     `node scripts/push-banners.mjs --write`.
--
--  2. Les pages événements ne sont pas des collections. Elles reçoivent
--     ici leur propre table, `page_banners` : une ligne par page, avec
--     son visuel et, si l'admin le souhaite, son titre et son
--     sous-titre.
-- ════════════════════════════════════════════════════════════════════

-- ------------------------------------------------------------
--  1. Bandeaux de page
--     `key` est l'identifiant stable de la page (« evenements-mariage »),
--     jamais son adresse : une URL peut changer, la clé non.
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.page_banners (
  key         text PRIMARY KEY,
  label       text NOT NULL DEFAULT '',
  image_key   text NOT NULL DEFAULT '',
  image_url   text NOT NULL DEFAULT '',
  title       text NOT NULL DEFAULT '',
  subtitle    text NOT NULL DEFAULT '',
  updated_at  timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT page_banners_key_format CHECK (key ~ '^[a-z0-9-]+$')
);

COMMENT ON TABLE public.page_banners IS
  'Visuel et accroche du haut de page, pilotés depuis le back-office.';
COMMENT ON COLUMN public.page_banners.image_key IS
  'Ancien fichier de src/assets — repli temporaire, voué à disparaître.';
COMMENT ON COLUMN public.page_banners.image_url IS
  'Adresse servie par la base : /api/public/media/<fichier>.';

DROP TRIGGER IF EXISTS page_banners_touch ON public.page_banners;
CREATE TRIGGER page_banners_touch
  BEFORE UPDATE ON public.page_banners
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- ------------------------------------------------------------
--  2. Les pages qui ont un bandeau aujourd'hui
--     On inscrit les lignes maintenant, vides d'image : le script
--     `push-banners.mjs` y versera les visuels actuels. Ainsi la liste
--     du back-office est complète dès la première ouverture, même avant
--     tout téléversement.
-- ------------------------------------------------------------
INSERT INTO public.page_banners (key, label, image_key) VALUES
  ('patisserie',              'Pâtisserie Tunisienne — page d''entrée', 'cat-patisserie.jpg'),
  ('patisserie-collection-defaut', 'Collection sans visuel — image par défaut', 'plateau-or-assortiment-signature.jpg'),
  ('evenements',              'Événements — page d''entrée',            'wedding-buffet.jpg'),
  ('evenements-mariage',      'Événements — Mariage',                   'wedding-buffet.jpg'),
  ('evenements-fiancailles',  'Événements — Fiançailles',               'p-kaak-warka.jpg'),
  ('evenements-anniversaire', 'Événements — Anniversaire',              'cake-vanille.jpg'),
  ('evenements-baby-shower',  'Événements — Baby shower',               'p-mignardises.jpg'),
  ('evenements-gender-reveal','Événements — Gender reveal',             'cake-pistache.jpg'),
  ('evenements-entreprise',   'Événements — Entreprise',                'wedding-buffet.jpg'),
  ('evenements-ramadan',      'Événements — Ramadan',                   'p-baklawa.jpg'),
  ('evenements-aid',          'Événements — Aïd',                       'cat-coffrets.jpg'),
  ('cadeaux',                 'Cadeaux — page d''entrée',               'cat-coffrets.jpg')
ON CONFLICT (key) DO NOTHING;
