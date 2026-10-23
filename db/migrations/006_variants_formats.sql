-- Lot 2 — formats & conditionnements : la base doit porter les variantes,
-- sinon la fiche produit perd le sélecteur « Choisissez votre format ».
UPDATE public.products SET variants = '[{"id":"pot","label":"Pot individuel · 180 g","price":14},{"id":"bol","label":"Bol familial · 500 g","price":35}]'::jsonb
 WHERE slug IN ('assida-zgougou','assida-noisette','assida-pistache') AND variants IS NULL;

UPDATE public.products SET variants = '[{"id":"pot","label":"Pot individuel · 180 g","price":12},{"id":"bol","label":"Bol familial · 500 g","price":30}]'::jsonb
 WHERE slug = 'bouza' AND variants IS NULL;

UPDATE public.products SET variants = '[{"id":"petit","label":"Petit format · 4-5 personnes","price":18},{"id":"grand","label":"Grand format · 8-10 personnes","price":30}]'::jsonb
 WHERE slug = 'hrisset-louz' AND variants IS NULL;

UPDATE public.products SET variants = '[{"id":"p6","label":"Pour 6 personnes","price":42},{"id":"p12","label":"Pour 12 personnes","price":76}]'::jsonb
 WHERE slug IN ('kounefa-pistache','kounefa-chocolat','kounefa-kechda','kounefa-fromage') AND variants IS NULL;
