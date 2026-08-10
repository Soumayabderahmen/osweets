import { Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { FiltersSidebar, type Section } from "@/components/filters/FiltersSidebar";
import { itemListJsonLd } from "@/lib/seo";

export type CakeItem = {
  slug: string;
  name: string;
  flavor: string;
  size: string;
  price: number;
  image: string;
  diet?: ("sans-gluten" | "vegan")[];
  seasonal?: boolean;
  inStock?: boolean;
  ingredients: string[];
  allergens: string[];
  conservation: string;
  leadTime: string;
  customization?: string[];
};

type ExtraGroup = {
  id: string;
  label: string;
  type: "single" | "multi";
  options: { value: string; label: string }[];
  /** Selector — returns product's value(s) */
  get: (it: CakeItem) => string | string[] | null | undefined;
};

export interface CakeCatalogPageProps {
  title: string;
  subtitle: string;
  heroImage: string;
  items: CakeItem[];
  /** Filter for main saveur/parfum (single-select) */
  flavors: string[];
  /** Filter for taille/format (single-select) */
  sizes: string[];
  /** Human labels for flavor values */
  flavorLabels?: Record<string, string>;
  /** Human labels for size values */
  sizeLabels?: Record<string, string>;
  /** Custom label for flavor filter (default: "Saveur") */
  flavorLabel?: string;
  /** Custom label for size filter (default: "Format") */
  sizeLabel?: string;
  /** Extra filter groups appended between size and allergens */
  extraFilters?: ExtraGroup[];
  freshnessNote?: string;
  seasonalNote?: string;
  crossLink?: { label: string; to: string; params?: Record<string, string> };
  cta?: "add-to-cart" | "quote";
  /** Show a "seasonal availability" filter if any item is seasonal */
  seasonalFilter?: boolean;
  /** Canonical path used to emit an ItemList JSON-LD for this listing. */
  jsonLdPath?: string;
}

const ALL_ALLERGENS = [
  { key: "gluten", label: "gluten" },
  { key: "lait", label: "lait" },
  { key: "oeuf", label: "œufs" },
  { key: "fruits", label: "fruits à coque" },
  { key: "sesame", label: "sésame" },
] as const;

function hasAllergen(it: CakeItem, key: string): boolean {
  return it.allergens.some((a) => a.toLowerCase().includes(key));
}

export function CakeCatalogPage({
  title,
  subtitle,
  heroImage,
  items,
  flavors,
  sizes,
  flavorLabels,
  sizeLabels,
  flavorLabel = "Saveur",
  sizeLabel = "Format",
  extraFilters = [],
  freshnessNote,
  seasonalNote,
  crossLink,
  cta = "add-to-cart",
  seasonalFilter = false,
  jsonLdPath,
}: CakeCatalogPageProps) {
  const priceBounds = useMemo(() => {
    if (!items.length) return { min: 0, max: 0 };
    const prices = items.map((i) => i.price);
    return { min: Math.floor(Math.min(...prices)), max: Math.ceil(Math.max(...prices)) };
  }, [items]);

  const [flavor, setFlavor] = useState<string>("");
  const [size, setSize] = useState<string>("");
  const [diet, setDiet] = useState<string[]>([]);
  const [stockOnly, setStockOnly] = useState(false);
  const [priceMin, setPriceMin] = useState(priceBounds.min);
  const [priceMax, setPriceMax] = useState(priceBounds.max);
  const [excludeAllergens, setExcludeAllergens] = useState<string[]>([]);
  const [seasonalOnly, setSeasonalOnly] = useState(false);
  const [sort, setSort] = useState<"feature" | "asc" | "desc">("feature");
  const [open, setOpen] = useState<string | null>(null);
  const [extras, setExtras] = useState<Record<string, string | string[]>>(() =>
    Object.fromEntries(extraFilters.map((g) => [g.id, g.type === "multi" ? [] : ""])),
  );

  useEffect(() => {
    setPriceMin(priceBounds.min);
    setPriceMax(priceBounds.max);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [priceBounds.min, priceBounds.max]);

  const filtered = useMemo(() => {
    let list = items.filter((it) => {
      if (stockOnly && it.inStock === false) return false;
      if (flavor && it.flavor !== flavor) return false;
      if (size && it.size !== size) return false;
      if (diet.length && !diet.every((d) => (it.diet ?? []).includes(d as "sans-gluten" | "vegan")))
        return false;
      if (it.price < priceMin || it.price > priceMax) return false;
      if (excludeAllergens.some((a) => hasAllergen(it, a))) return false;
      if (seasonalOnly && !it.seasonal) return false;
      for (const g of extraFilters) {
        const v = extras[g.id];
        const val = g.get(it);
        if (g.type === "multi") {
          const sel = (v as string[]) ?? [];
          if (sel.length) {
            const productVals = Array.isArray(val) ? val : val ? [val] : [];
            if (!sel.some((x) => productVals.includes(x))) return false;
          }
        } else {
          const sel = v as string;
          if (sel) {
            const productVals = Array.isArray(val) ? val : val ? [val] : [];
            if (!productVals.includes(sel)) return false;
          }
        }
      }
      return true;
    });
    if (sort === "asc") list.sort((a, b) => a.price - b.price);
    if (sort === "desc") list.sort((a, b) => b.price - a.price);
    return list;
  }, [items, flavor, size, diet, stockOnly, priceMin, priceMax, excludeAllergens, seasonalOnly, sort, extraFilters, extras]);

  const inStockCount = items.filter((i) => i.inStock !== false).length;
  const outStockCount = items.length - inStockCount;
  const anySeasonal = items.some((i) => i.seasonal);

  const hasActive =
    !!flavor ||
    !!size ||
    diet.length > 0 ||
    stockOnly ||
    priceMin > priceBounds.min ||
    priceMax < priceBounds.max ||
    excludeAllergens.length > 0 ||
    seasonalOnly ||
    extraFilters.some((g) => {
      const v = extras[g.id];
      return Array.isArray(v) ? v.length > 0 : !!v;
    });

  const reset = () => {
    setFlavor("");
    setSize("");
    setDiet([]);
    setStockOnly(false);
    setPriceMin(priceBounds.min);
    setPriceMax(priceBounds.max);
    setExcludeAllergens([]);
    setSeasonalOnly(false);
    setSort("feature");
    setExtras(Object.fromEntries(extraFilters.map((g) => [g.id, g.type === "multi" ? [] : ""])));
  };

  const anyDiet = items.some((i) => (i.diet ?? []).length > 0);

  const sections: Section[] = [
    {
      kind: "stock",
      value: stockOnly,
      inStockCount,
      outStockCount,
      onChange: setStockOnly,
    },
    {
      kind: "price",
      bounds: priceBounds,
      min: priceMin,
      max: priceMax,
      onChange: (mn, mx) => {
        setPriceMin(mn);
        setPriceMax(mx);
      },
    },
    {
      kind: "single",
      id: "flavor",
      label: flavorLabel,
      value: flavor,
      onChange: setFlavor,
      options: flavors.map((f) => ({
        value: f,
        label: flavorLabels?.[f] ?? f.replace(/-/g, " "),
        count: items.filter((it) => it.flavor === f).length,
      })),
    },
  ];

  if (sizes.length > 1) {
    sections.push({
      kind: "single",
      id: "size",
      label: sizeLabel,
      value: size,
      onChange: setSize,
      options: sizes.map((s) => ({
        value: s,
        label: sizeLabels?.[s] ?? s,
        count: items.filter((it) => it.size === s).length,
      })),
    });
  }

  // Custom extra filter groups
  for (const g of extraFilters) {
    const options = g.options.map((o) => ({
      value: o.value,
      label: o.label,
      count: items.filter((it) => {
        const val = g.get(it);
        return Array.isArray(val) ? val.includes(o.value) : val === o.value;
      }).length,
    }));
    if (g.type === "multi") {
      sections.push({
        kind: "multi",
        id: g.id,
        label: g.label,
        value: (extras[g.id] as string[]) ?? [],
        onChange: (v) => setExtras((prev) => ({ ...prev, [g.id]: v })),
        options,
      });
    } else {
      sections.push({
        kind: "single",
        id: g.id,
        label: g.label,
        value: (extras[g.id] as string) ?? "",
        onChange: (v) => setExtras((prev) => ({ ...prev, [g.id]: v })),
        options,
      });
    }
  }

  if (seasonalFilter && anySeasonal) {
    sections.push({
      kind: "single",
      id: "seasonal",
      label: "Disponibilité saisonnière",
      value: seasonalOnly ? "seasonal" : "",
      onChange: (v) => setSeasonalOnly(v === "seasonal"),
      options: [
        {
          value: "seasonal",
          label: "En saison uniquement",
          count: items.filter((it) => it.seasonal).length,
        },
      ],
      allLabel: "Tous",
    });
  }

  sections.push({
    kind: "multi",
    id: "allergens",
    label: "Sans allergène",
    value: excludeAllergens,
    onChange: setExcludeAllergens,
    options: ALL_ALLERGENS.map((a) => ({
      value: a.key,
      label: a.label,
      count: items.filter((it) => !hasAllergen(it, a.key)).length,
    })),
    withoutPrefix: true,
  });

  if (anyDiet) {
    sections.push({
      kind: "multi",
      id: "diet",
      label: "Régime alimentaire",
      value: diet,
      onChange: setDiet,
      options: [
        {
          value: "sans-gluten",
          label: "Sans gluten",
          count: items.filter((it) => (it.diet ?? []).includes("sans-gluten")).length,
        },
        {
          value: "vegan",
          label: "Vegan",
          count: items.filter((it) => (it.diet ?? []).includes("vegan")).length,
        },
      ],
    });
  }

  const Grid = (
    <>
      <div className="flex flex-wrap items-center justify-end gap-3 mb-6">
        <label className="flex items-center gap-2 text-sm">
          <span className="text-xs uppercase tracking-[0.16em] text-charbon/60">Trier par :</span>
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value as typeof sort)}
            className="border border-border bg-white px-3 py-2 text-sm min-w-[140px]"
          >
            <option value="feature">En vedette</option>
            <option value="asc">Prix croissant</option>
            <option value="desc">Prix décroissant</option>
          </select>
        </label>
      </div>

      {filtered.length === 0 ? (
        <p className="text-center text-charbon/60 py-12">
          Aucun produit ne correspond à ces filtres.{" "}
          <button onClick={reset} className="text-gold underline underline-offset-2 ml-1">
            Réinitialiser
          </button>
        </p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {filtered.map((it) => (
            <article
              key={it.slug}
              className="group bg-white border border-border hover:border-gold/50 transition"
            >
              <div className="aspect-[4/5] overflow-hidden bg-beige">
                <img
                  src={it.image}
                  alt={it.name}
                  loading="lazy"
                  className="h-full w-full object-cover transition duration-[900ms] group-hover:scale-105"
                />
              </div>
              <div className="p-5">
                <div className="flex items-center justify-between text-[10px] uppercase tracking-[0.22em] text-charbon/55">
                  <span>{flavorLabels?.[it.flavor] ?? it.flavor}</span>
                  <span>{sizeLabels?.[it.size] ?? it.size}</span>
                </div>
                <h3 className="font-display text-xl mt-2 leading-tight">{it.name}</h3>
                <div className="mt-3 flex items-center justify-between">
                  <span className="font-price text-gold text-lg">{it.price}€</span>
                  <button
                    onClick={() => setOpen(open === it.slug ? null : it.slug)}
                    className="text-xs uppercase tracking-wider text-charbon/70 hover:text-gold"
                  >
                    {open === it.slug ? "Fermer" : "Détails"}
                  </button>
                </div>

                {open === it.slug && (
                  <div className="mt-5 space-y-3 text-sm text-charbon/75 border-t border-border pt-4">
                    <div>
                      <strong className="text-charbon">Ingrédients :</strong>{" "}
                      {it.ingredients.join(", ")}.
                    </div>
                    <div>
                      <strong className="text-charbon">Allergènes :</strong>{" "}
                      {it.allergens.join(", ") || "—"}.
                    </div>
                    <div>
                      <strong className="text-charbon">Conservation :</strong> {it.conservation}
                    </div>
                    <div>
                      <strong className="text-charbon">Délai :</strong> {it.leadTime}
                    </div>
                    {it.customization && it.customization.length > 0 && (
                      <div>
                        <strong className="text-charbon">Personnalisation :</strong>
                        <ul className="mt-1 list-disc list-inside">
                          {it.customization.map((c) => (
                            <li key={c}>{c}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                )}

                <div className="mt-5">
                  {cta === "quote" ? (
                    <Link
                      to="/evenements/mariage"
                      className="btn btn-outline-gold w-full justify-center text-xs"
                    >
                      Demander un devis
                    </Link>
                  ) : it.seasonal ? (
                    <button className="btn btn-outline-gold w-full justify-center text-xs">
                      Être prévenu(e) du retour
                    </button>
                  ) : (
                    <a
                      href={`https://wa.me/33699466030?text=${encodeURIComponent(`Bonjour, je souhaite commander : ${it.name} (${it.size})`)}`}
                      target="_blank"
                      rel="noreferrer"
                      className="btn btn-gold w-full justify-center text-xs"
                    >
                      Commander
                    </a>
                  )}
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </>
  );

  const listLd = jsonLdPath
    ? itemListJsonLd({
        name: title,
        path: jsonLdPath,
        items: items.map((it) => ({
          slug: it.slug,
          name: it.name,
          image: it.image,
          price: it.price,
          inStock: it.inStock,
          seasonalOnly: it.seasonal,
          shortDesc: `${it.flavor} — ${it.size}`,
        })),
      })
    : null;

  return (
    <div className="bg-ivory">
      {listLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(listLd) }}
        />
      )}
      {/* Hero */}
      <section className="relative h-[46vh] min-h-[360px] overflow-hidden">
        <img src={heroImage} alt={title} className="absolute inset-0 h-full w-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-b from-black/25 to-black/70" />
        <div className="relative z-10 h-full flex flex-col items-center justify-center text-center text-white px-6">
          <div className="text-[10px] tracking-[0.35em] uppercase text-gold">Nos gâteaux</div>
          <h1 className="font-display text-5xl md:text-6xl mt-4">{title}</h1>
          <span className="mt-5 inline-block h-px w-16 bg-gold" />
          <p className="mt-5 max-w-xl text-white/90 font-light">{subtitle}</p>
        </div>
      </section>

      {seasonalNote && (
        <div className="bg-gold/10 border-y border-gold/30 text-center py-3 text-sm text-charbon/80">
          <span className="text-gold uppercase tracking-[0.25em] text-[10px] mr-2">Saisonnier</span>
          {seasonalNote}
        </div>
      )}

      <section className="container-os section-y">
        <FiltersSidebar
          sections={sections}
          hasActive={hasActive}
          onReset={reset}
          totalCount={filtered.length}
        >
          {Grid}
        </FiltersSidebar>
      </section>

      {freshnessNote && (
        <section className="bg-sable">
          <div className="container-os py-10 text-center text-sm text-charbon/75">
            <span className="text-[10px] uppercase tracking-[0.3em] text-gold block mb-2">
              Conservation
            </span>
            {freshnessNote}
          </div>
        </section>
      )}

      {crossLink && (
        <section className="container-os section-y">
          <Link
            to={crossLink.to as string}
            params={crossLink.params as never}
            className="group relative block overflow-hidden bg-charbon text-white text-center py-14 px-8"
          >
            <div className="text-[10px] tracking-[0.35em] uppercase text-gold">
              Aussi pour vos événements
            </div>
            <div className="font-display text-3xl mt-3 text-white">{crossLink.label}</div>
            <span className="mt-4 inline-block text-xs tracking-[0.25em] uppercase text-gold border-b border-gold/60 pb-0.5">
              Découvrir →
            </span>
          </Link>
        </section>
      )}
    </div>
  );
}
