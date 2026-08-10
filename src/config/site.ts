/**
 * Ö' Sweets — Configuration centralisée des textes commerciaux
 * ============================================================
 * Ce fichier regroupe TOUS les textes/flags à confirmer par Ö' Sweets.
 * Modifier une seule fois ici pour propager sur tout le site.
 */

/**
 * Message du bandeau supérieur.
 * Tant que la livraison France / délais 18h / retrait sur RDV ne sont pas
 * confirmés, on garde une formule neutre.
 * Remplacer par la version complète UNIQUEMENT après validation officielle.
 */
export const ANNOUNCEMENT_MESSAGE =
  "Pâtisseries artisanales fabriquées à la commande";

/**
 * Retrait sur rendez-vous à Évry-Courcouronnes — À CONFIRMER.
 * Tant que false, le libellé "Atelier de création · Évry-Courcouronnes"
 * n'est PAS cliquable et le mode "Retrait sur rendez-vous" reste affiché
 * dans le formulaire de devis mais sans promesse de disponibilité.
 */
export const PICKUP_BY_APPOINTMENT_ENABLED = false;

/**
 * Collection saisonnière — configuration manuelle.
 * Ne JAMAIS calculer automatiquement à partir des dates.
 * Valeurs possibles : 'ramadan' | 'aid' | 'none'
 */
export const SEASONAL_COLLECTION: "ramadan" | "aid" | "none" = "none";

/**
 * Emplacement des Cookies dans la navigation — À CONFIRMER.
 * 'gateaux'  → Gâteaux > Formats individuels (produits frais, consommation rapide)
 * 'epicerie' → Épicerie Fine > Biscuits & croustillants (emballés, longue conservation)
 * 'hidden'   → masqué tant que le mode de conservation réel n'est pas confirmé
 */
export const COOKIES_LOCATION: "gateaux" | "epicerie" | "hidden" = "gateaux";

/**
 * Fonctionnalités actives — active uniquement ce qui est réellement branché.
 */
export const FEATURES = {
  favorites: true,        // page /favoris + icône cœur
  search: false,          // désactivé tant que la recherche n'est pas branchée
  giftMessage: false,     // "Ajouter un message personnalisé" dans le composer
  genderReveal: true,     // service Gender Reveal actif
  plateauxPersonnalises: false, // plateaux composés à la demande — à confirmer
} as const;

/**
 * Collections marketing existantes — masquer si non alimentées.
 */
export const COLLECTIONS = {
  bestsellers: false,
  novelties: false,
  fekiaPerlesTraditionLight: false, // gamme officielle non confirmée
  lightIsOfficialRange: false,      // "Light" gamme officielle vs simple filtre
} as const;

