export interface CatalogQuery {
  stock: ("in" | "out")[];
  exclude: string[];
  priceMin: number;
  priceMax: number;
  /** Vrai uniquement après une action volontaire sur les bornes de prix. */
  priceTouched: boolean;
  sort: "feature" | "asc" | "desc" | "new";
  layout: "grid" | "list";
  page: number;
  extraValues: Record<string, string | string[]>;
}

export function readCatalogQuery(
  value: unknown,
  bounds: { min: number; max: number },
): CatalogQuery {
  const q = value && typeof value === "object" ? (value as Partial<CatalogQuery>) : {};
  const strings = (v: unknown): string[] =>
    Array.isArray(v) ? v.filter((x) => typeof x === "string") : [];
  return {
    stock: strings(q.stock).filter((v): v is "in" | "out" => v === "in" || v === "out"),
    exclude: strings(q.exclude),
    priceMin: Number.isFinite(q.priceMin) ? Math.max(0, q.priceMin!) : 0,
    priceMax: Number.isFinite(q.priceMax) ? Math.max(0, q.priceMax!) : bounds.max,
    priceTouched:
      q.priceTouched === true ||
      (q.priceTouched === undefined &&
        (Object.prototype.hasOwnProperty.call(q, "priceMin") ||
          Object.prototype.hasOwnProperty.call(q, "priceMax"))),
    sort: ["asc", "desc", "new"].includes(q.sort ?? "") ? q.sort! : "feature",
    layout: q.layout === "list" ? "list" : "grid",
    page: Math.max(1, Math.trunc(Number(q.page) || 1)),
    extraValues:
      q.extraValues && typeof q.extraValues === "object"
        ? Object.fromEntries(
            Object.entries(q.extraValues).map(([key, v]) => [
              key,
              typeof v === "string" ? v : strings(v),
            ]),
          )
        : {},
  };
}

export function isPriceFilterActive(
  query: Pick<CatalogQuery, "priceMin" | "priceMax" | "priceTouched">,
  bounds: { max: number },
): boolean {
  return query.priceTouched && (query.priceMin > 0 || query.priceMax < bounds.max);
}

export function activeCatalogCriteria(
  query: Pick<
    CatalogQuery,
    "stock" | "exclude" | "extraValues" | "priceMin" | "priceMax" | "priceTouched"
  >,
  bounds: { max: number },
): number {
  const extras = Object.values(query.extraValues).filter((value) =>
    Array.isArray(value) ? value.length > 0 : Boolean(value),
  ).length;
  return (
    (query.stock.length ? 1 : 0) +
    (query.exclude.length ? 1 : 0) +
    (isPriceFilterActive(query, bounds) ? 1 : 0) +
    extras
  );
}

export function newestFirst<T extends { createdAt?: string; slug: string }>(products: T[]): T[] {
  const time = (s?: string) => (s && Number.isFinite(Date.parse(s)) ? Date.parse(s) : 0);
  return [...products].sort(
    (a, b) => time(b.createdAt) - time(a.createdAt) || a.slug.localeCompare(b.slug),
  );
}
