import type { Product } from "@/data/products";
import { isPatisserieCategory } from "./patisserie-scope.ts";

/**
 * Certaines pâtisseries se vendent au poids : la fiche annonce un grammage de
 * référence (ex. « 500 g ») et le client choisit 500 g ou 1 kg.
 * On ne fabrique ces options que lorsqu'aucune variante n'existe déjà.
 */
export type WeightOption = { id: string; label: string; grams: number; price: number };

/** Extrait le grammage d'un texte libre (« 500 g », « ≈ 600 g (24 pièces) », « 1 kg »). */
export function parseGrams(text?: string): number | null {
  if (!text) return null;
  const kg = text.match(/([\d.,]+)\s*kg/i);
  if (kg) return Math.round(parseFloat(kg[1].replace(",", ".")) * 1000);
  const g = text.match(/([\d.,]+)\s*g\b/i);
  if (g) return Math.round(parseFloat(g[1].replace(",", ".")));
  return null;
}

/** Libellé lisible d'un grammage (« 500 g », « 1 kg »). Partagé avec le mode `kg`. */
export function formatGrams(grams: number): string {
  return grams % 1000 === 0 ? `${grams / 1000} kg` : `${grams} g`;
}

/**
 * Options de grammage proposées à la commande.
 * Prix strictement proportionnel au grammage de référence — aucune règle
 * commerciale nouvelle, juste une mise à l'échelle du prix affiché.
 */
export function weightOptions(product: Product): WeightOption[] {
  if (product.variants?.length) return [];
  /*
   * Un `sellMode` explicite (kg/format/pot) est une décision de
   * l'administratrice qui fait autorité : même si `sell_options` est
   * encore vide (configuration en cours), il ne faut JAMAIS retomber sur
   * ce générateur automatique basé sur l'ancien `weight` texte du
   * produit — ça fabriquerait un faux prix au kilo pour un produit dont
   * le vrai prix au kilo n'est pas encore saisi.
   */
  if (product.sellMode) return [];
  if (product.noCart || product.hidePrice || !product.price) return [];
  // Contenants à l'unité (pot, bol, verrine, plateau…) : pas de vente au poids.
  if (product.unit && /pot|bol|verrine|pièce|piece|plateau|coffret/i.test(product.unit)) return [];
  // Les gâteaux, coffrets, packs et salés se vendent à l'unité.
  if (!isPatisserieCategory(product.category)) return [];

  // Grammage de référence : celui de la fiche, sinon 500 g (tarif affiché).
  const base = parseGrams(product.weight) ?? 500;
  if (base < 250) return [];

  const steps = new Set<number>([base, 500, 1000]);
  return [...steps]
    .filter((g) => g >= 250 && g <= 2000)
    .sort((a, b) => a - b)
    .map((grams) => ({
      id: `w-${grams}`,
      label: formatGrams(grams),
      grams,
      price: Math.round(((product.price * grams) / base) * 100) / 100,
    }));
}
