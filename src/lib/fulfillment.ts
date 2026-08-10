/**
 * Ö' Sweets — Logique de livraison à 3 modes
 * ==========================================
 * 1) Expédition nationale  : uniquement pour les produits marqués « expédiable ».
 * 2) Livraison locale      : calculée au kilomètre depuis l'atelier (tarif + rayon max configurables).
 * 3) Retrait à l'atelier   : toujours disponible sauf indication contraire.
 */

import { products, type Product } from "@/data/products";

export type FulfillmentMode = "shipping" | "local" | "pickup";

export const FULFILLMENT_LABELS: Record<FulfillmentMode, string> = {
  shipping: "Expédition en France",
  local: "Livraison locale",
  pickup: "Retrait à l'atelier",
};

/**
 * PARAMÈTRES ADMIN — valeurs à ajuster (fournies par Ö' Sweets).
 */
export const DELIVERY_CONFIG = {
  /** Adresse de l'atelier — point de départ du calcul kilométrique. */
  workshopAddress: "Atelier Ö' Sweets — Évry-Courcouronnes (91)",
  /** Tarif par kilomètre (aller) en euros. */
  pricePerKm: 1.2,
  /** Forfait de prise en charge ajouté à toute livraison locale. */
  baseFee: 5,
  /** Rayon maximal de livraison locale, en kilomètres. */
  maxRadiusKm: 30,
  /** Montant de commande à partir duquel la livraison locale est offerte (0 = jamais). */
  freeLocalFrom: 150,
  /** Frais forfaitaires d'expédition nationale (colis). */
  shippingFlatFee: 9.9,
  /** Expédition nationale offerte à partir de ce montant (0 = jamais). */
  freeShippingFrom: 80,
};

/** Frais de livraison locale pour une distance donnée. */
export function localDeliveryFee(km: number, orderTotal = 0): number {
  if (DELIVERY_CONFIG.freeLocalFrom > 0 && orderTotal >= DELIVERY_CONFIG.freeLocalFrom) return 0;
  const d = Math.max(0, km);
  return Math.round((DELIVERY_CONFIG.baseFee + d * DELIVERY_CONFIG.pricePerKm) * 100) / 100;
}

/** Frais d'expédition nationale. */
export function shippingFee(orderTotal = 0): number {
  if (DELIVERY_CONFIG.freeShippingFrom > 0 && orderTotal >= DELIVERY_CONFIG.freeShippingFrom) return 0;
  return DELIVERY_CONFIG.shippingFlatFee;
}

export function isWithinRadius(km: number): boolean {
  return km > 0 && km <= DELIVERY_CONFIG.maxRadiusKm;
}

/**
 * Modes de réception d'un produit.
 * Les champs admin (`shippable`, `localDelivery`, `pickup`, `requiresCold`) priment ;
 * à défaut, on déduit depuis `localOnly` et la catégorie (le salé n'est jamais expédié).
 */
export function productModes(p: Product): FulfillmentMode[] {
  const cold = p.requiresCold ?? false;
  const shippable = p.shippable ?? (!p.localOnly && !cold);
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
  message?: string;
}

export const MIXED_SHIPPING_MESSAGE =
  "Certains produits de votre panier ne peuvent pas être expédiés. Choisissez la livraison locale, le retrait à l'atelier ou séparez votre commande.";

export function cartFulfillment(cart: CartLike): CartFulfillment {
  const items = cart
    .map((c) => products.find((p) => p.slug === c.slug))
    .filter((p): p is Product => Boolean(p));

  if (items.length === 0) {
    return { available: ["shipping", "local", "pickup"], nonShippable: [], mixedShipping: false, hasCold: false };
  }

  const all: FulfillmentMode[] = ["shipping", "local", "pickup"];
  const available = all.filter((m) => items.every((p) => productModes(p).includes(m)));
  const nonShippable = items.filter((p) => !isShippable(p)).map((p) => p.name);
  const shippableCount = items.length - nonShippable.length;
  const hasCold = items.some((p) => (p.requiresCold ?? false) || p.category === "sale");

  return {
    available,
    nonShippable,
    mixedShipping: nonShippable.length > 0 && shippableCount > 0,
    hasCold,
    message: nonShippable.length > 0 ? MIXED_SHIPPING_MESSAGE : undefined,
  };
}
