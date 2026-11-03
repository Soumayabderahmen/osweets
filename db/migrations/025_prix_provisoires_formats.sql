-- Prix PROVISOIRES (tous ≤ 50 €) pour les formats créés sans prix en 023/024,
-- à corriger dans l'admin. Ils deviennent visibles. Chaque mise à jour ne
-- touche qu'un format encore à 0 € : un prix déjà saisi n'est jamais écrasé.

CREATE OR REPLACE FUNCTION pg_temp.prix_format(p_slug text, p_id text, p_prix numeric)
RETURNS void LANGUAGE sql AS $$
  UPDATE public.products p
     SET sell_options = (
           SELECT jsonb_agg(
                    CASE WHEN o->>'id' = p_id AND COALESCE((o->>'price')::numeric, 0) = 0
                         THEN o || jsonb_build_object('price', p_prix, 'hidden', false)
                         ELSE o END
                    ORDER BY n)
             FROM jsonb_array_elements(p.sell_options) WITH ORDINALITY AS t(o, n)
         )
   WHERE p.slug = p_slug
     AND jsonb_array_length(p.sell_options) > 0;
$$;

SELECT pg_temp.prix_format('cheesecake-kounefa', 'petit', 36);
SELECT pg_temp.prix_format('cheesecake-kounefa', 'grand', 48);
SELECT pg_temp.prix_format('hrisset-louz', 'grand', 32);
SELECT pg_temp.prix_format('assida-zgougou', 'verrine', 8);

-- Brouillons de dattes farcies : un prix au kilo et les grammages 250 g / 500 g / 1 kg.
-- Ils RESTENT en brouillon : les publier reste un choix à faire dans l'admin.
UPDATE public.products AS p
   SET price = v.prix,
       sell_options = '[
         {"id":"g-250","grams":250,"label":"","piecesEstimate":null},
         {"id":"g-500","grams":500,"label":"","piecesEstimate":null},
         {"id":"g-1000","grams":1000,"label":"","piecesEstimate":null}
       ]'::jsonb
  FROM (VALUES
         ('dattes-farcies-framboise-pistache', 26),
         ('dattes-farcies-noisettes', 24),
         ('dattes-farcies-noix', 24),
         ('dattes-farcies-pistache-pignon', 28)
       ) AS v(slug, prix)
 WHERE p.slug = v.slug
   AND p.sell_mode = 'kg'
   AND p.price = 0
   AND jsonb_array_length(p.sell_options) = 0;
