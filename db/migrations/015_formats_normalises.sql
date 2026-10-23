-- ============================================================
-- 015 - Normalisation des formats de vente (Patisserie Tunisienne)
--
-- Objectif : ne plus considerer sell_mode = '' comme un mode de vente
-- valable pour ces produits. Trois modes metier restent : kg / format / pot.
--
-- Cette migration est additive et non destructive :
--   - aucune colonne n'est supprimee ou renommee ;
--   - aucun prix n'est invente : quand le prix au kilo ou un format n'est
--     pas fiable dans les donnees existantes, le produit est marque
--     "draft" (configuration admin requise) au lieu de recevoir une
--     valeur devinee ;
--   - les produits non cites dans la demande (Assortiment Patisseries
--     Tunisiennes, Zlebia & Mkharek) ne sont pas touches ;
--   - la colonne `variants` (legacy) n'est plus reecrite ici : elle garde
--     sa derniere valeur connue, lue en repli si `sell_options` est vide.
--
-- Etat avant migration (verifie en lecture seule le 2026-09-07) :
--   sell_mode='' : 16 produits, sell_mode='format' : 5, sell_mode='pot' : 4,
--   sell_mode='kg' : 1 (Kaak Warka). Voir le rapport joint pour le detail
--   ligne a ligne avant/apres.
-- ============================================================

-- ------------------------------------------------------------
-- 1. KG - Kaak Warka : deja en mode kg, prix au kilo deja fiable
--    (32 EUR/kg, coherent avec les 7 paliers existants). On retire
--    uniquement le prix stocke par palier : il est desormais toujours
--    recalcule depuis products.price. Aucun prix ne change pour la cliente.
-- ------------------------------------------------------------
UPDATE public.products
   SET sell_options = '[
         {"id":"g-100","grams":100,"piecesEstimate":null},
         {"id":"g-200","grams":200,"piecesEstimate":null},
         {"id":"g-250","grams":250,"piecesEstimate":null},
         {"id":"g-300","grams":300,"piecesEstimate":null},
         {"id":"g-500","grams":500,"piecesEstimate":null},
         {"id":"g-750","grams":750,"piecesEstimate":null},
         {"id":"g-1000","grams":1000,"piecesEstimate":null}
       ]'::jsonb
 WHERE slug = 'kaak-warka';

-- ------------------------------------------------------------
-- 2. KG - produits sans prix/kg fiable dans les donnees actuelles.
--    Mode bascule en 'kg', aucun grammage n'est encore autorise
--    (sell_options vide), et le produit passe en brouillon : il reste
--    visible (sauf Ghraiba, deja depublie) mais non commandable tant que
--    l'administratrice n'a pas saisi un vrai prix au kilo et coche des
--    grammages. L'ancien prix (boite/piece) est conserve tel quel dans
--    products.price, pour tracabilite uniquement - ce n'est PAS un prix
--    au kilo et ne doit pas etre lu comme tel.
-- ------------------------------------------------------------
UPDATE public.products
   SET sell_mode = 'kg',
       sell_options = '[]'::jsonb,
       draft = true
 WHERE slug IN (
   'baklawa-pistache',
   'samsa-amandes',
   'samsa-chocolat-blanc',
   'samsa-chocolat-noir',
   'samsa-fruits-secs',
   'samsa-praline-noisette',
   'samsa-praline-pistache',
   'bechkoutou',
   'ghraiba',
   'sable',
   'youyou',
   'debla',
   'dattes-farcies'
 );

-- Ghraiba : la demande est explicite - ne pas republier. On revient donc
-- immediatement sur published/archived pour ce seul produit (l'UPDATE
-- ci-dessus ne touchait pas ces colonnes, ceci est une securite explicite).
UPDATE public.products
   SET published = false,
       archived = true
 WHERE slug = 'ghraiba';

-- Dattes Farcies rejoint aussi la famille "dattes-farcies" (voir section 6).
UPDATE public.products
   SET family = 'dattes-farcies'
 WHERE slug = 'dattes-farcies';

-- ------------------------------------------------------------
-- 3. FORMAT - Kounefa (4 parfums) : "Pour 6 personnes"/"Pour 12 personnes"
--    deviennent Petit format / Grand format, avec personnes structurees.
--    Prix reels conserves (42 EUR / 76 EUR). Nombre de pieces NON invente :
--    l'ancien pieces=8 au niveau produit ne precisait pas pour quel format,
--    donc aucune valeur n'est reportee par option.
-- ------------------------------------------------------------
UPDATE public.products
   SET sell_options = '[
         {"id":"petit","label":"Petit format","price":42,"formatSize":"small","servesMin":6,"servesMax":6,"pieces":null},
         {"id":"grand","label":"Grand format","price":76,"formatSize":"large","servesMin":12,"servesMax":12,"pieces":null}
       ]'::jsonb
 WHERE slug IN ('kounefa-chocolat', 'kounefa-fromage', 'kounefa-kechda');

-- Kounefa Pistache : memes formats reels (42/76), prix produit historique
-- (46 EUR) laisse tel quel - il ne correspond a aucune option et n'est de
-- toute facon jamais lu tant que sell_options n'est pas vide.
UPDATE public.products
   SET sell_options = '[
         {"id":"petit","label":"Petit format","price":42,"formatSize":"small","servesMin":6,"servesMax":6,"pieces":null},
         {"id":"grand","label":"Grand format","price":76,"formatSize":"large","servesMin":12,"servesMax":12,"pieces":null}
       ]'::jsonb
 WHERE slug = 'kounefa-pistache';

-- ------------------------------------------------------------
-- 4. FORMAT - Hrisset Louz : garde son seul "Petit format" reel
--    (18 EUR, 4-5 personnes). Aucun Grand format invente : le
--    back-office permettra d'en ajouter un, marque "a configurer"
--    tant qu'aucun prix n'est saisi.
-- ------------------------------------------------------------
UPDATE public.products
   SET sell_options = '[
         {"id":"petit","label":"Petit format","price":18,"formatSize":"small","servesMin":4,"servesMax":5,"pieces":null}
       ]'::jsonb
 WHERE slug = 'hrisset-louz';

-- ------------------------------------------------------------
-- 5. FORMAT - Cheese-cake Kounefa : aucune donnee reelle (prix a 0,
--    aucun format connu). Mode bascule en 'format', reste en brouillon,
--    non commandable tant que l'administratrice n'a pas configure au
--    moins un format avec un prix reel.
-- ------------------------------------------------------------
UPDATE public.products
   SET sell_mode = 'format',
       sell_options = '[]'::jsonb,
       draft = true
 WHERE slug = 'cheesecake-kounefa';

-- ------------------------------------------------------------
-- 6. POT - Assida (3 parfums) et Bouza : poids deplace du texte du
--    libelle vers un champ structure weightG. Prix reels conserves.
--    products.price nettoye pour refleter le prix du plus petit pot
--    (c'est deja ce que la boutique affiche ; les deux Assida a 0 EUR
--    en base n'avaient jamais ete un vrai prix affiche a la cliente).
-- ------------------------------------------------------------
UPDATE public.products
   SET sell_options = '[
         {"id":"pot","label":"Pot individuel","weightG":180,"price":14},
         {"id":"bol","label":"Bol familial","weightG":500,"price":35}
       ]'::jsonb,
       price = 14
 WHERE slug IN ('assida-noisette', 'assida-pistache', 'assida-zgougou');

UPDATE public.products
   SET sell_options = '[
         {"id":"pot","label":"Pot individuel","weightG":180,"price":12},
         {"id":"bol","label":"Bol familial","weightG":500,"price":30}
       ]'::jsonb,
       price = 12
 WHERE slug = 'bouza';

-- ------------------------------------------------------------
-- 7. Famille Dattes Farcies : 6 nouveaux parfums + 1 assortiment.
--    Reutilise le mecanisme existant family/flavor_label (deja utilise
--    par Kounefa et Samsa) - pas de systeme parallele.
--
--    Aucun de ces 7 produits n'a de prix, de grammage ou de composition
--    reels aujourd'hui : ils sont crees en mode kg, sell_options vide,
--    draft=true ET published=false (contrairement aux produits migres
--    ci-dessus qui existaient deja publiquement, ceux-la n'ont jamais
--    ete vendus - ils restent invisibles tant que l'atelier n'a pas
--    rempli de vraies donnees).
-- ------------------------------------------------------------
INSERT INTO public.products
  (slug, name, category, family, flavor_label, price, sell_mode, sell_options,
   composition, short_desc, description, conservation,
   draft, published, sort_order)
VALUES
  ('dattes-farcies-pistache-pignon', 'Dattes Farcies Pistache et Pignon', 'traditionnelle',
   'dattes-farcies', 'Pistache et Pignon', 0, 'kg', '[]'::jsonb,
   '{}', '', '', '', true, false, 0),
  ('dattes-farcies-framboise-pistache', 'Dattes Farcies Framboise et Pistache', 'traditionnelle',
   'dattes-farcies', 'Framboise et Pistache', 0, 'kg', '[]'::jsonb,
   '{}', '', '', '', true, false, 0),
  ('dattes-farcies-noisettes', 'Dattes Farcies Noisettes', 'traditionnelle',
   'dattes-farcies', 'Noisettes', 0, 'kg', '[]'::jsonb,
   '{}', '', '', '', true, false, 0),
  ('dattes-farcies-noix', 'Dattes Farcies Noix', 'traditionnelle',
   'dattes-farcies', 'Noix', 0, 'kg', '[]'::jsonb,
   '{}', '', '', '', true, false, 0),
  ('dattes-farcies-amandes', 'Dattes Farcies Amandes', 'traditionnelle',
   'dattes-farcies', 'Amandes', 0, 'kg', '[]'::jsonb,
   '{}', '', '', '', true, false, 0),
  ('dattes-farcies-abricot', 'Dattes Farcies Abricot', 'traditionnelle',
   'dattes-farcies', 'Abricot', 0, 'kg', '[]'::jsonb,
   '{}', '', '', '', true, false, 0),
  ('dattes-farcies-variees', 'Dattes Farcies Variees', 'traditionnelle',
   'dattes-farcies', NULL, 0, 'kg', '[]'::jsonb,
   ARRAY['Pistache et pignon','Framboise et pistache','Noisettes','Noix','Amandes','Abricot'],
   'Un assortiment de dattes farcies en plusieurs parfums.',
   'Un assortiment de dattes farcies declinees en six parfums - pistache et pignon, framboise et pistache, noisette, noix, amande et abricot - pour decouvrir plusieurs saveurs dans une seule commande. Grammages, prix au kilo et repartition exacte des parfums restent a definir par l''atelier avant mise en vente.',
   '', true, false, 0)
ON CONFLICT (slug) DO NOTHING;

-- Le produit "Dattes Farcies" (historique) liste desormais ces 6 parfums
-- a titre indicatif - champ existant, non encore affiche cote boutique.
UPDATE public.products
   SET flavors = ARRAY['Pistache et Pignon','Framboise et Pistache','Noisettes','Noix','Amandes','Abricot']
 WHERE slug = 'dattes-farcies';
