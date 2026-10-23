import { Check } from "lucide-react";
import type { Product, ProductVariant } from "@/data/products";
import { formatPrice } from "@/lib/shop-store";
import { variantPrice } from "@/lib/product-rules";
import { optionParts } from "@/lib/option-parts";

export { optionParts };

/**
 * Le sélecteur de conditionnement — grammages (kg), formats (petit/grand)
 * et contenants (pot) — partagé par l'aperçu rapide ET la fiche produit.
 *
 * Il existe pour une raison précise : ces deux écrans affichaient le même
 * choix avec deux rendus écrits séparément, qui ont déjà divergé (libellé
 * dupliqué d'un côté, pas de l'autre). Un composant unique rend la
 * divergence impossible, et la cliente retrouve exactement la même chose
 * dans la modale et sur la fiche.
 */

export function OptionPicker({
  product,
  variants,
  selectedId,
  onSelect,
  name,
  compact = false,
}: {
  product: Pick<Product, "sellMode" | "price">;
  variants: ProductVariant[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  /** Nom du groupe de radios — distinct entre la modale et la fiche. */
  name: string;
  /** Version resserrée pour l'aperçu rapide. */
  compact?: boolean;
}) {
  const ordered =
    product.sellMode === "kg"
      ? [...variants].sort((a, b) => (a.grams ?? 0) - (b.grams ?? 0))
      : variants;

  return (
    <div className={compact ? "space-y-1.5" : "space-y-2"}>
      {ordered.map((v) => {
        const { title, details } = optionParts(product, v);
        const selected = selectedId === v.id;
        return (
          <label
            key={v.id}
            className={`flex cursor-pointer items-center gap-3 rounded-lg border px-4 transition-colors ${
              compact ? "min-h-[52px] py-2.5" : "min-h-[60px] py-3"
            } ${
              selected
                ? "border-gold bg-gold/[0.07]"
                : "border-border bg-white hover:border-gold/50"
            }`}
          >
            <input
              type="radio"
              name={name}
              checked={selected}
              onChange={() => onSelect(v.id)}
              className="sr-only"
            />
            <span
              aria-hidden="true"
              className={`grid h-5 w-5 shrink-0 place-items-center rounded-full border transition-colors ${
                selected ? "border-gold bg-gold text-white" : "border-charbon/25 bg-white"
              }`}
            >
              {selected && <Check className="h-3 w-3" strokeWidth={3} />}
            </span>
            <span className="flex-1">
              <span
                className={`block leading-tight text-charbon ${compact ? "text-sm" : "text-[15px]"}`}
              >
                {title}
              </span>
              {details.length > 0 && (
                <span className="mt-0.5 block text-xs leading-tight text-charbon-soft">
                  {details.join(" · ")}
                </span>
              )}
            </span>
            <span
              className={`font-price shrink-0 tabular-nums text-charbon ${
                compact ? "text-sm" : "text-[15px]"
              }`}
            >
              {formatPrice(variantPrice(product, v))}
            </span>
          </label>
        );
      })}
    </div>
  );
}
