import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { cakeSizes, cakeFlavors } from "@/data/themes";
import cakePistache from "@/assets/cake-pistache.jpg";

export const Route = createFileRoute("/gateaux/gender-reveal")({
  head: () => ({
    meta: [
      { title: "Gâteau Gender Reveal sur mesure — Ö' Sweets" },
      { name: "description", content: "Révélez le sexe de bébé avec un gâteau surprise fille ou garçon. Personnalisez couleur, taille, parfum et date de l'événement." },
      { property: "og:title", content: "Gâteau Gender Reveal — Ö' Sweets" },
      { property: "og:description", content: "Gâteau surprise fille ou garçon, sur mesure pour votre baby shower." },
    ],
  }),
  component: Page,
});

type Reveal = "fille" | "garcon" | "surprise";

const reveals: { id: Reveal; label: string; emoji: string; color: string; desc: string }[] = [
  { id: "fille", label: "C'est une fille", emoji: "🎀", color: "#F5B7C7", desc: "Cœur du gâteau rose poudré." },
  { id: "garcon", label: "C'est un garçon", emoji: "💙", color: "#9EC5E8", desc: "Cœur du gâteau bleu ciel." },
  { id: "surprise", label: "Surprise pour nous aussi", emoji: "✨", color: "#D8C79A", desc: "Nous gardons le secret jusqu'au moment magique." },
];

function Page() {
  const [reveal, setReveal] = useState<Reveal>("fille");
  const [size, setSize] = useState(cakeSizes[1]);
  const [flavor, setFlavor] = useState(cakeFlavors[0]);
  const [eventDate, setEventDate] = useState("");
  const [guests, setGuests] = useState("");
  const [name, setName] = useState("");
  const [message, setMessage] = useState("");

  const selected = reveals.find((r) => r.id === reveal)!;
  const total = useMemo(() => size.price + 20, [size]); // +20€ décor gender reveal

  const waLink = useMemo(() => {
    const txt = `Bonjour Ö' Sweets,\n\nJe souhaite commander un gâteau Gender Reveal :\n• Révélation : ${selected.label}\n• Diamètre : ${size.diameter} (${size.parts} parts)\n• Parfum : ${flavor.label}\n• Date de l'événement : ${eventDate || "—"}\n• Nombre d'invités : ${guests || "—"}\n• Famille / Prénoms : ${name || "—"}\n• Message : ${message || "—"}\n\nPrix estimé : ${total}€`;
    return `https://wa.me/33699466030?text=${encodeURIComponent(txt)}`;
  }, [selected, size, flavor, eventDate, guests, name, message, total]);

  return (
    <div className="bg-ivory">
      {/* Hero */}
      <section className="relative h-[52vh] min-h-[400px] overflow-hidden">
        <img src={cakePistache} alt="Gâteau Gender Reveal" className="absolute inset-0 h-full w-full object-cover" />
        <div
          className="absolute inset-0"
          style={{ background: `linear-gradient(to bottom, ${selected.color}55, rgba(0,0,0,0.7))` }}
        />
        <div className="relative z-10 h-full flex flex-col items-center justify-center text-white text-center px-6">
          <div className="text-[10px] tracking-[0.35em] uppercase text-gold font-medium">Sur mesure · Gâteaux</div>
          <h1 className="font-display text-5xl md:text-6xl mt-4 text-white" style={{ textShadow: "0 2px 30px rgba(0,0,0,0.55)" }}>
            Gâteau Gender Reveal
          </h1>
          <span className="mt-5 h-px w-16 bg-gold inline-block" />
          <p className="mt-5 max-w-xl text-white/90 font-light">
            Un gâteau surprise pour révéler le sexe de bébé au moment de la découpe.
          </p>
          <div className="mt-6 text-xs tracking-wider text-white/80 uppercase">
            <Link to="/gateaux" className="hover:text-gold">Gâteaux</Link>
            <span className="mx-2">/</span>
            <span className="text-gold">Gender Reveal</span>
          </div>
        </div>
      </section>

      <section className="container-os section-y grid lg:grid-cols-[1fr_380px] gap-12">
        <div className="space-y-14">
          {/* Reveal choice */}
          <div>
            <div className="flex items-baseline justify-between mb-6">
              <h2 className="font-display text-2xl"><span className="text-gold">01.</span> Fille, garçon ou surprise ?</h2>
              <span className="text-xs text-charbon/60">{selected.label}</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {reveals.map((r) => (
                <button
                  key={r.id}
                  onClick={() => setReveal(r.id)}
                  className={`relative p-6 text-left transition border-2 ${reveal === r.id ? "border-gold bg-beige" : "border-border bg-white hover:border-gold/50"}`}
                >
                  <div className="text-3xl mb-3">{r.emoji}</div>
                  <div className="font-display text-base">{r.label}</div>
                  <div className="text-xs text-charbon/60 mt-2 leading-relaxed">{r.desc}</div>
                  <span className="absolute right-4 top-4 h-4 w-4 rounded-full border border-white shadow" style={{ background: r.color }} />
                </button>
              ))}
            </div>
          </div>

          {/* Size */}
          <div>
            <div className="flex items-baseline justify-between mb-6">
              <h2 className="font-display text-2xl"><span className="text-gold">02.</span> Choisissez la taille</h2>
              <span className="text-xs text-charbon/60">{size.diameter}</span>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {cakeSizes.map((s) => (
                <button
                  key={s.id}
                  onClick={() => setSize(s)}
                  className={`p-5 text-center transition border-2 ${size.id === s.id ? "border-gold bg-beige" : "border-border bg-white hover:border-gold/50"}`}
                >
                  <div className="font-display text-lg">{s.diameter}</div>
                  <div className="text-xs text-charbon/60 mt-1 uppercase tracking-wider">{s.parts} parts</div>
                  <div className="font-price text-xl text-gold mt-2">{s.price}€</div>
                </button>
              ))}
            </div>
          </div>

          {/* Flavor */}
          <div>
            <div className="flex items-baseline justify-between mb-6">
              <h2 className="font-display text-2xl"><span className="text-gold">03.</span> Choisissez le parfum</h2>
              <span className="text-xs text-charbon/60">{flavor.label}</span>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {cakeFlavors.map((f) => (
                <button
                  key={f.id}
                  onClick={() => setFlavor(f)}
                  className={`p-4 text-left transition border ${flavor.id === f.id ? "border-gold bg-beige" : "border-border bg-white hover:border-gold/50"}`}
                >
                  <div className="font-display text-sm">{f.label}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Event config */}
          <div>
            <h2 className="font-display text-2xl mb-6"><span className="text-gold">04.</span> Configurer l'événement</h2>
            <div className="grid md:grid-cols-2 gap-3">
              <label className="block">
                <span className="text-xs uppercase tracking-wider text-charbon/60">Date de l'événement</span>
                <input
                  type="date"
                  value={eventDate}
                  onChange={(e) => setEventDate(e.target.value)}
                  className="mt-2 w-full bg-white border border-border px-4 py-3"
                />
              </label>
              <label className="block">
                <span className="text-xs uppercase tracking-wider text-charbon/60">Nombre d'invités</span>
                <input
                  type="number"
                  min={1}
                  value={guests}
                  onChange={(e) => setGuests(e.target.value)}
                  placeholder="Ex. 20"
                  className="mt-2 w-full bg-white border border-border px-4 py-3"
                />
              </label>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Prénoms des futurs parents"
                className="md:col-span-2 w-full bg-white border border-border px-4 py-3"
              />
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Message ou demandes spéciales (couleurs, thème, allergies, décor…)"
                rows={4}
                className="md:col-span-2 w-full bg-white border border-border px-4 py-3"
              />
            </div>
          </div>
        </div>

        {/* Sticky summary */}
        <aside className="bg-sable p-8 h-fit sticky top-32 space-y-4">
          <h3 className="font-display text-xl">Votre gâteau</h3>
          <div
            className="h-24 rounded-sm border border-border flex items-center justify-center text-4xl"
            style={{ background: `${selected.color}30` }}
          >
            {selected.emoji}
          </div>
          <div className="text-sm space-y-2 border-y border-border py-4">
            <div className="flex justify-between"><span className="text-charbon/60">Révélation</span><span>{selected.label}</span></div>
            <div className="flex justify-between"><span className="text-charbon/60">Taille</span><span>{size.diameter}</span></div>
            <div className="flex justify-between"><span className="text-charbon/60">Parts</span><span>{size.parts}</span></div>
            <div className="flex justify-between"><span className="text-charbon/60">Parfum</span><span>{flavor.label}</span></div>
            {eventDate && <div className="flex justify-between"><span className="text-charbon/60">Date</span><span>{eventDate}</span></div>}
            {guests && <div className="flex justify-between"><span className="text-charbon/60">Invités</span><span>{guests}</span></div>}
          </div>
          <div className="flex items-end justify-between">
            <span className="text-xs uppercase tracking-wider text-charbon/60">Prix estimé</span>
            <span className="font-price text-3xl text-gold">{total}€</span>
          </div>
          <a href={waLink} target="_blank" rel="noreferrer" className="btn btn-gold w-full justify-center">
            Commander sur WhatsApp
          </a>
          <p className="text-[11px] text-charbon/55 leading-relaxed">
            Confirmation sous 24h. Délai minimum 5 jours avant la date. Acompte 30% à la commande. Décor Gender Reveal inclus (+20€).
          </p>
        </aside>
      </section>
    </div>
  );
}
