-- ============================================================
-- 016 - Separer visibilite editoriale (published/draft) et
--        commandabilite commerciale (prix/format configure ou non)
--
-- Constat corrige : la migration 015 avait mis draft=true sur les
-- produits migres vers kg/format sans prix/format encore fiable. Or
-- `draft=true` rend un produit totalement invisible (exclu des requetes
-- SQL publiques listProducts/getProductBySlug) - ce n'est pas ce qui etait
-- demande. Le code applicatif distingue deja "no_price" de "draft" dans
-- `productBlockReason()` (src/lib/product-rules.ts) : un produit publie
-- sans prix reste visible, avec un statut "Tarif a venir", et seul
-- l'ajout au panier est bloque. Cette migration corrige les lignes
-- affectees pour utiliser ce mecanisme deja existant, au lieu de draft.
--
-- Additive et reversible : aucune colonne touchee, uniquement des
-- UPDATE sur des booleens deja existants. Snapshot avant/apres documente
-- dans le rapport joint (pas dans ce fichier, pour rester executable).
-- ============================================================

-- Les 11 produits kg qui etaient deja publies et vendus (a leur ancien
-- prix fixe) avant la migration 015 : ils redeviennent "publies, en
-- attente de prix au kilo" plutot que "brouillon invisible".
UPDATE public.products
   SET draft = false
 WHERE slug IN (
   'baklawa-pistache',
   'bechkoutou',
   'debla',
   'sable',
   'samsa-amandes',
   'samsa-chocolat-blanc',
   'samsa-chocolat-noir',
   'samsa-fruits-secs',
   'samsa-praline-noisette',
   'samsa-praline-pistache',
   'youyou'
 )
 AND sell_mode = 'kg';

-- Cheese-cake Kounefa (format) : meme correction, meme raisonnement.
UPDATE public.products
   SET draft = false
 WHERE slug = 'cheesecake-kounefa'
   AND sell_mode = 'format';

-- Ghraiba : deja archive/deplublie par choix explicite (migration 015) ;
-- `draft` n'a plus d'effet visible ici, on l'aligne par coherence.
UPDATE public.products
   SET draft = false
 WHERE slug = 'ghraiba';

-- Correction d'une divergence constatee en lecture (cause non identifiee
-- avec certitude - aucune instruction SQL de la migration 015 ne visait
-- cette colonne pour ce produit) : "Dattes Farcies" (fiche historique)
-- portait published=false alors qu'elle etait publiee avant toute
-- migration de cette phase. Restauration explicite.
UPDATE public.products
   SET published = true
 WHERE slug = 'dattes-farcies'
   AND published = false;

-- Les 6 nouveaux parfums Dattes Farcies + Dattes Farcies Variees restent
-- volontairement draft=true ET published=false : ce sont de vraies
-- fiches en brouillon (aucune photo, aucune donnee reelle), pas des
-- produits existants bloques par un probleme de prix. Non touches ici.
