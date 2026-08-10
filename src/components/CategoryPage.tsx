import { useMemo, useState, useEffect, type ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import type { Product, Allergen } from "@/data/products";
import { allergenLabels } from "@/data/products";
import { ProductCard } from "@/components/ProductCard";
import { LayoutGrid, List } from "lucide-react";
import { FiltersSidebar, type Section } from "@/components/filters/FiltersSidebar";
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

/** Bandeau collection éditorial : bande sable pleine largeur, texte à gauche, photo arrondie à droite. */
function CollectionBanner({
  title,
  subtitle,
  image,
}: {
  title: string;
  subtitle?: string;
  image: string;
}) {
  return (
    <section className="mb-12 rounded-2xl bg-sand px-7 py-10 md:px-12 md:py-14">
      <div className="grid items-center gap-8 md:grid-cols-[1fr_1fr] md:gap-14">
        <div className="flex flex-col justify-center">
          <span className="text-[10px] uppercase tracking-[0.28em] text-gold">Collection</span>
          <h1 className="mt-4 font-display text-[34px] leading-[1.1] text-charbon md:text-[44px]">
            {title}
          </h1>
          {subtitle && (
            <p className="mt-5 max-w-md text-[15px] leading-relaxed text-charbon-soft">{subtitle}</p>
          )}
        </div>
        <div className="relative aspect-[16/9] overflow-hidden rounded-xl md:aspect-[16/10]">
          <img src={image} alt={title} className="absolute inset-0 h-full w-full object-cover" />
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

  const [stockOnly, setStockOnly] = useState(false);
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
    setStockOnly(false);
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
    setStockOnly(false);
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
    if (filters.stock && stockOnly) list = list.filter((p) => p.inStock);
    if (filters.allergens && exclude.length)
      list = list.filter((p) => !p.allergens.some((a) => exclude.includes(a)));
    if (filters.price)
      list = list.filter((p) => p.price >= priceMin && p.price <= priceMax);
    for (const g of extraFilters) {
      const v = extraValues[g.id];
      if (v !== undefined) list = list.filter((p) => matchesGroup(p, g, v));
    }
    if (sort === "asc") list.sort((a, b) => a.price - b.price);
    if (sort === "desc") list.sort((a, b) => b.price - a.price);
    if (sort === "new") list = [...list].reverse();
    return list;
  }, [products, filters, stockOnly, exclude, priceMin, priceMax, sort, extraFilters, extraValues]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const visible = filtered.slice((page - 1) * pageSize, page * pageSize);
  const inStockCount = products.filter((p) => p.inStock).length;
  const outStockCount = products.length - inStockCount;

  const hasSidebar =
    filters.stock || filters.price || filters.allergens || extraFilters.length > 0;

  const hasActiveFilters =
    stockOnly ||
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
      if (filters.stock && stockOnly && !p.inStock) return false;
      if (filters.price && (p.price < priceMin || p.price > priceMax)) return false;
      if (filters.allergens && exclude.length && p.allergens.some((a) => exclude.includes(a)))
        return false;
      return predicate(p);
    }).length;

  const sections: Section[] = [];
  if (filters.stock)
    sections.push({
      kind: "stock",
      value: stockOnly,
      inStockCount,
      outStockCount,
      onChange: (v) => {
        setStockOnly(v);
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

  const banner = heroImage ? (
    <CollectionBanner title={title} subtitle={subtitle} image={heroImage} />
  ) : (
    <header className="mb-10 max-w-2xl">
      <h1 className="font-display text-[34px] leading-tight text-charbon md:text-[44px]">{title}</h1>
      {subtitle && <p className="mt-3 text-sm leading-relaxed text-charbon-soft">{subtitle}</p>}
    </header>
  );

  const Grid = (
    <>
      {banner}

      <div className="mb-8 flex flex-wrap items-center justify-between gap-3 border-b border-line pb-4">
        <div className="flex items-center gap-4">
          <span className="text-[11px] uppercase tracking-[0.18em] text-charbon-soft">
            {filtered.length} produit{filtered.length > 1 ? "s" : ""}
          </span>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setLayout("grid")}
              className={`grid h-8 w-8 place-items-center transition ${layout === "grid" ? "text-charbon" : "text-charbon-soft/50 hover:text-charbon"}`}
              aria-label="Grille"
            >
              <LayoutGrid className="h-4 w-4" />
            </button>
            <button
              onClick={() => setLayout("list")}
              className={`grid h-8 w-8 place-items-center transition ${layout === "list" ? "text-charbon" : "text-charbon-soft/50 hover:text-charbon"}`}
              aria-label="Liste"
            >
              <List className="h-4 w-4" />
            </button>
          </div>
        </div>
        <label className="flex items-center gap-2 text-sm">
          <span className="text-[11px] uppercase tracking-[0.18em] text-charbon-soft">Trier</span>
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value as typeof sort)}
            className="min-w-[150px] border-0 border-b border-line bg-transparent px-1 py-1.5 text-sm text-charbon focus:border-gold focus:outline-none"
          >
            <option value="feature">En vedette</option>
            <option value="new">Nouveautés</option>
            <option value="asc">Prix croissant</option>
            <option value="desc">Prix décroissant</option>
          </select>
        </label>
      </div>


      {visible.length === 0 ? (
        <div className="py-20 text-center text-charbon-soft">
          <p>Aucun produit ne correspond à ces filtres.</p>
          <button onClick={resetFilters} className="link-gold mt-5 inline-block">
            Réinitialiser les filtres
          </button>
        </div>
      ) : layout === "list" ? (
        <div className="space-y-6">
          {visible.map((p) => (
            <ProductCard key={p.slug} product={p} layout="list" />
          ))}
        </div>
      ) : visible.length === 1 ? (
        <div className="flex justify-center">
          <div className="w-full max-w-[400px]">
            <ProductCard product={visible[0]} layout="grid" />
          </div>
        </div>
      ) : visible.length === 2 ? (
        <div className="mx-auto grid max-w-[820px] grid-cols-1 gap-8 sm:grid-cols-2 md:gap-10">
          {visible.map((p) => (
            <ProductCard key={p.slug} product={p} layout="grid" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-x-6 gap-y-12 lg:grid-cols-3 lg:gap-x-10 lg:gap-y-16">
          {visible.map((p) => (
            <ProductCard key={p.slug} product={p} layout="grid" />
          ))}
        </div>
      )}

      {totalPages > 1 && (
        <div className="mt-16 flex items-center justify-center gap-1 text-sm">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="px-3 py-2 text-charbon-soft transition hover:text-charbon disabled:opacity-30"
          >
            ←
          </button>
          {Array.from({ length: totalPages }).map((_, i) => (
            <button
              key={i}
              onClick={() => setPage(i + 1)}
              className={`h-9 w-9 transition ${page === i + 1 ? "border-b border-charbon text-charbon" : "text-charbon-soft hover:text-charbon"}`}
            >
              {i + 1}
            </button>
          ))}
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="px-3 py-2 text-charbon-soft transition hover:text-charbon disabled:opacity-30"
          >
            →
          </button>
        </div>
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
        <div className="container-os py-5">
          {breadcrumb && (
            <div className="text-[13px] text-charbon-soft">
              {breadcrumb.map((b, i) => (
                <span key={i}>
                  {b.to ? (
                    <Link to={b.to} className="transition hover:text-charbon">
                      {b.label}
                    </Link>
                  ) : (
                    <span className="text-charbon">{b.label}</span>
                  )}
                  {i < breadcrumb.length - 1 && (
                    <span className="mx-2 text-charbon-soft/50">&rsaquo;</span>
                  )}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>



      {notice && <div className="container-os pt-5">{notice}</div>}

      <section className="container-os py-8 md:py-12">
        {products.length === 0 && emptyState ? (
          <>
            {banner}
            {emptyState}
          </>
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
