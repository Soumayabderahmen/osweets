import type { Product, ProductVariant, SellMode } from "../data/products";
import { isProductAvailableNow, type SeasonWindow } from "./season.ts";
import { weightOptions } from "./weight.ts";
import { kgOptionPrice } from "./variant-label.ts";

/**
 * Prix réel d'une variante choisie, quel que soit le mode de vente.
 * Un palier `kg` ne stocke jamais de prix : il se calcule toujours ici,
 * depuis `product.price` (prix au kilo) — jamais depuis une valeur mise en
 * cache côté navigateur.
 */
export function variantPrice(
  product: { price?: number | string | null; sellMode?: SellMode },
  variant: ProductVariant,
): number {
  if (product.sellMode === "kg" && variant.grams) {
    return kgOptionPrice(numericPrice(product.price), variant.grams);
  }
  return numericPrice(variant.price);
}

export interface ProductRuleInput {
  name?: string;
  price?: number | string | null;
  variants?: { price?: number | string | null; grams?: number | null }[] | null;
  sellMode?: SellMode;
  published?: boolean;
  archived?: boolean;
  draft?: boolean;
  noCart?: boolean;
  hidePrice?: boolean;
  inStock?: boolean;
  stockUnlimited?: boolean;
  stockQty?: number | null;
  seasonalOnly?: boolean;
  collections?: readonly string[] | null;
  productType?: string;
  assortmentComposition?: { flavor: string; grams: number }[] | null;
}

/** Grammages `kg` valides et positifs portés par les variantes du produit. */
function kgGrams(p: { variants?: { grams?: number | null }[] | null }): number[] {
  return (p.variants ?? [])
    .map((v) => v.grams)
    .filter((g): g is number => typeof g === "number" && g > 0);
}

export type ProductBlockReason =
  "unpublished" | "archived" | "draft" | "quote" | "no_price" | "season_closed" | "out_of_stock";

export function numericPrice(value: number | string | null | undefined): number {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

export function isProductOutOfStock(p: ProductRuleInput): boolean {
  return p.inStock === false || (p.stockUnlimited === false && (p.stockQty ?? 0) <= 0);
}

/**
 * Grammage de référence pour le prix "principal" d'un produit kg : priorité
 * 1 kg, sinon 500 g, sinon 100 g — jamais le grammage le moins cher, qui
 * fait croire à une promotion. Si aucun de ces trois n'est vendu, on retombe
 * sur le grammage vendu le plus élevé : une règle déterministe, pas un choix
 * arbitraire au hasard de l'ordre en base.
 */
export function kgMainGrams(grams: readonly number[]): number | null {
  if (!grams.length) return null;
  if (grams.includes(1000)) return 1000;
  if (grams.includes(500)) return 500;
  if (grams.includes(100)) return 100;
  return Math.max(...grams);
}

/** Libellé de l'unité affichée à côté du prix principal kg : « /kg », « / 500 g »… */
export function kgMainUnitLabel(grams: number): string {
  return grams === 1000 ? "/kg" : `/ ${grams} g`;
}

/**
 * Grammage + prix de référence d'un produit kg, ou `null` si rien n'est
 * encore vendable (prix/kg absent, ou aucun grammage coché). Centralise ce
 * que la carte, la QuickView et la fiche doivent tous montrer comme prix
 * "principal" — jamais un prix minimum, jamais un grammage non coché.
 */
export function kgMainSelection(p: {
  price?: number | string | null;
  variants?: { grams?: number | null }[] | null;
}): { grams: number; price: number } | null {
  const grams = kgGrams(p);
  const pricePerKg = numericPrice(p.price);
  const main = kgMainGrams(grams);
  if (main === null || pricePerKg <= 0) return null;
  return { grams: main, price: kgOptionPrice(pricePerKg, main) };
}

export function displayedProductPrice(p: Product): number {
  if (p.hidePrice) return 0;
  if (
    p.productType === "assortiment" &&
    (p.assortmentComposition ?? []).reduce((sum, item) => sum + Number(item.grams || 0), 0) !== 1000
  )
    return 0;

  if (p.sellMode === "kg") {
    const main = kgMainSelection(p);
    return main ? main.price : 0;
  }

  const variantPrices = (p.variants ?? [])
    .map((v) => numericPrice(v.price))
    .filter((price) => price > 0);
  if (variantPrices.length) return Math.min(...variantPrices);

  const weights = weightOptions(p)
    .map((w) => numericPrice(w.price))
    .filter((price) => price > 0);
  if (weights.length) return Math.min(...weights);

  return numericPrice(p.price);
}

function hasOrderablePrice(p: ProductRuleInput): boolean {
  if (p.hidePrice) return false;
  if (
    p.productType === "assortiment" &&
    (p.assortmentComposition ?? []).reduce((sum, item) => sum + Number(item.grams || 0), 0) !== 1000
  )
    return false;
  if (p.sellMode === "kg") return kgGrams(p).length > 0 && numericPrice(p.price) > 0;
  const variants = (p.variants ?? []).map((v) => numericPrice(v.price));
  if (variants.length) return variants.some((price) => price > 0);
  return numericPrice(p.price) > 0;
}

export function productBlockReason(
  p: ProductRuleInput,
  windows: SeasonWindow[] = [],
  now = new Date(),
): ProductBlockReason | null {
  if (p.archived) return "archived";
  if (p.published === false) return "unpublished";
  if (p.draft) return "draft";
  if (p.noCart || p.hidePrice) return "quote";
  if (!hasOrderablePrice(p)) return "no_price";
  if (
    p.seasonalOnly &&
    !isProductAvailableNow(
      {
        slug: "",
        name: p.name ?? "",
        category: "traditionnelle",
        price: numericPrice(p.price),
        image: "",
        shortDesc: "",
        description: "",
        composition: [],
        ingredients: [],
        allergens: [],
        conservation: "",
        collections: (p.collections ?? []) as Product["collections"],
        seasonalOnly: true,
      },
      windows,
      now,
    )
  ) {
    return "season_closed";
  }
  if (isProductOutOfStock(p)) return "out_of_stock";
  return null;
}

export function isProductOrderable(
  p: ProductRuleInput,
  windows: SeasonWindow[] = [],
  now = new Date(),
): { ok: boolean; reason: ProductBlockReason | null } {
  const reason = productBlockReason(p, windows, now);
  return { ok: reason === null, reason };
}

/**
 * Visible / découvrable — distinct de « commandable ».
 *
 * Utilisé pour « Autres parfums » (même famille) : un produit publié dont
 * le prix/kg ou le format n'est pas encore configuré ("no_price"), qui est
 * épuisé ("out_of_stock") ou sur devis ("quote") reste un parfum légitime
 * à montrer — la cliente atterrit sur sa fiche et y voit son propre
 * statut. Seuls un vrai brouillon, une fiche archivée/dépubliée, ou une
 * fermeture saisonnière la rendent non pertinente à suggérer.
 */
export function isProductDiscoverable(
  p: ProductRuleInput,
  windows: SeasonWindow[] = [],
  now = new Date(),
): boolean {
  const reason = productBlockReason(p, windows, now);
  return (
    reason !== "archived" &&
    reason !== "unpublished" &&
    reason !== "draft" &&
    reason !== "season_closed"
  );
}

export function isProductStructuredAvailable(
  p: ProductRuleInput,
  windows: SeasonWindow[] = [],
  now = new Date(),
): boolean {
  return isProductOrderable(p, windows, now).ok;
}
