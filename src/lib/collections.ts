import { useQuery } from "@tanstack/react-query";
import { listCollections, type CollectionRow } from "@/api/collections";
import { COLLECTIONS, COLLECTION_ORDER, type CollectionKey } from "@/lib/patisserie";
import type { Product } from "@/data/products";
import { resolveProductImage } from "@/lib/product-assets";

/**
 * Une collection telle que l'affiche la boutique : les textes viennent de la
 * base dès qu'elle répond, sinon des définitions du code — qui restent le
 * filet de sécurité et la source du rendu serveur.
 */
export interface LiveCollection {
  key: CollectionKey;
  /** Étiquette portée par les produits (`collections` du produit). */
  productKey: string;
  path: string;
  label: string;
  h1: string;
  title: string;
  description: string;
  subtitle: string;
  image?: string;
  published: boolean;
  sortOrder: number;
  filter: (p: Product) => boolean;
}

/** Correspondance clé de page ↔ étiquette produit (elles diffèrent pour la pistache). */
const PRODUCT_KEY: Record<CollectionKey, string> = {
  amandes: "amandes",
  "pistache-machmoum-pignon": "pistache",
  perles: "perles",
  tradition: "tradition",
  ramadan: "ramadan",
  aid: "aid",
};

const makeFilter = (productKey: string) => (p: Product) =>
  (p.collections ?? []).includes(productKey as never);

/** Version issue uniquement du code — utilisée tant que la base n'a pas répondu. */
export function staticCollections(): LiveCollection[] {
  return COLLECTION_ORDER.map((key, i) => {
    const def = COLLECTIONS[key];
    return {
      key,
      productKey: PRODUCT_KEY[key],
      path: def.path,
      label: def.label,
      h1: def.h1,
      title: def.title,
      description: def.description,
      subtitle: def.subtitle,
      published: true,
      sortOrder: (i + 1) * 10,
      filter: makeFilter(PRODUCT_KEY[key]),
    };
  });
}

/** Ligne de base → collection affichable. */
export function rowToCollection(r: CollectionRow): LiveCollection | null {
  const key = r.slug as CollectionKey;
  if (!COLLECTIONS[key]) return null; // une page doit exister pour ce slug
  const image = resolveProductImage(r.image_url, r.image_key);
  return {
    key,
    productKey: r.product_key,
    path: `/patisserie/${r.slug}`,
    label: r.label,
    h1: r.h1,
    title: r.title,
    description: r.description,
    subtitle: r.subtitle,
    image: image || undefined,
    published: r.published,
    sortOrder: r.sort_order,
    filter: makeFilter(r.product_key),
  };
}

export function mergeCollections(rows: CollectionRow[]): LiveCollection[] {
  if (!rows.length) return staticCollections();
  const fromDb = rows.map(rowToCollection).filter((c): c is LiveCollection => c !== null);
  if (!fromDb.length) return staticCollections();
  return [...fromDb].sort((a, b) => a.sortOrder - b.sortOrder);
}

/** Les collections publiées, dans l'ordre. */
export function useCollections(): LiveCollection[] {
  const { data } = useQuery({
    queryKey: ["collections"],
    queryFn: () => listCollections(),
    staleTime: 60_000,
    retry: false,
  });
  return mergeCollections(data ?? []).filter((c) => c.published);
}

/** Une collection précise, avec repli sur la définition du code. */
export function useCollection(key: CollectionKey): LiveCollection {
  const all = useCollections();
  return all.find((c) => c.key === key) ?? staticCollections().find((c) => c.key === key)!;
}
