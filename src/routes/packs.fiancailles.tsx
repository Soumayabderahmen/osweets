import { createFileRoute, Link } from "@tanstack/react-router";
import { PackQuoteForm } from "@/components/devis/PackQuoteForm";
import { breadcrumb, jsonLdScript, service, SITE } from "@/lib/seo";

export const Route = createFileRoute("/packs/fiancailles")({
  head: () => ({
    meta: [
      { title: "Pack Fiançailles sur mesure | Ö' Sweets Pâtisserie" },
      {
        name: "description",
        content:
          "Pack Fiançailles Ö' Sweets : plateaux sucrés et salés, degla farcie, mignardises, Kaak Warka amande/pistache/noisette et présentation. Devis sous 48h.",
      },
      { property: "og:title", content: "Pack Fiançailles sur mesure | Ö' Sweets" },
      { property: "og:description", content: "Composez votre pack fiançailles : plateaux, mignardises, Kaak Warka, présentation. Devis sous 48h." },
      { property: "og:type", content: "website" },
      { property: "og:url", content: `${SITE.url}/packs/fiancailles` },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [{ rel: "canonical", href: `${SITE.url}/packs/fiancailles` }],
    scripts: [
      jsonLdScript(
        service({
          name: "Pack Fiançailles",
          description: "Pack pâtisserie complet pour fiançailles : plateaux sucrés et salés, mignardises, présentation.",
          serviceType: "Traiteur pâtisserie fiançailles",
          path: "/packs/fiancailles",
        }),
      ),
      jsonLdScript(
        breadcrumb([
          { name: "Accueil", path: "/" },
          { name: "Packs", path: "/packs/fiancailles" },
          { name: "Pack Fiançailles", path: "/packs/fiancailles" },
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
          <span className="text-charbon/70">Pack Fiançailles</span>
        </nav>

        <div className="text-center max-w-2xl mx-auto">
          <div className="text-[10px] uppercase tracking-[0.32em] text-gold">Cérémonie</div>
          <h1 className="font-display text-4xl md:text-5xl mt-3">Pack Fiançailles</h1>
          <div className="mt-4"><span className="divider-gold" /></div>
          <p className="mt-6 text-charbon/70">
            Plateaux tunisiens, degla farcie, Kaak Warka amande, pistache ou noisette, mignardises et
            mise en scène soignée — composez votre pack et recevez un devis personnalisé.
          </p>
        </div>

        <div className="max-w-3xl mx-auto mt-12">
          <PackQuoteForm eventType="Fiançailles" />
        </div>
      </section>
    </div>
  );
}
