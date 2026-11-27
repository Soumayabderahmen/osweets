/**
 * Anciennes adresses devenues introuvables.
 *
 * Une fiche dépubliée et remplacée par une autre, une collection masquée au
 * profit d'une nouvelle : l'adresse d'avant reste dans l'index de Google et
 * dans les liens déjà partagés. Sans redirection, elle répond 404 et tout le
 * référencement accumulé est perdu. On renvoie donc un vrai 301 vers ce qui
 * lui succède.
 *
 * À ne pas confondre avec `product_slug_history` : cette table-là couvre le
 * RENOMMAGE d'une fiche, automatiquement, par déclencheur SQL. Ici, il s'agit
 * de retraits — l'ancienne fiche existe toujours en base, simplement
 * dépubliée, et sa remplaçante est une autre fiche (voire une collection).
 * Aucun déclencheur ne peut deviner ce lien : il est éditorial.
 *
 * ⚠️ Si une de ces adresses est un jour remise en ligne, retirer sa ligne
 * ici — sinon la redirection continuerait de masquer la page rétablie.
 */
export const REDIRECTIONS_LEGACY: Record<string, string> = {
  /*
   * Les six samsa par parfum ont été remplacées par une seule fiche.
   */
  "/produits/samsa-amandes": "/produits/samsa-moelleuse",
  "/produits/samsa-chocolat-blanc": "/produits/samsa-moelleuse",
  "/produits/samsa-chocolat-noir": "/produits/samsa-moelleuse",
  "/produits/samsa-fruits-secs": "/produits/samsa-moelleuse",
  "/produits/samsa-praline-noisette": "/produits/samsa-moelleuse",
  "/produits/samsa-praline-pistache": "/produits/samsa-moelleuse",

  /*
   * « Ghraïba » s'est scindée en deux recettes (droo et pois chiche) : aucune
   * des deux n'en est l'héritière unique, on renvoie donc vers la collection
   * qui les présente toutes les deux. Même raisonnement pour Youyou, retirée
   * sans remplaçante.
   */
  "/produits/ghraiba": "/patisserie/patisseries-orientales",
  "/produits/youyou": "/patisserie/patisseries-orientales",

  /*
   * Les quatre anciennes collections, masquées lors de la réorganisation du
   * menu au profit de « Pâtisseries orientales ». « Perles » n'avait aucun
   * produit : elle renvoie vers l'index plutôt que vers une collection qui
   * ne lui correspond pas.
   */
  "/patisserie/amandes": "/patisserie/patisseries-orientales",
  "/patisserie/pistache-machmoum-pignon": "/patisserie/patisseries-orientales",
  "/patisserie/tradition": "/patisserie/patisseries-orientales",
  "/patisserie/perles": "/patisserie",
};

/**
 * Destination d'une ancienne adresse, ou `null` si elle n'en est pas une.
 * La barre oblique finale est ignorée (`/patisserie/tradition/` compte comme
 * `/patisserie/tradition`), et la chaîne de requête est conservée : un lien
 * publicitaire avec `?utm_source=…` garde son traçage après redirection.
 */
export function destinationLegacy(pathname: string, search = ""): string | null {
  const propre = pathname.length > 1 ? pathname.replace(/\/+$/, "") : pathname;
  const cible = REDIRECTIONS_LEGACY[propre];
  if (!cible) return null;
  return search ? `${cible}${search}` : cible;
}
