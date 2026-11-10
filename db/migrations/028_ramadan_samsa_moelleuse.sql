-- ============================================================
-- 028 - Ramadan : une seule samsa, la Samsa moelleuse
--
-- Les samsa par parfum quittent la collection Ramadan ; la Samsa
-- moelleuse (créée en 027, Gâteaux d'occasion) y entre. Les fiches par
-- parfum ne sont ni supprimées ni dépubliées : seule leur place dans
-- Ramadan change.
-- ============================================================
UPDATE public.products
   SET collections = array_remove(collections, 'ramadan')
 WHERE family = 'samsa'
   AND 'ramadan' = ANY(collections);

UPDATE public.products
   SET collections = array_append(collections, 'ramadan')
 WHERE slug = 'samsa-moelleuse'
   AND NOT ('ramadan' = ANY(collections));
