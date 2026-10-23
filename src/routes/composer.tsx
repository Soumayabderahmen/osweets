import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Check, Plus, Minus, ArrowRight, ArrowLeft, Gift, ChevronRight } from "lucide-react";
import { zodValidator } from "@tanstack/zod-adapter";
import { z } from "zod";
import { toast } from "sonner";
import { useCatalog, useEtatBase } from "@/lib/catalog";
import { PatisserieIndisponible } from "@/components/patisserie/Indisponible";
import { formatPrice, useShop } from "@/lib/shop-store";
import { isPatisserieTunisienne, isPublished } from "@/lib/patisserie";
import composerHero from "@/assets/composer-hero.jpg";
import { ProductImage } from "@/components/ProductImage";
import { Reveal } from "@/components/Reveal";

const SIZES = [6, 12, 18, 24, 36, 48] as const;

/** Libellés sans le mot « Coffret » — il est ajouté à l'affichage. */
const BOXES: Record<number, { label: string; tagline: string }> = {
  6: { label: "Dégustation", tagline: "Petit format" },
  12: { label: "Découverte", tagline: "Le plus offert" },
  18: { label: "Partage", tagline: "À partager" },
  24: { label: "Prestige", tagline: "Signature" },
  36: { label: "Réception", tagline: "Réceptions" },
  48: { label: "Royal", tagline: "Grand format" },
};

const UNIT_PRICE = 3.5;
const GIFT_WRAP_PRICE = 5;

const boxPrice = (pieces: number) =>
  pieces * UNIT_PRICE + (pieces >= 36 ? 15 : pieces >= 24 ? 8 : pieces >= 18 ? 5 : 0);

const STEPS = ["Format", "Pâtisseries", "Récapitulatif"] as const;

type BoxSizeParam = "6" | "12" | "18" | "24" | "36" | "48";

const searchSchema = z.object({
  size: z.enum(["6", "12", "18", "24", "36", "48"]).optional().catch(undefined),
});

export const Route = createFileRoute("/composer")({
  validateSearch: zodValidator(searchSchema),
  head: () => ({
    meta: [
      { title: "Votre Coffret — Ö' Sweets" },
      {
        name: "description",
        content:
          "Choisissez le format, garnissez à votre image, offrez l'exception. Coffrets de 6 à 48 pièces de pâtisseries tunisiennes artisanales.",
      },
    ],
  }),
  component: Page,
});

function Page() {
  const { size: sizeParam } = Route.useSearch();
  const navigate = Route.useNavigate();
  const { addToCart } = useShop();

  const [size, setSize] = useState<number | null>(sizeParam ? Number(sizeParam) : null);
  const [step, setStep] = useState<1 | 2 | 3>(sizeParam ? 2 : 1);
  const [picks, setPicks] = useState<Record<string, number>>({});
  const [giftMessage, setGiftMessage] = useState("");
  const [giftWrap, setGiftWrap] = useState(false);

  // L'adresse fait foi : /composer?size=12 ouvre directement l'étape « Pâtisseries ».
  useEffect(() => {
    if (sizeParam && Number(sizeParam) !== size) {
      setSize(Number(sizeParam));
      setPicks({});
      setStep(2);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sizeParam]);

  /** Pâtisseries éligibles au coffret : publiées, avec un prix, hors devis. */
  const catalogue = useCatalog();
  const etatBase = useEtatBase();
  const eligible = useMemo(
    () =>
      catalogue.filter(
        (p) =>
          isPatisserieTunisienne(p) &&
          isPublished(p) &&
          !p.draft &&
          !p.noCart &&
          !p.hidePrice &&
          p.price > 0,
      ),
    [catalogue],
  );

  /*
   * Un coffret ne se compose que de pâtisseries tunisiennes. Sans la base,
   * il n'y a rien à proposer — et surtout rien à facturer sur la foi d'un
   * ancien prix.
   */
  const chosen = size ? { pieces: size, ...BOXES[size], price: boxPrice(size) } : null;
  const totalSelected = useMemo(() => Object.values(picks).reduce((a, b) => a + b, 0), [picks]);
  const filled = !!chosen && totalSelected === chosen.pieces;

  const summaryParts = useMemo(
    () =>
      Object.entries(picks)
        .filter(([, q]) => q > 0)
        .map(([slug, q]) => {
          const p = eligible.find((x) => x.slug === slug);
          return p ? `${p.name} ×${q}` : null;
        })
        .filter(Boolean) as string[],
    [picks, eligible],
  );

  const totalPrice = (chosen?.price ?? 0) + (giftWrap ? GIFT_WRAP_PRICE : 0);

  const pickSize = (pieces: number) => {
    setSize(pieces);
    setPicks({});
    setStep(2);
    void navigate({ search: { size: String(pieces) as BoxSizeParam } });
  };

  const setQty = (slug: string, delta: number) =>
    setPicks((prev) => {
      const next = { ...prev };
      const cur = next[slug] ?? 0;
      const nv = Math.max(0, cur + delta);
      if (nv === 0) delete next[slug];
      else next[slug] = nv;
      return next;
    });

  const handleAddToCart = () => {
    if (!chosen) return;
    const composition = summaryParts.join(" · ");
    const ok = addToCart({
      slug: `box-${chosen.pieces}`,
      // La composition distingue deux coffrets d'un même format dans le panier.
      variantId: `${composition}${giftWrap ? "|cadeau" : ""}`,
      variantLabel: composition,
      name: `Coffret ${chosen.label} (${chosen.pieces} pièces)`,
      price: totalPrice,
      image: composerHero,
      unit: "coffret",
      gift: giftWrap ? { wrap: true, message: giftMessage || undefined } : undefined,
    });
    if (ok) toast.success(`Coffret ${chosen.label} ajouté au panier`);
  };

  if (etatBase === "panne") return <PatisserieIndisponible contexte="Votre Coffret" />;

  return (
    <div className="container-os py-6">
      {/* Fil d'ariane */}
      <nav className="text-xs text-charbon-soft" aria-label="Fil d'ariane">
        <ol className="flex flex-wrap items-center gap-1">
          <li className="flex items-center gap-1">
            <Link to="/" className="transition-colors hover:text-gold">
              Accueil
            </Link>
            <ChevronRight className="h-3 w-3 text-charbon-soft/50" />
          </li>
          <li>
            <span className="text-charbon" aria-current="page">
              Coffrets
            </span>
          </li>
        </ol>
      </nav>

      {/* Bandeau */}
      <div className="relative mb-12 mt-6 h-[260px] overflow-hidden rounded-2xl md:h-[340px]">
        <img
          src={composerHero}
          alt=""
          aria-hidden="true"
          className="absolute inset-0 h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-charbon/55" />
        <div className="absolute bottom-0 left-0 max-w-xl p-8 text-ivory md:p-12">
          <p className="mb-3 text-[11px] uppercase tracking-[0.25em] text-gold">
            L'expérience signature
          </p>
          <h1 className="font-display text-4xl leading-tight md:text-5xl">Votre Coffret</h1>
          <p className="mt-4 leading-relaxed text-ivory/80">
            Choisissez le format, garnissez à votre image, offrez l'exception.
          </p>
        </div>
      </div>

      {/* Progression */}
      <div className="mb-10 flex flex-wrap items-center gap-3 text-[11px] uppercase tracking-[0.18em]">
        {STEPS.map((s, i) => {
          const n = (i + 1) as 1 | 2 | 3;
          const active = step === n;
          const done = step > n;
          return (
            <div key={s} className="flex items-center gap-3">
              <span
                className={`inline-flex items-center gap-2 ${
                  active ? "text-gold" : done ? "text-charbon" : "text-charbon-soft/50"
                }`}
              >
                <span
                  className={`flex h-6 w-6 items-center justify-center rounded-full text-[10px] ${
                    active
                      ? "bg-gold text-white"
                      : done
                        ? "bg-charbon text-white"
                        : "bg-sable text-charbon-soft"
                  }`}
                >
                  {done ? <Check className="h-3.5 w-3.5" /> : n}
                </span>
                {n}. {s}
              </span>
              {i < STEPS.length - 1 && <span className="text-charbon-soft/30">—</span>}
            </div>
          );
        })}
      </div>

      {/* ÉTAPE 1 — FORMAT */}
      {step === 1 && (
        <div>
          <h2 className="mb-2 font-display text-3xl text-charbon">Quel format vous inspire ?</h2>
          <p className="mb-10 text-charbon-soft">
            Plus le coffret est grand, plus l'expérience est généreuse.
          </p>
          {!size && <p className="mb-6 text-sm text-charbon-soft/70">Aucun format sélectionné</p>}
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-3 lg:gap-6">
            {SIZES.map((pieces, i) => {
              const box = BOXES[pieces];
              const selected = size === pieces;
              return (
                <Reveal key={pieces} delay={(i % 3) * 0.04}>
                  <button
                    onClick={() => pickSize(pieces)}
                    className={`w-full overflow-hidden rounded-2xl border-2 text-left transition-colors ${
                      selected ? "border-gold" : "border-beige hover:border-gold/50"
                    }`}
                  >
                    <div className="relative aspect-[4/3] bg-sable">
                      <img
                        src={composerHero}
                        alt={`Coffret ${box.label}`}
                        loading="lazy"
                        className="absolute inset-0 h-full w-full object-cover"
                      />
                      {selected && (
                        <div className="absolute right-3 top-3 flex h-7 w-7 items-center justify-center rounded-full bg-gold">
                          <Check className="h-4 w-4 text-white" />
                        </div>
                      )}
                    </div>
                    <div className="flex items-center justify-between p-5">
                      <div>
                        <p className="text-[10px] uppercase tracking-[0.18em] text-gold">
                          {box.tagline}
                        </p>
                        <p className="mt-1 font-display text-lg text-charbon">{pieces} pièces</p>
                      </div>
                      <span className="text-sm text-charbon">dès {boxPrice(pieces)} €</span>
                    </div>
                  </button>
                </Reveal>
              );
            })}
          </div>
          {!size && (
            <p className="mt-8 text-center text-sm text-charbon-soft">
              Sélectionnez un format — Choisissez d'abord un format ci-dessus.
            </p>
          )}
        </div>
      )}

      {/* ÉTAPE 2 — PÂTISSERIES */}
      {step === 2 && chosen && (
        <div>
          <div className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
            <div>
              <button
                onClick={() => setStep(1)}
                className="mb-3 inline-flex items-center gap-1.5 text-xs text-charbon-soft transition-colors hover:text-charbon"
              >
                <ArrowLeft className="h-4 w-4" /> Retour au format
              </button>
              <h2 className="font-display text-3xl text-charbon">Garnissez votre coffret</h2>
              <p className="mt-1 text-charbon-soft">
                Coffret {chosen.label} — {chosen.pieces} pièces · dès {chosen.price} €
              </p>
            </div>
            <div className="text-right">
              <p className="text-[11px] uppercase tracking-[0.18em] text-gold">
                {totalSelected} / {chosen.pieces} pièces sélectionnées
              </p>
              <div className="mt-2 h-1.5 w-40 overflow-hidden rounded-full bg-sable">
                <div
                  className="h-full bg-gold transition-all"
                  style={{ width: `${(totalSelected / chosen.pieces) * 100}%` }}
                />
              </div>
            </div>
          </div>

          {eligible.length === 0 ? (
            <p className="py-10 text-center text-sm text-charbon-soft">
              Aucune pâtisserie éligible au coffret n'est disponible pour le moment.
            </p>
          ) : (
            <div className="grid grid-cols-2 gap-4 lg:grid-cols-4 lg:gap-6">
              {eligible.map((p) => {
                const q = picks[p.slug] ?? 0;
                const maxed = totalSelected >= chosen.pieces && q === 0;
                return (
                  <div
                    key={p.slug}
                    className="overflow-hidden rounded-2xl border border-beige bg-white"
                  >
                    <div className="relative aspect-square bg-sable">
                      <ProductImage src={p.image} alt={p.name} placeholderClassName="text-3xl" />
                    </div>
                    <div className="p-3">
                      <p className="line-clamp-2 min-h-[2.2em] font-display text-sm leading-tight text-charbon">
                        {p.name}
                      </p>
                      <div className="mt-3 flex items-center justify-between">
                        <button
                          onClick={() => setQty(p.slug, -1)}
                          disabled={q === 0}
                          aria-label={`Retirer ${p.name}`}
                          className="flex h-8 w-8 items-center justify-center rounded-full border border-beige text-charbon transition-colors hover:border-gold disabled:opacity-30"
                        >
                          <Minus className="h-3.5 w-3.5" />
                        </button>
                        <span className="text-sm tabular-nums text-charbon">{q}</span>
                        <button
                          onClick={() => setQty(p.slug, 1)}
                          disabled={maxed}
                          aria-label={`Ajouter ${p.name}`}
                          className="flex h-8 w-8 items-center justify-center rounded-full bg-charbon text-white transition-colors hover:bg-gold disabled:opacity-30"
                        >
                          <Plus className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          <div className="mt-10 flex justify-end">
            <button
              onClick={() => setStep(3)}
              disabled={!filled}
              className="inline-flex h-12 items-center gap-2 rounded-full bg-charbon px-8 text-xs uppercase tracking-[0.2em] text-ivory transition-colors hover:bg-gold disabled:opacity-40 disabled:hover:bg-charbon"
            >
              Continuer <ArrowRight className="h-4 w-4" />
            </button>
          </div>
          {!filled && totalSelected > 0 && (
            <p className="mt-2 text-right text-xs text-charbon-soft">
              Il vous reste {chosen.pieces - totalSelected} pièce(s) à choisir.
            </p>
          )}
        </div>
      )}

      {/* ÉTAPE 3 — RÉCAPITULATIF */}
      {step === 3 && chosen && (
        <div className="grid gap-10 lg:grid-cols-12">
          <div className="lg:col-span-7">
            <button
              onClick={() => setStep(2)}
              className="mb-4 inline-flex items-center gap-1.5 text-xs text-charbon-soft transition-colors hover:text-charbon"
            >
              <ArrowLeft className="h-4 w-4" /> Modifier les pâtisseries
            </button>
            <h2 className="mb-6 font-display text-3xl text-charbon">Récapitulatif</h2>

            <div className="overflow-hidden rounded-2xl border border-beige">
              <div className="flex items-center gap-4 border-b border-beige bg-sable/50 p-5">
                <div className="h-16 w-16 shrink-0 overflow-hidden rounded-xl bg-sable">
                  <img
                    src={composerHero}
                    alt=""
                    aria-hidden="true"
                    className="h-full w-full object-cover"
                  />
                </div>
                <div>
                  <p className="text-[10px] uppercase tracking-[0.18em] text-gold">
                    {chosen.tagline}
                  </p>
                  <p className="font-display text-lg text-charbon">Coffret {chosen.label}</p>
                  <p className="text-sm text-charbon-soft">{chosen.pieces} pièces</p>
                </div>
              </div>
              <ul className="divide-y divide-beige">
                {summaryParts.map((line) => (
                  <li key={line} className="flex items-center gap-2 px-5 py-3 text-sm text-charbon">
                    <Check className="h-4 w-4 shrink-0 text-gold" /> {line}
                  </li>
                ))}
              </ul>
            </div>

            <div className="mt-6 space-y-4">
              <label className="block">
                <span className="text-xs uppercase tracking-[0.15em] text-charbon-soft">
                  Message cadeau (facultatif)
                </span>
                <textarea
                  value={giftMessage}
                  onChange={(e) => setGiftMessage(e.target.value)}
                  rows={3}
                  placeholder="Un petit mot à glisser dans le coffret…"
                  className="mt-2 w-full rounded-xl border border-beige bg-white px-4 py-3 text-sm text-charbon outline-none focus:border-gold"
                />
              </label>
              <label className="flex cursor-pointer items-start gap-3">
                <input
                  type="checkbox"
                  checked={giftWrap}
                  onChange={(e) => setGiftWrap(e.target.checked)}
                  className="mt-1 accent-gold"
                />
                <span className="text-sm text-charbon">
                  <span className="inline-flex items-center gap-1.5 font-medium">
                    <Gift className="h-4 w-4 text-gold" /> C'est un cadeau — emballage premium
                  </span>
                  <span className="block text-charbon-soft">
                    Écrin signé Ö' Sweets (+{GIFT_WRAP_PRICE} €)
                  </span>
                </span>
              </label>
            </div>
          </div>

          <div className="lg:col-span-5">
            <div className="sticky top-28 rounded-2xl border border-beige p-6">
              <h3 className="mb-4 font-display text-xl text-charbon">Votre coffret</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between text-charbon">
                  <span>
                    Coffret {chosen.label} ({chosen.pieces} pièces)
                  </span>
                  <span>{chosen.price} €</span>
                </div>
                {giftWrap && (
                  <div className="flex justify-between text-charbon">
                    <span>Emballage cadeau premium</span>
                    <span>{GIFT_WRAP_PRICE} €</span>
                  </div>
                )}
              </div>
              <div className="mt-4 flex items-baseline justify-between border-t border-beige pt-4">
                <span className="text-xs uppercase tracking-[0.18em] text-charbon-soft">Total</span>
                <span className="font-display text-2xl text-charbon">
                  {formatPrice(totalPrice)}
                </span>
              </div>
              <button
                onClick={handleAddToCart}
                className="mt-6 inline-flex h-12 w-full items-center justify-center gap-2 rounded-full bg-charbon text-xs uppercase tracking-[0.2em] text-ivory transition-colors hover:bg-gold"
              >
                Ajouter au panier <ArrowRight className="h-4 w-4" />
              </button>
              <p className="mt-3 text-center text-xs text-charbon-soft">
                Le coffret entre dans le panier comme un seul article.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
