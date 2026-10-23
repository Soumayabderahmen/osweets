-- ============================================================
-- 017 - Correction : "dattes-farcies" oublie dans 016
--
-- La migration 016 a bien restaure published=true pour ce produit, mais
-- a omis de remettre draft=false (la liste de la premiere UPDATE de 016
-- ne citait pas ce slug). Consequence verifiee : le produit restait
-- toujours invisible (draft=true bloque listProducts/getProductBySlug
-- au niveau SQL, meme avec published=true). Correction directe.
-- ============================================================
UPDATE public.products
   SET draft = false
 WHERE slug = 'dattes-farcies'
   AND sell_mode = 'kg';
