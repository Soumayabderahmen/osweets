import { createFileRoute, Link } from "@tanstack/react-router";
import { PackQuoteForm } from "@/components/devis/PackQuoteForm";
import { breadcrumb, jsonLdScript, service, SITE } from "@/lib/seo";

export const Route = createFileRoute("/packs/circoncision")({
  head: () => ({
    meta: [
      { title: "Pack Circoncision / Thour | Ö' Sweets Pâtisserie" },
      {
        name: "description",
        content:
          "Pack Circoncision (Thour) Ö' Sweets : plateaux sucrés et salés, degla farcie, mignardises, Kaak Warka et présentation traditionnelle. Devis sous 48h.",
      },
      { property: "og:title", content: "Pack Circoncision / Thour | Ö' Sweets" },
      { property: "og:description", content: "Composez votre pack Thour : plateaux sucrés & salés, mignardises, présentation. Devis sous 48h." },
      { property: "og:type", content: "website" },
      { property: "og:url", content: `${SITE.url}/packs/circoncision` },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [{ rel: "canonical", href: `${SITE.url}/packs/circoncision` }],
    scripts: [
      jsonLdScript(
        service({
          name: "Pack Circoncision / Thour",
          description: "Pack pâtisserie traditionnel pour circoncision (Thour) : plateaux sucrés et salés, présentation.",
          serviceType: "Traiteur pâtisserie circoncision",
          path: "/packs/circoncision",
        }),
      ),
      jsonLdScript(
        breadcrumb([
          { name: "Accueil", path: "/" },
          { name: "Packs", path: "/packs/circoncision" },
          { name: "Pack Circoncision", path: "/packs/circoncision" },
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
          <span className="text-charbon/70">Pack Circoncision / Thour</span>
        </nav>

        <div className="text-center max-w-2xl mx-auto">
          <div className="text-[10px] uppercase tracking-[0.32em] text-gold">Tradition</div>
          <h1 className="font-display text-4xl md:text-5xl mt-3">Pack Circoncision / Thour</h1>
          <div className="mt-4"><span className="divider-gold" /></div>
          <p className="mt-6 text-charbon/70">
            La tradition du Thour dans les règles de l'art : plateaux sucrés et salés, degla farcie,
            Kaak Warka, mignardises et présentation d'exception.
          </p>
        </div>

        <div className="max-w-3xl mx-auto mt-12">
          <PackQuoteForm eventType="Circoncision / Thour" />
        </div>
      </section>
    </div>
  );
}
