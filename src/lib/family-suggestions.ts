import type { Product } from "../data/products.ts";
import type { SeasonWindow } from "./season.ts";
import { isProductDiscoverable } from "./product-rules.ts";

export interface FamilySuggestionGroups {
  sameType: Product[];
  otherTypes: Product[];
}

export function familySuggestionGroups(
  current: Product,
  catalog: readonly Product[],
  seasons: SeasonWindow[] = [],
): FamilySuggestionGroups {
  if (!current.family) return { sameType: [], otherTypes: [] };
  const family = catalog.filter(
    (item) =>
      item.slug !== current.slug &&
      item.family === current.family &&
      isProductDiscoverable(item, seasons),
  );

  if (current.family === "dattes-farcies") {
    return current.productType === "assortiment"
      ? { sameType: [], otherTypes: family.filter((item) => item.productType === "parfum-simple") }
      : { sameType: family, otherTypes: [] };
  }

  const sameType = current.productType
    ? family.filter(
        (item) =>
          item.productType === current.productType && item.flavorLabel !== current.flavorLabel,
      )
    : [];
  const representatives = new Map<string, Product>();
  for (const item of family) {
    if (!item.productType || item.productType === current.productType) continue;
    if (!representatives.has(item.productType)) representatives.set(item.productType, item);
  }
  return { sameType, otherTypes: [...representatives.values()] };
}

export function productTaxonomyLabel(product: Product, familyLabel: string): string | null {
  if (!product.family) return null;
  const type = productTypeLabel(product.productType);
  return [familyLabel, type, product.flavorLabel].filter(Boolean).join(" — ");
}

export function productTypeLabel(value?: string): string | null {
  if (!value) return null;
  const known: Record<string, string> = {
    "parfum-simple": "Parfum simple",
    assortiment: "Assortiment",
    "cheese-cake": "Cheese-cake",
    kechda: "Kechda",
    fromage: "Fromage",
    chocolat: "Chocolat",
  };
  return known[value] ?? value.charAt(0).toUpperCase() + value.slice(1);
}
