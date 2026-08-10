import { createFileRoute } from "@tanstack/react-router";
import { useMemo } from "react";
import { products as baseProducts } from "@/data/products";
import { CategoryPage, type ExtraFilterGroup } from "@/components/CategoryPage";
import { useCatalog } from "@/lib/catalog";
import { filterAvailable } from "@/lib/season";
import { patisserieProducts } from "@/lib/patisserie";
import { SITE } from "@/lib/seo";
import catPat from "@/assets/cat-patisserie.jpg";

export const Route = createFileRoute("/patisserie/")({
  head: () => ({
    meta: [
      { title: "Pâtisserie Tunisienne — Toute la boutique | Ö' Sweets" },
      {
        name: "description",
        content:
          "Toute la pâtisserie tunisienne artisanale Ö' Sweets : amandes, pistache, perles, tradition et les collections Ramadan & Aïd. Façonnée à la main à Évry-Courcouronnes.",
      },
      { property: "og:title", content: "Pâtisserie Tunisienne — Toute la boutique | Ö' Sweets" },
      {
        property: "og:description",
        content:
          "Explorez tout le savoir-faire Ö' Sweets : spécialités, collections et douceurs des grandes occasions, façonnées à la main.",
      },
      { property: "og:type", content: "website" },
      { property: "og:url", content: `${SITE.url}/patisserie` },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [{ rel: "canonical", href: `${SITE.url}/patisserie` }],
  }),
  component: Page,
});

function Page() {
  const catalog = useCatalog(baseProducts);
  const list = useMemo(() => filterAvailable(patisserieProducts(catalog)), [catalog]);

  const extraFilters: ExtraFilterGroup[] = useMemo(
    () => [
      {
        id: "collection",
        label: "Collection",
        type: "multi",
        get: (p) => p.collections ?? [],
        options: [
          { value: "amandes", label: "Amandes" },
          { value: "pistache", label: "Pistache, Machmoum & Pignon" },
          { value: "perles", label: "Perles" },
          { value: "tradition", label: "Tradition" },
          { value: "ramadan", label: "Ramadan" },
          { value: "aid", label: "Aïd" },
        ],
      },
    ],
    [],
  );

  return (
    <CategoryPage
      jsonLdPath="/patisserie"
      title="Pâtisseries Tunisiennes"
      subtitle="Toute la pâtisserie tunisienne Ö' Sweets : amandes, pistache, perles, tradition, Ramadan et Aïd. Façonnée à la main chaque matin à Évry-Courcouronnes."
      heroImage={catPat}
      breadcrumb={[{ label: "Accueil", to: "/" }, { label: "Pâtisserie Tunisienne" }]}
      products={list}
      filters={{ stock: true, price: true, allergens: true }}
      extraFilters={extraFilters}
    />
  );
}
