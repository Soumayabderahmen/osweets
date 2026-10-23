-- ============================================================
--  LES PHOTOS AUSSI VIVENT DANS POSTGRESQL
--
--  Plus aucun service externe : les fichiers téléversés depuis le
--  back-office sont rangés dans la base, à côté des produits, et
--  servis par la route /api/public/media/<chemin>.
--
--  Conséquence pratique : une sauvegarde de la base (pg_dump)
--  contient aussi les photos. Rien à synchroniser ailleurs.
-- ============================================================

CREATE TABLE IF NOT EXISTS public.media_files (
  path text PRIMARY KEY,
  content_type text NOT NULL DEFAULT 'image/jpeg',
  bytes bytea NOT NULL,
  size_bytes integer NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT media_files_path_format CHECK (path ~ '^[A-Za-z0-9._-]+$'),
  CONSTRAINT media_files_type_allowed CHECK (
    content_type IN ('image/jpeg', 'image/png', 'image/webp', 'image/avif')
  ),
  CONSTRAINT media_files_size CHECK (size_bytes > 0 AND size_bytes <= 6 * 1024 * 1024)
);

COMMENT ON TABLE public.media_files IS
  'Photos téléversées depuis le back-office. Servies par /api/public/media/<path>.';
