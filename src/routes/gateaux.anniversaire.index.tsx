import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { cakeThemes, type ThemeCategory } from "@/data/themes";
import catCakes from "@/assets/cat-cakes.jpg";

export const Route = createFileRoute("/gateaux/anniversaire/")({
  head: () => ({
    meta: [
      { title: "Gâteaux d'anniversaire — Ö' Sweets" },
      { name: "description", content: "Choisissez parmi nos thèmes de gâteaux d'anniversaire : Licorne, Reine des Neiges, Spider-Man, Princesse…" },
    ],
  }),
  component: Page,
});

const tabs: { id: "all" | ThemeCategory; label: string }[] = [
  { id: "all", label: "Tous les thèmes" },
  { id: "age", label: "Par âge" },
  { id: "motif", label: "Par motif" },
  { id: "occasion", label: "Par occasion" },
];

function Page() {
  const [tab, setTab] = useState<"all" | ThemeCategory>("all");
  const themes = tab === "all" ? cakeThemes : cakeThemes.filter((t) => t.category === tab);

  return (
    <div className="bg-white">
      {/* Hero */}
      <section className="relative overflow-hidden bg-sable border-b border-border">
        <img src={catCakes} alt="Anniversaire" className="absolute inset-0 h-full w-full object-cover opacity-40" />
        <div className="absolute inset-0 bg-gradient-to-b from-ivory/30 via-ivory/60 to-ivory/95" />
        <div className="relative z-10 container-os py-16 md:py-24 text-center">
          <div className="text-[11px] uppercase tracking-[0.22em] text-charbon/60 mb-5">
            <Link to="/" className="hover:text-gold">Accueil</Link>
            <span className="mx-2">/</span>
            <Link to="/gateaux" className="hover:text-gold">Gâteaux</Link>
            <span className="mx-2">/</span>
            <span className="text-gold">Anniversaire</span>
          </div>
          <h1 className="font-display text-4xl md:text-5xl text-charbon">Gâteaux d'anniversaire</h1>
          <p className="mt-5 max-w-2xl mx-auto text-charbon/70 font-light leading-relaxed">
            Choisissez votre thème — chaque gâteau est ensuite personnalisable (parfum, taille, message).
          </p>
          <div className="mt-8">
            <Link to="/gateaux/anniversaire/personnaliser" className="btn btn-outline-gold">
              Concevoir un gâteau sur mesure →
            </Link>
          </div>
        </div>
      </section>

      {/* Filters */}
      <section className="container-os pt-10">
        <div className="flex flex-wrap justify-center gap-2">
          {tabs.map((t) => (
            <button key={t.id} onClick={() => setTab(t.id)}
              className={`text-xs uppercase tracking-[0.2em] px-5 py-2.5 border transition ${
                tab === t.id
                  ? "border-gold bg-gold text-white"
                  : "border-border text-charbon/70 hover:border-gold hover:text-gold"
              }`}>
              {t.label}
            </button>
          ))}
        </div>
      </section>

      {/* Themes Grid */}
      <section className="container-os py-12 pb-24">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {themes.map((t) => (
            <Link
              key={t.id}
              to="/gateaux/anniversaire/$theme"
              params={{ theme: t.id }}
              className="group block relative aspect-[3/4] overflow-hidden bg-sable"
            >
              <img src={t.image} alt={t.label} loading="lazy"
                className="absolute inset-0 h-full w-full object-cover transition duration-700 group-hover:scale-110" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-transparent" />
              <div className="absolute inset-x-0 bottom-0 p-5 text-white">
                <div className="text-3xl mb-2">{t.emoji}</div>
                <h3 className="font-display text-lg leading-tight text-white">{t.label}</h3>
                <span className="inline-block mt-3 text-[10px] tracking-[0.28em] uppercase text-gold border-b border-gold pb-0.5 opacity-0 group-hover:opacity-100 transition">
                  Voir →
                </span>
              </div>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
