import { useMemo } from "react";
import type { Product } from "@/data/products";
import { useCatalog } from "@/lib/catalog";

/**
 * Les plateaux salés vendus en boutique : les fiches « salé » de la base,
 * gérées dans l'admin (prix, photo, contenu, mise en ligne).
 *
 * Les produits d'épicerie écrits dans le code (tapenade, huiles…) portent
 * aussi la catégorie « sale » mais n'ont pas d'identifiant de base : ils
 * restent sur leur propre page et n'entrent pas ici.
 */
export function isSaleAdminProduct(p: Product): boolean {
  return p.category === "sale" && !!p.id;
}

export function useSaleProducts(): Product[] {
  const catalog = useCatalog();
  return useMemo(() => catalog.filter(isSaleAdminProduct), [catalog]);
}

/** « 40 pièces · 45 € » — la ligne courte des cartes du menu. */
export function saleShortLine(p: Product): string {
  const prix = `${Number(p.price).toLocaleString("fr-FR", { maximumFractionDigits: 2 })} €`;
  return p.pieces ? `${p.pieces} pièces · ${prix}` : prix;
}
