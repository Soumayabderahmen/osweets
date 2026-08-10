import { createFileRoute, Link } from "@tanstack/react-router";
import catCakes from "@/assets/cat-cakes.jpg";
import cakePistache from "@/assets/cake-pistache.jpg";
import cakeChocolat from "@/assets/cake-chocolat.jpg";

export const Route = createFileRoute("/gateaux/")({
  head: () => ({
    meta: [
      { title: "Gâteaux — Ö' Sweets" },
      { name: "description", content: "Gâteaux de voyage, cheesecake, tiramisu, tartes, fraisier, gâteaux d'anniversaire à thème, wedding cakes sur mesure." },
    ],
  }),
  component: Page,
});

function Page() {
  const sections = [
    {
      to: "/gateaux/cheesecake",
      title: "Cheesecake",
      desc: "Onctueux, aérien — à la new-yorkaise ou revisité.",
      img: cakeChocolat,
      tag: "Bientôt",
    },
    {
      to: "/gateaux/tiramisu",
      title: "Tiramisu",
      desc: "Mascarpone soyeux, café intense, la douceur italienne.",
      img: cakePistache,
      tag: "Bientôt",
    },
    {
      to: "/gateaux/tartes",
      title: "Tartes",
      desc: "Sablé croustillant, fruits de saison, chocolat, citron.",
      img: catCakes,
      tag: "Bientôt",
    },
    {
      to: "/gateaux/fraisier",
      title: "Fraisier",
      desc: "Génoise moelleuse, crème mousseline, fraises fraîches.",
      img: cakePistache,
      tag: "Bientôt",
    },
    {
      to: "/gateaux/gateaux-de-voyage",
      title: "Gâteaux de voyage",
      desc: "Citron, chocolat, vanille, pistache, noisette — nos cakes signature qui voyagent.",
      img: cakeChocolat,
      tag: "Boutique",
    },
    {
      to: "/gateaux/anniversaire",
      title: "Anniversaire",
      desc: "Plus de 15 thèmes — Licorne, Reine des Neiges, Spider-Man…",
      img: cakePistache,
      tag: "Thèmes",
    },
    {
      to: "/gateaux/anniversaire/personnaliser",
      title: "Configurer mon anniversaire",
      desc: "Sur mesure : parfum, taille, message, décor.",
      img: catCakes,
      tag: "Sur mesure",
    },
    {
      to: "/gateaux/wedding-cakes",
      title: "Wedding Cakes",
      desc: "Mariages, cérémonies — création signature.",
      img: catCakes,
      tag: "Sur mesure",
    },
    {
      to: "/gateaux/gender-reveal",
      title: "Gender Reveal 🎀",
      desc: "Gâteau surprise fille ou garçon pour révéler le sexe de bébé.",
      img: cakePistache,
      tag: "Sur mesure",
    },
  ];
  return (
    <div>
      <section className="relative h-[55vh] min-h-[420px] overflow-hidden">
        <img src={catCakes} alt="Gâteaux" className="absolute inset-0 h-full w-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/55 to-black/75" />
        <div className="relative z-10 h-full flex flex-col items-center justify-center text-white text-center px-6">
          <div className="text-[10px] tracking-[0.35em] uppercase text-gold font-medium">Nos gâteaux</div>
          <h1 className="font-display text-5xl md:text-7xl mt-5 text-white" style={{ textShadow: "0 2px 30px rgba(0,0,0,0.5)" }}>
            Gâteaux
          </h1>
          <span className="mt-6 inline-block h-px w-16 bg-gold" />
          <p className="mt-6 max-w-xl text-white/90 font-light">
            L'art du gâteau, entre rigueur française et générosité tunisienne.
          </p>
        </div>
      </section>
      <section className="container-os section-y grid md:grid-cols-3 gap-6">
        {sections.map((s) => (
          <Link key={s.title} to={s.to} className="group block hover-lift">
            <div className="relative aspect-[4/5] overflow-hidden bg-sable">
              <img src={s.img} alt={s.title} loading="lazy" className="absolute inset-0 h-full w-full object-cover transition duration-700 group-hover:scale-110" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-transparent" />
              <span className="absolute top-4 left-4 text-[10px] tracking-[0.22em] uppercase bg-gold/95 text-white px-3 py-1">{s.tag}</span>
              <div className="absolute bottom-0 left-0 right-0 p-7 text-white">
                <h3 className="font-display text-2xl text-white">{s.title}</h3>
                <p className="text-sm text-white/85 mt-2 font-light">{s.desc}</p>
                <span className="inline-block mt-4 text-[10px] tracking-[0.3em] uppercase text-gold border-b border-gold pb-1">Découvrir →</span>
              </div>
            </div>
          </Link>
        ))}
      </section>
    </div>
  );
}
