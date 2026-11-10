-- ============================================================
-- 030 - Aïd : une seule samsa, la Samsa moelleuse (comme Ramadan en 028)
--
-- Les samsa par parfum quittent la collection Aïd ; la Samsa moelleuse y
-- entre. Aucune fiche n'est supprimée ni dépubliée.
-- ============================================================
UPDATE public.products
   SET collections = array_remove(collections, 'aid')
 WHERE family = 'samsa'
   AND 'aid' = ANY(collections);

UPDATE public.products
   SET collections = array_append(collections, 'aid')
 WHERE slug = 'samsa-moelleuse'
   AND NOT ('aid' = ANY(collections));
