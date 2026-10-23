import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import { listProducts } from "@/api/catalog";
import {
  products as baseProducts,
  type Allergen,
  type Category,
  type Product,
  type ProductCollection,
  type ProductFamily,
  type ProductVariant,
} from "@/data/products";
import { resolveProductImage } from "@/lib/product-assets";
import { optionLabel } from "@/lib/variant-label";

/** Une ligne de la table `products` — le catalogue vit désormais en base. */
export interface ProductRow {
  id: string;
  slug: string;
  name: string;
  category: string;
  family: string | null;
  product_type: string | null;
  flavor_label: string | null;
  assortment_composition: { flavor: string; grams: number }[];
  price: number | string;
  price_per_piece: number | string | null;
  unit: string | null;
  weight: string | null;
  pieces: number | null;
  serves: number | null;
  min_quantity: string | null;
  prep_lead: string | null;
  short_desc: string;
  description: string;
  seo_title: string | null;
  seo_description: string | null;
  conservation: string;
  disclaimer: string | null;
  delivery_mode: string | null;
  image_key: string | null;
  image_url: string | null;
  composition: string[];
  ingredients: string[];
  allergens: string[];
  flavors: string[];
  varieties: string[];
  collections: string[];
  /** Slugs mis en avant sous la fiche. Vide = choix automatique. */
  recommended: string[];
  availability: string[];
  occasions: string[];
  pack_includes: string[];
  themes: string[];
  badge: string | null;
  /** jsonb — toujours une liste de parfums vendables, ou NULL. */
  variants: ProductVariant[] | null;
  in_stock: boolean;
  published: boolean;
  archived: boolean;
  draft: boolean;
  seasonal_only: boolean;
  local_only: boolean;
  no_cart: boolean;
  hide_price: boolean;
  requires_cold: boolean;
  customizable: boolean | null;

  /** Comment la cliente choisit : '' | 'kg' | 'format' | 'pot'. */
  sell_mode: "" | "kg" | "format" | "pot";
  /** Les options proposées, dans l'ordre. La première est cochée par défaut. */
  sell_options: ProductVariant[];

  /** Compteur de réserve — `in_stock` en découle, par déclencheur en base. */
  stock_qty: number;
  stock_alert: number;
  stock_unlimited: boolean;

  /** Modes de réception cochés pour ce produit. */
  ship_pickup: boolean;
  ship_local: boolean;
  ship_national: boolean;

  sort_order: number;
  created_at?: string;
  updated_at?: string;
}

/** Une liste vide en base doit rester `undefined` côté fiche produit. */
const list = <T>(v: T[] | null | undefined): T[] | undefined => (v && v.length ? v : undefined);

/** Ligne PostgreSQL → objet `Product` utilisé partout dans le site. */
export function rowToProduct(r: ProductRow): Product {
  return {
    id: r.id,
    slug: r.slug,
    createdAt: r.created_at,
    name: r.name,
    category: r.category as Category,
    price: Number(r.price ?? 0),
    unit: r.unit ?? undefined,
    image: resolveProductImage(r.image_url, r.image_key),
    shortDesc: r.short_desc ?? "",
    description: r.description ?? "",
    composition: r.composition ?? [],
    ingredients: r.ingredients ?? [],
    allergens: (r.allergens ?? []) as Allergen[],
    conservation: r.conservation ?? "",
    availability: list(r.availability),
    badge: (r.badge ?? undefined) as Product["badge"],
    occasions: list(r.occasions),
    inStock: r.in_stock,
    pieces: r.pieces ?? undefined,
    themes: list(r.themes),
    packIncludes: list(r.pack_includes),
    serves: r.serves ?? undefined,
    collections: list(r.collections) as ProductCollection[] | undefined,
    seasonalOnly: r.seasonal_only,
    family: (r.family ?? undefined) as ProductFamily | undefined,
    productType: r.product_type ?? undefined,
    flavorLabel: r.flavor_label ?? undefined,
    assortmentComposition: list(r.assortment_composition),
    recommended: list(r.recommended),
    published: r.published,
    archived: r.archived,
    seoTitle: r.seo_title ?? undefined,
    seoDescription: r.seo_description ?? undefined,
    draft: r.draft,
    flavors: list(r.flavors),
    // `sell_options` fait autorité ; `variants` reste lu pour les fiches
    // enregistrées avant que la façon de vendre existe.
    variants: (r.sell_options?.length
      ? r.sell_options
      : r.variants?.length
        ? r.variants
        : undefined
    )?.map((option) => ({ ...option, baseLabel: option.label, label: optionLabel(option) })),
    weight: r.weight ?? undefined,
    varieties: list(r.varieties),
    deliveryMode: r.delivery_mode ?? undefined,
    customizable: r.customizable ?? undefined,
    hidePrice: r.hide_price,
    noCart: r.no_cart,
    disclaimer: r.disclaimer ?? undefined,
    pricePerPiece: r.price_per_piece === null ? undefined : Number(r.price_per_piece),
    minQuantity: r.min_quantity ?? undefined,
    prepLead: r.prep_lead ?? undefined,
    localOnly: r.local_only,
    requiresCold: r.requires_cold,
    sellMode: r.sell_mode ?? "",
    stockQty: r.stock_qty ?? 0,
    stockAlert: r.stock_alert ?? 0,
    stockUnlimited: r.stock_unlimited ?? true,
    pickup: r.ship_pickup ?? true,
    localDelivery: r.ship_local ?? true,
    shippable: r.ship_national ?? true,
  };
}

/** Champs acceptés par le backoffice lors d'un enregistrement. */
export type ProductInput = Partial<Omit<ProductRow, "id" | "created_at" | "updated_at">>;

/**
 * Fusionne le catalogue statique avec la base.
 *
 * La base fait autorité : une fiche présente en base remplace entièrement son
 * équivalent statique, et les fiches créées depuis le backoffice s'ajoutent à
 * la suite. Si la base est vide ou injoignable, le site continue de tourner
 * sur `src/data/products.ts` — c'est le filet de sécurité.
 */
export function mergeCatalog(staticList: Product[], rows: ProductRow[]): Product[] {
  if (!rows.length) return staticList;
  const byslug = new Map(rows.map((r) => [r.slug, r]));
  const merged = staticList.flatMap((p) => {
    const r = byslug.get(p.slug);
    if (!r) return [p];
    byslug.delete(p.slug);
    if (r.archived) return [];
    const next = rowToProduct(r);
    // Une fiche sans photo en base garde le visuel livré avec le site.
    if (!next.image) next.image = p.image;
    return [next];
  });
  const created = [...byslug.values()].filter((r) => !r.archived).map(rowToProduct);
  return [...merged, ...created];
}

/** L'unique requête catalogue, partagée par toute la boutique. */
function catalogueQuery() {
  return {
    queryKey: ["catalogue"] as const,
    queryFn: () => listProducts(),
    staleTime: 60_000,
    retry: false,
  };
}

/**
 * Le catalogue affiché.
 *
 * `src/data/products.ts` ne porte plus la Pâtisserie Tunisienne, et aucune
 * copie de secours ne la porte non plus : elle vient de la base, ou elle ne
 * vient pas. C'est la contrepartie exacte de la règle voulue — le
 * back-office décide, et rien ne peut le contredire.
 *
 * Les autres catégories (gâteaux, salé, coffrets, packs) vivent toujours
 * dans le fichier statique : elles ne sont pas migrées, on n'y touche pas.
 */
export function useCatalog(staticList: Product[] = baseProducts): Product[] {
  const { data } = useQuery(catalogueQuery());
  return useMemo(() => mergeCatalog(staticList, data?.rows ?? []), [staticList, data?.rows]);
}

/**
 * L'état de la base, pour les pages qui ne peuvent rien montrer sans elle.
 *
 * « en attente » n'arrive qu'au tout premier rendu client d'une page non
 * pré-chargée ; le chargeur racine remplit le cache avant le rendu serveur.
 */
export type EtatBase = "ok" | "attente" | "panne";

export function useEtatBase(): EtatBase {
  const { data, isLoading } = useQuery(catalogueQuery());
  if (data) return data.ok ? "ok" : "panne";
  return isLoading ? "attente" : "panne";
}
