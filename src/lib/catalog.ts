import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { products as baseProducts, type Product, type ProductCollection, type ProductFamily } from "@/data/products";

export interface ProductOverride {
  slug: string;
  name: string | null;
  price: number | null;
  image_url: string | null;
  short_desc: string | null;
  collections: string[] | null;
  seasonal_only: boolean | null;
  family: string | null;
  published: boolean;
  description?: string | null;
  composition?: string[] | null;
  allergens?: string[] | null;
  unit?: string | null;
  pieces?: number | null;
  weight?: string | null;
  variants?: unknown;
}

export async function fetchOverrides(): Promise<ProductOverride[]> {
  const { data, error } = await supabase.from("product_overrides").select("*");
  if (error) throw error;
  return (data ?? []) as ProductOverride[];
}

/** Applique les ajustements administrables sur la fiche statique. */
export function applyOverride(p: Product, o?: ProductOverride): Product {
  if (!o) return p;
  const next: Product = { ...p };
  if (o.name) next.name = o.name;
  if (o.price !== null && o.price !== undefined) {
    next.price = Number(o.price);
    if (next.price > 0) next.draft = false;
  }
  if (o.image_url) next.image = o.image_url;
  if (o.short_desc) next.shortDesc = o.short_desc;
  if (o.collections) next.collections = o.collections as ProductCollection[];
  if (o.seasonal_only !== null && o.seasonal_only !== undefined) next.seasonalOnly = o.seasonal_only;
  if (o.family) next.family = o.family as ProductFamily;
  if (o.description) next.description = o.description;
  if (o.composition?.length) next.composition = o.composition;
  if (o.allergens?.length) next.allergens = o.allergens as Product["allergens"];
  if (o.unit) next.unit = o.unit;
  if (o.pieces !== null && o.pieces !== undefined) next.pieces = o.pieces;
  if (o.weight) next.weight = o.weight;
  if (Array.isArray(o.variants) && o.variants.length) {
    next.variants = o.variants as Product["variants"];
  }
  next.published = o.published;
  return next;
}

export function mergeOverrides(list: Product[], overrides: ProductOverride[]): Product[] {
  if (!overrides.length) return list;
  const map = new Map(overrides.map((o) => [o.slug, o]));
  return list.map((p) => applyOverride(p, map.get(p.slug)));
}

/**
 * Catalogue enrichi des ajustements saisis dans la page d'administration.
 * Les données statiques restent la source SSR (bonnes pour le SEO) ;
 * les ajustements sont appliqués côté client dès qu'ils sont chargés.
 */
export function useCatalog(list: Product[] = baseProducts): Product[] {
  const { data } = useQuery({
    queryKey: ["product-overrides"],
    queryFn: fetchOverrides,
    staleTime: 60_000,
    retry: false,
  });
  return mergeOverrides(list, data ?? []);
}
