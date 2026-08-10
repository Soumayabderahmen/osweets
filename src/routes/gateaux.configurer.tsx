import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import cakePistache from "@/assets/cake-pistache.jpg";
import { breadcrumb, jsonLdScript, service, SITE } from "@/lib/seo";

const PATH = "/gateaux/configurer";

export const Route = createFileRoute("/gateaux/configurer")({
  head: () => ({
    meta: [
      { title: "Configurer mon gâteau sur mesure | Ö' Sweets Pâtisserie" },
      {
        name: "description",
        content:
          "Composez votre gâteau sur mesure : base, parfums, nombre de personnes, allergies et date souhaitée. Votre configuration est envoyée directement au devis.",
      },
      { property: "og:title", content: "Configurer mon gâteau sur mesure | Ö' Sweets" },
      {
        property: "og:description",
        content: "Base, parfums, nombre de personnes, allergies, date — puis devis sous 48h.",
      },
      { property: "og:type", content: "website" },
      { property: "og:url", content: `${SITE.url}${PATH}` },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [{ rel: "canonical", href: `${SITE.url}${PATH}` }],
    scripts: [
      jsonLdScript(
        service({
          name: "Gâteau sur mesure",
          description: "Configuration d'un gâteau sur mesure : base, parfums, portions, allergies et date.",
          serviceType: "Gâteau sur mesure",
          path: PATH,
        }),
      ),
      jsonLdScript(
        breadcrumb([
          { name: "Accueil", path: "/" },
          { name: "Gâteaux", path: "/gateaux" },
          { name: "Configurer mon gâteau", path: PATH },
        ]),
      ),
    ],
  }),
  component: Page,
});

const BASES = [
  { id: "genoise", label: "Génoise vanille", desc: "Moelleuse, classique, sirop parfumé" },
  { id: "chocolat", label: "Biscuit chocolat", desc: "Cacao intense, texture fondante" },
  { id: "amande", label: "Biscuit amande", desc: "Amande de Valence, sans gluten possible" },
  { id: "pistache", label: "Biscuit pistache", desc: "Pistache de Sicile torréfiée" },
  { id: "entremets", label: "Entremets mousse", desc: "Insert fruité, glaçage miroir" },
  { id: "conseil", label: "Je souhaite être conseillé(e)", desc: "Notre chef vous oriente" },
];

const FLAVORS = [
  "Vanille Bourbon",
  "Chocolat noir 70%",
  "Pistache",
  "Praliné noisette",
  "Fraise",
  "Framboise",
  "Citron",
  "Fleur d'oranger",
  "Caramel beurre salé",
  "Café",
];

const FINISHES = ["Crème au beurre lisse", "Chantilly mascarpone", "Glaçage miroir", "Pâte à sucre", "Nu (naked cake)"];

function Page() {
  const [base, setBase] = useState(BASES[0]);
  const [flavors, setFlavors] = useState<string[]>([]);
  const [finish, setFinish] = useState(FINISHES[0]);
  const [guests, setGuests] = useState(20);
  const [allergies, setAllergies] = useState("");
  const [date, setDate] = useState("");
  const [notes, setNotes] = useState("");
  const [touched, setTouched] = useState(false);

  const toggleFlavor = (f: string) =>
    setFlavors((prev) => (prev.includes(f) ? prev.filter((x) => x !== f) : prev.length >= 3 ? prev : [...prev, f]));

  const valid = flavors.length > 0 && guests > 0 && !!date;

  const search = useMemo(
    () => ({
      type: "Gâteau sur mesure",
      date,
      guests,
      flavors: flavors.join(", "),
      allergies: allergies || undefined,
      produit: "Gâteau",
      details: [
        `Base : ${base.label}`,
        `Finition : ${finish}`,
        notes ? `Précisions : ${notes}` : null,
      ]
        .filter(Boolean)
        .join(" · "),
    }),
    [base, finish, flavors, guests, allergies, date, notes],
  );

  const today = new Date().toISOString().slice(0, 10);

  return (
    <div className="bg-ivory">
      <section className="relative h-[46vh] min-h-[340px] overflow-hidden">
        <img src={cakePistache} alt="Gâteau sur mesure Ö' Sweets" className="absolute inset-0 h-full w-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-b from-black/35 to-black/75" />
        <div className="relative z-10 h-full flex flex-col items-center justify-center text-center text-white px-6">
          <div className="text-[10px] tracking-[0.35em] uppercase text-gold">Sur mesure</div>
          <h1 className="font-display text-4xl md:text-6xl mt-4 text-white">Configurer mon gâteau</h1>
          <span className="mt-5 inline-block h-px w-16 bg-gold" />
          <p className="mt-5 max-w-xl text-white/90 font-light">
            Base, parfums, portions, allergies et date : votre configuration est transmise avec votre demande de devis.
          </p>
        </div>
      </section>

      <section className="container-os section-y grid lg:grid-cols-[1fr_360px] gap-12 items-start">
        <div className="space-y-12">
          {/* Base */}
          <div>
            <h2 className="font-display text-2xl mb-5"><span className="text-gold">01.</span> Choix de la base</h2>
            <div className="grid sm:grid-cols-2 gap-3">
              {BASES.map((b) => (
                <button
                  key={b.id}
                  type="button"
                  onClick={() => setBase(b)}
                  className={`p-5 text-left border-2 transition ${base.id === b.id ? "border-gold bg-beige" : "border-border bg-white hover:border-gold/50"}`}
                >
                  <div className="font-display text-base">{b.label}</div>
                  <div className="text-sm text-charbon/60 mt-1">{b.desc}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Parfums */}
          <div>
            <h2 className="font-display text-2xl mb-2"><span className="text-gold">02.</span> Parfums</h2>
            <p className="text-sm text-charbon/60 mb-5">Sélectionnez 1 à 3 parfums.</p>
            <div className="flex flex-wrap gap-2">
              {FLAVORS.map((f) => {
                const on = flavors.includes(f);
                return (
                  <button
                    key={f}
                    type="button"
                    onClick={() => toggleFlavor(f)}
                    className={`px-4 py-2 text-sm border transition ${on ? "border-gold bg-gold text-white" : "border-border bg-white hover:border-gold/50"}`}
                  >
                    {f}
                  </button>
                );
              })}
            </div>
            {touched && flavors.length === 0 && (
              <p className="text-sm text-red-600 mt-3">Choisissez au moins un parfum.</p>
            )}
          </div>

          {/* Finition */}
          <div>
            <h2 className="font-display text-2xl mb-5"><span className="text-gold">03.</span> Finition</h2>
            <div className="flex flex-wrap gap-2">
              {FINISHES.map((f) => (
                <button
                  key={f}
                  type="button"
                  onClick={() => setFinish(f)}
                  className={`px-4 py-2 text-sm border transition ${finish === f ? "border-gold bg-beige" : "border-border bg-white hover:border-gold/50"}`}
                >
                  {f}
                </button>
              ))}
            </div>
          </div>

          {/* Personnes / date / allergies */}
          <div>
            <h2 className="font-display text-2xl mb-5"><span className="text-gold">04.</span> Détails</h2>
            <div className="grid sm:grid-cols-2 gap-5">
              <label className="block">
                <span className="text-xs uppercase tracking-wider text-charbon/60">Nombre de personnes</span>
                <input
                  type="number"
                  min={1}
                  max={1000}
                  value={guests}
                  onChange={(e) => setGuests(Math.max(1, Number(e.target.value) || 1))}
                  className="mt-2 w-full bg-white border border-border px-4 py-3"
                />
              </label>
              <label className="block">
                <span className="text-xs uppercase tracking-wider text-charbon/60">Date souhaitée</span>
                <input
                  type="date"
                  min={today}
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="mt-2 w-full bg-white border border-border px-4 py-3"
                />
                {touched && !date && <span className="text-sm text-red-600">Date requise.</span>}
              </label>
              <label className="block sm:col-span-2">
                <span className="text-xs uppercase tracking-wider text-charbon/60">Allergies & intolérances</span>
                <input
                  type="text"
                  maxLength={300}
                  value={allergies}
                  onChange={(e) => setAllergies(e.target.value)}
                  placeholder="Fruits à coque, gluten, lactose…"
                  className="mt-2 w-full bg-white border border-border px-4 py-3"
                />
              </label>
              <label className="block sm:col-span-2">
                <span className="text-xs uppercase tracking-wider text-charbon/60">Précisions (facultatif)</span>
                <textarea
                  rows={4}
                  maxLength={1000}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Thème, couleurs, inscription, inspiration…"
                  className="mt-2 w-full bg-white border border-border px-4 py-3"
                />
              </label>
            </div>
          </div>
        </div>

        {/* Récapitulatif */}
        <aside className="bg-sable p-8 h-fit lg:sticky lg:top-32 space-y-4">
          <h2 className="font-display text-xl">Votre gâteau</h2>
          <dl className="text-sm space-y-2 border-y border-border py-4">
            <div className="flex justify-between gap-4"><dt className="text-charbon/60">Base</dt><dd className="text-right">{base.label}</dd></div>
            <div className="flex justify-between gap-4"><dt className="text-charbon/60">Parfums</dt><dd className="text-right">{flavors.length ? flavors.join(", ") : "—"}</dd></div>
            <div className="flex justify-between gap-4"><dt className="text-charbon/60">Finition</dt><dd className="text-right">{finish}</dd></div>
            <div className="flex justify-between gap-4"><dt className="text-charbon/60">Personnes</dt><dd className="text-right">{guests}</dd></div>
            <div className="flex justify-between gap-4"><dt className="text-charbon/60">Date</dt><dd className="text-right">{date || "—"}</dd></div>
            <div className="flex justify-between gap-4"><dt className="text-charbon/60">Allergies</dt><dd className="text-right">{allergies || "—"}</dd></div>
          </dl>
          {valid ? (
            <Link to="/devis" search={search} className="btn btn-gold w-full justify-center">
              Envoyer ma configuration au devis
            </Link>
          ) : (
            <button
              type="button"
              onClick={() => setTouched(true)}
              className="btn btn-gold w-full justify-center opacity-60"
            >
              Envoyer ma configuration au devis
            </button>
          )}
          <p className="text-xs text-charbon/60 text-center">
            Réponse sous 48h · devis gratuit et sans engagement.
          </p>
        </aside>
      </section>
    </div>
  );
}
