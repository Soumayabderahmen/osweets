-- Assida Zgougou se vend aussi en verrine. Prix inconnu : la verrine est créée
-- MASQUÉE, à compléter puis afficher depuis l'admin. Les pots et bols existants
-- ne sont pas touchés.
UPDATE public.products
   SET sell_options = sell_options
         || '[{"id":"verrine","label":"Verrine","price":0,"hidden":true}]'::jsonb
 WHERE slug = 'assida-zgougou'
   AND sell_mode = 'pot'
   AND NOT EXISTS (
         SELECT 1 FROM jsonb_array_elements(sell_options) o WHERE o->>'id' = 'verrine'
       );
