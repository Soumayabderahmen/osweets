-- ============================================================
-- 029 - Baklawa Pistache masquée de la boutique
--
-- Dépubliée (published = false), pas supprimée ni archivée : la fiche,
-- son prix et sa photo restent dans l'admin, qui peut la remettre en
-- ligne d'un clic.
-- ============================================================
UPDATE public.products SET published = false WHERE slug = 'baklawa-pistache';
