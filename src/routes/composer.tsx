import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Check, Plus, Minus, ShoppingBag } from "lucide-react";
import { zodValidator, fallback } from "@tanstack/zod-adapter";
import { z } from "zod";
import { products } from "@/data/products";
import { formatPrice, useShop } from "@/lib/shop-store";
import composerHero from "@/assets/composer-hero.jpg";

const sizes = [6, 12, 18, 24, 36, 48] as const;
const coffretNames: Record<number, string> = {
  6: "Coffret Dégustation",
  12: "Coffret Découverte",
  18: "Coffret Partage",
  24: "Coffret Prestige",
  36: "Coffret Réception",
  48: "Coffret Royal",
};

const searchSchema = z.object({
  size: fallback(z.enum(["6", "12", "18", "24", "36", "48"]), "12").default("12"),
});

export const Route = createFileRoute("/composer")({
  validateSearch: zodValidator(searchSchema),
  head: () => ({
    meta: [
      { title: "Composez votre coffret — Ö' Sweets" },
      { name: "description", content: "Composez votre coffret sur mesure : 6, 12, 18, 24, 36 ou 48 pièces de pâtisseries tunisiennes artisanales." },
    ],
  }),
  component: Page,
});

function Page() {
  const { size: sizeParam } = Route.useSearch();
  const [size, setSize] = useState<number | null>(null);

  
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [picks, setPicks] = useState<Record<string, number>>({});
  const { addToCart } = useShop();

  const sel = products.filter((p) => ["traditionnelle", "orientale", "fekia", "petits-fours"].includes(p.category));
  const totalPieces = useMemo(() => Object.values(picks).reduce((a, b) => a + b, 0), [picks]);
  const unitPrice = 3.5;
  const effSize = size ?? 0;
  const total = effSize * unitPrice + (effSize >= 36 ? 15 : effSize >= 24 ? 8 : effSize >= 18 ? 5 : 0);
  const complete = size !== null && totalPieces === size;

  const stepLabels = ["Format", "Pâtisseries", "Récapitulatif"];

  const add = (slug: string) => setPicks((p) => totalPieces < effSize ? { ...p, [slug]: (p[slug] ?? 0) + 1 } : p);
  const remove = (slug: string) => setPicks((p) => ({ ...p, [slug]: Math.max(0, (p[slug] ?? 0) - 1) }));

  return (
    <div className="bg-ivory">
      {/* Hero immersive */}
      <section className="relative h-[55vh] min-h-[420px] overflow-hidden">
        <img src={composerHero} alt="Coffret" className="absolute inset-0 h-full w-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-b from-black/40 to-black/70" />
        <div className="relative z-10 h-full flex flex-col items-center justify-center text-center px-6">
          <div className="text-[10px] tracking-[0.35em] uppercase text-gold font-medium">L'expérience signature</div>
          <h1 className="font-display text-5xl md:text-7xl mt-5 text-white" style={{ textShadow: "0 2px 30px rgba(0,0,0,0.5)" }}>
            Votre Coffret
          </h1>
          <span className="mt-5 h-px w-16 bg-gold inline-block" />
          <p className="mt-5 max-w-xl text-white/90 font-light">
            Choisissez le format, garnissez à votre image, offrez l'exception.
          </p>
        </div>
      </section>

      {/* Elegant step indicator */}
      <section className="container-os pt-14 pb-6">
        <div className="flex justify-center items-center gap-2 md:gap-8 flex-wrap">
          {stepLabels.map((label, i) => {
            const s = (i + 1) as 1 | 2 | 3;
            const active = step === s;
            const done = step > s;
            return (
              <button key={label} onClick={() => setStep(s)} className="flex items-center gap-3 group">
                <span className={`h-10 w-10 grid place-items-center rounded-full font-display text-base transition border ${active ? "bg-gold text-white border-gold" : done ? "bg-beige text-gold border-gold" : "border-charbon/15 text-charbon/40"}`}>
                  {done ? <Check className="h-4 w-4" /> : i + 1}
                </span>
                <span className={`hidden md:inline text-[11px] tracking-[0.25em] uppercase transition ${active ? "text-gold" : done ? "text-charbon" : "text-charbon/40"}`}>
                  {label}
                </span>
                {i < 2 && <span className="hidden md:inline-block w-12 h-px bg-charbon/15" />}
              </button>
            );
          })}
        </div>
      </section>

      <section className="container-os pb-24">
        {/* STEP 1 */}
        {step === 1 && (
          <div>
            <div className="text-center mb-12">
              <h2 className="font-display text-3xl md:text-4xl">Quel format vous inspire ?</h2>
              <p className="mt-3 text-charbon/60 font-light">Plus le coffret est grand, plus l'expérience est généreuse.</p>
              {size ? (
                <div className="mt-6 inline-flex flex-col items-center gap-2 px-8 py-5 border border-gold/40 bg-white">
                  <div className="flex items-center gap-3">
                    <Check className="h-4 w-4 text-gold" />
                    <span className="text-[11px] tracking-[0.25em] uppercase text-charbon/70">Format sélectionné</span>
                  </div>
                  <div className="font-display text-2xl text-gold">{coffretNames[size]}</div>
                  <div className="flex items-center gap-3 text-sm">
                    <span className="text-charbon/70">{size} pièces</span>
                    <span className="text-charbon/30">·</span>
                    <span className="font-price text-lg">{total.toFixed(0)}€ estimé</span>
                  </div>
                </div>
              ) : (
                <div className="mt-6 inline-block text-[11px] tracking-[0.25em] uppercase text-charbon/50 border border-dashed border-charbon/20 px-5 py-2.5">
                  Aucun format sélectionné
                </div>
              )}
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-5 max-w-6xl mx-auto">
              {sizes.map((s) => {
                const active = size === s;
                const price = s * unitPrice + (s >= 36 ? 15 : s >= 24 ? 8 : s >= 18 ? 5 : 0);
                return (
                  <button key={s} onClick={() => { setSize(s); setPicks({}); }}
                    className={`group relative aspect-[3/4] overflow-hidden transition ${active ? "ring-2 ring-gold" : "ring-1 ring-border hover:ring-gold/50"}`}>
                    <img src={composerHero} alt="" className="absolute inset-0 h-full w-full object-cover transition duration-700 group-hover:scale-105" />
                    <div className="absolute inset-0 bg-gradient-to-b from-black/30 to-black/80" />
                    <div className="relative z-10 h-full flex flex-col justify-end p-6 text-white text-left">
                      <div className="font-display text-5xl leading-none">{s}</div>
                      <div className="text-[10px] tracking-[0.3em] uppercase text-gold mt-2">pièces</div>
                      <div className="font-price text-2xl mt-3">{price.toFixed(0)}€</div>
                    </div>
                    {active && <div className="absolute top-4 right-4 h-8 w-8 rounded-full bg-gold grid place-items-center"><Check className="h-4 w-4 text-white" /></div>}
                  </button>
                );
              })}
            </div>
            <div className="text-center mt-12">
              <button onClick={() => size && setStep(2)} disabled={!size} className="btn btn-gold disabled:opacity-40 disabled:cursor-not-allowed">
                {size ? `Continuer avec ${size} pièces →` : "Sélectionnez un format"}
              </button>
              {!size && <p className="text-xs text-charbon/60 mt-3 italic">Choisissez d'abord un format ci-dessus.</p>}
            </div>
          </div>
        )}

        {/* STEP 2 */}
        {step === 2 && (
          <div>
            {/* Elegant counter */}
            <div className="sticky top-32 z-10 bg-ivory/95 backdrop-blur py-5 mb-10 border-b border-gold/30">
              <div className="flex flex-col md:flex-row items-center justify-between gap-3">
                <div>
                  <div className="text-[10px] tracking-[0.3em] uppercase text-gold">{size ? coffretNames[size] : "Votre sélection"}</div>
                  <div className="font-display text-2xl mt-1">
                    {totalPieces} <span className="text-charbon/40">/ {effSize}</span> <span className="text-sm font-body text-charbon/60">pièces</span>
                  </div>
                </div>
                <div className="font-price text-3xl text-gold">{formatPrice(total)}</div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
              {sel.map((p) => {
                const qty = picks[p.slug] ?? 0;
                const canAdd = totalPieces < effSize;
                return (
                  <div
                    key={p.slug}
                    className={`group relative bg-ivory p-3 transition ${qty > 0 ? "shadow-[0_18px_50px_-20px_rgba(168,145,82,0.35)]" : ""}`}
                  >
                    {/* Ornate frame */}
                    <div aria-hidden className={`pointer-events-none absolute inset-1.5 rounded-[6px] border ${qty > 0 ? "border-gold" : "border-gold/40"}`} />
                    <div aria-hidden className="pointer-events-none absolute inset-[10px] rounded-[4px] border border-gold/20" />

                    {/* Image */}
                    <div className="relative aspect-square overflow-hidden bg-sable rounded-[2px]">
                      <img
                        src={p.image}
                        alt={p.name}
                        loading="lazy"
                        className="absolute inset-0 h-full w-full object-cover transition duration-700 group-hover:scale-[1.03]"
                      />
                      <button
                        aria-label="Favori"
                        className="absolute top-3 right-3 h-10 w-10 rounded-full grid place-items-center bg-ivory/95 ring-1 ring-gold/30 hover:bg-gold hover:text-white transition"
                        onClick={(e) => e.preventDefault()}
                      >
                        <svg viewBox="0 0 24 24" className="h-4 w-4 text-gold" fill="none" stroke="currentColor" strokeWidth="1.6"><path d="M12 21s-7-4.35-9.5-8.5C.5 8 3 4 7 4c2 0 3.5 1 5 3 1.5-2 3-3 5-3 4 0 6.5 4 4.5 8.5C19 16.65 12 21 12 21z"/></svg>
                      </button>
                    </div>

                    {/* Body */}
                    <div className="relative px-4 sm:px-6 pt-6 pb-5">
                      {/* Pill label */}
                      <span className="inline-block text-[10px] tracking-[0.3em] uppercase text-gold border border-gold/50 px-3 py-1 rounded-full">
                        À la pièce
                      </span>
                      <h3 className="font-display text-3xl sm:text-4xl leading-tight mt-4 text-charbon">
                        {p.name}
                      </h3>
                      <div className="text-charbon/60 mt-1 capitalize">{p.category}</div>

                      {/* Gold divider with ornament */}
                      <div className="mt-5 flex items-center gap-3">
                        <span className="h-px flex-1 bg-gold/40" />
                        <span className="text-gold/80 text-xs">✦</span>
                        <span className="h-px flex-1 bg-gold/40" />
                      </div>

                      {/* Quantity */}
                      <div className="mt-5 text-charbon/70 text-sm">Sélectionnez la quantité</div>
                      <div className="mt-3 flex items-center border border-gold/50 rounded-full overflow-hidden">
                        <button
                          onClick={() => remove(p.slug)}
                          disabled={qty === 0}
                          className="flex-1 h-12 grid place-items-center text-gold hover:bg-gold hover:text-white transition disabled:opacity-30"
                          aria-label="Retirer"
                        >
                          <Minus className="h-4 w-4" />
                        </button>
                        <span className="w-14 text-center font-price text-2xl text-charbon">{qty}</span>
                        <button
                          onClick={() => add(p.slug)}
                          disabled={!canAdd}
                          className="flex-1 h-12 grid place-items-center text-gold hover:bg-gold hover:text-white transition disabled:opacity-30"
                          aria-label="Ajouter"
                        >
                          <Plus className="h-4 w-4" />
                        </button>
                      </div>
                      <div className="text-center text-xs text-charbon/50 mt-2">pièce</div>

                      {/* CTA */}
                      <button
                        onClick={() => add(p.slug)}
                        disabled={!canAdd}
                        className="mt-5 w-full inline-flex items-center justify-center gap-3 bg-charbon text-ivory py-4 text-[11px] tracking-[0.3em] uppercase font-medium hover:bg-gold transition disabled:opacity-40"
                      >
                        Ajouter au plateau <span aria-hidden>→</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>


            <div className="text-center mt-14 flex gap-3 justify-center">
              <button onClick={() => setStep(1)} className="btn btn-outline-gold">← Format</button>
              <button onClick={() => setStep(3)} disabled={!complete} className="btn btn-gold disabled:opacity-40 disabled:cursor-not-allowed">
                {complete ? `Continuer · ${size} pièces →` : `Encore ${effSize - totalPieces} à choisir`}
              </button>
            </div>
            {!complete && <p className="text-center text-xs text-charbon/60 mt-4 italic">Encore {effSize - totalPieces} pièces à choisir.</p>}
          </div>
        )}

        {/* STEP 3 */}
        {step === 3 && (
          <div className="max-w-2xl mx-auto">
            <div className="text-center mb-10">
              <div className="eyebrow">Votre carte</div>
              <h2 className="font-display text-4xl mt-3">{size ? coffretNames[size] : "Votre Coffret"}</h2>
              <div className="text-[11px] tracking-[0.25em] uppercase text-charbon/60 mt-2">Sur mesure · {size} pièces</div>
              <span className="inline-block h-px w-12 bg-gold mt-4" />
            </div>

            <div className="bg-white border border-gold/20 p-10">
              <div className="text-center mb-6 pb-6 border-b border-gold/20">
                <div className="font-display italic text-gold text-xl">Ö' Sweets</div>
                <div className="text-[10px] tracking-[0.3em] uppercase text-charbon/60 mt-1">{size ? coffretNames[size] : "Coffret"} · {size} pièces</div>
              </div>

              <ul className="space-y-3">
                {Object.entries(picks).filter(([, q]) => q > 0).map(([slug, q]) => {
                  const p = sel.find((x) => x.slug === slug)!;
                  return (
                    <li key={slug} className="flex items-center gap-4">
                      <img src={p.image} alt="" className="h-12 w-12 object-cover" />
                      <div className="flex-1 flex items-baseline gap-3">
                        <span className="font-display text-base">{p.name}</span>
                        <span className="flex-1 border-b border-dotted border-charbon/20" />
                        <span className="font-price text-lg">×{q}</span>
                      </div>
                    </li>
                  );
                })}
              </ul>

              <div className="mt-8 pt-6 border-t border-gold/20 flex justify-between items-baseline">
                <span className="font-display text-xl">Total</span>
                <span className="font-price text-3xl text-gold">{formatPrice(total)}</span>
              </div>
            </div>

            <div className="mt-10 flex gap-3 justify-center">
              <button onClick={() => setStep(2)} className="btn btn-outline-gold">← Modifier</button>
              <button
                onClick={() => {
                  addToCart({ slug: `coffret-custom-${size}-${Date.now()}`, name: `${size ? coffretNames[size] : "Coffret"} · ${size} pièces (sur mesure)`, price: total, image: composerHero });
                  alert("Coffret ajouté au panier !");
                  setPicks({}); setStep(1);
                }}
                className="btn btn-gold"
              >
                <ShoppingBag className="h-4 w-4" /> Ajouter au panier
              </button>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
