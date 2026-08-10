import { createFileRoute } from "@tanstack/react-router";
import { events } from "@/data/products";
import { ImmersiveCard } from "@/components/ImmersiveCard";
import wedding from "@/assets/wedding-buffet.jpg";

export const Route = createFileRoute("/evenements/")({
  head: () => ({
    meta: [
      { title: "Événements — Ö' Sweets" },
      { name: "description", content: "Mariage, anniversaire, baby shower, fiançailles, entreprise, Ramadan, Aïd. Devis sur mesure." },
    ],
  }),
  component: Page,
});

function Page() {
  return (
    <div className="bg-ivory">
      <section className="relative h-[55vh] min-h-[420px] overflow-hidden">
        <img src={wedding} alt="Événements" className="absolute inset-0 h-full w-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/55 to-black/75" />
        <div className="relative z-10 h-full flex flex-col items-center justify-center text-center px-6">
          <div className="text-[10px] tracking-[0.35em] uppercase text-gold font-medium">Vos moments précieux</div>
          <h1 className="font-display text-5xl md:text-7xl mt-5 text-white" style={{ textShadow: "0 2px 30px rgba(0,0,0,0.5)" }}>
            Événements
          </h1>
          <span className="mt-6 inline-block h-px w-16 bg-gold" />
          <p className="mt-6 max-w-xl text-white/90 font-light leading-relaxed">
            Vos plus beaux moments, sublimés par Ö' Sweets.
          </p>
        </div>
      </section>

      <section className="container-os section-y">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {events.map((e) => (
            <ImmersiveCard
              key={e.slug}
              to="/evenements/$slug"
              params={{ slug: e.slug }}
              image={e.image}
              title={e.label}
              ratio="landscape"
            />
          ))}
        </div>
      </section>
    </div>
  );
}
