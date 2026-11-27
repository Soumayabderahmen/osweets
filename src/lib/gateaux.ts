import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import { listGateaux, type GateauRow, type GateauxData } from "@/api/gateaux";
import { resolveProductImage } from "@/lib/product-assets";
import { cakeFlavors, cakeSizes, cakeThemes, type CakeTheme } from "@/data/themes";

/**
 * La partie « Gâteaux » du site, telle que l'admin la règle (migration 034).
 *
 * Les pages gardent leur texte détaillé écrit dans le code ; la base décide
 * du nom, du prix, de la photo, de l'ordre, de ce qui est en ligne — et des
 * gâteaux ajoutés depuis l'admin. Si la base ne répond pas, rien ne change :
 * chaque page montre ses gâteaux écrits.
 */

export function gateauxQuery() {
  return {
    queryKey: ["gateaux"] as const,
    queryFn: () => listGateaux(),
    staleTime: 60_000,
    retry: false,
  };
}

export function useGateauxData(): GateauxData | undefined {
  return useQuery(gateauxQuery()).data;
}

interface ItemDeBase {
  slug: string;
  name: string;
  price: number;
  image: string;
}

/** Un gâteau créé dans l'admin, au format de la page : champs du modèle vidés. */
function gabarit<T extends ItemDeBase>(modele: T, r: GateauRow, image: string): T {
  const o: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(modele))
    o[k] =
      typeof v === "string" ? "" : Array.isArray(v) ? [] : typeof v === "number" ? 0 : undefined;
  for (const k of ["size", "format", "weight"]) if (k in o) o[k] = r.format;
  if ("leadTime" in o) o.leadTime = r.lead_time;
  return { ...o, slug: r.slug, name: r.name, price: Number(r.price), image } as T;
}

/** Applique la base aux gâteaux écrits d'une page : nom, prix, photo, ordre, en ligne. */
export function appliquerGateaux<T extends ItemDeBase>(
  page: string,
  items: T[],
  data: GateauxData | undefined,
): T[] {
  if (!data?.ok) return items;
  const rows = data.gateaux.filter((r) => r.page_key === page);
  if (!rows.length) return items;
  const ecrits = new Map(items.map((i) => [i.slug, i]));
  const vus = new Set<string>();
  const out: T[] = [];
  for (const r of [...rows].sort((a, b) => a.sort_order - b.sort_order)) {
    vus.add(r.slug);
    if (!r.visible) continue;
    const ecrit = ecrits.get(r.slug);
    const image = resolveProductImage(r.image_url, r.image_key) || ecrit?.image || "";
    out.push(
      ecrit
        ? { ...ecrit, name: r.name, price: Number(r.price), image }
        : gabarit(items[0] ?? ({ slug: "", name: "", price: 0, image: "" } as T), r, image),
    );
  }
  // Un gâteau écrit qui n'a pas (encore) de ligne en base reste affiché.
  for (const i of items) if (!vus.has(i.slug)) out.push(i);
  return out;
}

export function useGateaux<T extends ItemDeBase>(page: string | undefined, items: T[]): T[] {
  const data = useGateauxData();
  return useMemo(() => (page ? appliquerGateaux(page, items, data) : items), [page, items, data]);
}

/* ------------------------------------------------------------------ menu */

export interface ColonneMenu {
  title: string;
  items: { to: string; label: string; highlight?: boolean }[];
}
type LienMenu = ColonneMenu["items"][number];

const ORDRE_COLONNES = ["Nos gâteaux", "Formats individuels", "Célébrations & sur mesure"];

/** Les colonnes du menu Gâteaux, ou `null` pour garder celles écrites dans le code. */
export function useGateauxMenu(): ColonneMenu[] | null {
  const data = useGateauxData();
  return useMemo(() => {
    if (!data?.ok || !data.pages.length) return null;
    const colonnes = [...new Set([...ORDRE_COLONNES, ...data.pages.map((p) => p.column_label)])];
    const cols = colonnes
      .map((title) => ({
        title,
        items: data.pages
          .filter((p) => p.column_label === title && p.visible)
          .sort((a, b) => a.sort_order - b.sort_order)
          .map((p): LienMenu => ({ to: p.href, label: p.title })),
      }))
      .filter((c) => c.items.length);
    const derniere =
      cols.find((c) => c.title === "Célébrations & sur mesure") ?? cols[cols.length - 1];
    derniere?.items.push({
      to: "/gateaux/configurer",
      label: "Configurer mon gâteau →",
      highlight: true,
    });
    return cols;
  }, [data]);
}

/* ------------------------------------------------------------------ configurateur */

export interface ConfigSite {
  sizes: { id: string; diameter: string; parts: number; price: number }[];
  flavors: { id: string; label: string }[];
  themes: CakeTheme[];
  customSupplement: number;
  message: boolean;
}

const IMAGE_THEME_DEFAUT = cakeThemes[0]?.image ?? "";

/** Tailles, parfums et thèmes du gâteau d'anniversaire : ceux de l'admin, sinon ceux du code. */
export function useCakeConfig(): ConfigSite {
  const data = useGateauxData();
  return useMemo(() => {
    const c = data?.ok ? data.config : null;
    if (!c)
      return {
        sizes: cakeSizes,
        flavors: cakeFlavors,
        themes: cakeThemes,
        customSupplement: 25,
        message: true,
      };
    const ecrits = new Map(cakeThemes.map((t) => [t.id, t]));
    return {
      sizes: c.sizes
        .filter((s) => s.visible)
        .map((s) => ({ id: s.id, diameter: s.label, parts: s.parts, price: Number(s.price) })),
      flavors: c.flavors,
      themes: c.themes
        .filter((t) => t.visible)
        .map((t) => ({
          id: t.id,
          label: t.label,
          emoji: t.emoji,
          category: t.category,
          color: ecrits.get(t.id)?.color ?? "#A89152",
          image: ecrits.get(t.id)?.image ?? IMAGE_THEME_DEFAUT,
        })),
      customSupplement: Number(c.customSupplement) || 0,
      message: c.message,
    };
  }, [data]);
}
