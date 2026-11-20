-- ============================================================
-- 031 - Les plateaux salés passent dans l'admin
--
-- Jusqu'ici, le Plateau Classique et le Plateau Prestige étaient écrits
-- dans le code (src/data/products.ts) : prix, photo et contenu ne se
-- changeaient qu'en redéployant. Ils deviennent des fiches de la base,
-- comme la Pâtisserie : l'admin les modifie, les masque, en ajoute.
--
-- Mêmes adresses qu'avant (plateau-sale-classique / -prestige) : les liens
-- et les paniers existants restent valables. Photo : celle livrée avec le
-- site (image_key), qu'un téléversement dans l'admin peut remplacer.
-- Réception uniquement en local : pas d'expédition par transporteur.
-- ON CONFLICT DO NOTHING : une fiche déjà créée n'est jamais écrasée.
-- ============================================================
INSERT INTO public.products
  (slug, name, category, price, pieces, min_quantity, prep_lead, delivery_mode,
   short_desc, description, conservation, composition, image_key, badge,
   themes, occasions, local_only, ship_pickup, ship_local, ship_national,
   sell_mode, published, draft, archived, sort_order)
VALUES
  ('plateau-sale-classique', 'Plateau Classique', 'sale', 45, 40,
   '1 plateau (40 pièces)',
   'Préparé le jour de la réception — commande à passer à l''avance.',
   'Retrait à l''atelier ou livraison locale (frais kilométriques). Pas d''expédition nationale.',
   '40 pièces : fricassés, mini hamburgers, tacos et brik dannouni.',
   'Un plateau de 40 pièces salées assorties : fricassés, mini hamburgers, tacos et brik dannouni. Préparé le jour de votre réception.',
   'Produit frais, à consommer le jour même.',
   ARRAY['Fricassés', 'Mini hamburgers', 'Tacos', 'Brik dannouni'],
   'plateau-sale-classique.jpg', 'nouveau',
   ARRAY['plateau-classique', 'sale-mariage', 'sale-fiancailles'],
   ARRAY['mariage', 'fiancailles'],
   true, true, true, false, '', true, false, false, 1),
  ('plateau-sale-prestige', 'Plateau Prestige', 'sale', 55, 40,
   '1 plateau (40 pièces)',
   'Préparé le jour de la réception — commande à passer à l''avance.',
   'Retrait à l''atelier ou livraison locale (frais kilométriques). Pas d''expédition nationale.',
   '40 pièces : quiches au poulet, crevettes panées, mini sandwichs au saumon et croquants au gouda.',
   'Un plateau de 40 pièces salées pour vos réceptions soignées : quiches au poulet, crevettes panées, mini sandwichs au saumon et croquants au gouda. Préparé le jour de votre réception.',
   'Produit frais, à consommer le jour même.',
   ARRAY['Quiches au poulet', 'Crevettes panées', 'Mini sandwichs au saumon', 'Croquants au gouda'],
   'plateau-sale-prestige.jpg', 'nouveau',
   ARRAY['plateau-prestige', 'sale-mariage', 'sale-fiancailles'],
   ARRAY['mariage', 'fiancailles', 'entreprise'],
   true, true, true, false, '', true, false, false, 2)
ON CONFLICT (slug) DO NOTHING;
