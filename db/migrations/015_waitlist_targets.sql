-- Preserve existing registrations as legacy entries; never guess their target.
ALTER TABLE public.patisserie_waitlist
  ADD COLUMN IF NOT EXISTS target_type text NOT NULL DEFAULT 'legacy',
  ADD COLUMN IF NOT EXISTS target_label text NOT NULL DEFAULT '';

ALTER TABLE public.patisserie_waitlist
  DROP CONSTRAINT IF EXISTS patisserie_waitlist_email_collection_key,
  DROP CONSTRAINT IF EXISTS waitlist_collection_len;
ALTER TABLE public.patisserie_waitlist
  ADD CONSTRAINT waitlist_target_type CHECK (target_type IN ('legacy', 'collection', 'product')),
  ADD CONSTRAINT waitlist_collection_len CHECK (length(collection) BETWEEN 1 AND 255),
  ADD CONSTRAINT waitlist_email_target UNIQUE (email, collection, target_type);
