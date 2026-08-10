import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { cakeThemes, cakeSizes, cakeFlavors } from "@/data/themes";
import cakePistache from "@/assets/cake-pistache.jpg";

export const Route = createFileRoute("/gateaux/anniversaire/personnaliser")({
  head: () => ({
    meta: [
      { title: "Gâteaux d'Anniversaire sur mesure — Ö' Sweets" },
      { name: "description", content: "Composez votre gâteau d'anniversaire : thème, diamètre, parfum, message personnalisé." },
    ],
  }),
  component: Page,
});

function Page() {
  const [theme, setTheme] = useState(cakeThemes[0]);
  const [size, setSize] = useState(cakeSizes[1]);
  const [flavor, setFlavor] = useState(cakeFlavors[0]);
  const [message, setMessage] = useState("");
  const [name, setName] = useState("");

  const total = useMemo(() => size.price + (theme.id === "personnalise" ? 25 : 0), [size, theme]);

  const waLink = useMemo(() => {
    const txt = `Bonjour Ö' Sweets,\n\nJe souhaite commander un gâteau d'anniversaire :\n• Thème : ${theme.label}\n• Diamètre : ${size.diameter} (${size.parts} parts)\n• Parfum : ${flavor.label}\n• Pour : ${name || "—"}\n• Message : ${message || "—"}\n\nPrix estimé : ${total}€`;
    return `https://wa.me/33699466030?text=${encodeURIComponent(txt)}`;
  }, [theme, size, flavor, name, message, total]);

  return (
    <div className="bg-ivory">
      {/* Hero */}
      <section className="relative h-[50vh] min-h-[380px] overflow-hidden">
        <img src={cakePistache} alt="Gâteau anniversaire" className="absolute inset-0 h-full w-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-b from-black/45 to-black/75" />
        <div className="relative z-10 h-full flex flex-col items-center justify-center text-white text-center px-6">
          <div className="text-[10px] tracking-[0.35em] uppercase text-gold font-medium">Sur mesure</div>
          <h1 className="font-display text-5xl md:text-6xl mt-4 text-white" style={{ textShadow: "0 2px 30px rgba(0,0,0,0.5)" }}>
            Gâteau d'Anniversaire
          </h1>
          <span className="mt-5 h-px w-16 bg-gold inline-block" />
          <p className="mt-5 max-w-xl text-white/90 font-light">
            Composez le gâteau parfait, façonné main pour le grand jour.
          </p>
        </div>
      </section>

      <section className="container-os section-y grid lg:grid-cols-[1fr_380px] gap-12">
        {/* Configurator */}
        <div className="space-y-14">
          {/* Theme */}
          <div>
            <div className="flex items-baseline justify-between mb-6">
              <h2 className="font-display text-2xl"><span className="text-gold">01.</span> Choisissez le thème</h2>
              <span className="text-xs text-charbon/60">{theme.label}</span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
              {cakeThemes.map((t) => (
                <button
                  key={t.id}
                  onClick={() => setTheme(t)}
                  className={`relative p-5 text-left transition border-2 ${theme.id === t.id ? "border-gold bg-beige" : "border-border bg-white hover:border-gold/50"}`}
                >
                  <div className="text-2xl mb-2">{t.emoji}</div>
                  <div className="font-display text-sm">{t.label}</div>
                  <span className="absolute right-3 top-3 h-3 w-3 rounded-full" style={{ background: t.color }} />
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

          {/* Personalization */}
          <div>
            <h2 className="font-display text-2xl mb-6"><span className="text-gold">04.</span> Personnalisez</h2>
            <div className="space-y-3">
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Prénom à inscrire sur le gâteau"
                className="w-full bg-white border border-border px-4 py-3"
              />
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Message ou demandes spéciales (couleurs, figurine, allergies…)"
                rows={4}
                className="w-full bg-white border border-border px-4 py-3"
              />
            </div>
          </div>
        </div>

        {/* Sticky summary */}
        <aside className="bg-sable p-8 h-fit sticky top-32 space-y-4">
          <h3 className="font-display text-xl">Votre commande</h3>
          <div className="text-sm space-y-2 border-y border-border py-4">
            <div className="flex justify-between"><span className="text-charbon/60">Thème</span><span>{theme.label}</span></div>
            <div className="flex justify-between"><span className="text-charbon/60">Taille</span><span>{size.diameter}</span></div>
            <div className="flex justify-between"><span className="text-charbon/60">Parts</span><span>{size.parts}</span></div>
            <div className="flex justify-between"><span className="text-charbon/60">Parfum</span><span>{flavor.label}</span></div>
            {name && <div className="flex justify-between"><span className="text-charbon/60">Inscription</span><span>{name}</span></div>}
          </div>
          <div className="flex items-end justify-between">
            <span className="text-xs uppercase tracking-wider text-charbon/60">Prix estimé</span>
            <span className="font-price text-3xl text-gold">{total}€</span>
          </div>
          <a href={waLink} target="_blank" rel="noreferrer" className="btn btn-gold w-full justify-center">
            Commander sur WhatsApp
          </a>
          <p className="text-[11px] text-charbon/55 leading-relaxed">
            Confirmation sous 24h. Délai minimum 5 jours avant la date. Acompte 30% à la commande.
          </p>
        </aside>
      </section>
    </div>
  );
}
