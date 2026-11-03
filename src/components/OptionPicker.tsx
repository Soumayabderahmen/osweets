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
  // Ordre décidé dans l'admin (flèches ↑ ↓), y compris pour les grammages.
  const ordered = variants;

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

/** Plusieurs formats à la fois : une quantité par carte (2 pots + 1 bol). */
export function OptionQuantityPicker({
  product,
  variants,
  quantities,
  onChange,
  maxTotal = Infinity,
  compact = false,
}: {
  product: Pick<Product, "sellMode" | "price">;
  variants: ProductVariant[];
  quantities: Record<string, number>;
  onChange: (id: string, quantity: number) => void;
  /** Stock restant pour l'ensemble des formats. */
  maxTotal?: number;
  compact?: boolean;
}) {
  // Ordre décidé dans l'admin (flèches ↑ ↓), y compris pour les grammages.
  const ordered = variants;
  const total = Object.values(quantities).reduce((s, n) => s + n, 0);
  const plein = total >= maxTotal;
  const bouton = compact ? "h-8 w-8" : "h-9 w-9";

  return (
    <div className={compact ? "space-y-1.5" : "space-y-2"}>
      {ordered.map((v) => {
        const { title, details } = optionParts(product, v);
        const n = quantities[v.id] ?? 0;
        return (
          <div
            key={v.id}
            className={`flex items-center gap-3 rounded-lg border px-4 transition-colors ${
              compact ? "min-h-[52px] py-2" : "min-h-[60px] py-2.5"
            } ${n > 0 ? "border-gold bg-gold/[0.07]" : "border-border bg-white"}`}
          >
            <span className="min-w-0 flex-1">
              <span
                className={`block leading-tight text-charbon ${compact ? "text-sm" : "text-[15px]"}`}
              >
                {title}
              </span>
              <span className="mt-0.5 block text-xs leading-tight text-charbon-soft">
                {[...details, formatPrice(variantPrice(product, v))].join(" · ")}
              </span>
            </span>
            <span className="inline-flex shrink-0 items-center rounded-full border border-charbon/20 bg-white">
              <button
                type="button"
                aria-label={`Retirer un ${title}`}
                onClick={() => onChange(v.id, Math.max(0, n - 1))}
                disabled={n <= 0}
                className={`${bouton} grid place-items-center rounded-full text-lg leading-none hover:bg-sable disabled:opacity-30`}
              >
                −
              </button>
              <span
                aria-live="polite"
                aria-label={`${title} : ${n}`}
                className="w-7 text-center font-price tabular-nums text-charbon"
              >
                {n}
              </span>
              <button
                type="button"
                aria-label={`Ajouter un ${title}`}
                onClick={() => onChange(v.id, n + 1)}
                disabled={plein}
                className={`${bouton} grid place-items-center rounded-full text-lg leading-none hover:bg-sable disabled:opacity-30`}
              >
                +
              </button>
            </span>
          </div>
        );
      })}
    </div>
  );
}
