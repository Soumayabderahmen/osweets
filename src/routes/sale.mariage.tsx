import { createFileRoute, Link } from "@tanstack/react-router";
import { PackQuoteForm } from "@/components/devis/PackQuoteForm";
import { breadcrumb, jsonLdScript, service, SITE } from "@/lib/seo";

export const Route = createFileRoute("/sale/mariage")({
  head: () => ({
    meta: [
      { title: "Salé pour mariage — Plateaux & buffet salé | Ö' Sweets" },
      {
        name: "description",
        content:
          "Buffet salé de mariage : plateaux traditionnels et prestige, bouchées à la pièce, verrines. Retrait à l'atelier ou livraison locale. Devis sous 48h.",
      },
      { property: "og:title", content: "Salé pour mariage | Ö' Sweets" },
      { property: "og:description", content: "Plateaux salés et bouchées pour votre mariage. Devis sous 48h." },
      { property: "og:type", content: "website" },
      { property: "og:url", content: `${SITE.url}/sale/mariage` },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [{ rel: "canonical", href: `${SITE.url}/sale/mariage` }],
    scripts: [
      jsonLdScript(
        service({
          name: "Salé pour mariage",
          description: "Buffet salé de mariage : plateaux traditionnels, prestige et bouchées individuelles.",
          serviceType: "Traiteur salé mariage",
          path: "/sale/mariage",
        }),
      ),
      jsonLdScript(
        breadcrumb([
          { name: "Accueil", path: "/" },
          { name: "Salé", path: "/sale" },
          { name: "Salé pour mariage", path: "/sale/mariage" },
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
          <Link to="/sale" className="hover:text-gold">Salé</Link> ·{" "}
          <span className="text-charbon/70">Salé pour mariage</span>
        </nav>

        <div className="text-center max-w-2xl mx-auto">
          <div className="text-[10px] uppercase tracking-[0.32em] text-gold">Réception</div>
          <h1 className="font-display text-4xl md:text-5xl mt-3">Salé pour mariage</h1>
          <div className="mt-4"><span className="divider-gold" /></div>
          <p className="mt-6 text-charbon/70">
            Plateaux salés traditionnels ou prestige, bouchées à la pièce et verrines fraîcheur :
            nous composons votre buffet salé selon le nombre d'invités et votre budget.
          </p>
          <p className="mt-4 text-sm text-charbon/70 border border-gold/40 bg-gold/10 px-4 py-3">
            Produits frais : <strong>retrait à l'atelier</strong> ou <strong>livraison locale</strong>
            {" "}(frais kilométriques). Pas d'expédition nationale.
          </p>
        </div>

        <div className="max-w-3xl mx-auto mt-12">
          <PackQuoteForm eventType="Salé — Mariage" />
        </div>
      </section>
    </div>
  );
}
