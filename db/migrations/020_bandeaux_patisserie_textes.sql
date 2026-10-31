-- ============================================================
-- 020 - Textes de /patisserie administrables
--
-- Migration additive : elle declare deux cles lues par le front-office.
--   patisserie-toutes : titre, texte et image de « Toutes nos patisseries »
--   patisserie-seo    : ce que Google affiche pour /patisserie. Une
--                       description vide reste composee a partir des
--                       collections publiees.
-- Si l'admin a deja cree ces lignes, on n'ecrase rien.
-- ============================================================

INSERT INTO public.page_banners (key, label, image_key, image_url, title, subtitle)
VALUES (
  'patisserie-toutes',
  'Pâtisserie Tunisienne — Toutes nos pâtisseries',
  COALESCE((SELECT image_key FROM public.page_banners WHERE key = 'patisserie'), ''),
  COALESCE((SELECT image_url FROM public.page_banners WHERE key = 'patisserie'), ''),
  'Toutes nos pâtisseries',
  'Toute la pâtisserie tunisienne Ö'' Sweets, toutes collections confondues. Façonnée à la main chaque matin à Évry-Courcouronnes.'
)
ON CONFLICT (key) DO NOTHING;

INSERT INTO public.page_banners (key, label, image_key, image_url, title, subtitle)
VALUES (
  'patisserie-seo',
  'Pâtisserie Tunisienne — Ce que Google affiche',
  '',
  '',
  'Nos collections — Pâtisserie Tunisienne | Ö'' Sweets',
  ''
)
ON CONFLICT (key) DO NOTHING;
