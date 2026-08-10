import { useMemo, useState } from "react";

export type Tier = {
  maxGuests: number | null; // null = 100+
  label: string;
  parts: string;
  priceRange: string;
  quote?: boolean; // sur devis uniquement
};

export const WEDDING_TIERS: Tier[] = [
  { maxGuests: 20, label: "Petit wedding cake · 1 étage", parts: "~20 parts", priceRange: "à partir de 180 €" },
  { maxGuests: 40, label: "Wedding cake moyen · 2 étages", parts: "~40 parts", priceRange: "à partir de 340 €" },
  { maxGuests: 60, label: "Grand wedding cake · 3 étages", parts: "~60 parts", priceRange: "à partir de 520 €" },
  { maxGuests: 100, label: "Wedding cake XL · 4 étages", parts: "~100 parts", priceRange: "à partir de 880 €" },
  { maxGuests: null, label: "Wedding cake royal · 5 étages et +", parts: "100 parts et +", priceRange: "sur devis personnalisé", quote: true },
];

export function pickTier(guests: number, tiers: Tier[] = WEDDING_TIERS): Tier {
  for (const t of tiers) {
    if (t.maxGuests === null) return t;
    if (guests <= t.maxGuests) return t;
  }
  return tiers[tiers.length - 1];
}

export function QuantityCalculator({
  tiers = WEDDING_TIERS,
  initialGuests = 50,
  onUseForQuote,
}: {
  tiers?: Tier[];
  initialGuests?: number;
  onUseForQuote?: (guests: number, size: string) => void;
}) {
  const [guests, setGuests] = useState(initialGuests);
  const tier = useMemo(() => pickTier(guests, tiers), [guests, tiers]);

  return (
    <div className="bg-white border border-border p-6 space-y-5">
      <div>
        <label className="flex items-center justify-between mb-2">
          <span className="text-[10px] uppercase tracking-[0.25em] text-charbon/60">Nombre d'invités</span>
          <span className="font-display text-2xl text-gold">{guests}</span>
        </label>
        <input
          type="range"
          min={10}
          max={200}
          step={5}
          value={Math.min(guests, 200)}
          onChange={(e) => setGuests(+e.target.value)}
          className="w-full accent-[var(--gold)]"
        />
        <div className="flex items-center gap-2 mt-2">
          <input
            type="number"
            min={1}
            value={guests}
            onChange={(e) => setGuests(Math.max(1, +e.target.value || 0))}
            className="w-28 border border-border px-3 py-2 text-sm"
          />
          <span className="text-xs text-charbon/55">invités</span>
        </div>
      </div>

      <div className="border-t border-border pt-5 space-y-3">
        <div className="text-[10px] uppercase tracking-[0.25em] text-gold">Notre recommandation</div>
        <div className="font-display text-xl leading-snug">{tier.label}</div>
        <div className="flex flex-wrap gap-x-6 gap-y-1 text-sm text-charbon/70">
          <span>{tier.parts}</span>
          <span className="text-gold">·</span>
          <span>{tier.priceRange}</span>
        </div>
        <div className="bg-beige border-l-2 border-gold px-4 py-3 text-sm">
          Pour <strong>{guests}</strong> invités : <em className="italic">{tier.label}</em>, {tier.parts}.
        </div>
      </div>

      {onUseForQuote && (
        <button
          type="button"
          onClick={() => onUseForQuote(guests, tier.label)}
          className="btn btn-outline-gold w-full justify-center"
        >
          {tier.quote ? "Utiliser pour mon devis personnalisé" : "Utiliser ce résultat pour mon devis"}
        </button>
      )}
    </div>
  );
}
