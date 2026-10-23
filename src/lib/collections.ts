import { useQuery } from "@tanstack/react-query";
import { listCollections, type CollectionRow } from "@/api/collections";
import type { Product } from "@/data/products";
import { resolveProductImage } from "@/lib/product-assets";
import { isCollectionPublic } from "@/lib/collection-visibility";

/**
 * Une collection telle que l'affiche la boutique.
 *
 * Tous ses textes viennent de la base. Il y avait ici une copie des six
 * collections historiques, qui servait quand PostgreSQL ne répondait pas :
 * une collection dépubliée au back-office serait alors revenue au menu,
 * et son lien aurait mené à une page vide.
 */
export interface LiveCollection {
  /** Identifiant d'URL — celui d'une collection créée depuis l'admin aussi. */
  key: string;
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
  /** Masquee partout cote client, conservee dans le back-office. */
  hidden: boolean;
  /**
   * Ce qu'il advient de la collection quand elle n'a aucun produit :
   * « soon » garde sa page avec la liste d'attente, « hide » la retire
   * des surfaces jusqu'à ce qu'elle en ait un. Le choix est fait dans le
   * back-office, et il n'était lu nulle part.
   */
  emptyBehavior: "soon" | "hide";
  sortOrder: number;
  filter: (p: Product) => boolean;
}

const makeFilter = (productKey: string) => (p: Product) =>
  (p.collections ?? []).includes(productKey as never);

/**
 * Ligne de base → collection affichable.
 * Toute collection créée depuis le back-office est acceptée : sa page vit sur
 * la route générique `/patisserie/$slug`, sans passer par le code.
 */
export function rowToCollection(r: CollectionRow): LiveCollection {
  const image = resolveProductImage(r.image_url, r.image_key);
  return {
    key: r.slug,
    productKey: r.product_key,
    path: `/patisserie/${r.slug}`,
    label: r.label,
    h1: r.h1 || r.label,
    title: r.title,
    description: r.description,
    subtitle: r.subtitle,
    image: image || undefined,
    published: r.published,
    hidden: r.hidden ?? false,
    emptyBehavior: r.empty_behavior === "hide" ? "hide" : "soon",
    sortOrder: r.sort_order,
    filter: makeFilter(r.product_key),
  };
}

/**
 * Les lignes de base → les collections de la boutique.
 *
 * Sans réponse de la base, on ne retombe plus sur les six collections
 * écrites dans le code. C'était la même fuite que le catalogue de
 * secours, par une autre porte : une collection dépubliée au back-office
 * serait restée au menu le jour où PostgreSQL se tait, et son lien aurait
 * mené à une page vide. Rien vaut mieux que faux.
 */
export function mergeCollections(rows: CollectionRow[]): LiveCollection[] {
  return rows.map(rowToCollection).sort((a, b) => a.sortOrder - b.sortOrder);
}

/** Les collections publiées, dans l'ordre. */
export function useCollections(): LiveCollection[] {
  const { data } = useQuery({
    queryKey: ["collections"],
    queryFn: () => listCollections(),
    staleTime: 60_000,
    retry: false,
  });
  return mergeCollections(data ?? []).filter(isCollectionPublic);
}

/**
 * Une collection précise.
 *
 * Elle vient de la base, ou de nulle part : la page saura le dire — elle
 * n'ira pas chercher dans le code un titre que le back-office a peut-être
 * changé depuis.
 */
export function useCollection(key: string): LiveCollection | undefined {
  const all = useCollections();
  return all.find((c) => c.key === key);
}
