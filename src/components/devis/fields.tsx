import type React from "react";

export const inputCls =
  "w-full bg-white border border-border px-4 py-3 text-sm focus:outline-none focus:border-gold";

export function Field({
  label,
  children,
  full,
}: {
  label: string;
  children: React.ReactNode;
  full?: boolean;
}) {
  return (
    <label className={`block ${full ? "sm:col-span-2" : ""}`}>
      <span className="block text-[11px] uppercase tracking-[0.2em] text-charbon/60 mb-2">{label}</span>
      {children}
    </label>
  );
}

export function ChipGroup({
  label,
  options,
  selected,
  onToggle,
}: {
  label: string;
  options: string[];
  selected: string[];
  onToggle: (v: string) => void;
}) {
  return (
    <div className="mt-6">
      <span className="block text-[11px] uppercase tracking-[0.2em] text-charbon/60 mb-2">{label}</span>
      <div className="flex flex-wrap gap-2">
        {options.map((o) => (
          <button
            key={o}
            type="button"
            aria-pressed={selected.includes(o)}
            onClick={() => onToggle(o)}
            className={`px-3 py-2 text-sm border transition ${
              selected.includes(o) ? "border-gold bg-beige" : "border-border bg-white hover:border-gold/50"
            }`}
          >
            {o}
          </button>
        ))}
      </div>
    </div>
  );
}

export function toggleIn(list: string[], v: string) {
  return list.includes(v) ? list.filter((x) => x !== v) : [...list, v];
}

export const FULFILLMENT = ["Livraison", "Retrait sur rendez-vous", "Je ne sais pas encore"];

export const BUDGETS = [
  "Moins de 300 €",
  "300 – 600 €",
  "600 – 1 000 €",
  "1 000 – 2 500 €",
  "Plus de 2 500 €",
  "Je souhaite être conseillé(e)",
];

export function waHref(lines: (string | false | undefined)[]) {
  return `https://wa.me/33699466030?text=${encodeURIComponent(lines.filter(Boolean).join("\n"))}`;
}

export function QuoteNotice() {
  return (
    <p className="text-xs text-charbon/60 mt-3 text-center">
      Il s'agit d'une <strong>demande de devis</strong>, et non d'une commande payée immédiatement. Nous revenons
      vers vous sous 48h avec une proposition détaillée.
    </p>
  );
}
