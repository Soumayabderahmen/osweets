import type { Product } from "../data/products";
import type { LiveCollection } from "./collections";
import { shouldShowCollection } from "./collection-visibility.ts";
import { patisserieProducts } from "./patisserie.ts";

export interface PatisserieMenuGroups {
  pastries: LiveCollection[];
  occasions: LiveCollection[];
}

export function patisserieMenuGroups(
  collections: LiveCollection[],
  products: Product[],
  seasons: readonly { key: string }[],
  limit = 4,
): PatisserieMenuGroups {
  const seasonKeys = new Set(seasons.map((season) => season.key));
  const patisserie = patisserieProducts(products);
  const productCount = (collection: LiveCollection) => patisserie.filter(collection.filter).length;
  const visibleCollection = (collection: LiveCollection) =>
    shouldShowCollection(collection, productCount(collection));

  const occasions = collections.filter(
    (collection) => seasonKeys.has(collection.productKey) && visibleCollection(collection),
  );

  const pastries = collections
    .filter((collection) => !seasonKeys.has(collection.productKey))
    .filter(visibleCollection)
    .slice(0, limit);

  return { pastries, occasions };
}
