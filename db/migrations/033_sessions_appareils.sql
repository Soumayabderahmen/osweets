-- « Mon profil » montre où le compte est connecté.
-- Chaque session reçoit un identifiant public (le jeton, lui, ne quitte jamais
-- le serveur), le navigateur qui l'a ouverte et sa dernière visite.

ALTER TABLE public.admin_sessions
  ADD COLUMN IF NOT EXISTS id uuid NOT NULL DEFAULT gen_random_uuid(),
  ADD COLUMN IF NOT EXISTS user_agent text,
  ADD COLUMN IF NOT EXISTS last_seen_at timestamptz NOT NULL DEFAULT now();

CREATE UNIQUE INDEX IF NOT EXISTS admin_sessions_id_idx ON public.admin_sessions (id);
CREATE INDEX IF NOT EXISTS admin_sessions_user_idx ON public.admin_sessions (user_id);
