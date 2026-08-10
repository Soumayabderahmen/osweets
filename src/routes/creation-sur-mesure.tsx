import { createFileRoute, Link } from "@tanstack/react-router";
import { CustomRequestForm } from "@/components/devis/CustomRequestForm";
import { SITE } from "@/lib/seo";

const str = (v: unknown) => (typeof v === "string" && v.trim() ? v : undefined);

export const Route = createFileRoute("/creation-sur-mesure")({
  head: () => ({
    meta: [
      { title: "Demander une création sur mesure | Ö' Sweets Pâtisserie" },
      {
        name: "description",
        content:
          "Gâteau personnalisé, wedding cake, bento cake, coffret, mariage, fiançailles, circoncision ou commande pro : décrivez votre projet et recevez un devis sous 48h.",
      },
      { property: "og:title", content: "Demander une création sur mesure | Ö' Sweets" },
      { property: "og:description", content: "Décrivez votre projet sur mesure — devis personnalisé sous 48h." },
      { property: "og:type", content: "website" },
      { property: "og:url", content: `${SITE.url}/creation-sur-mesure` },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [{ rel: "canonical", href: `${SITE.url}/creation-sur-mesure` }],
  }),
  validateSearch: (s: Record<string, unknown>) => ({ type: str(s.type) }),
  component: Page,
});

function Page() {
  const { type } = Route.useSearch();
  return (
    <div className="bg-ivory">
      <section className="container-os section-y">
        <nav className="text-xs text-charbon/50 mb-8" aria-label="Fil d'Ariane">
          <Link to="/" className="hover:text-gold">Accueil</Link> ·{" "}
          <span className="text-charbon/70">Création sur mesure</span>
        </nav>

        <div className="text-center max-w-2xl mx-auto">
          <div className="text-[10px] uppercase tracking-[0.32em] text-gold">Atelier</div>
          <h1 className="font-display text-4xl md:text-5xl mt-3">Demander une création sur mesure</h1>
          <div className="mt-4"><span className="divider-gold" /></div>
          <p className="mt-6 text-charbon/70">
            Chaque création est imaginée avec vous. Remplissez le formulaire : il s'agit d'une demande de devis,
            pas d'une commande payée immédiatement.
          </p>
        </div>

        <div className="max-w-3xl mx-auto mt-12">
          <CustomRequestForm defaultType={type} />
        </div>
      </section>
    </div>
  );
}
