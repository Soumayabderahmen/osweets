-- ============================================================
-- 014 - Bandeau administrable du mega menu Patisserie
--
-- Migration additive : elle declare seulement la cle que le front-office
-- lit pour l'image du mega menu. Si l'admin a deja cree cette ligne, on
-- n'ecrase rien.
-- ============================================================

INSERT INTO public.page_banners (key, label, image_key, title, subtitle)
VALUES (
  'patisserie-mega-menu-occasions',
  'Patisserie Tunisienne - mega menu occasions',
  'plateau-or-assortiment-signature.jpg',
  'L''atelier',
  'Fait main'
)
ON CONFLICT (key) DO NOTHING;
