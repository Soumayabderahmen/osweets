-- Disponibilité pilotable depuis l'administration.
-- NULL = on garde la valeur de la fiche statique ; false = produit épuisé.
ALTER TABLE public.product_overrides
  ADD COLUMN IF NOT EXISTS in_stock boolean;
