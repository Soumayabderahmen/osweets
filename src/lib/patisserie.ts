/**
 * Univers « Pâtisserie Tunisienne » — définitions centralisées.
 * Une seule source de vérité pour : le périmètre catalogue, les 6 collections,
 * les familles de parfums et les redirections 301 des anciennes URL.
 */
import { products, type Product } from "@/data/products";
import type { ProductFamily } from "@/data/products";

export type CollectionKey =
  | "amandes"
  | "pistache-machmoum-pignon"
  | "perles"
  | "tradition"
  | "ramadan"
  | "aid";

/** Périmètre : uniquement la pâtisserie tunisienne (exclut cakes, coffrets, salé, packs). */
export const isPatisserieTunisienne = (p: Product) =>
  p.category !== "cake" &&
  p.category !== "coffret" &&
  p.category !== "sale" &&
  p.category !== "pack-fiancailles" &&
  p.category !== "anniversaire";

/** Produit visible en boutique (le champ admin `published` prime). */
export const isPublished = (p: Product) => p.published !== false;

/** Appartenance à une collection — assignation explicite, jamais déduite du texte. */
const inCollection = (key: string) => (p: Product) => (p.collections ?? []).includes(key as never);

export interface CollectionDef {
  key: CollectionKey;
  path: string;
  label: string;
  h1: string;
  title: string;
  description: string;
  subtitle: string;
  filter: (p: Product) => boolean;
}

export const COLLECTIONS: Record<CollectionKey, CollectionDef> = {
  amandes: {
    key: "amandes",
    path: "/patisserie/amandes",
    label: "Amandes",
    h1: "Amandes",
    title: "Pâtisseries aux Amandes — Ghraïba, Samsa, Hrisset Louz | Ö' Sweets",
    description:
      "Nos pâtisseries tunisiennes aux amandes façonnées à la main à Évry-Courcouronnes : Ghraïba fondante, Samsa croustillante, Hrisset Louz et dattes farcies à la pâte d'amandes.",
    subtitle:
      "L'amande sous toutes ses formes — travaillée en pâte, en poudre ou entière, elle est le cœur de la pâtisserie tunisienne.",
    filter: inCollection("amandes"),
  },
  "pistache-machmoum-pignon": {
    key: "pistache-machmoum-pignon",
    path: "/patisserie/pistache-machmoum-pignon",
    label: "Pistache, Machmoum & Pignon",
    h1: "Pistache, Machmoum & Pignon",
    title: "Pistache, Machmoum & Pignon — Baklawa, Kounefa, Samsa | Ö' Sweets",
    description:
      "Les saveurs nobles de la pâtisserie tunisienne : pistache d'Iran, machmoum et pignon de pin. Baklawa, Kounefa et Samsa façonnées à la main dans notre atelier.",
    subtitle:
      "Les saveurs nobles. Pistache d'Iran, pignon de pin, et le machmoum — cette bouchée délicate qui doit son nom au bouquet de jasmin.",
    filter: inCollection("pistache"),
  },
  perles: {
    key: "perles",
    path: "/patisserie/perles",
    label: "Perles",
    h1: "Perles",
    title: "Collection Perles — Bouchées rondes précieuses | Ö' Sweets",
    description:
      "Nos Perles : petites bouchées rondes et raffinées de la pâtisserie tunisienne Ö' Sweets, façonnées à la main à Évry-Courcouronnes.",
    subtitle:
      "Petites bouchées rondes, pralinées et précieuses — une collection en préparation dans notre atelier.",
    filter: inCollection("perles"),
  },
  tradition: {
    key: "tradition",
    path: "/patisserie/tradition",
    label: "Tradition",
    h1: "Tradition",
    title: "Collection Tradition — Ghraïba, Bechkoutou, Youyou, Sablé | Ö' Sweets",
    description:
      "Les quatre classiques tunisiens transmis de génération en génération : Ghraïba, Bechkoutou, Youyou et Sablé pur beurre AOP, façonnés à la main à Évry-Courcouronnes.",
    subtitle:
      "Les classiques de la maison — ceux que l'on retrouve sur toutes les tables tunisiennes.",
    filter: (p) => (p.collections ?? []).includes("tradition"),
  },
  ramadan: {
    key: "ramadan",
    path: "/patisserie/ramadan",
    label: "Ramadan",
    h1: "Ramadan",
    title: "Collection Ramadan — Samsa, Kounefa, Assida, Zlebia | Ö' Sweets",
    description:
      "Les douceurs du mois sacré préparées chaque jour dans notre atelier d'Évry-Courcouronnes : Samsa, Kounefa, Assida, Zlebia & Mkharek, Bouza, Sablé, Hrisset Louz et dattes farcies.",
    subtitle:
      "Les douceurs du mois sacré. Samsa, kaak, assida, bouza et kounefa, préparées chaque matin dans notre atelier.",
    filter: (p) => (p.collections ?? []).includes("ramadan"),
  },
  aid: {
    key: "aid",
    path: "/patisserie/aid",
    label: "Aïd",
    h1: "Aïd",
    title: "Collection Aïd Mubarak — Kaak Warka, Samsa, Hrisset Louz | Ö' Sweets",
    description:
      "Célébrez l'Aïd avec nos pâtisseries tunisiennes signature : Kaak Warka, Baklawa pistache, Samsa aux amandes, Sablé pur beurre, Hrisset Louz et dattes farcies.",
    subtitle:
      "Pour célébrer l'Aïd — les pâtisseries que l'on offre et que l'on partage.",
    filter: (p) => (p.collections ?? []).includes("aid"),
  },
};

export const COLLECTION_ORDER: CollectionKey[] = [
  "amandes",
  "pistache-machmoum-pignon",
  "perles",
  "tradition",
  "ramadan",
  "aid",
];

/** Tous les produits de l'univers pâtisserie tunisienne, publiés. */
export function patisserieProducts(list: Product[] = products): Product[] {
  return list.filter((p) => isPatisserieTunisienne(p) && isPublished(p));
}

/** Produits d'une collection donnée. */
export function collectionProducts(key: CollectionKey, list: Product[] = products): Product[] {
  const def = COLLECTIONS[key];
  return patisserieProducts(list).filter(def.filter);
}

/** Les autres parfums de la même famille (hors produit courant). */
export function familySiblings(p: Product, list: Product[] = products): Product[] {
  if (!p.family) return [];
  return list.filter((x) => x.family === p.family && x.slug !== p.slug && isPublished(x));
}

export function familyMembers(family: ProductFamily, list: Product[] = products): Product[] {
  return list.filter((x) => x.family === family && isPublished(x));
}

/**
 * Redirections 301 — anciens slugs produits renommés.
 */
export const PRODUCT_SLUG_REDIRECTS: Record<string, string> = {
  "ghrayba-amandes": "ghraiba",
  "samsa-praline": "samsa-praline-noisette",
  "samsa-pistache": "samsa-praline-pistache",
  "kounafa-pistache": "kounefa",
  "kounefa-kechda": "kounefa",
  "kounefa-nutella": "kounefa",
  "bachkoutou": "bechkoutou",
  "kaak-youyou": "youyou",
  "sable-tunisien": "sable",
  "hrissa-louz": "hrisset-louz",
  "degla-farcie": "dattes-farcies",
};

/**
 * Redirections 301 — anciennes URL `/patisserie?cat=…` vers les pages dédiées.
 * Les anciennes valeurs supprimées pointent vers Tradition ou la page complète.
 */
export const PATISSERIE_CAT_REDIRECTS: Record<string, string> = {
  amandes: "/patisserie/amandes",
  "pistache-machmoum-pignon": "/patisserie/pistache-machmoum-pignon",
  perles: "/patisserie/perles",
  tradition: "/patisserie/tradition",
  ramadan: "/patisserie/ramadan",
  aid: "/patisserie/aid",
  fekia: "/patisserie/tradition",
  "amandes-collection": "/patisserie/amandes",
  light: "/patisserie",
  assortiments: "/patisserie",
  all: "/patisserie",
};
