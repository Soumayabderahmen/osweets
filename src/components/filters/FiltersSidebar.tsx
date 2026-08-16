import { useState, type ReactNode } from "react";
import { SlidersHorizontal, X } from "lucide-react";

export type FilterOption = { value: string; label: string; count: number };

/** Disponibilité : « in » = en stock, « out » = épuisé. Tableau vide = tous. */
export type StockFilter = "in" | "out";

export type Section =
  | {
      kind: "stock";
      value: StockFilter[];
      onChange: (v: StockFilter[]) => void;
      inStockCount: number;
      outStockCount: number;
      label?: string;
    }
  | {
      kind: "price";
      bounds: { min: number; max: number };
      min: number;
      max: number;
      onChange: (min: number, max: number) => void;
      label?: string;
    }
  | {
      kind: "single";
      id: string;
      label: string;
      value: string;
      onChange: (v: string) => void;
      options: FilterOption[];
      allLabel?: string;
    }
  | {
      kind: "multi";
      id: string;
      label: string;
      value: string[];
      onChange: (v: string[]) => void;
      options: FilterOption[];
      /** prefix each option label with "Sans " */
      withoutPrefix?: boolean;
    };

export interface FiltersSidebarProps {
  sections: Section[];
  hasActive: boolean;
  onReset: () => void;
  totalCount: number;
  /** Largeur de la colonne de filtres sur ordinateur (px). */
  width?: number;
  /** Content rendered next to sidebar (the products grid). */
  children: ReactNode;
}

/** Titre de groupe — 10px majuscules gris, référence base44. */
function GroupTitle({ children }: { children: ReactNode }) {
  return (
    <h3 className="mb-3 text-[10px] uppercase tracking-[0.18em] text-charbon-soft">{children}</h3>
  );
}

/** Ligne d'option : case à cocher or, libellé, compteur gris à la suite. */
function OptionRow({
  checked,
  onChange,
  label,
  count,
  disabled,
}: {
  checked: boolean;
  onChange: () => void;
  label: string;
  count: number;
  disabled?: boolean;
}) {
  return (
    <li>
      <label
        className={`flex items-center gap-2.5 text-sm text-charbon ${
          disabled ? "cursor-default opacity-60" : "cursor-pointer"
        }`}
      >
        <input
          type="checkbox"
          checked={checked}
          disabled={disabled}
          onChange={onChange}
          className="h-4 w-4 rounded accent-gold"
        />
        {label} <span className="text-charbon-soft">({count})</span>
      </label>
    </li>
  );
}

function SectionView({ section }: { section: Section }) {
  if (section.kind === "stock") {
    // Une option dont le compteur vaut (0) est masquée, jamais grisée.
    if (section.inStockCount === 0 && section.outStockCount === 0) return null;
    const toggle = (v: StockFilter) =>
      section.onChange(
        section.value.includes(v) ? section.value.filter((x) => x !== v) : [...section.value, v],
      );
    return (
      <div>
        <GroupTitle>{section.label ?? "Disponibilité"}</GroupTitle>
        <ul className="space-y-2.5">
          {section.inStockCount > 0 && (
            <OptionRow
              checked={section.value.includes("in")}
              onChange={() => toggle("in")}
              label="En stock"
              count={section.inStockCount}
            />
          )}
          {section.outStockCount > 0 && (
            <OptionRow
              checked={section.value.includes("out")}
              onChange={() => toggle("out")}
              label="Épuisé"
              count={section.outStockCount}
            />
          )}
        </ul>
      </div>
    );
  }

  if (section.kind === "price") {
    const single = section.bounds.max <= section.bounds.min;
    const safeMin = Number.isFinite(section.bounds.min) ? section.bounds.min : 0;
    const safeMax = Number.isFinite(section.bounds.max) ? section.bounds.max : safeMin;
    return (
      <div>
        <GroupTitle>{section.label ?? "Prix"}</GroupTitle>
        <div className="flex items-center gap-2">
          <input
            type="number"
            aria-label="Prix minimum"
            min={safeMin}
            max={safeMax}
            value={section.min}
            disabled={single}
            onChange={(e) => {
              const v = Number(e.target.value);
              section.onChange(v, Math.max(v, section.max));
            }}
            className="h-9 w-full rounded-lg border border-beige bg-white px-3 text-sm outline-none focus:border-gold disabled:opacity-70"
          />
          <span className="text-xs text-charbon-soft">—</span>
          <input
            type="number"
            aria-label="Prix maximum"
            min={safeMin}
            max={safeMax}
            value={section.max}
            disabled={single}
            onChange={(e) => {
              const v = Number(e.target.value);
              section.onChange(Math.min(v, section.min), v);
            }}
            className="h-9 w-full rounded-lg border border-beige bg-white px-3 text-sm outline-none focus:border-gold disabled:opacity-70"
          />
        </div>
        <p className="mt-2 text-xs text-charbon-soft">
          {single ? `Prix : ${safeMin} €` : `Le prix le plus élevé est ${safeMax} €`}
        </p>
      </div>
    );
  }

  if (section.kind === "single") {
    if (section.options.length === 0) return null;
    return (
      <div>
        <GroupTitle>{section.label}</GroupTitle>
        <ul className="space-y-2.5">
          <li>
            <label className="flex cursor-pointer items-center gap-2.5 text-sm text-charbon">
              <input
                type="radio"
                name={section.id}
                checked={section.value === ""}
                onChange={() => section.onChange("")}
                className="h-4 w-4 accent-gold"
              />
              {section.allLabel ?? "Tous"}
            </label>
          </li>
          {section.options.map((o) => (
            <li key={o.value}>
              <label className="flex cursor-pointer items-center gap-2.5 text-sm text-charbon">
                <input
                  type="radio"
                  name={section.id}
                  checked={section.value === o.value}
                  onChange={() => section.onChange(o.value)}
                  className="h-4 w-4 accent-gold"
                />
                {o.label} <span className="text-charbon-soft">({o.count})</span>
              </label>
            </li>
          ))}
        </ul>
      </div>
    );
  }

  // multi
  if (section.options.length === 0) return null;
  return (
    <div>
      <GroupTitle>{section.label}</GroupTitle>
      <ul className="space-y-2.5">
        {section.options.map((o) => {
          const checked = section.value.includes(o.value);
          return (
            <OptionRow
              key={o.value}
              checked={checked}
              onChange={() =>
                section.onChange(
                  checked
                    ? section.value.filter((x) => x !== o.value)
                    : [...section.value, o.value],
                )
              }
              label={section.withoutPrefix ? `Sans ${o.label.toLowerCase()}` : o.label}
              count={o.count}
            />
          );
        })}
      </ul>
    </div>
  );
}

function SidebarBody({
  sections,
  onReset,
  totalCount,
}: Pick<FiltersSidebarProps, "sections" | "onReset" | "totalCount">) {
  return (
    <div>
      <div className="mb-6 flex items-center justify-between border-b border-beige pb-4">
        <h2 className="text-xs uppercase tracking-[0.2em] text-charbon">
          Filtrer <span className="text-charbon-soft">({totalCount})</span>
        </h2>
        <button onClick={onReset} className="text-xs text-gold hover:underline">
          Réinitialiser
        </button>
      </div>

      <div className="space-y-7">
        {sections.map((s, i) => (
          <SectionView key={i} section={s} />
        ))}
      </div>

      <div className="mt-7 border-t border-beige pt-5">
        <p className="text-xs text-charbon-soft">
          {totalCount} produit{totalCount > 1 ? "s" : ""}
        </p>
      </div>
    </div>
  );
}

export function FiltersSidebar({
  sections,
  onReset,
  totalCount,
  width = 216,
  children,
}: FiltersSidebarProps) {
  const [open, setOpen] = useState(false);

  return (
    <div className="flex flex-col gap-10 lg:flex-row">
      {/* Colonne de filtres — ordinateur */}
      <aside className="hidden shrink-0 self-start lg:sticky lg:top-32 lg:block" style={{ width }}>
        <SidebarBody sections={sections} onReset={onReset} totalCount={totalCount} />
      </aside>

      {/* Déclencheur mobile */}
      <button
        onClick={() => setOpen(true)}
        className="inline-flex h-11 items-center gap-2 self-start rounded-full border border-beige px-5 text-xs uppercase tracking-[0.15em] text-charbon lg:hidden"
      >
        <SlidersHorizontal className="h-4 w-4" /> Filtrer
      </button>

      <div className="min-w-0 flex-1">{children}</div>

      {/* Tiroir de filtres — mobile */}
      {open && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            type="button"
            aria-label="Fermer les filtres"
            onClick={() => setOpen(false)}
            className="absolute inset-0 animate-fade-in bg-charbon/40 backdrop-blur-sm"
          />
          <aside className="absolute right-0 top-0 flex h-full w-80 max-w-[85vw] animate-fade-in flex-col bg-ivory shadow-xl">
            <div className="flex h-16 items-center justify-between border-b border-beige px-5">
              <span className="font-display text-lg">Filtrer</span>
              <button onClick={() => setOpen(false)} aria-label="Fermer">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="overflow-auto p-5">
              <SidebarBody sections={sections} onReset={onReset} totalCount={totalCount} />
            </div>
            <div className="border-t border-beige p-5">
              <button
                onClick={() => setOpen(false)}
                className="h-12 w-full rounded-full bg-charbon text-xs uppercase tracking-[0.2em] text-ivory"
              >
                Voir {totalCount} produit{totalCount > 1 ? "s" : ""}
              </button>
            </div>
          </aside>
        </div>
      )}
    </div>
  );
}
