import { createFileRoute, Link } from "@tanstack/react-router";
import { ProOfferForm } from "@/components/devis/ProOfferForm";
import { breadcrumb, jsonLdScript, service, SITE } from "@/lib/seo";

export const Route = createFileRoute("/offre-professionnelle")({
  head: () => ({
    meta: [
      { title: "Offre professionnelle & cadeaux d'entreprise | Ö' Sweets" },
      {
        name: "description",
        content:
          "Coffrets brandés, séminaires, cadeaux clients et commandes récurrentes : demandez votre offre professionnelle Ö' Sweets. Réponse sous 48h.",
      },
      { property: "og:title", content: "Offre professionnelle | Ö' Sweets" },
      { property: "og:description", content: "Coffrets brandés, séminaires, cadeaux clients — devis pro sous 48h." },
      { property: "og:type", content: "website" },
      { property: "og:url", content: `${SITE.url}/offre-professionnelle` },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [{ rel: "canonical", href: `${SITE.url}/offre-professionnelle` }],
    scripts: [
      jsonLdScript(
        service({
          name: "Offre professionnelle",
          description: "Coffrets d'entreprise, séminaires et cadeaux clients personnalisés.",
          serviceType: "Cadeaux d'entreprise",
          path: "/offre-professionnelle",
        }),
      ),
      jsonLdScript(
        breadcrumb([
          { name: "Accueil", path: "/" },
          { name: "Offre professionnelle", path: "/offre-professionnelle" },
        ]),
      ),
    ],
  }),
  component: Page,
});

function Page() {
  return (
    <div className="bg-ivory">
      <section className="container-os section-y">
        <nav className="text-xs text-charbon/50 mb-8" aria-label="Fil d'Ariane">
          <Link to="/" className="hover:text-gold">Accueil</Link> ·{" "}
          <span className="text-charbon/70">Offre professionnelle</span>
        </nav>

        <div className="text-center max-w-2xl mx-auto">
          <div className="text-[10px] uppercase tracking-[0.32em] text-gold">Entreprises</div>
          <h1 className="font-display text-4xl md:text-5xl mt-3">Demander une offre professionnelle</h1>
          <div className="mt-4"><span className="divider-gold" /></div>
          <p className="mt-6 text-charbon/70">
            Coffrets brandés à votre logo, pauses gourmandes, séminaires et cadeaux clients :
            nous construisons une offre adaptée à votre volume et à votre budget.
          </p>
        </div>

        <div className="max-w-3xl mx-auto mt-12">
          <ProOfferForm />
        </div>
      </section>
    </div>
  );
}
