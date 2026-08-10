import { createFileRoute } from "@tanstack/react-router";
import { giftCategories } from "@/data/products";
import { ImmersiveCard } from "@/components/ImmersiveCard";
import catCoff from "@/assets/cat-coffrets.jpg";

export const Route = createFileRoute("/cadeaux")({
  head: () => ({
    meta: [
      { title: "Cadeaux & Coffrets — Ö' Sweets" },
      { name: "description", content: "Coffrets pour toutes les occasions : Maître & Maîtresse, naissance, remerciement, Aïd, Fête des Mères, Ramadan, anniversaire, entreprise." },
    ],
  }),
  component: Page,
});

function Page() {
  return (
    <div className="bg-ivory">
      {/* HERO */}
      <section className="relative h-[55vh] min-h-[420px] overflow-hidden">
        <img src={catCoff} alt="Coffrets cadeaux" className="absolute inset-0 h-full w-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/55 to-black/75" />
        <div className="relative z-10 h-full flex flex-col items-center justify-center text-center px-6">
          <div className="text-[10px] tracking-[0.35em] uppercase text-gold font-medium">Carrousel Immersif · Interactif & fluide</div>
          <h1 className="font-display text-5xl md:text-7xl mt-5 text-white" style={{ textShadow: "0 2px 30px rgba(0,0,0,0.5)" }}>
            L'Art d'Offrir
          </h1>
          <span className="mt-6 inline-block h-px w-16 bg-gold" />
          <p className="mt-6 max-w-xl text-white/90 font-light leading-relaxed">
            Un écrin signé Ö' Sweets pour chaque occasion d'exception.
          </p>
        </div>
      </section>

      {/* GRID — immersive cards */}
      <section className="container-os section-y">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {giftCategories.map((g) => (
            <ImmersiveCard
              key={g.slug}
              to="/cadeaux/$slug"
              params={{ slug: g.slug }}
              image={g.image}
              title={g.label}
              ratio="landscape"
            />
          ))}
        </div>
      </section>
    </div>
  );
}
