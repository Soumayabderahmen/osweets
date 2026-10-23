import type { Product, ProductVariant, SellMode } from "../data/products";
import type { CartLineStatus } from "./cart-rules";
import { weightOptions } from "./weight.ts";
import { formatGrams } from "./weight.ts";
import { kgOptionPrice, optionLabel } from "./variant-label.ts";

export interface CartPricingRow {
  slug: string;
  name: string;
  category: string;
  price: number | string;
  unit?: string | null;
  image_url?: string | null;
  image_key?: string | null;
  short_desc?: string | null;
  description?: string | null;
  composition?: string[] | null;
  ingredients?: string[] | null;
  conservation?: string | null;
  variants?: ProductVariant[] | null;
  sell_options?: ProductVariant[] | null;
  sell_mode?: SellMode | null;
  weight?: string | null;
  hide_price?: boolean;
  no_cart?: boolean;
}

export interface CartPricingLine {
  name: string;
  variantId?: string;
  variantLabel?: string;
}

function sellOptions(row: CartPricingRow): ProductVariant[] {
  if (Array.isArray(row.sell_options) && row.sell_options.length) return row.sell_options;
  if (Array.isArray(row.variants) && row.variants.length) return row.variants;
  return [];
}

function imageOf(row: CartPricingRow) {
  if (row.image_url) return row.image_url;
  if (row.image_key) return `/api/public/media/${row.image_key}`;
  return "";
}

function productForWeight(row: CartPricingRow): Product {
  return {
    slug: row.slug,
    name: row.name,
    category: row.category as Product["category"],
    price: Number(row.price ?? 0),
    unit: row.unit ?? undefined,
    image: imageOf(row),
    shortDesc: row.short_desc ?? "",
    description: row.description ?? "",
    composition: row.composition ?? [],
    ingredients: row.ingredients ?? [],
    allergens: [],
    conservation: row.conservation ?? "",
    variants: undefined,
    weight: row.weight ?? undefined,
    hidePrice: row.hide_price,
    noCart: row.no_cart,
  };
}

export function currentUnitPrice(
  row: CartPricingRow,
  line: CartPricingLine,
): { price: number; variantId?: string; variantLabel?: string; status?: CartLineStatus } {
  if (row.sell_mode === "kg") return currentKgPrice(row, line);

  const options = sellOptions(row);
  const weights = options.length ? [] : weightOptions(productForWeight(row));
  const weight = weights.find(
    (w) => w.id === line.variantId || (!!line.variantLabel && w.label === line.variantLabel),
  );
  if (weight) return { price: weight.price, variantId: weight.id, variantLabel: weight.label };

  if (!options.length) {
    if (line.variantId) {
      return {
        price: Number(row.price ?? 0),
        status: {
          code: "format_removed",
          blocking: true,
          message: `${line.name} a changé de format. Retirez-le du panier puis ajoutez-le à nouveau.`,
        },
      };
    }
    return { price: Number(row.price ?? 0) };
  }

  const matchingLabels = options.filter(
    (o) =>
      !!line.variantLabel &&
      (o.label === line.variantLabel || optionLabel(o) === line.variantLabel),
  );
  const option =
    options.find((o) => o.id === line.variantId) ??
    (matchingLabels.length === 1 ? matchingLabels[0] : undefined);
  if (!option) {
    return {
      price: Number(row.price ?? 0),
      status: {
        code: "format_removed",
        blocking: true,
        message: `${line.name} n'est plus disponible dans ce format. Retirez-le du panier puis choisissez un format actuel.`,
      },
    };
  }
  return {
    price: Number(option.price ?? 0),
    variantId: option.id,
    variantLabel: optionLabel(option),
  };
}

/**
 * Mode `kg` : le grammage demandé doit figurer parmi les paliers cochés par
 * l'administratrice (`sell_options`), et le prix se recalcule TOUJOURS ici,
 * jamais depuis une valeur reçue du navigateur.
 */
function currentKgPrice(
  row: CartPricingRow,
  line: CartPricingLine,
): { price: number; variantId?: string; variantLabel?: string; status?: CartLineStatus } {
  const allowed = sellOptions(row).filter(
    (o): o is ProductVariant & { grams: number } => typeof o.grams === "number" && o.grams > 0,
  );
  const pricePerKg = Number(row.price ?? 0);

  const chosen = allowed.find(
    (o) => o.id === line.variantId || (!!line.variantLabel && formatGrams(o.grams) === line.variantLabel),
  );

  if (!chosen) {
    return {
      price: 0,
      status: {
        code: "format_removed",
        blocking: true,
        message: `${line.name} n'est plus disponible dans ce grammage. Retirez-le du panier puis choisissez un grammage actuel.`,
      },
    };
  }
  if (pricePerKg <= 0) {
    return {
      price: 0,
      variantId: chosen.id,
      variantLabel: formatGrams(chosen.grams),
      status: {
        code: "not_sellable",
        blocking: true,
        message: `${row.name} n'a pas encore de prix au kilo configuré : il n'est pas commandable pour l'instant.`,
      },
    };
  }
  return {
    price: kgOptionPrice(pricePerKg, chosen.grams),
    variantId: chosen.id,
    variantLabel: formatGrams(chosen.grams),
  };
}
