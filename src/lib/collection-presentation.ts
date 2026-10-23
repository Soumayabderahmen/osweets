import type { CollectionRow } from "../api/collections";
import type { Product } from "../data/products";
import { isPatisserieCategory } from "./patisserie-scope.ts";
import { isProductAvailableNow, type SeasonWindow } from "./season.ts";
import { isProductOrderable } from "./product-rules.ts";

export function collectionMetadata(row: Pick<CollectionRow, "label" | "title" | "description">) {
  return {
    title: row.title.trim() || `${row.label} | Ö' Sweets`,
    description: row.description.trim() || `La collection ${row.label} de la pâtisserie Ö' Sweets.`,
  };
}

export function collectionState(row: {
  published: boolean;
  hidden: boolean;
}): "online" | "hidden" | "unpublished" {
  return row.hidden ? "hidden" : row.published ? "online" : "unpublished";
}

/**
 * Tous les produits associés à une collection, quel que soit leur statut
 * (archivé, dépublié, brouillon…). Fonction unique : le compteur "associés"
 * de la carte collection et le panneau "Ses produits" du back-office doivent
 * compter exactement les mêmes lignes, sous peine de se contredire.
 */
export function collectionAssociatedProducts(products: Product[], key: string): Product[] {
  return products.filter(
    (p) =>
      isPatisserieCategory(p.category) &&
      (p.collections as readonly string[] | undefined)?.includes(key),
  );
}

export function collectionCounts(
  products: Product[],
  key: string,
  seasons: SeasonWindow[],
  now = new Date(),
) {
  const associated = collectionAssociatedProducts(products, key);
  const notArchived = associated.filter((p) => !p.archived);
  const published = notArchived.filter((p) => p.published !== false && !p.draft);
  const visible = published.filter((p) => isProductAvailableNow(p, seasons, now));
  const commandable = visible.filter((p) => isProductOrderable(p, seasons, now).ok);
  return {
    associated: associated.length,
    published: published.length,
    visible: visible.length,
    commandable: commandable.length,
    archived: associated.length - notArchived.length,
  };
}

export function nextCollectionOrder(rows: { sort_order: number }[]): number {
  return Math.max(0, ...rows.map((r) => r.sort_order)) + 10;
}
