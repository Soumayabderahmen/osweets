/**
 * Univers « Pâtisserie Tunisienne » — définitions centralisées.
 * Une seule source de vérité pour : le périmètre catalogue, les 6 collections,
 * et les familles de parfums.
 */
import type { Product } from "@/data/products";
import type { ProductFamily } from "@/data/products";
import { isPatisserieCategory } from "./patisserie-scope.ts";

export type CollectionKey =
  "amandes" | "pistache-machmoum-pignon" | "perles" | "tradition" | "ramadan" | "aid";

/** Périmètre : uniquement la pâtisserie tunisienne (exclut cakes, coffrets, salé, packs). */
export const isPatisserieTunisienne = (p: Product) => isPatisserieCategory(p.category);

/** Produit visible en boutique (le champ admin `published` prime). */
export const isPublished = (p: Product) => p.published !== false && !p.archived && !p.draft;

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
    subtitle: "Pour célébrer l'Aïd — les pâtisseries que l'on offre et que l'on partage.",
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
/**
 * Les produits de l'univers Pâtisserie Tunisienne.
 *
 * Le catalogue est un paramètre OBLIGATOIRE, et c'est voulu : il vit en base,
 * plus dans le code. Un appel qui l'oublie ne doit pas retomber en silence
 * sur une liste vide — il doit refuser de compiler.
 */
export function patisserieProducts(list: Product[]): Product[] {
  return list.filter((p) => isPatisserieTunisienne(p) && isPublished(p));
}

/** Produits d'une collection donnée. */
export function collectionProducts(key: CollectionKey, list: Product[]): Product[] {
  const def = COLLECTIONS[key];
  return patisserieProducts(list).filter(def.filter);
}

/** Les autres parfums de la même famille (hors produit courant). */
export function familySiblings(p: Product, list: Product[]): Product[] {
  if (!p.family) return [];
  return list.filter((x) => x.family === p.family && x.slug !== p.slug && isPublished(x));
}

export function familyMembers(family: ProductFamily, list: Product[]): Product[] {
  return list.filter((x) => x.family === family && isPublished(x));
}

/*
 * Les redirections d'anciens slugs produits vivaient ici : onze lignes
 * écrites à la main, à compléter après chaque renommage — et qu'on
 * oubliait, laissant l'ancienne adresse en 404 sans que rien ne le dise.
 *
 * Elles sont passées en base (`product_slug_history`, migration 012), où
 * un déclencheur les alimente tout seul à chaque changement de slug. La
 * fiche produit les relit avec `resolveOldSlug`.
 */

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
