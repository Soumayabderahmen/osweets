import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Check } from "lucide-react";
import { events } from "@/data/products";
import { eventPacks } from "@/data/packs";
import wedding from "@/assets/wedding-buffet.jpg";

export const Route = createFileRoute("/evenements/$slug")({
  loader: ({ params }) => {
    const e = events.find((x) => x.slug === params.slug);
    if (!e) throw notFound();
    return e;
  },
  head: ({ loaderData }) => ({
    meta: [
      { title: `${loaderData?.label ?? "Événement"} — Ö' Sweets` },
      { name: "description", content: loaderData?.desc ?? "" },
    ],
  }),
  notFoundComponent: () => <div className="container-os py-20 text-center"><h1 className="font-display text-3xl">Événement introuvable</h1></div>,
  errorComponent: () => <div className="container-os py-20 text-center">Erreur</div>,
  component: Page,
});

function Page() {
  const e = Route.useLoaderData();
  const packs = eventPacks[e.slug] ?? [];

  const [guests, setGuests] = useState(50);
  const [types, setTypes] = useState<string[]>(["baklawa"]);
  const [date, setDate] = useState("");
  const [budget, setBudget] = useState(800);

  const toggleType = (t: string) => setTypes((arr) => arr.includes(t) ? arr.filter(x => x !== t) : [...arr, t]);

  const waLink = useMemo(() => {
    const txt = `Bonjour, demande de devis ${e.label} :\n• Date : ${date || "à définir"}\n• Invités : ${guests}\n• Pâtisseries souhaitées : ${types.join(", ") || "à définir"}\n• Budget : ~${budget}€`;
    return `https://wa.me/33699466030?text=${encodeURIComponent(txt)}`;
  }, [e.label, guests, types, date, budget]);

  return (
    <div className="bg-ivory">
      {/* Hero */}
      <section className="relative h-[55vh] min-h-[420px] overflow-hidden">
        <img src={e.image ?? wedding} alt={e.label} className="absolute inset-0 h-full w-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-b from-black/45 to-black/75" />
        <div className="relative z-10 h-full flex flex-col items-center justify-center text-white text-center px-6">
          <div className="text-3xl">{e.icon}</div>
          <h1 className="font-display text-5xl md:text-7xl mt-4 text-white" style={{ textShadow: "0 2px 30px rgba(0,0,0,0.5)" }}>
            {e.label}
          </h1>
          <span className="mt-5 h-px w-16 bg-gold inline-block" />
          <p className="mt-5 max-w-xl text-white/90 font-light">{e.desc}</p>
        </div>
      </section>

      {/* Packs prêts */}
      {packs.length > 0 && (
        <section className="container-os section-y">
          <div className="text-center mb-14">
            <div className="text-[10px] tracking-[0.3em] uppercase text-gold font-medium">Nos formules</div>
            <h2 className="font-display text-4xl md:text-5xl mt-3">Packs prêts à réserver</h2>
            <span className="mt-5 inline-block h-px w-16 bg-gold" />
            <p className="mt-5 text-charbon/70 max-w-2xl mx-auto font-light">
              Des formules complètes pensées pour chaque taille d'événement.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {packs.map((p) => (
              <div key={p.id} className={`relative bg-white p-8 flex flex-col border-2 ${p.highlight ? "border-gold shadow-[0_10px_40px_rgba(168,145,82,0.18)]" : "border-border"}`}>
                {p.highlight && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-gold text-white text-[10px] tracking-[0.22em] uppercase px-3 py-1">
                    Le plus choisi
                  </span>
                )}
                <h3 className="font-display text-2xl">{p.name}</h3>
                <div className="text-xs uppercase tracking-wider text-charbon/60 mt-1">{p.guests} invités</div>
                <div className="font-price text-4xl text-gold mt-4">{p.price}€</div>
                <ul className="mt-6 space-y-3 flex-1">
                  {p.includes.map((line) => (
                    <li key={line} className="flex gap-2 text-sm text-charbon/80">
                      <Check className="h-4 w-4 text-gold shrink-0 mt-0.5" />
                      <span>{line}</span>
                    </li>
                  ))}
                </ul>
                <a
                  href={`https://wa.me/33699466030?text=${encodeURIComponent(`Bonjour, je souhaite réserver le ${p.name} (${e.label}) pour ${p.guests} personnes — ${p.price}€`)}`}
                  target="_blank" rel="noreferrer"
                  className={`btn mt-8 w-full justify-center ${p.highlight ? "btn-gold" : "btn-outline-gold"}`}
                >
                  Réserver ce pack
                </a>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Configurateur sur mesure */}
      <section className="bg-sable">
        <div className="container-os section-y grid lg:grid-cols-2 gap-12 items-start">
          <div>
            <div className="text-[10px] tracking-[0.3em] uppercase text-gold font-medium">100% sur mesure</div>
            <h2 className="font-display text-4xl mt-3">Créez votre pack idéal</h2>
            <span className="mt-5 inline-block h-px w-16 bg-gold" />
            <p className="mt-6 text-charbon/70 leading-relaxed">
              Nos packs ne correspondent pas à vos envies ? Composez votre formule
              à la carte : nous adaptons quantités, variétés et présentation à votre événement.
            </p>
            <ul className="mt-6 space-y-2 text-sm text-charbon/75">
              <li>✦ Devis gratuit sous 24h</li>
              <li>✦ Dégustation préalable en boutique</li>
              <li>✦ Livraison Île-de-France · service possible</li>
              <li>✦ Acompte 30% à la confirmation</li>
            </ul>
          </div>

          <div className="bg-white p-8 space-y-5 border border-border">
            <h3 className="font-display text-2xl">Configurateur</h3>

            <div>
              <label className="text-xs uppercase tracking-wider text-charbon/60">Date de l'événement</label>
              <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="mt-2 w-full bg-white border border-border px-4 py-3" />
            </div>

            <div>
              <label className="text-xs uppercase tracking-wider text-charbon/60">Nombre d'invités : <span className="text-gold font-medium">{guests}</span></label>
              <input type="range" min={10} max={500} step={10} value={guests} onChange={(ev) => setGuests(+ev.target.value)} className="w-full accent-[var(--gold)]" />
            </div>

            <div>
              <label className="text-xs uppercase tracking-wider text-charbon/60 block mb-2">Pâtisseries souhaitées</label>
              <div className="grid grid-cols-2 gap-2">
                {["baklawa", "kaak warka", "samsa", "makroud", "mignardises", "pièce montée", "dattes", "coffrets"].map((t) => (
                  <button key={t} type="button" onClick={() => toggleType(t)}
                    className={`px-3 py-2 text-sm border transition ${types.includes(t) ? "border-gold bg-beige text-gold" : "border-border bg-white"}`}>
                    {t}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-xs uppercase tracking-wider text-charbon/60">Budget estimé : <span className="text-gold font-medium">{budget}€</span></label>
              <input type="range" min={200} max={5000} step={50} value={budget} onChange={(ev) => setBudget(+ev.target.value)} className="w-full accent-[var(--gold)]" />
            </div>

            <a href={waLink} target="_blank" rel="noreferrer" className="btn btn-gold w-full justify-center">
              Envoyer ma demande
            </a>
            <Link to="/evenements" className="block text-center text-xs uppercase tracking-wider text-charbon/60 hover:text-gold">← Tous les événements</Link>
          </div>
        </div>
      </section>
    </div>
  );
}
