import { useMemo, useState, useEffect, type ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import type { Product, Allergen } from "@/data/products";
import { allergenLabels } from "@/data/products";
import { ProductCard } from "@/components/ProductCard";
import { LayoutGrid, List, ChevronRight } from "lucide-react";
import { Reveal } from "@/components/Reveal";
import {
  FiltersSidebar,
  type Section,
  type StockFilter,
} from "@/components/filters/FiltersSidebar";
import { itemListJsonLd } from "@/lib/seo";
import { isProductAvailableNow } from "@/lib/season";
import { FULFILLMENT_LABELS, productModes } from "@/lib/fulfillment";

export type ExtraFilterGroup = {
  id: string;
  label: string;
  /** Function selecting the value from a product for this filter. */
  get: (p: Product) => string | string[] | null | undefined;
  /** Options with human labels; value must match what `get` returns. */
  options: { value: string; label: string }[];
  type?: "single" | "multi";
};

export interface CategoryPageProps {
  title: string;
  subtitle?: string;
  heroImage?: string;
  breadcrumb?: { label: string; to?: string }[];
  products: Product[];
  filters?: {
    stock?: boolean;
    price?: boolean;
    allergens?: boolean;
    /** Filtre « Mode de réception » (activé par défaut). */
    fulfillment?: boolean;
  };
  extraFilters?: ExtraFilterGroup[];
  pageSize?: number;
  /** Canonical path used to emit an ItemList JSON-LD for this listing. */
  jsonLdPath?: string;
  /** Rendu à la place de la grille quand la collection ne contient aucun produit. */
  emptyState?: ReactNode;
  /** Bandeau libre affiché sous le fil d'ariane. */
  notice?: ReactNode;
}

const allAllergens: Allergen[] = ["gluten", "lait", "oeuf", "fruits-coque", "sesame"];

/**
 * Disponibilité d'un produit. Le champ `inStock` est optionnel :
 * seul `inStock: false` marque une rupture, l'absence de valeur vaut « en stock ».
 */
const isInStock = (p: Product) => p.inStock !== false;

/**
 * Bandeau de collection — référence base44 : fond sable pleine largeur,
 * texte à gauche (7/12), photo à droite (5/12), hauteur minimale 180px.
 */
function CollectionBanner({
  title,
  subtitle,
  image,
}: {
  title: string;
  subtitle?: string;
  image?: string;
}) {
  return (
    <section className="bg-sable">
      <div className="container-os min-h-[180px] py-12 lg:py-16">
        <div className="grid items-center gap-8 md:grid-cols-12">
          <div className="md:col-span-7">
            <span className="text-[11px] uppercase tracking-[0.25em] text-gold">Collection</span>
            <h1 className="mt-3 font-display text-[32px] leading-tight text-charbon md:text-[40px]">
              {title}
            </h1>
            {subtitle && (
              <p className="mt-4 max-w-lg text-sm leading-relaxed text-charbon-soft md:text-[15px]">
                {subtitle}
              </p>
            )}
          </div>
          <div className="hidden md:col-span-5 md:block">
            <div className="h-[200px] overflow-hidden rounded-xl bg-beige">
              {image ? (
                <img src={image} alt="" aria-hidden="true" className="h-full w-full object-cover" />
              ) : (
                <div className="flex h-full w-full items-center justify-center">
                  <span className="select-none font-display text-7xl text-gold/30">Ö</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function matchesGroup(p: Product, g: ExtraFilterGroup, selection: string | string[]): boolean {
  const productVal = g.get(p);
  if (g.type === "multi") {
    const sel = selection as string[];
    if (sel.length === 0) return true;
    const values = Array.isArray(productVal) ? productVal : productVal ? [productVal] : [];
    return sel.some((v) => values.includes(v));
  }
  const sel = selection as string;
  if (!sel) return true;
  if (Array.isArray(productVal)) return productVal.includes(sel);
  return productVal === sel;
}

export function CategoryPage({
  title,
  subtitle,
  heroImage,
  breadcrumb,
  products,
  filters = { stock: true, price: true, allergens: true },
  extraFilters: extraFiltersProp = [],
  pageSize = 12,
  jsonLdPath,
  emptyState,
  notice,
}: CategoryPageProps) {
  const fulfillmentGroup: ExtraFilterGroup = {
    id: "fulfillment",
    label: "Mode de réception",
    type: "multi",
    get: (p) => productModes(p),
    options: [
      { value: "shipping", label: FULFILLMENT_LABELS.shipping },
      { value: "local", label: FULFILLMENT_LABELS.local },
      { value: "pickup", label: FULFILLMENT_LABELS.pickup },
    ],
  };
  const extraFilters: ExtraFilterGroup[] =
    filters.fulfillment === false ? extraFiltersProp : [fulfillmentGroup, ...extraFiltersProp];
  const priceBounds = useMemo(() => {
    if (!products.length) return { min: 0, max: 0 };
    const prices = products.map((p) => p.price);
    return { min: Math.floor(Math.min(...prices)), max: Math.ceil(Math.max(...prices)) };
  }, [products]);

  const [stock, setStock] = useState<StockFilter[]>([]);
  const [exclude, setExclude] = useState<Allergen[]>([]);
  const [priceMin, setPriceMin] = useState(priceBounds.min);
  const [priceMax, setPriceMax] = useState(priceBounds.max);
  const [sort, setSort] = useState<"feature" | "asc" | "desc" | "new">("feature");
  const [layout, setLayout] = useState<"grid" | "list">("grid");
  const [page, setPage] = useState(1);
  const [extraValues, setExtraValues] = useState<Record<string, string | string[]>>(() =>
    Object.fromEntries(extraFilters.map((g) => [g.id, g.type === "multi" ? [] : ""])),
  );

  useEffect(() => {
    setStock([]);
    setExclude([]);
    setPriceMin(priceBounds.min);
    setPriceMax(priceBounds.max);
    setSort("feature");
    setPage(1);
    setExtraValues(
      Object.fromEntries(extraFilters.map((g) => [g.id, g.type === "multi" ? [] : ""])),
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [products, priceBounds.min, priceBounds.max]);

  const resetFilters = () => {
    setStock([]);
    setExclude([]);
    setPriceMin(priceBounds.min);
    setPriceMax(priceBounds.max);
    setSort("feature");
    setPage(1);
    setExtraValues(
      Object.fromEntries(extraFilters.map((g) => [g.id, g.type === "multi" ? [] : ""])),
    );
  };

  const filtered = useMemo(() => {
    let list = [...products];
    if (filters.stock && stock.length)
      list = list.filter((p) => stock.includes(isInStock(p) ? "in" : "out"));
    if (filters.allergens && exclude.length)
      list = list.filter((p) => !p.allergens.some((a) => exclude.includes(a)));
    if (filters.price) list = list.filter((p) => p.price >= priceMin && p.price <= priceMax);
    for (const g of extraFilters) {
      const v = extraValues[g.id];
      if (v !== undefined) list = list.filter((p) => matchesGroup(p, g, v));
    }
    if (sort === "asc") list.sort((a, b) => a.price - b.price);
    if (sort === "desc") list.sort((a, b) => b.price - a.price);
    if (sort === "new") list = [...list].reverse();
    return list;
  }, [products, filters, stock, exclude, priceMin, priceMax, sort, extraFilters, extraValues]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const visible = filtered.slice((page - 1) * pageSize, page * pageSize);
  const inStockCount = products.filter(isInStock).length;
  const outStockCount = products.length - inStockCount;

  const hasSidebar = filters.stock || filters.price || filters.allergens || extraFilters.length > 0;

  const hasActiveFilters =
    stock.length > 0 ||
    exclude.length > 0 ||
    priceMin > priceBounds.min ||
    priceMax < priceBounds.max ||
    extraFilters.some((g) => {
      const v = extraValues[g.id];
      return Array.isArray(v) ? v.length > 0 : !!v;
    });

  // Build sections for the shared sidebar
  const countMatchingExcept = (predicate: (p: Product) => boolean): number =>
    products.filter((p) => {
      if (filters.stock && stock.length && !stock.includes(isInStock(p) ? "in" : "out"))
        return false;
      if (filters.price && (p.price < priceMin || p.price > priceMax)) return false;
      if (filters.allergens && exclude.length && p.allergens.some((a) => exclude.includes(a)))
        return false;
      return predicate(p);
    }).length;

  const sections: Section[] = [];
  if (filters.stock)
    sections.push({
      kind: "stock",
      value: stock,
      inStockCount,
      outStockCount,
      onChange: (v) => {
        setStock(v);
        setPage(1);
      },
    });
  if (filters.price)
    sections.push({
      kind: "price",
      bounds: priceBounds,
      min: priceMin,
      max: priceMax,
      onChange: (mn, mx) => {
        setPriceMin(mn);
        setPriceMax(mx);
        setPage(1);
      },
    });
  for (const g of extraFilters) {
    const type = g.type ?? "single";
    const options = g.options
      .map((o) => ({
        value: o.value,
        label: o.label,
        count: countMatchingExcept((p) => {
          const val = g.get(p);
          return Array.isArray(val) ? val.includes(o.value) : val === o.value;
        }),
      }))
      // Une option qui ne correspond à aucun produit n'est pas affichée.
      .filter((o) => o.count > 0 || (extraValues[g.id] ?? []).includes(o.value));
    if (type === "multi") {
      sections.push({
        kind: "multi",
        id: g.id,
        label: g.label,
        value: (extraValues[g.id] as string[]) ?? [],
        onChange: (v) => {
          setExtraValues((prev) => ({ ...prev, [g.id]: v }));
          setPage(1);
        },
        options,
      });
    } else {
      sections.push({
        kind: "single",
        id: g.id,
        label: g.label,
        value: (extraValues[g.id] as string) ?? "",
        onChange: (v) => {
          setExtraValues((prev) => ({ ...prev, [g.id]: v }));
          setPage(1);
        },
        options,
      });
    }
  }
  if (filters.allergens)
    sections.push({
      kind: "multi",
      id: "allergens",
      label: "Sans allergène",
      value: exclude,
      onChange: (v) => {
        setExclude(v as Allergen[]);
        setPage(1);
      },
      options: allAllergens
        .map((a) => ({
          value: a,
          label: allergenLabels[a],
          count: products.filter((p) => !p.allergens.includes(a)).length,
        }))
        .filter((o) => o.count > 0 && o.count < products.length),
      withoutPrefix: true,
    });

  const banner = <CollectionBanner title={title} subtitle={subtitle} image={heroImage} />;

  const Grid = (
    <>
      {/* Compteur + rappel de collection — au-dessus de la barre d'outils (base44) */}
      <div className="mb-6 flex items-baseline justify-between">
        <p className="text-xs tracking-wide text-charbon-soft">
          {filtered.length} produit{filtered.length > 1 ? "s" : ""}
        </p>
        <span className="hidden text-xs text-charbon-soft/60 sm:block">{title}</span>
      </div>

      <div className="mb-8 flex items-center justify-between border-b border-beige pb-5">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setLayout("grid")}
            aria-label="Vue grille"
            aria-pressed={layout === "grid"}
            className={`flex h-9 w-9 items-center justify-center rounded-lg transition-colors ${
              layout === "grid"
                ? "bg-charbon text-ivory"
                : "border border-beige text-charbon-soft hover:border-gold"
            }`}
          >
            <LayoutGrid className="h-4 w-4" />
          </button>
          <button
            onClick={() => setLayout("list")}
            aria-label="Vue liste"
            aria-pressed={layout === "list"}
            className={`flex h-9 w-9 items-center justify-center rounded-lg transition-colors ${
              layout === "list"
                ? "bg-charbon text-ivory"
                : "border border-beige text-charbon-soft hover:border-gold"
            }`}
          >
            <List className="h-4 w-4" />
          </button>
        </div>
        <label className="flex items-center gap-2.5 text-sm">
          <span className="hidden text-xs uppercase tracking-[0.15em] text-charbon-soft sm:inline">
            Trier
          </span>
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value as typeof sort)}
            className="h-9 rounded-lg border border-beige bg-white px-3 text-sm text-charbon outline-none focus:border-gold"
          >
            <option value="feature">En vedette</option>
            <option value="new">Nouveautés</option>
            <option value="asc">Prix croissant</option>
            <option value="desc">Prix décroissant</option>
          </select>
        </label>
      </div>

      {visible.length === 0 ? (
        <div className="py-12 text-center">
          <p className="text-sm text-charbon-soft">Aucun produit ne correspond à ces filtres.</p>
          <button onClick={resetFilters} className="link-gold mt-5 inline-block">
            Réinitialiser les filtres
          </button>
        </div>
      ) : layout === "list" ? (
        <div className="flex flex-col gap-6">
          {visible.map((p) => (
            <ProductCard key={p.slug} product={p} layout="list" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-x-6 gap-y-10 lg:grid-cols-3">
          {visible.map((p, i) => (
            <Reveal key={p.slug} delay={(i % 3) * 0.05}>
              <ProductCard product={p} layout="grid" />
            </Reveal>
          ))}
        </div>
      )}

      {totalPages > 1 && (
        <nav className="mt-14 flex items-center justify-center gap-2" aria-label="Pagination">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="h-10 rounded-full border border-beige px-4 text-sm transition-colors hover:border-gold disabled:opacity-40"
          >
            Précédent
          </button>
          {Array.from({ length: totalPages }).map((_, i) => (
            <button
              key={i}
              onClick={() => setPage(i + 1)}
              aria-current={page === i + 1 ? "page" : undefined}
              className={`h-10 w-10 rounded-full text-sm transition-colors ${
                page === i + 1 ? "bg-charbon text-ivory" : "border border-beige hover:border-gold"
              }`}
            >
              {i + 1}
            </button>
          ))}
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="h-10 rounded-full border border-beige px-4 text-sm transition-colors hover:border-gold disabled:opacity-40"
          >
            Suivant
          </button>
        </nav>
      )}
    </>
  );

  const listLd = jsonLdPath
    ? itemListJsonLd({
        name: title,
        path: jsonLdPath,
        items: products,
        availability: (p) => isProductAvailableNow(p as Product),
      })
    : null;

  return (
    <div className="bg-background min-h-[60vh]">
      {listLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(listLd) }}
        />
      )}
      <div>
        <div className="container-os py-6">
          {breadcrumb && (
            <nav className="text-xs text-charbon-soft" aria-label="Fil d'ariane">
              <ol className="flex flex-wrap items-center gap-1">
                {breadcrumb.map((b, i) => (
                  <li key={i} className="flex items-center gap-1">
                    {b.to ? (
                      <Link to={b.to} className="transition-colors hover:text-gold">
                        {b.label}
                      </Link>
                    ) : (
                      <span className="text-charbon" aria-current="page">
                        {b.label}
                      </span>
                    )}
                    {i < breadcrumb.length - 1 && (
                      <ChevronRight className="h-3 w-3 text-charbon-soft/50" />
                    )}
                  </li>
                ))}
              </ol>
            </nav>
          )}
        </div>
      </div>

      {notice && <div className="container-os pb-5">{notice}</div>}

      {banner}

      <section className="container-os py-12 lg:py-16">
        {products.length === 0 && emptyState ? (
          emptyState
        ) : hasSidebar ? (
          <FiltersSidebar
            sections={sections}
            hasActive={hasActiveFilters}
            onReset={resetFilters}
            totalCount={filtered.length}
          >
            {Grid}
          </FiltersSidebar>
        ) : (
          Grid
        )}
      </section>
    </div>
  );
}
