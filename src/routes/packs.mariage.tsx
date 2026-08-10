import { createFileRoute, Link } from "@tanstack/react-router";
import { PackQuoteForm } from "@/components/devis/PackQuoteForm";
import { breadcrumb, jsonLdScript, service, SITE } from "@/lib/seo";

export const Route = createFileRoute("/packs/mariage")({
  head: () => ({
    meta: [
      { title: "Pack Mariage sur mesure | Ö' Sweets Pâtisserie" },
      {
        name: "description",
        content:
          "Pack Mariage Ö' Sweets : wedding cake, sucré et salé par pièce ou plateau, degla farcie, mignardises, Kaak Warka et présentation. Devis personnalisé sous 48h.",
      },
      { property: "og:title", content: "Pack Mariage sur mesure | Ö' Sweets" },
      { property: "og:description", content: "Composez votre pack mariage : wedding cake, buffet sucré & salé, présentation. Devis sous 48h." },
      { property: "og:type", content: "website" },
      { property: "og:url", content: `${SITE.url}/packs/mariage` },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [{ rel: "canonical", href: `${SITE.url}/packs/mariage` }],
    scripts: [
      jsonLdScript(
        service({
          name: "Pack Mariage",
          description: "Pack pâtisserie complet pour mariage : wedding cake, buffet sucré et salé, présentation.",
          serviceType: "Traiteur pâtisserie mariage",
          path: "/packs/mariage",
        }),
      ),
      jsonLdScript(
        breadcrumb([
          { name: "Accueil", path: "/" },
          { name: "Packs", path: "/packs/mariage" },
          { name: "Pack Mariage", path: "/packs/mariage" },
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
          <span className="text-charbon/70">Pack Mariage</span>
        </nav>

        <div className="text-center max-w-2xl mx-auto">
          <div className="text-[10px] uppercase tracking-[0.32em] text-gold">Cérémonie</div>
          <h1 className="font-display text-4xl md:text-5xl mt-3">Pack Mariage</h1>
          <div className="mt-4"><span className="divider-gold" /></div>
          <p className="mt-6 text-charbon/70">
            Wedding cake, buffet sucré et salé, degla farcie, mignardises, Kaak Warka et mise en scène :
            composez votre pack et recevez un devis personnalisé.
          </p>
        </div>

        <div className="max-w-3xl mx-auto mt-12">
          <PackQuoteForm eventType="Mariage" />
        </div>
      </section>
    </div>
  );
}
