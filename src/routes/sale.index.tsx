import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { zodValidator, fallback } from "@tanstack/zod-adapter";
import { CategoryPage } from "@/components/CategoryPage";
import bandeauSale from "@/assets/bandeau-plateaux-sales.jpg";
import { SITE } from "@/lib/seo";
import { useSaleProducts } from "@/lib/sale";

/*
 * Les plateaux viennent de l'admin (fiches « salé » de la base) : un
 * plateau ajouté, renommé ou masqué là-bas change cette page et ses
 * boutons sans toucher au code. `cat` désigne un plateau par son adresse ;
 * les anciens liens (?cat=classique, ?cat=prestige) restent valables.
 */
const searchSchema = z.object({
  cat: fallback(z.string(), "all").default("all"),
});

export const Route = createFileRoute("/sale/")({
  validateSearch: zodValidator(searchSchema),
  head: () => ({
    meta: [
      { title: "Plateaux salés — Classique et Prestige, 40 pièces | Ö' Sweets" },
      {
        name: "description",
        content:
          "Plateaux salés de 40 pièces : fricassés, mini hamburgers, quiches, crevettes panées. Retrait à l'atelier ou livraison locale — préparation le jour même.",
      },
      { property: "og:title", content: "Plateaux salés — Classique et Prestige | Ö' Sweets" },
      {
        property: "og:description",
        content:
          "Fricassés, mini hamburgers, quiches, crevettes panées : nos plateaux de 40 pièces. Retrait atelier ou livraison locale.",
      },
      { property: "og:type", content: "website" },
      { property: "og:url", content: `${SITE.url}/sale` },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [{ rel: "canonical", href: `${SITE.url}/sale` }],
  }),
  component: SalePage,
});

function SalePage() {
  const { cat } = Route.useSearch();
  const plateaux = useSaleProducts();
  const choisi = plateaux.find((p) => p.slug === cat || p.slug === `plateau-sale-${cat}`);
  const affiches = choisi ? [choisi] : plateaux;

  return (
    <div>
      <CategoryPage
        jsonLdPath="/sale"
        title={choisi?.name ?? "Plateaux salés"}
        subtitle={
          choisi?.shortDesc ??
          "Nos plateaux de pièces salées, préparés le jour même pour vos réceptions."
        }
        heroImage={bandeauSale}
        bannerEyebrow="Salé"
        tabs={[
          { label: "Tous les plateaux", to: "/sale", active: !choisi },
          ...plateaux.map((p) => ({
            label: p.name,
            to: `/sale?cat=${p.slug}`,
            active: choisi?.slug === p.slug,
          })),
        ]}
        breadcrumb={[
          { label: "Accueil", to: "/" },
          { label: "Salé", to: "/sale" },
          ...(choisi ? [{ label: choisi.name }] : []),
        ]}
        products={affiches}
        filters={{ stock: true, price: true, allergens: true }}
      />

      <section className="container-os pb-16">
        <div className="border border-gold/40 bg-gold/10 px-5 py-4 text-sm text-charbon/80">
          <strong>Réception uniquement en local.</strong> Nos produits salés sont frais : ils sont
          proposés exclusivement en <strong>retrait à l'atelier</strong> ou en{" "}
          <strong>livraison locale</strong> (frais kilométriques selon la distance). Aucune
          expédition nationale par transporteur n'est possible.
        </div>
      </section>
    </div>
  );
}
