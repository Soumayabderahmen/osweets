import { useState, type ReactNode } from "react";
import { SlidersHorizontal, Filter } from "lucide-react";
import { Slider } from "@/components/ui/slider";
import { Sheet, SheetContent, SheetTrigger, SheetHeader, SheetTitle } from "@/components/ui/sheet";

export type FilterOption = { value: string; label: string; count: number };

export type Section =
  | {
      kind: "stock";
      value: boolean;
      onChange: (v: boolean) => void;
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
  /** Content rendered next to sidebar (the products grid). */
  children: ReactNode;
}

function SidebarBody({
  sections,
  hasActive,
  onReset,
  totalCount,
}: Omit<FiltersSidebarProps, "children">) {
  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h2 className="flex items-center gap-2 text-[11px] font-medium uppercase tracking-[0.22em] text-charbon">
          <SlidersHorizontal className="h-3.5 w-3.5 text-gold" />
          Filtrer
        </h2>
        {hasActive && (
          <button onClick={onReset} className="text-[11px] text-gold transition hover:opacity-60">
            Réinitialiser
          </button>
        )}
      </div>
      <div className="text-[11px] uppercase tracking-[0.18em] text-charbon-soft">
        {totalCount} produit{totalCount > 1 ? "s" : ""}
      </div>

      {sections.map((s, i) => (
        <div key={i} className="border-t border-beige pt-7">
          <SectionView section={s} />
        </div>
      ))}
    </div>
  );
}

function SectionView({ section }: { section: Section }) {
  if (section.kind === "stock") {
    return (
      <div>
        <h3 className="text-[11px] tracking-[0.2em] uppercase text-charbon font-medium mb-4">
          {section.label ?? "Disponibilité"}
        </h3>
        <div className="space-y-2.5">
          <label className="flex items-center justify-between gap-2 text-sm cursor-pointer group">
            <span className="flex items-center gap-2.5">
              <input
                type="checkbox"
                checked={section.value}
                onChange={(e) => section.onChange(e.target.checked)}
                className="accent-gold h-4 w-4 border-border"
              />
              En stock
            </span>
            <span className="text-xs text-charbon/50 group-hover:text-charbon/70">
              ({section.inStockCount})
            </span>
          </label>
          <div className="flex items-center justify-between gap-2 text-sm text-charbon/50">
            <span className="flex items-center gap-2.5">
              <span className="h-4 w-4 inline-block" />
              En rupture de stock
            </span>
            <span className="text-xs">({section.outStockCount})</span>
          </div>
        </div>
      </div>
    );
  }

  if (section.kind === "price") {
    const single = section.bounds.max <= section.bounds.min;
    const safeMin = Number.isFinite(section.bounds.min) ? section.bounds.min : 0;
    const safeMax = Number.isFinite(section.bounds.max) ? section.bounds.max : safeMin;
    const sliderMax = single ? safeMin + 1 : safeMax;
    return (
      <div>
        <h3 className="text-[11px] tracking-[0.2em] uppercase text-charbon font-medium mb-3">
          {section.label ?? "Prix"}
        </h3>
        <p className="text-xs text-charbon/60 mb-4">
          {single ? `Prix : ${safeMin} €` : `Le prix le plus élevé est ${safeMax} €`}
        </p>
        <div className="px-1 mb-5">
          <Slider
            value={[single ? safeMin : section.max]}
            min={safeMin}
            max={sliderMax}
            step={1}
            disabled={single}
            onValueChange={(v) => section.onChange(section.min, v[0] ?? safeMax)}
          />
        </div>
        <div className="flex items-center gap-3">
          <div className="flex-1">
            <label className="text-[10px] text-charbon/50 uppercase tracking-wider">De</label>
            <input
              type="number"
              min={safeMin}
              max={safeMax}
              value={section.min}
              disabled={single}
              onChange={(e) => {
                const v = Number(e.target.value);
                section.onChange(v, Math.max(v, section.max));
              }}
              className="mt-1 w-full rounded-xl border border-beige bg-white px-3 py-2 text-sm outline-none focus:border-gold disabled:opacity-70"
            />
          </div>
          <span className="pt-5 text-charbon/40">—</span>
          <div className="flex-1">
            <label className="text-[10px] text-charbon/50 uppercase tracking-wider">à</label>
            <input
              type="number"
              min={safeMin}
              max={safeMax}
              value={section.max}
              disabled={single}
              onChange={(e) => {
                const v = Number(e.target.value);
                section.onChange(Math.min(v, section.min), v);
              }}
              className="mt-1 w-full rounded-xl border border-beige bg-white px-3 py-2 text-sm outline-none focus:border-gold disabled:opacity-70"
            />
          </div>
        </div>
      </div>
    );
  }

  if (section.kind === "single") {
    if (section.options.length === 0) return null;
    return (
      <div>
        <h3 className="text-[11px] tracking-[0.2em] uppercase text-charbon font-medium mb-4">
          {section.label}
        </h3>
        <ul className="space-y-2">
          <li>
            <label className="flex items-center justify-between text-sm cursor-pointer group">
              <span className="flex items-center gap-2.5">
                <input
                  type="radio"
                  name={section.id}
                  checked={section.value === ""}
                  onChange={() => section.onChange("")}
                  className="accent-gold h-4 w-4"
                />
                <span className="text-charbon/80 group-hover:text-charbon">
                  {section.allLabel ?? "Tous"}
                </span>
              </span>
            </label>
          </li>
          {section.options.map((o) => (
            <li key={o.value}>
              <label className="flex items-center justify-between text-sm cursor-pointer group">
                <span className="flex items-center gap-2.5">
                  <input
                    type="radio"
                    name={section.id}
                    checked={section.value === o.value}
                    onChange={() => section.onChange(o.value)}
                    className="accent-gold h-4 w-4"
                  />
                  <span className="text-charbon/80 group-hover:text-charbon capitalize">
                    {o.label}
                  </span>
                </span>
                <span className="text-xs text-charbon/50">({o.count})</span>
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
      <h3 className="text-[11px] tracking-[0.2em] uppercase text-charbon font-medium mb-4">
        {section.label}
      </h3>
      <ul className="space-y-2.5">
        {section.options.map((o) => {
          const checked = section.value.includes(o.value);
          return (
            <li key={o.value}>
              <label className="flex items-center justify-between text-sm cursor-pointer group">
                <span className="flex items-center gap-2.5">
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() =>
                      section.onChange(
                        checked
                          ? section.value.filter((x) => x !== o.value)
                          : [...section.value, o.value],
                      )
                    }
                    className="accent-gold h-4 w-4"
                  />
                  <span className="text-charbon/70 group-hover:text-charbon transition">
                    {section.withoutPrefix ? `Sans ${o.label.toLowerCase()}` : o.label}
                  </span>
                </span>
                <span className="text-xs text-charbon/50">({o.count})</span>
              </label>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

export function FiltersSidebar({
  sections,
  hasActive,
  onReset,
  totalCount,
  children,
}: FiltersSidebarProps) {
  const [open, setOpen] = useState(false);

  return (
    <div className="grid gap-6 lg:grid-cols-[260px_1fr] lg:gap-14">
      {/* Desktop sidebar */}
      <aside className="hidden self-start lg:sticky lg:top-32 lg:block">
        <SidebarBody
          sections={sections}
          hasActive={hasActive}
          onReset={onReset}
          totalCount={totalCount}
        />
      </aside>

      {/* Mobile trigger */}
      <div className="lg:hidden flex items-center justify-between gap-3 -mb-2">
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild>
            <button className="inline-flex items-center gap-2 rounded-full border border-beige bg-white px-4 py-2 text-xs uppercase tracking-[0.18em] text-charbon transition hover:border-gold hover:text-gold">
              <Filter className="h-4 w-4" /> Filtrer
              {hasActive && <span className="ml-1 inline-block h-2 w-2 rounded-full bg-gold" />}
            </button>
          </SheetTrigger>
          <SheetContent side="left" className="w-[320px] sm:w-[380px] overflow-y-auto">
            <SheetHeader>
              <SheetTitle className="tracking-[0.16em] uppercase text-sm">Filtres</SheetTitle>
            </SheetHeader>
            <div className="mt-6">
              <SidebarBody
                sections={sections}
                hasActive={hasActive}
                onReset={onReset}
                totalCount={totalCount}
              />
            </div>
          </SheetContent>
        </Sheet>
        <span className="text-xs text-charbon/60">
          {totalCount} produit{totalCount > 1 ? "s" : ""}
        </span>
      </div>

      <div className="min-w-0">{children}</div>
    </div>
  );
}
