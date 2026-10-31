-- ============================================================
-- 021 - Prix et grammages PROVISOIRES des fiches "Tarif a venir"
--
-- Valeurs de depart, a corriger depuis le back-office (Produits).
-- Chaque UPDATE ne touche qu'une valeur encore vide : un prix ou un
-- grammage deja saisi par l'admin n'est jamais ecrase.
-- ============================================================

UPDATE public.products AS p
   SET price = v.prix
  FROM (VALUES
    ('samsa-praline-noisette', 32.00),
    ('samsa-praline-pistache', 36.00),
    ('samsa-fruits-secs',      30.00),
    ('samsa-chocolat-blanc',   32.00),
    ('samsa-chocolat-noir',    32.00),
    ('debla',                  28.00),
    ('dattes-farcies-amandes', 22.00)
  ) AS v(slug, prix)
 WHERE p.slug = v.slug
   AND p.price = 0;

UPDATE public.products
   SET sell_options = '[
     {"id":"g-250","grams":250,"label":"","piecesEstimate":null},
     {"id":"g-500","grams":500,"label":"","piecesEstimate":null},
     {"id":"g-1000","grams":1000,"label":"","piecesEstimate":null}
   ]'::jsonb
 WHERE sell_mode = 'kg'
   AND sell_options = '[]'::jsonb
   AND slug IN (
     'baklawa-pistache', 'ghraiba', 'samsa-amandes', 'youyou', 'bechkoutou', 'sable',
     'samsa-praline-noisette', 'samsa-praline-pistache', 'samsa-fruits-secs',
     'samsa-chocolat-blanc', 'samsa-chocolat-noir', 'debla'
   );

UPDATE public.products
   SET assortment_composition = '[
     {"flavor":"Pistache et pignon","grams":200},
     {"flavor":"Framboise et pistache","grams":200},
     {"flavor":"Noisettes","grams":150},
     {"flavor":"Noix","grams":150},
     {"flavor":"Amandes","grams":150},
     {"flavor":"Abricot","grams":150}
   ]'::jsonb
 WHERE slug = 'dattes-farcies-variees'
   AND assortment_composition = '[]'::jsonb;
