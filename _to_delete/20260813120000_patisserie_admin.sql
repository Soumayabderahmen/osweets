-- Univers « Pâtisserie Tunisienne » — administration du catalogue
-- 1) Saisonnalité datée + fiches créées depuis l'administration
-- 2) Stockage public des photos produit

ALTER TABLE public.product_overrides
  ADD COLUMN IF NOT EXISTS season_start date,
  ADD COLUMN IF NOT EXISTS season_end date,
  ADD COLUMN IF NOT EXISTS category text,
  ADD COLUMN IF NOT EXISTS is_custom boolean NOT NULL DEFAULT false;

-- Bucket public des photos produit ------------------------------------------
INSERT INTO storage.buckets (id, name, public)
VALUES ('product-images', 'product-images', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- Lecture publique des photos
DROP POLICY IF EXISTS "product images are publicly readable" ON storage.objects;
CREATE POLICY "product images are publicly readable"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'product-images');

-- Seuls les administrateurs téléversent / remplacent / suppriment
DROP POLICY IF EXISTS "admins upload product images" ON storage.objects;
CREATE POLICY "admins upload product images"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'product-images'
    AND public.has_role(auth.uid(), 'admin'::public.app_role)
  );

DROP POLICY IF EXISTS "admins update product images" ON storage.objects;
CREATE POLICY "admins update product images"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'product-images'
    AND public.has_role(auth.uid(), 'admin'::public.app_role)
  );

DROP POLICY IF EXISTS "admins delete product images" ON storage.objects;
CREATE POLICY "admins delete product images"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'product-images'
    AND public.has_role(auth.uid(), 'admin'::public.app_role)
  );
