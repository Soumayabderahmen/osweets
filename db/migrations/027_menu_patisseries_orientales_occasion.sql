-- ============================================================
-- 027 - Nouveau menu Pâtisserie : « Pâtisseries orientales » et
--       « Gâteaux d'occasion » (liste des prix de l'atelier)
--
-- 1. Deux nouvelles collections, en tête du menu. Ramadan et Aïd ne
--    changent pas. Amandes, Pistache-Machmoum-Pignon, Perles et Tradition
--    sont MASQUÉES (hidden), pas supprimées : leurs produits et leurs
--    associations restent, on peut les réafficher depuis l'admin.
-- 2. Les produits déjà en vente prennent le prix de la liste et rejoignent
--    la nouvelle collection (en tête du menu, c'est elle que la carte
--    produit affiche).
-- 3. Les produits absents de la base sont créés, vendus au poids
--    (250 g / 500 g / 1 kg), sans photo sauf quand l'atelier en a déjà une.
--    Allergènes et composition restent à renseigner dans l'admin.
-- Chaque INSERT est protégé (ON CONFLICT DO NOTHING) : relancer la
-- migration, ou la jouer sur une base qui a déjà ces fiches, n'écrase rien.
-- ============================================================

-- ---------- 1. Collections ----------
INSERT INTO public.collections
  (product_key, slug, label, h1, title, description, subtitle, image_key, image_url,
   sort_order, published, empty_behavior, hidden)
VALUES
  ('orientales', 'patisseries-orientales', 'Pâtisseries orientales', 'Pâtisseries orientales',
   'Pâtisseries orientales — Bachkoutou, ghrayba, sablés | Ö'' Sweets',
   'Pâtisseries orientales faites main à Évry-Courcouronnes : bachkoutou, ghrayba, libanais, sablés et zouza, vendus au poids.',
   'Les biscuits et douceurs de tous les jours, vendus au poids.',
   '', '/api/public/media/bandeau-plateau-or-assortiment-signature.jpg', 1, true, 'soon', false),
  ('occasion', 'gateaux-occasion', 'Gâteaux d''occasion', 'Gâteaux d''occasion',
   'Gâteaux d''occasion — Kaak, samsa, mignardises | Ö'' Sweets',
   'Gâteaux d''occasion faits main à Évry-Courcouronnes : kaak warka, kaak louz, kaak amber, samsa et mignardises pour vos fêtes.',
   'Les pièces de fête, pour les mariages, fiançailles et grandes tables.',
   '', '/api/public/media/bandeau-p-kaak-warka.jpg', 2, true, 'soon', false)
ON CONFLICT (slug) DO NOTHING;

UPDATE public.collections
   SET hidden = true
 WHERE slug IN ('amandes', 'pistache-machmoum-pignon', 'perles', 'tradition');

-- ---------- 2. Familles (pour « Autres parfums ») ----------
INSERT INTO public.families (key, label)
VALUES ('bachkoutou', 'Bachkoutou'), ('ghrayba', 'Ghrayba')
ON CONFLICT (key) DO NOTHING;

-- ---------- 3. Produits existants : prix de la liste + nouvelle collection ----------
-- (Le déclencheur products_normalize_collections retrie la liste ensuite.)
CREATE OR REPLACE FUNCTION pg_temp.en_tete(cols text[], c text) RETURNS text[]
LANGUAGE sql IMMUTABLE AS $$ SELECT array_prepend(c, array_remove(cols, c)) $$;

UPDATE public.products
   SET name = 'Bachkoutou nature', price = 15, family = 'bachkoutou',
       flavor_label = 'Nature', product_type = 'parfum-simple',
       collections = pg_temp.en_tete(collections, 'orientales')
 WHERE slug = 'bechkoutou';

UPDATE public.products
   SET price = 18, collections = pg_temp.en_tete(collections, 'orientales')
 WHERE slug = 'sable';

UPDATE public.products
   SET name = 'Kaak Warka bennesri', price = 40,
       collections = pg_temp.en_tete(collections, 'occasion')
 WHERE slug = 'kaak-warka';

-- ---------- 4. Nouveaux produits (au poids) ----------
INSERT INTO public.products
  (slug, name, category, family, flavor_label, product_type, price, unit,
   short_desc, description, image_url, image_key, collections, badge,
   sell_mode, sell_options, published, draft, archived, sort_order)
SELECT v.slug, v.nom, v.categorie, v.famille, v.parfum, v.type_produit, v.prix, NULL,
       v.court, v.court, v.photo, NULL, ARRAY[v.collection], 'nouveau',
       'kg',
       '[{"id":"g-250","grams":250,"label":"","piecesEstimate":null},
         {"id":"g-500","grams":500,"label":"","piecesEstimate":null},
         {"id":"g-1000","grams":1000,"label":"","piecesEstimate":null}]'::jsonb,
       true, false, false, v.ordre
  FROM (VALUES
    ('bachkoutou-fruits-secs', 'Bachkoutou fruits secs', 'traditionnelle', 'bachkoutou', 'Fruits secs', 'parfum-simple', 18, 'orientales', NULL,
     'Le bachkoutou de la maison, enrichi de fruits secs.', 81),
    ('ghrayba-pois-chiche', 'Ghrayba pois chiche', 'traditionnelle', 'ghrayba', 'Pois chiche', 'parfum-simple', 25, 'orientales', NULL,
     'Ghrayba fondante à la farine de pois chiche.', 82),
    ('ghrayba-droo', 'Ghrayba droo', 'traditionnelle', 'ghrayba', 'Droo', 'parfum-simple', 22, 'orientales', NULL,
     'Ghrayba au droo (sorgho), recette tunisienne d''autrefois.', 83),
    ('libanais', 'Libanais', 'orientale', NULL, NULL, NULL, 32, 'orientales', NULL,
     'Petites bouchées libanaises faites main.', 84),
    ('zouza-caramel-noisette', 'Zouza caramel & noisette', 'orientale', NULL, NULL, NULL, 28, 'orientales', NULL,
     'Zouza au caramel et à la noisette.', 91),
    ('kaak-louz', 'Kaak louz', 'traditionnelle', NULL, NULL, NULL, 35, 'occasion', NULL,
     'Kaak à la pâte d''amandes.', 11),
    ('kaak-amber', 'Kaak amber', 'traditionnelle', NULL, NULL, NULL, 38, 'occasion', NULL,
     'Kaak parfumé à l''ambre.', 12),
    ('assortiment-special', 'Assortiment spécial', 'orientale', NULL, NULL, NULL, 48, 'occasion', NULL,
     'Un assortiment de nos pâtisseries d''occasion.', 13),
    ('samsa-moelleuse', 'Samsa moelleuse', 'orientale', NULL, NULL, NULL, 65, 'occasion', '/api/public/media/p-samsa.jpg',
     'Samsa moelleuse, faite main.', 14),
    ('mignardises-pistache-noisette', 'Mignardises pistache & noisette', 'orientale', NULL, NULL, NULL, 58, 'occasion', '/api/public/media/p-mignardises.jpg',
     'Mignardises à la pistache et à la noisette.', 15)
  ) AS v(slug, nom, categorie, famille, parfum, type_produit, prix, collection, photo, court, ordre)
ON CONFLICT (slug) DO NOTHING;
