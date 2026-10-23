import { toast } from "sonner";
import type { ProductRow } from "@/lib/catalog";
import type { CollectionRow } from "@/api/collections";
import type { FamilyRow } from "@/api/families";
import type { WaitlistRow } from "@/api/waitlist";
import type { ShopSettings } from "@/api/settings";
import type { PageBannerRow } from "@/api/banners";
import type { SeasonRow } from "@/api/seasons";

/**
 * Le vocabulaire commun du back-office.
 *
 * Ces quelques fonctions décident ce qu'« en boutique », « disponible » et
 * « à surveiller » veulent dire. Elles vivent ici, à un seul endroit, pour que
 * la liste des produits, le tableau de bord et la cloche d'alertes ne puissent
 * pas se contredire.
 */

export type EcranKey =
  | "bord"
  | "collections"
  | "produits"
  | "familles"
  | "campagnes"
  | "commandes"
  | "attente"
  | "bandeaux"
  | "reglages";

/** Ce qu'un panneau latéral doit afficher. */
export type PanneauDemande =
  | { type: "produit"; row: ProductRow | null; famille?: string; collection?: string }
  | { type: "collection"; row: CollectionRow | null }
  | { type: "collection-products"; row: CollectionRow }
  | { type: "collection-add-products"; row: CollectionRow }
  | { type: "famille"; row: FamilyRow | null }
  | { type: "ajout-parfum"; row: FamilyRow }
  | { type: "supprimer"; row: ProductRow }
  | { type: "alertes" };

/** Tout ce qu'un écran reçoit : les données, et de quoi agir dessus. */
export interface Contexte {
  produits: ProductRow[];
  collections: CollectionRow[];
  /** Visuels de haut de page, pour les pages qui ne sont pas des collections. */
  bandeaux: PageBannerRow[];
  familles: FamilyRow[];
  /** Fenêtres d'ouverture des collections saisonnières. */
  saisons: SeasonRow[];
  attente: WaitlistRow[];
  reglages: ShopSettings;
  recherche: string;
  recharger: () => Promise<void>;
  ouvrir: (d: PanneauDemande) => void;
  aller: (e: EcranKey) => void;
}

/** Produits encore en boutique — les archives ne comptent nulle part ailleurs. */
export const enBoutique = (rows: ProductRow[]) => rows.filter((r) => !r.archived);

/** Un produit est disponible s'il se fait à la demande, ou s'il en reste. */
export const dispo = (r: ProductRow) => r.stock_unlimited || (r.stock_qty ?? 0) > 0;

/** Réserve basse : il en reste, mais on approche de la rupture. */
export const bas = (r: ProductRow) =>
  !r.stock_unlimited && (r.stock_qty ?? 0) > 0 && (r.stock_qty ?? 0) <= (r.stock_alert ?? 0);

/** Les produits à surveiller — c'est exactement le compteur de la cloche. */
export const alertes = (rows: ProductRow[]) =>
  enBoutique(rows).filter((r) => !r.stock_unlimited && (r.stock_qty ?? 0) <= (r.stock_alert ?? 0));

export const adminImage = (p: Pick<ProductRow, "image_url" | "image_key">) =>
  p.image_url || (p.image_key ? `/api/public/media/${p.image_key}` : "");

/** Pastille promotionnelle : la valeur en base, et ce qu'on en lit à l'écran. */
export const BADGES: Record<string, string> = {
  bestseller: "Meilleure vente",
  nouveau: "Nouveauté",
  commande: "Sur commande",
  promo: "Promotion",
  limitee: "Édition limitée",
};

export const euro = (n: number | string) => `${Number(n).toFixed(2).replace(".", ",")} €`;

/** Toutes les actions passent par ici : on agit, on recharge, on annonce. */
export async function agir(fn: () => Promise<unknown>, ok: string, recharger: () => Promise<void>) {
  try {
    await fn();
    await recharger();
    toast.success(ok);
  } catch (e) {
    toast.error(e instanceof Error ? e.message : "Action impossible.");
  }
}

export const slugify = (v: string) =>
  v
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
