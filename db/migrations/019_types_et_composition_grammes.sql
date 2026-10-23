-- 019 - Structure Famille -> Type -> Parfum et composition d'assortiment en grammes.
-- Additif : les anciennes donnees JSON par pieces restent conservees dans sell_options.

ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS product_type text,
  ADD COLUMN IF NOT EXISTS assortment_composition jsonb NOT NULL DEFAULT '[]'::jsonb;

ALTER TABLE public.products
  DROP CONSTRAINT IF EXISTS products_assortment_composition_array;
ALTER TABLE public.products
  ADD CONSTRAINT products_assortment_composition_array
  CHECK (jsonb_typeof(assortment_composition) = 'array');

-- Types deduits sans ambiguite du nom et de la structure valides par la mission.
UPDATE public.products
   SET product_type = CASE slug
     WHEN 'kounefa-kechda' THEN 'kechda'
     WHEN 'kounefa-fromage' THEN 'fromage'
     WHEN 'kounefa-chocolat' THEN 'chocolat'
     WHEN 'cheesecake-kounefa' THEN 'cheese-cake'
     ELSE product_type
   END,
       flavor_label = CASE
         WHEN slug IN ('kounefa-kechda','kounefa-fromage','kounefa-chocolat','cheesecake-kounefa') THEN NULL
         ELSE flavor_label
       END
 WHERE family = 'kounefa';

UPDATE public.products
   SET product_type = CASE
     WHEN slug = 'dattes-farcies-variees' THEN 'assortiment'
     WHEN flavor_label IS NOT NULL THEN 'parfum-simple'
     ELSE product_type
   END
 WHERE family = 'dattes-farcies';

COMMENT ON COLUMN public.products.product_type IS
  'Type structure au sein de la famille (ex. kechda, fromage, assortiment).';
COMMENT ON COLUMN public.products.assortment_composition IS
  'Composition de reference pour 1 kg : [{"flavor":"...","grams":...}], total exact 1000 g.';

-- Un grammage kg ne porte jamais un prix indépendant du prix/kg.
UPDATE public.products p
   SET sell_options = COALESCE(
     (SELECT jsonb_agg(option_value - 'price' ORDER BY ordinality)
        FROM jsonb_array_elements(p.sell_options) WITH ORDINALITY AS x(option_value, ordinality)),
     '[]'::jsonb
   )
 WHERE p.sell_mode = 'kg';
