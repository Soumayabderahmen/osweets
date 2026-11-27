-- La partie « Gâteaux » passe dans la base, pour être gérée depuis l'admin.
--
-- * gateau_pages : les pages du menu Gâteaux du site (colonne, ordre, texte, photo).
-- * gateaux      : les gâteaux de chaque page (nom, prix, format, délai, photo, en ligne).
-- * gateau_config : le configurateur « Gâteau d'anniversaire » (tailles et prix,
--                   parfums, thèmes, supplément « sur mesure »).
--
-- Les pages du site gardent leur texte détaillé (ingrédients, allergènes…) écrit
-- dans le code ; la base décide du nom, du prix, de la photo, de l'ordre et de
-- ce qui est en ligne. Un gâteau créé dans l'admin apparaît sur sa page.

CREATE TABLE IF NOT EXISTS public.gateau_pages (
  key text PRIMARY KEY,
  column_label text NOT NULL,
  title text NOT NULL,
  description text NOT NULL DEFAULT '',
  image_key text,
  image_url text,
  tag text NOT NULL DEFAULT 'Boutique',
  href text NOT NULL,
  visible boolean NOT NULL DEFAULT true,
  sort_order integer NOT NULL DEFAULT 0,
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.gateaux (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  page_key text NOT NULL REFERENCES public.gateau_pages(key) ON UPDATE CASCADE,
  name text NOT NULL,
  price numeric(10, 2) NOT NULL CHECK (price >= 0),
  format text NOT NULL DEFAULT '',
  lead_time text NOT NULL DEFAULT '48 h',
  image_key text,
  image_url text,
  visible boolean NOT NULL DEFAULT true,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS gateaux_page_idx ON public.gateaux (page_key, sort_order);

CREATE TABLE IF NOT EXISTS public.gateau_config (
  id integer PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  data jsonb NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now()
);

DROP TRIGGER IF EXISTS gateau_pages_touch ON public.gateau_pages;
CREATE TRIGGER gateau_pages_touch BEFORE UPDATE ON public.gateau_pages
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
DROP TRIGGER IF EXISTS gateaux_touch ON public.gateaux;
CREATE TRIGGER gateaux_touch BEFORE UPDATE ON public.gateaux
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
DROP TRIGGER IF EXISTS gateau_config_touch ON public.gateau_config;
CREATE TRIGGER gateau_config_touch BEFORE UPDATE ON public.gateau_config
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

INSERT INTO public.gateau_pages (key, column_label, title, description, image_key, tag, href, sort_order) VALUES
  ('gateaux-de-voyage', 'Nos gâteaux', 'Gâteaux de voyage', 'Nos cakes signature qui voyagent.', 'cake-chocolat.jpg', 'Boutique', '/gateaux/gateaux-de-voyage', 0),
  ('entremets', 'Nos gâteaux', 'Entremets', 'Des mousses légères sur un croustillant, pour les grandes tables.', 'cake-pistache.jpg', 'Boutique', '/gateaux/entremets', 10),
  ('cheesecake', 'Nos gâteaux', 'Cheesecakes', 'Onctueux, aérien : à la new-yorkaise ou revisité.', 'cake-vanille.jpg', 'Boutique', '/gateaux/cheesecake', 20),
  ('tiramisu', 'Nos gâteaux', 'Tiramisus', 'Mascarpone soyeux, café intense, la douceur italienne.', 'cake-chocolat.jpg', 'Boutique', '/gateaux/tiramisu', 30),
  ('tartes', 'Nos gâteaux', 'Tartes', 'Sablé croustillant, fruits de saison, chocolat, citron.', 'cake-citron.jpg', 'Boutique', '/gateaux/tartes', 40),
  ('fraisier', 'Nos gâteaux', 'Fraisiers', 'Génoise moelleuse, crème mousseline, fraises fraîches.', 'cake-pistache.jpg', 'Boutique', '/gateaux/fraisier', 50),
  ('bento', 'Formats individuels', 'Bento Cakes', 'Le petit gâteau à partager à deux.', 'cake-vanille.jpg', 'Boutique', '/gateaux/bento', 60),
  ('fondants', 'Formats individuels', 'Fondants individuels', 'Cœur coulant, à réchauffer quelques secondes.', 'cake-chocolat.jpg', 'Boutique', '/gateaux/fondants', 70),
  ('verrines', 'Formats individuels', 'Verrines', 'Des desserts en verre, pour un buffet élégant.', 'cat-cakes.jpg', 'Boutique', '/gateaux/verrines', 80),
  ('cupcakes', 'Formats individuels', 'Cupcakes', 'À la pièce ou en coffret de 12.', 'cake-noisette.jpg', 'Boutique', '/gateaux/cupcakes', 90),
  ('cookies', 'Formats individuels', 'Cookies', 'Moelleux à cœur, à la pièce ou en coffret.', 'cake-chocolat.jpg', 'Boutique', '/gateaux/cookies', 100),
  ('anniversaire', 'Célébrations & sur mesure', 'Gâteaux d''anniversaire', 'Plus de 15 thèmes, à composer : taille, parfum, message.', 'cake-pistache.jpg', 'Sur mesure', '/gateaux/anniversaire', 110),
  ('wedding-cakes', 'Célébrations & sur mesure', 'Wedding Cakes', 'Mariages, cérémonies : création signature, sur devis.', 'wedding-buffet.jpg', 'Sur devis', '/gateaux/wedding-cakes', 120),
  ('fin-annee', 'Célébrations & sur mesure', 'Gâteaux de fin d''année', 'Bûches et gâteaux de fêtes, en décembre.', 'cat-cakes.jpg', 'Saison', '/gateaux/fin-annee', 130)
ON CONFLICT (key) DO NOTHING;

INSERT INTO public.gateaux (slug, page_key, name, price, format, lead_time, image_key, sort_order) VALUES
  ('cake-de-voyage', 'gateaux-de-voyage', 'Cake de voyage', 24, 'Cake entier', '48 h', 'cake-citron.jpg', 0),
  ('quatre-quarts', 'gateaux-de-voyage', 'Quatre-quarts', 20, 'Cake entier', '48 h', 'cake-vanille.jpg', 10),
  ('brownies', 'gateaux-de-voyage', 'Brownies', 22, 'Format carré 12 parts', '48 h', 'cake-chocolat.jpg', 20),
  ('russe-pistache', 'gateaux-de-voyage', 'Russe pistache', 32, 'Rectangle 6 parts', '48 h', 'cake-pistache.jpg', 30),
  ('entremets-chocolat-praline', 'entremets', 'Entremets Chocolat & Praliné', 48, 'Ø 20 cm', '48 h', 'cake-chocolat.jpg', 0),
  ('entremets-pistache-framboise', 'entremets', 'Entremets Pistache & Framboise', 52, 'Ø 20 cm', '48 h', 'cake-pistache.jpg', 10),
  ('entremets-vanille-caramel', 'entremets', 'Entremets Vanille & Caramel', 48, 'Ø 20 cm', '48 h', 'cake-vanille.jpg', 20),
  ('entremets-citron-basilic', 'entremets', 'Entremets Citron & Basilic', 46, 'Ø 20 cm', '48 h', 'cake-citron.jpg', 30),
  ('cheesecake-nature', 'cheesecake', 'Cheesecake Nature', 32, 'Entier', '48 h', 'cake-vanille.jpg', 0),
  ('cheesecake-speculoos', 'cheesecake', 'Cheesecake Spéculoos', 36, 'Entier', '48 h', 'cake-chocolat.jpg', 10),
  ('cheesecake-fruits-rouges', 'cheesecake', 'Cheesecake Fruits Rouges', 38, 'Entier', '48 h', 'cake-citron.jpg', 20),
  ('cheesecake-pistache', 'cheesecake', 'Cheesecake Pistache', 42, 'Entier', '48 h', 'cake-pistache.jpg', 30),
  ('cheesecake-citron', 'cheesecake', 'Cheesecake Citron', 34, 'Entier', '48 h', 'cake-citron.jpg', 40),
  ('cheesecake-part-nature', 'cheesecake', 'Part Cheesecake Nature', 6, 'Part', '24 h', 'cake-vanille.jpg', 50),
  ('tiramisu-classique-verrine', 'tiramisu', 'Tiramisu Classique — Verrine', 7, 'Verrine', '48 h', 'cake-chocolat.jpg', 0),
  ('tiramisu-classique-plat', 'tiramisu', 'Tiramisu Classique — Plat', 38, 'Plat', '48 h', 'cake-chocolat.jpg', 10),
  ('tiramisu-pistache-verrine', 'tiramisu', 'Tiramisu Pistache — Verrine', 8, 'Verrine', '48 h', 'cake-pistache.jpg', 20),
  ('tiramisu-fruits-rouges', 'tiramisu', 'Tiramisu Fruits Rouges — Verrine', 8, 'Verrine', '48 h', 'cake-citron.jpg', 30),
  ('tiramisu-speculoos-plat', 'tiramisu', 'Tiramisu Spéculoos — Plat', 42, 'Plat', '48 h', 'cake-vanille.jpg', 40),
  ('tarte-fruits-6', 'tartes', 'Tarte aux fruits de saison — 6 parts', 28, '6 parts', '48 h', 'cake-vanille.jpg', 0),
  ('tarte-citron-6', 'tartes', 'Tarte Citron Meringuée — 6 parts', 30, '6 parts', '48 h', 'cake-citron.jpg', 10),
  ('tarte-citron-8', 'tartes', 'Tarte Citron Meringuée — 8 parts', 38, '8 parts', '48 h', 'cake-citron.jpg', 20),
  ('tarte-chocolat-6', 'tartes', 'Tarte Chocolat — 6 parts', 32, '6 parts', '48 h', 'cake-chocolat.jpg', 30),
  ('tarte-amandine-6', 'tartes', 'Tarte Amandine — 6 parts', 28, '6 parts', '48 h', 'cake-pistache.jpg', 40),
  ('tarte-amandine-8', 'tartes', 'Tarte Amandine — 8 parts', 36, '8 parts', '48 h', 'cake-pistache.jpg', 50),
  ('fraisier-6', 'fraisier', 'Fraisier — 6 parts', 42, '6 parts', '72 h', 'cake-vanille.jpg', 0),
  ('fraisier-8', 'fraisier', 'Fraisier — 8 parts', 56, '8 parts', '72 h', 'cake-vanille.jpg', 10),
  ('fraisier-10', 'fraisier', 'Fraisier — 10 parts', 72, '10 parts', '72 h', 'cake-vanille.jpg', 20),
  ('bento-vanille-fraise', 'bento', 'Bento Cake Vanille & Fraise', 18, '≈ 250 g', '48 h', 'cake-vanille.jpg', 0),
  ('bento-chocolat', 'bento', 'Bento Cake Chocolat', 18, '≈ 250 g', '48 h', 'cake-chocolat.jpg', 10),
  ('bento-pistache', 'bento', 'Bento Cake Pistache', 20, '≈ 260 g', '48 h', 'cake-pistache.jpg', 20),
  ('fondant-chocolat', 'fondants', 'Fondant chocolat individuel', 5.5, '90 g / pièce', '48 h', 'cake-chocolat.jpg', 0),
  ('fondant-pistache', 'fondants', 'Fondant pistache individuel', 6, '90 g / pièce', '48 h', 'cake-pistache.jpg', 10),
  ('fondant-citron', 'fondants', 'Fondant citron individuel', 5.5, '85 g / pièce', '48 h', 'cake-citron.jpg', 20),
  ('fondant-noisette', 'fondants', 'Fondant noisette individuel', 6, '90 g / pièce', '48 h', 'cake-noisette.jpg', 30),
  ('verrine-fruits-rouges', 'verrines', 'Verrine Fruits Rouges', 5.5, 'Individuelle', '24 h', 'cake-citron.jpg', 0),
  ('verrine-chocolat', 'verrines', 'Verrine Chocolat Noir', 5.5, 'Individuelle', '24 h', 'cake-chocolat.jpg', 10),
  ('verrine-pistache', 'verrines', 'Verrine Pistache & Fleur d''oranger', 6, 'Individuelle', '24 h', 'cake-pistache.jpg', 20),
  ('verrine-vanille-caramel', 'verrines', 'Verrine Vanille & Caramel', 5.5, 'Individuelle', '24 h', 'cake-vanille.jpg', 30),
  ('verrine-plateau-12', 'verrines', 'Plateau Verrines · 12 pièces', 58, 'Plateau', '48 h', 'cake-chocolat.jpg', 40),
  ('cupcake-vanille', 'cupcakes', 'Cupcake Vanille Bourbon', 4, 'À la pièce', '24 h', 'cake-vanille.jpg', 0),
  ('cupcake-chocolat', 'cupcakes', 'Cupcake Chocolat Noir', 4, 'À la pièce', '24 h', 'cake-chocolat.jpg', 10),
  ('cupcake-pistache', 'cupcakes', 'Cupcake Pistache', 4.5, 'À la pièce', '24 h', 'cake-pistache.jpg', 20),
  ('cupcake-citron', 'cupcakes', 'Cupcake Citron Meringué', 4, 'À la pièce', '24 h', 'cake-citron.jpg', 30),
  ('cupcake-noisette', 'cupcakes', 'Cupcake Noisette & Praliné', 4.5, 'À la pièce', '24 h', 'cake-noisette.jpg', 40),
  ('cupcake-box-12', 'cupcakes', 'Coffret Cupcakes · 12 pièces', 44, 'Boîte', '48 h', 'cake-vanille.jpg', 50),
  ('cookie-chocolat', 'cookies', 'Cookie Chocolat Intense', 3.5, 'À la pièce', '24 h', 'cake-chocolat.jpg', 0),
  ('cookie-pistache', 'cookies', 'Cookie Pistache & Chocolat blanc', 4, 'À la pièce', '24 h', 'cake-pistache.jpg', 10),
  ('cookie-noisette', 'cookies', 'Cookie Noisette & Praliné', 4, 'À la pièce', '24 h', 'cake-noisette.jpg', 20),
  ('cookie-vanille', 'cookies', 'Cookie Vanille & Pépites', 3.5, 'À la pièce', '24 h', 'cake-vanille.jpg', 30),
  ('cookie-box-12', 'cookies', 'Coffret Cookies · 12 pièces', 34, 'Boîte', '48 h', 'cake-chocolat.jpg', 40)
ON CONFLICT (slug) DO NOTHING;

INSERT INTO public.gateau_config (id, data) VALUES (1, '{"sizes": [{"id": "16", "label": "16 cm", "parts": 4, "price": 45.0, "visible": true}, {"id": "20", "label": "20 cm", "parts": 8, "price": 65.0, "visible": true}, {"id": "24", "label": "24 cm", "parts": 12, "price": 95.0, "visible": true}, {"id": "28", "label": "28 cm", "parts": 20, "price": 145.0, "visible": true}, {"id": "32", "label": "32 cm", "parts": 30, "price": 195.0, "visible": true}, {"id": "etage", "label": "Pièce montée 2 étages", "parts": 40, "price": 290.0, "visible": true}, {"id": "etage3", "label": "Pièce montée 3 étages", "parts": 70, "price": 480.0, "visible": true}], "flavors": [{"id": "chocolat", "label": "Chocolat Noir 70%"}, {"id": "vanille", "label": "Vanille Bourbon"}, {"id": "fraise", "label": "Fraise & Crème Vanille"}, {"id": "pistache", "label": "Pistache & Fleur d''Oranger"}, {"id": "citron", "label": "Citron Confit & Mascarpone"}, {"id": "framboise", "label": "Framboise & Chocolat Blanc"}, {"id": "caramel", "label": "Caramel Beurre Salé"}, {"id": "moka", "label": "Moka Praliné"}], "themes": [{"id": "reine-des-neiges", "label": "Reine des Neiges", "emoji": "❄️", "category": "motif", "visible": true}, {"id": "licorne", "label": "Licorne", "emoji": "🦄", "category": "motif", "visible": true}, {"id": "princesse", "label": "Princesse", "emoji": "👑", "category": "motif", "visible": true}, {"id": "super-heros", "label": "Super-héros", "emoji": "🦸", "category": "motif", "visible": true}, {"id": "spider-man", "label": "Spider-Man", "emoji": "🕷️", "category": "motif", "visible": true}, {"id": "voiture", "label": "Voitures & Cars", "emoji": "🏎️", "category": "motif", "visible": true}, {"id": "football", "label": "Football", "emoji": "⚽", "category": "motif", "visible": true}, {"id": "fleurs", "label": "Fleurs", "emoji": "🌸", "category": "motif", "visible": true}, {"id": "animaux", "label": "Animaux", "emoji": "🐻", "category": "motif", "visible": true}, {"id": "enfant-garcon", "label": "Enfant garçon", "emoji": "👦", "category": "age", "visible": true}, {"id": "enfant-fille", "label": "Enfant fille", "emoji": "👧", "category": "age", "visible": true}, {"id": "ado", "label": "Ado", "emoji": "🎮", "category": "age", "visible": true}, {"id": "adulte", "label": "Adulte", "emoji": "✨", "category": "age", "visible": true}, {"id": "premier-anniversaire", "label": "1er Anniversaire", "emoji": "🎂", "category": "occasion", "visible": true}, {"id": "baby-shower", "label": "Baby Shower", "emoji": "👶", "category": "occasion", "visible": true}, {"id": "anniversaire-mariage", "label": "Anniversaire de mariage", "emoji": "💍", "category": "occasion", "visible": true}, {"id": "personnalise", "label": "Sur mesure", "emoji": "🎨", "category": "occasion", "visible": true}], "customSupplement": 25, "leadTime": "72 h", "message": true}'::jsonb)
ON CONFLICT (id) DO NOTHING;
