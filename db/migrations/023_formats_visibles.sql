-- Formats gérables depuis l'admin : visibles / masqués, ordre, prix manuel au kilo,
-- vente à la pièce. Aucune ligne n'est supprimée : un format masqué reste en base.

-- 1. Nouveau mode de vente « à la pièce ».
ALTER TABLE public.products DROP CONSTRAINT IF EXISTS products_sell_mode_valid;
ALTER TABLE public.products
  ADD CONSTRAINT products_sell_mode_valid
  CHECK (sell_mode IN ('', 'kg', 'format', 'pot', 'piece'));

-- 2. L'ordre des grammages est désormais celui enregistré (réglable avec ↑ ↓).
--    La boutique les triait par poids : on fige cet ordre pour ne rien changer à l'affichage.
UPDATE public.products p
   SET sell_options = (
         SELECT jsonb_agg(o ORDER BY (o->>'grams')::numeric)
           FROM jsonb_array_elements(p.sell_options) o
       )
 WHERE p.sell_mode = 'kg'
   AND jsonb_typeof(p.sell_options) = 'array'
   AND jsonb_array_length(p.sell_options) > 0;

-- 3. Kaak Warka : les 7 grammages restent enregistrés ; seuls 250 g, 500 g et 1 kg sont proposés.
UPDATE public.products p
   SET sell_options = (
         SELECT jsonb_agg(
                  o || jsonb_build_object('hidden', (o->>'grams')::int IN (100, 200, 300, 750))
                  ORDER BY (o->>'grams')::numeric)
           FROM jsonb_array_elements(p.sell_options) o
       )
 WHERE p.slug = 'kaak-warka'
   AND p.sell_mode = 'kg'
   AND jsonb_array_length(p.sell_options) > 0;

-- 4. Cheese-cake Kounefa : vendu selon le nombre de personnes, comme les autres kounefa.
--    Les deux formats sans prix connu naissent masqués (price 0) : à compléter dans l'admin.
UPDATE public.products
   SET sell_mode = 'format',
       sell_options = '[
         {"id":"part","label":"Part individuelle","servesMin":1,"servesMax":1,"price":12,"hidden":false},
         {"id":"petit","label":"Petit format","servesMin":6,"servesMax":6,"price":0,"formatSize":"small","hidden":true},
         {"id":"grand","label":"Grand format","servesMin":12,"servesMax":12,"price":0,"formatSize":"large","hidden":true}
       ]'::jsonb
 WHERE slug = 'cheesecake-kounefa';

-- 5. Hrisset Louz : plus de « 6 pièces » ; grand format créé masqué, prix à renseigner.
UPDATE public.products
   SET sell_mode = 'format',
       sell_options = '[
         {"id":"petit","label":"Petit format","servesMin":4,"servesMax":6,"price":18,"formatSize":"small","hidden":false},
         {"id":"grand","label":"Grand format","servesMin":8,"servesMax":12,"price":0,"formatSize":"large","hidden":true}
       ]'::jsonb
 WHERE slug = 'hrisset-louz';

-- 6. Délai de commande des kounefa (cheese-cake compris), sans écraser un délai déjà saisi.
UPDATE public.products
   SET prep_lead = 'Commande 48 h avant'
 WHERE family = 'kounefa'
   AND (prep_lead IS NULL OR btrim(prep_lead) = '');
