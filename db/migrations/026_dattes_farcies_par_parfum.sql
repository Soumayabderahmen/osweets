-- ============================================================
-- 026 - Dattes farcies : une fiche par parfum, l'ancienne fiche supprimee
--
-- 1. Les quatre parfums en brouillon (prix et grammages poses en 025)
--    passent en ligne, dans la collection "tradition" comme l'abricot
--    et l'assortiment.
-- 2. L'assortiment "Dattes Farcies Variees" reprend la place de l'ancienne
--    fiche dans la collection "ramadan".
-- 3. Les anciennes adresses ('dattes-farcies', 'degla-farcie') menent
--    desormais a l'assortiment, puis la fiche generique archivee (018)
--    est supprimee. Aucune ligne de commande ne la cite ; ses photos et
--    son ancienne redirection partent avec elle (ON DELETE CASCADE),
--    c'est pourquoi la redirection est reposee juste apres.
-- ============================================================

UPDATE public.products
   SET published = true,
       draft = false,
       collections = CASE WHEN 'tradition' = ANY(collections)
                          THEN collections
                          ELSE array_append(collections, 'tradition') END
 WHERE slug IN ('dattes-farcies-framboise-pistache', 'dattes-farcies-noisettes',
                'dattes-farcies-noix', 'dattes-farcies-pistache-pignon')
   AND archived = false
   AND price > 0
   AND jsonb_array_length(sell_options) > 0;

UPDATE public.products
   SET collections = array_append(collections, 'ramadan')
 WHERE slug = 'dattes-farcies-variees'
   AND NOT ('ramadan' = ANY(collections));

DELETE FROM public.products
 WHERE slug = 'dattes-farcies'
   AND archived = true
   AND NOT EXISTS (SELECT 1 FROM public.order_items oi
                    WHERE oi.product_id = products.id);

INSERT INTO public.product_slug_history (old_slug, product_id)
SELECT v.ancien, p.id
  FROM (VALUES ('dattes-farcies'), ('degla-farcie')) AS v(ancien)
  JOIN public.products p ON p.slug = 'dattes-farcies-variees'
 WHERE NOT EXISTS (SELECT 1 FROM public.products x WHERE x.slug = v.ancien)
ON CONFLICT (old_slug) DO UPDATE SET product_id = EXCLUDED.product_id;
