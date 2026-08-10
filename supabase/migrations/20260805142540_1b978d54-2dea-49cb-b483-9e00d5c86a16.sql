ALTER TABLE public.product_overrides
  ADD COLUMN IF NOT EXISTS description text,
  ADD COLUMN IF NOT EXISTS composition text[],
  ADD COLUMN IF NOT EXISTS allergens text[],
  ADD COLUMN IF NOT EXISTS unit text,
  ADD COLUMN IF NOT EXISTS pieces integer,
  ADD COLUMN IF NOT EXISTS weight text,
  ADD COLUMN IF NOT EXISTS variants jsonb;