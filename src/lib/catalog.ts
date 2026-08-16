import { useQuery } from "@tanstack/react-query";
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

/** Une ligne de la table `products` — le catalogue vit désormais en base. */
export interface ProductRow {
  id: string;
  slug: string;
  name: string;
  category: string;
  family: string | null;
  flavor_label: string | null;
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
  sort_order: number;
  created_at?: string;
  updated_at?: string;
}

/** Une liste vide en base doit rester `undefined` côté fiche produit. */
const list = <T>(v: T[] | null | undefined): T[] | undefined => (v && v.length ? v : undefined);

/** Ligne PostgreSQL → objet `Product` utilisé partout dans le site. */
export function rowToProduct(r: ProductRow): Product {
  return {
    slug: r.slug,
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
    flavorLabel: r.flavor_label ?? undefined,
    published: r.published,
    draft: r.draft,
    flavors: list(r.flavors),
    variants: r.variants?.length ? r.variants : undefined,
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

/**
 * Catalogue enrichi de la base.
 * Les données statiques restent la source du rendu serveur (bonnes pour le
 * référencement) ; la base prend le relais dès qu'elle a répondu.
 */
export function useCatalog(staticList: Product[] = baseProducts): Product[] {
  const { data } = useQuery({
    queryKey: ["catalogue"],
    queryFn: () => listProducts(),
    staleTime: 60_000,
    retry: false,
  });
  return mergeCatalog(staticList, data ?? []);
}
