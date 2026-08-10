import { createFileRoute } from "@tanstack/react-router";
import { CakeCatalogPage, type CakeItem } from "@/components/gateaux/CakeCatalogPage";
import catCakes from "@/assets/cat-cakes.jpg";
import cakeChocolat from "@/assets/cake-chocolat.jpg";
import cakePistache from "@/assets/cake-pistache.jpg";
import { breadcrumb, jsonLdScript, SITE } from "@/lib/seo";

const ITEMS: CakeItem[] = [
  {
    slug: "voyage-cake-citron",
    name: "Cake citron",
    flavor: "citron",
    size: "gâteau de voyage",
    price: 22,
    image: cakeChocolat,
    inStock: true,
    ingredients: ["Farine", "Beurre", "Œufs", "Sucre", "Citron"],
    allergens: ["gluten", "œufs", "lactose"],
    conservation: "Se conserve 8 jours à température ambiante.",
    leadTime: "48h",
  },
  {
    slug: "voyage-financier-noisette",
    name: "Financier noisette du Piémont I.G.P.",
    flavor: "noisette",
    size: "gâteau de voyage",
    price: 24,
    image: cakePistache,
    inStock: true,
    ingredients: ["Noisette du Piémont I.G.P.", "Beurre noisette", "Blancs d'œufs", "Sucre glace"],
    allergens: ["gluten", "œufs", "fruits à coque", "lactose"],
    conservation: "Se conserve 10 jours à température ambiante.",
    leadTime: "48h",
  },
  {
    slug: "voyage-cake-pecan-vanille",
    name: "Cake noix de pécan & vanille",
    flavor: "vanille",
    size: "gâteau de voyage",
    price: 26,
    image: cakeChocolat,
    inStock: true,
    ingredients: ["Farine", "Beurre", "Vanille de Madagascar", "Noix de pécan"],
    allergens: ["gluten", "œufs", "fruits à coque", "lactose"],
    conservation: "Se conserve 8 jours à température ambiante.",
    leadTime: "48h",
  },
  {
    slug: "voyage-cake-chocolat",
    name: "Cake chocolat noir intense",
    flavor: "chocolat",
    size: "gâteau de voyage",
    price: 24,
    image: cakeChocolat,
    inStock: true,
    ingredients: ["Chocolat noir 70%", "Beurre", "Œufs", "Farine"],
    allergens: ["gluten", "œufs", "lactose"],
    conservation: "Se conserve 8 jours à température ambiante.",
    leadTime: "48h",
  },
  {
    slug: "voyage-cake-pistache",
    name: "Cake pistache & fleur d'oranger",
    flavor: "pistache",
    size: "gâteau de voyage",
    price: 26,
    image: cakePistache,
    inStock: true,
    ingredients: ["Pistache de Sicile", "Fleur d'oranger", "Beurre", "Œufs"],
    allergens: ["gluten", "œufs", "fruits à coque", "lactose"],
    conservation: "Se conserve 8 jours à température ambiante.",
    leadTime: "48h",
  },
  {
    slug: "voyage-brownie",
    name: "Brownie chocolat & noix de pécan",
    flavor: "chocolat",
    size: "gâteau de voyage",
    price: 18,
    image: cakeChocolat,
    inStock: true,
    ingredients: ["Chocolat noir", "Beurre", "Noix de pécan", "Œufs"],
    allergens: ["gluten", "œufs", "fruits à coque", "lactose"],
    conservation: "Se conserve 6 jours à température ambiante.",
    leadTime: "48h",
  },
  {
    slug: "voyage-cookie",
    name: "Cookie chocolat & noisette",
    flavor: "chocolat",
    size: "gâteau de voyage",
    price: 4,
    image: cakePistache,
    inStock: true,
    ingredients: ["Farine", "Beurre", "Pépites de chocolat", "Noisette"],
    allergens: ["gluten", "œufs", "fruits à coque", "lactose"],
    conservation: "Se conserve 5 jours à température ambiante.",
    leadTime: "48h",
  },
  {
    slug: "voyage-madeleines",
    name: "Madeleines au miel",
    flavor: "vanille",
    size: "gâteau de voyage",
    price: 12,
    image: cakeChocolat,
    inStock: true,
    ingredients: ["Farine", "Beurre", "Œufs", "Miel", "Vanille"],
    allergens: ["gluten", "œufs", "lactose"],
    conservation: "Se conserve 5 jours à température ambiante.",
    leadTime: "48h",
  },
];

export const Route = createFileRoute("/gateaux/voyage")({
  head: () => ({
    meta: [
      { title: "Gâteaux de voyage | Ö' Sweets Pâtisserie" },
      {
        name: "description",
        content:
          "Nos gâteaux de voyage : cakes, financiers, brownies, cookies, madeleines — des douceurs qui se conservent et se partagent.",
      },
      { property: "og:title", content: "Gâteaux de voyage | Ö' Sweets" },
      { property: "og:url", content: `${SITE.url}/gateaux/voyage` },
    ],
    links: [{ rel: "canonical", href: `${SITE.url}/gateaux/voyage` }],
    scripts: [
      jsonLdScript(
        breadcrumb([
          { name: "Accueil", path: "/" },
          { name: "Gâteaux", path: "/gateaux" },
          { name: "Gâteaux de voyage", path: "/gateaux/voyage" },
        ]),
      ),
    ],
  }),
  component: () => (
    <CakeCatalogPage
      jsonLdPath="/gateaux/voyage"
      title="Gâteaux de voyage"
      subtitle="Cakes, financiers, brownies, cookies et madeleines — des douceurs qui se conservent, se transportent et se partagent."
      heroImage={catCakes}
      items={ITEMS}
      flavors={["citron", "chocolat", "vanille", "pistache", "noisette"]}
      flavorLabels={{
        citron: "Citron",
        chocolat: "Chocolat",
        vanille: "Vanille",
        pistache: "Pistache",
        noisette: "Noisette",
      }}
      sizes={[]}
      freshnessNote="Se conservent plusieurs jours à température ambiante, dans leur emballage d'origine."
    />
  ),
});
