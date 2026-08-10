import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { zodValidator, fallback } from "@tanstack/zod-adapter";
import { useMemo } from "react";
import { products, type Product } from "@/data/products";
import { CategoryPage } from "@/components/CategoryPage";
import catSale from "@/assets/cat-sale.jpg";
import { SITE } from "@/lib/seo";

type SubKey = "all" | "traditionnel" | "prestige" | "assortis" | "individuel" | "verrines";

const has = (p: Product, t: string) => !!p.themes?.includes(t);

const subCategories: Record<SubKey, { label: string; subtitle: string; filter: (p: Product) => boolean }> = {
  all: {
    label: "Le Salé",
    subtitle:
      "Plateaux traditionnels et prestige, bouchées à la pièce et verrines fraîcheur — préparés le jour même, en retrait atelier ou livraison locale.",
    filter: (p) =>
      p.category === "sale" &&
      (has(p, "plateau-traditionnel") ||
        has(p, "plateau-prestige") ||
        has(p, "plateaux-assortis") ||
        has(p, "sale-individuel") ||
        has(p, "verrines-salees")),
  },
  traditionnel: {
    label: "Salé traditionnel",
    subtitle: "Briks, samboussek, fricassés et feuilletés — le salé tunisien authentique, façonné à la main.",
    filter: (p) => has(p, "plateau-traditionnel"),
  },
  prestige: {
    label: "Salé prestige",
    subtitle: "Bouchées gastronomiques : saumon fumé, foie gras, crevettes et truffe, dressage signature.",
    filter: (p) => has(p, "plateau-prestige"),
  },
  assortis: {
    label: "Plateaux assortis",
    subtitle: "L'équilibre parfait entre salé et sucré, avec une répartition ajustable selon vos invités.",
    filter: (p) => has(p, "plateaux-assortis"),
  },
  individuel: {
    label: "Salé individuel",
    subtitle: "Bouchées salées vendues à la pièce pour composer votre buffet sur mesure.",
    filter: (p) => has(p, "sale-individuel"),
  },
  verrines: {
    label: "Verrines salées",
    subtitle: "Verrines fraîcheur dressées le matin même, servies avec cuillère dorée.",
    filter: (p) => has(p, "verrines-salees"),
  },
};

const searchSchema = z.object({
  cat: fallback(
    z.enum(["all", "traditionnel", "prestige", "assortis", "individuel", "verrines"]),
    "all",
  ).default("all"),
});

export const Route = createFileRoute("/sale/")({
  validateSearch: zodValidator(searchSchema),
  head: () => ({
    meta: [
      { title: "Le Salé — Plateaux, bouchées & verrines | Ö' Sweets" },
      {
        name: "description",
        content:
          "Plateaux salés traditionnels et prestige, plateaux assortis, salé individuel et verrines salées. Retrait à l'atelier ou livraison locale — préparation le jour même.",
      },
      { property: "og:title", content: "Le Salé — Plateaux & bouchées | Ö' Sweets" },
      {
        property: "og:description",
        content: "Briks, samboussek, bouchées prestige et verrines fraîcheur. Retrait atelier ou livraison locale.",
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
        heroImage={catSale}
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
          <strong>Réception uniquement en local.</strong> Nos produits salés sont frais : ils sont proposés
          exclusivement en <strong>retrait à l'atelier</strong> ou en <strong>livraison locale</strong> (frais
          kilométriques selon la distance). Aucune expédition nationale par transporteur n'est possible.
        </div>
      </section>
    </div>
  );
}
