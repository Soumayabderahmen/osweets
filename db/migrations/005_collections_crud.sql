-- ============================================================
--  COLLECTIONS pilotables depuis le back-office
--  Le blocage total des suppressions disparaît : la suppression
--  est désormais autorisée uniquement quand plus aucun produit ne
--  porte l'étiquette de la collection (vérifié côté serveur).
-- ============================================================

DROP TRIGGER IF EXISTS collections_block_delete ON public.collections;
DROP FUNCTION IF EXISTS public.collections_no_delete();
