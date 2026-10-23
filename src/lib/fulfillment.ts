/**
 * Ö' Sweets — Logique de livraison à 3 modes
 * ==========================================
 * 1) Expédition nationale  : uniquement pour les produits marqués « expédiable ».
 * 2) Livraison locale      : calculée au kilomètre depuis l'atelier (tarif + rayon max configurables).
 * 3) Retrait à l'atelier   : toujours disponible sauf indication contraire.
 */

import type { Product } from "@/data/products";

export type FulfillmentMode = "shipping" | "local" | "pickup";

export const FULFILLMENT_LABELS: Record<FulfillmentMode, string> = {
  shipping: "Expédition en France",
  local: "Livraison locale",
  pickup: "Retrait à l'atelier",
};

/*
 * Les tarifs ne sont plus ici.
 *
 * Ils vivaient dans une constante `DELIVERY_CONFIG` que ce fichier
 * exportait : prix au kilomètre, forfait, rayon, seuils de gratuité,
 * adresse de l'atelier. L'écran Réglages écrivait en base, et rien ne la
 * lisait — la cliente payait donc les valeurs du fichier, quoi qu'on
 * saisisse dans le back-office.
 *
 * Ces montants sont désormais dans la table `settings`, et se calculent
 * avec `localDeliveryPrice` / `shippingPrice` de `@/api/settings`. Ce
 * fichier ne garde que ce qui relève vraiment de la logique : quel mode
 * de réception un panier autorise.
 */

/**
 * Modes de réception d'un produit.
 * Les champs admin (`shippable`, `localDelivery`, `pickup`, `requiresCold`) priment ;
 * à défaut, on déduit depuis `localOnly` et la catégorie (le salé n'est jamais expédié).
 */
export function productModes(p: Product): FulfillmentMode[] {
  const cold = p.requiresCold ?? false;
  const shippable = !p.localOnly && !cold && (p.shippable ?? true);
  const local = p.localDelivery ?? true;
  const pickup = p.pickup ?? true;
  const modes: FulfillmentMode[] = [];
  if (shippable) modes.push("shipping");
  if (local) modes.push("local");
  if (pickup) modes.push("pickup");
  return modes;
}

export function isShippable(p: Product): boolean {
  return productModes(p).includes("shipping");
}

export type CartLike = { slug: string; name: string }[];

export interface CartFulfillment {
  /** Modes compatibles avec TOUS les produits du panier. */
  available: FulfillmentMode[];
  /** Produits du panier non expédiables. */
  nonShippable: string[];
  /** Le panier mélange des produits expédiables et non expédiables. */
  mixedShipping: boolean;
  /** Le panier contient un produit nécessitant du froid ou du salé. */
  hasCold: boolean;
  /**
   * Lignes du panier introuvables au catalogue.
   * Non vide = on ne sait pas ce qu'on vend : aucun mode n'est proposé.
   */
  unknown: string[];
  message?: string;
}

export const UNKNOWN_ITEM_MESSAGE =
  "Un produit de votre panier n'est plus disponible à la vente. Retirez-le du panier pour choisir un mode de réception.";

export const MIXED_SHIPPING_MESSAGE =
  "Certains produits de votre panier ne peuvent pas être expédiés. Choisissez la livraison locale, le retrait à l'atelier ou séparez votre commande.";

/**
 * Modes de réception possibles pour un panier.
 *
 * Le catalogue est passé en argument, et c'est le point critique : une
 * pâtisserie introuvable était simplement ignorée, le calcul se faisait sur
 * un panier vide, et la fonction répondait « tous les modes possibles » —
 * expédition comprise, pour un produit frais qui ne doit jamais voyager.
 * Ce n'était pas une section vide, c'était une commande acceptée à tort.
 */
export function cartFulfillment(cart: CartLike, catalogue: Product[]): CartFulfillment {
  const all: FulfillmentMode[] = ["shipping", "local", "pickup"];

  const items: Product[] = [];
  const unknown: string[] = [];
  for (const ligne of cart) {
    const p = catalogue.find((x) => x.slug === ligne.slug);
    if (p) items.push(p);
    else unknown.push(ligne.slug);
  }

  // Panier vide : il n'y a rien à contraindre.
  if (cart.length === 0) {
    return { available: all, nonShippable: [], mixedShipping: false, hasCold: false, unknown: [] };
  }

  /*
   * Sûr par défaut. Une ligne qu'on ne retrouve pas au catalogue — produit
   * archivé entre-temps, panier ancien, base qui n'a pas répondu — veut dire
   * qu'on ignore ses contraintes. On ne peut alors affirmer aucun mode : un
   * produit frais deviendrait expédiable par simple absence d'information.
   * Mieux vaut bloquer et le dire que laisser passer une commande impossible
   * à honorer.
   */
  if (unknown.length > 0) {
    return {
      available: [],
      nonShippable: [],
      mixedShipping: false,
      hasCold: false,
      unknown,
      message: UNKNOWN_ITEM_MESSAGE,
    };
  }

  const available = all.filter((m) => items.every((p) => productModes(p).includes(m)));
  const nonShippable = items.filter((p) => !isShippable(p)).map((p) => p.name);
  const shippableCount = items.length - nonShippable.length;
  const hasCold = items.some((p) => (p.requiresCold ?? false) || p.category === "sale");

  return {
    available,
    nonShippable,
    mixedShipping: nonShippable.length > 0 && shippableCount > 0,
    hasCold,
    unknown: [],
    message: nonShippable.length > 0 ? MIXED_SHIPPING_MESSAGE : undefined,
  };
}
