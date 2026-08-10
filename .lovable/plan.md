## Objectif

Restructurer le mega-menu « Pâtisserie Tunisienne » en 3 colonnes finales, ajouter des collections saisonnières, créer les pages de sous-catégories manquantes, et introduire un flag saisonnier sur les produits — sans dupliquer la fiche « Sablé ».

## 1. Mega-menu « Pâtisserie Tunisienne » (`src/components/layout/Header.tsx`)

Remplacer `patisserieCols` par exactement 3 colonnes :

- **PAR SPÉCIALITÉ** : Amandes · Pistache, Machmoum & Pignon · Assortiments de pâtisseries
- **NOS COLLECTIONS** : Tradition · Fekia · Perles
- **COLLECTIONS SAISONNIÈRES** : Ramadan (`/patisserie/ramadan`) · Aïd (`/patisserie/aid`) · Fin d'année (`/patisserie?cat=fin-annee`)

CTA bas de menu conservé : « VOIR TOUTE LA PÂTISSERIE TUNISIENNE → » vers `/patisserie`.

Supprimés : colonne « Formats & Assortiments » (titre), entrées Mignardises et Plateaux mixtes (déjà absentes du menu — vérifier qu'aucune autre section ne les remet). « Assortiments » déplacé dans PAR SPÉCIALITÉ. Light retiré du menu (reste accessible via `?cat=light` si le flag reste).

## 2. Nouvelles pages de catégorie

Créer 3 routes dédiées qui réutilisent `CategoryPage` (même sidebar/filters que `/patisserie`), avec `head()` SEO propre à chacune :

- `src/routes/patisserie.tradition.tsx` → filtre : produits marqués `collections: ["tradition"]` — Ghrayba, Bachkoutou, Youyou, Sablé
- `src/routes/patisserie.ramadan.tsx` → filtre : `collections` inclut `"ramadan"` — Samsa, Kaak, Assida, Bouza, Kounafa, Sablé, H'rissa Louz, Degla farcie
- `src/routes/patisserie.aid.tsx` → filtre : `collections` inclut `"aid"` — Samsa, Kaak, Sablé, H'rissa Louz, Degla farcie (sélection marquée « à confirmer » via un petit note bandeau)

Breadcrumb : Accueil › Pâtisserie Tunisienne › {Collection}.

Pas de nouvelle route pour « Fin d'année » dans ce lot : lien vers `/patisserie?cat=fin-annee` avec fallback vers `all` si aucun produit ne matche (comportement existant de `patisserie.tsx`). À créer plus tard si le catalogue saisonnier grandit.

## 3. Modèle produit — collections multiples + flag saisonnier

Dans `src/data/products.ts`, étendre `Product` :

- `collections?: Array<"tradition" | "ramadan" | "aid" | "fin-annee">` — permet à un même produit (ex. Sablé) d'apparaître dans plusieurs pages sans duplication.
- `seasonalOnly?: boolean` — champ admin « Disponible uniquement pendant Ramadan/Aïd ». Affiché sur la fiche produit sous forme d'un badge doré « Édition saisonnière ».

Ajouter les produits manquants (Bachkoutou, Youyou déjà présent, Sablé, Assida, Bouza, Kounafa, H'rissa Louz, Degla farcie) avec `collections` renseigné. Une seule fiche `sable` référencée dans `["tradition","ramadan","aid"]`.

Chaque nouvelle fiche renseigne les champs déjà standards du type `Product` : `name, image, shortDesc, price, unit, composition, ingredients, allergens, conservation, availability, packIncludes?`. La page `/produits/$slug` affiche déjà tout cela + bouton d'achat ; ajout d'un petit bloc « Mode de réception » (Expédition · Livraison locale · Retrait boutique) rendu depuis un helper commun réutilisant les icônes existantes.

## 4. Vérifications finales

- Le CTA bas de menu et les 9 liens du mega-menu résolvent en 200 (mise à jour de `tests/e2e/mega_menu_links.py`).
- Aucune duplication de slug `sable`.
- SEO : chaque nouvelle page a `title`/`description`/`og:*` distincts.

## Notes techniques

- `patisserie.tsx` reste la page « toutes » avec ses filtres querystring ; les nouvelles routes sont des raccourcis SEO-friendly qui filtrent via `collections`.
- Le badge « Édition saisonnière » vit dans `ProductCard` (au-dessus du nom, style `text-gold uppercase tracking`) et dans `produits.$slug.tsx` (près du prix).
- Aucun changement de business logic côté panier.