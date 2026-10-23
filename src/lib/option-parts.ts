import type { Product, ProductVariant } from "../data/products";
import { formatGrams } from "./weight.ts";

/**
 * Découpage d'une option de vente en « titre » et « détails », pour un
 * affichage sur deux niveaux (nom en avant, informations secondaires en
 * dessous) plutôt qu'une longue ligne « Petit format · 4–6 personnes ·
 * 6 pièces » difficile à parcourir.
 *
 * Règle importante : on ne re-découpe JAMAIS le libellé composé, et on ne
 * le recompose jamais non plus (ça dupliquait les mentions — bug déjà
 * rencontré). On lit le nom seul (`baseLabel`, conservé par
 * `rowToProduct()`) et les champs structurés de l'option.
 */
export function optionParts(
  product: Pick<Product, "sellMode">,
  v: ProductVariant,
): { title: string; details: string[] } {
  if (product.sellMode === "kg") {
    return {
      title: formatGrams(v.grams ?? 0),
      details: v.piecesEstimate ? [`≈ ${v.piecesEstimate} pièces`] : [],
    };
  }
  const details: string[] = [];
  if (v.servesMin != null) {
    const max = v.servesMax != null && v.servesMax !== v.servesMin ? `–${v.servesMax}` : "";
    details.push(`${v.servesMin}${max} personnes`);
  }
  if (v.pieces) details.push(`${v.pieces} pièces`);
  if (v.weightG) details.push(`${v.weightG} g`);
  return { title: v.baseLabel?.trim() || v.label, details };
}
