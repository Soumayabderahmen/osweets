-- Produits restés hors du menu après le passage au nouveau menu (migration 027),
-- qui a caché les anciennes rubriques Tradition, Amandes, Pistache et Perles.
--
-- 1. Les dattes farcies par parfum vont dans « Pâtisseries orientales » et « Ramadan »
--    (« Dattes Farcies Variées » est déjà dans Ramadan).
-- 2. Les anciens produits absents de la liste de prix sont cachés du site.
--    Ils restent dans l'admin et peuvent être remis en ligne d'un clic.

UPDATE public.products
SET collections = array_append(collections, 'orientales')
WHERE slug IN (
    'dattes-farcies-abricot', 'dattes-farcies-amandes', 'dattes-farcies-framboise-pistache',
    'dattes-farcies-noisettes', 'dattes-farcies-noix', 'dattes-farcies-pistache-pignon'
  )
  AND NOT ('orientales' = ANY (collections));

UPDATE public.products
SET collections = array_append(collections, 'ramadan')
WHERE slug IN (
    'dattes-farcies-abricot', 'dattes-farcies-amandes', 'dattes-farcies-framboise-pistache',
    'dattes-farcies-noisettes', 'dattes-farcies-noix', 'dattes-farcies-pistache-pignon'
  )
  AND NOT ('ramadan' = ANY (collections));

UPDATE public.products
SET published = false
WHERE slug IN (
  'samsa-chocolat-blanc', 'samsa-chocolat-noir', 'samsa-fruits-secs',
  'samsa-praline-noisette', 'samsa-praline-pistache', 'samsa-amandes',
  'youyou', 'ghraiba'
);
