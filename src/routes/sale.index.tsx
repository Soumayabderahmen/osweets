import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { zodValidator, fallback } from "@tanstack/zod-adapter";
import { useMemo } from "react";
import { products, type Product } from "@/data/products";
import { CategoryPage } from "@/components/CategoryPage";
import bandeauSale from "@/assets/bandeau-plateaux-sales.jpg";
import { SITE } from "@/lib/seo";

type SubKey = "all" | "classique" | "prestige";

const has = (p: Product, t: string) => !!p.themes?.includes(t);

const subCategories: Record<
  SubKey,
  { label: string; subtitle: string; filter: (p: Product) => boolean }
> = {
  all: {
    label: "Plateaux salés",
    subtitle: "Deux plateaux de 40 pièces, préparés le jour même pour vos réceptions.",
    filter: (p) =>
      p.category === "sale" && (has(p, "plateau-classique") || has(p, "plateau-prestige")),
  },
  classique: {
    label: "Plateau Classique",
    subtitle: "40 pièces : fricassés, mini hamburgers, tacos et brik dannouni.",
    filter: (p) => has(p, "plateau-classique"),
  },
  prestige: {
    label: "Plateau Prestige",
    subtitle:
      "40 pièces : quiches au poulet, crevettes panées, mini sandwichs au saumon et croquants au gouda.",
    filter: (p) => has(p, "plateau-prestige"),
  },
};

const searchSchema = z.object({
  cat: fallback(z.enum(["all", "classique", "prestige"]), "all").default("all"),
});

export const Route = createFileRoute("/sale/")({
  validateSearch: zodValidator(searchSchema),
  head: () => ({
    meta: [
      { title: "Plateaux salés — Classique et Prestige, 40 pièces | Ö' Sweets" },
      {
        name: "description",
        content:
          "Plateau Classique (40 pièces, 45 €) et Plateau Prestige (40 pièces, 55 €). Retrait à l'atelier ou livraison locale — préparation le jour même.",
      },
      { property: "og:title", content: "Plateaux salés — Classique et Prestige | Ö' Sweets" },
      {
        property: "og:description",
        content:
          "Fricassés, mini hamburgers, quiches, crevettes panées : deux plateaux de 40 pièces. Retrait atelier ou livraison locale.",
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
  const sub = subCategories[cat as SubKey];
  const filtered = useMemo(() => products.filter(sub.filter), [sub]);

  return (
    <div>
      <CategoryPage
        jsonLdPath="/sale"
        title={sub.label}
        subtitle={sub.subtitle}
        heroImage={bandeauSale}
        bannerEyebrow="Salé"
        tabs={[
          { label: "Tous les plateaux", to: "/sale", active: cat === "all" },
          { label: "Plateau Classique", to: "/sale?cat=classique", active: cat === "classique" },
          { label: "Plateau Prestige", to: "/sale?cat=prestige", active: cat === "prestige" },
        ]}
        breadcrumb={[
          { label: "Accueil", to: "/" },
          { label: "Salé", to: "/sale" },
          ...(cat !== "all" ? [{ label: sub.label }] : []),
        ]}
        products={filtered}
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
