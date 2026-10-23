-- ============================================================
-- 018 - Retrait du produit generique "Dattes farcies"
--
-- La gamme Dattes Farcies passe desormais par des fiches par parfum
-- (dattes-farcies-abricot, -amandes, -noisettes, -noix,
-- -pistache-pignon, -framboise-pistache) plus l'assortiment
-- "Dattes Farcies Variees". La fiche generique "dattes-farcies" (sans
-- parfum) n'a plus vocation a etre vendue.
--
-- Choix : ARCHIVAGE, pas suppression physique.
--   - `archived=true` la retire de listProducts/getProductBySlug (memes
--     regles SQL que tout autre produit retire de la vente) : plus
--     visible nulle part cote boutique (carte, collection, "Autres
--     parfums", recherche), sans toucher a une seule ligne de commande.
--   - La ligne reste en base : `product_slug_history` porte une
--     redirection historique ('degla-farcie' -> 'dattes-farcies', migration
--     012) avec une contrainte ON DELETE CASCADE — une suppression
--     physique aurait supprime cette redirection en silence. En la
--     gardant, rien ne casse, et l'operation reste reversible.
--   - Verifie avant d'ecrire cette migration (lecture seule) : aucune
--     collection autre que celles deja portees par la fiche, aucun
--     `recommended` d'un autre produit ne la cible, aucune inscription
--     de liste d'attente ne la cible (target_label/collection).
-- ============================================================
UPDATE public.products
   SET archived = true
 WHERE slug = 'dattes-farcies'
   AND family = 'dattes-farcies'
   AND flavor_label IS NULL;
