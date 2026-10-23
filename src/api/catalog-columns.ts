import type { ProductInput } from "@/lib/catalog";

/** Colonnes modifiables depuis le backoffice — liste blanche stricte. */
export const EDITABLE = [
  "slug",
  "name",
  "category",
  "family",
  "product_type",
  "flavor_label",
  "assortment_composition",
  "price",
  "price_per_piece",
  "unit",
  "weight",
  "pieces",
  "serves",
  "min_quantity",
  "prep_lead",
  "short_desc",
  "description",
  "seo_title",
  "seo_description",
  "conservation",
  "disclaimer",
  "delivery_mode",
  "image_key",
  "image_url",
  "composition",
  "ingredients",
  "allergens",
  "flavors",
  "varieties",
  "collections",
  "recommended",
  "availability",
  "occasions",
  "pack_includes",
  "themes",
  "badge",
  "variants",
  "sell_mode",
  "sell_options",
  "stock_qty",
  "stock_alert",
  "stock_unlimited",
  "ship_pickup",
  "ship_local",
  "ship_national",
  "in_stock",
  "published",
  "archived",
  "draft",
  "seasonal_only",
  "local_only",
  "no_cart",
  "hide_price",
  "requires_cold",
  "customizable",
  "sort_order",
] as const;

export type EditableColumn = (typeof EDITABLE)[number];

/** Colonnes jsonb : à sérialiser et à caster explicitement. */
const JSONB: readonly EditableColumn[] = ["variants", "sell_options", "assortment_composition"];

export const bind = (column: EditableColumn, index: number) =>
  JSONB.includes(column) ? `$${index}::jsonb` : `$${index}`;

export const prepare = (column: EditableColumn, value: unknown) =>
  JSONB.includes(column) ? (value === null ? null : JSON.stringify(value)) : value;

export function columnsOf(values: ProductInput) {
  return EDITABLE.filter((c) => Object.prototype.hasOwnProperty.call(values, c));
}
