import { createFileRoute } from "@tanstack/react-router";
import catCakes from "@/assets/cat-cakes.jpg";
import cakeChocolat from "@/assets/cake-chocolat.jpg";
import cakePistache from "@/assets/cake-pistache.jpg";
import cakeCitron from "@/assets/cake-citron.jpg";
import cakeVanille from "@/assets/cake-vanille.jpg";
import { CakeCatalogPage, type CakeItem } from "@/components/gateaux/CakeCatalogPage";
import { breadcrumb, jsonLdScript, SITE } from "@/lib/seo";

const ITEMS: CakeItem[] = [
  { slug: "tiramisu-classique-verrine", name: "Tiramisu Classique — Verrine", flavor: "cafe", size: "verrine", price: 7,
    image: cakeChocolat, ingredients: ["Mascarpone", "café", "biscuits savoyard", "œuf", "cacao"],
    allergens: ["Gluten", "lait", "œuf"], conservation: "Au frais, sous 48h.", leadTime: "48h" },
  { slug: "tiramisu-classique-plat", name: "Tiramisu Classique — Plat", flavor: "cafe", size: "plat", price: 38,
    image: cakeChocolat, ingredients: ["Mascarpone", "café", "biscuits savoyard", "œuf", "cacao"],
    allergens: ["Gluten", "lait", "œuf"], conservation: "Au frais, sous 48h.", leadTime: "48h" },
  { slug: "tiramisu-pistache-verrine", name: "Tiramisu Pistache — Verrine", flavor: "pistache", size: "verrine", price: 8,
    image: cakePistache, ingredients: ["Mascarpone", "pâte de pistache", "biscuits amande", "œuf"],
    allergens: ["Gluten", "lait", "œuf", "fruits à coque"], conservation: "Au frais, sous 48h.", leadTime: "48h" },
  { slug: "tiramisu-fruits-rouges", name: "Tiramisu Fruits Rouges — Verrine", flavor: "fruits-rouges", size: "verrine", price: 8,
    image: cakeCitron, ingredients: ["Mascarpone", "coulis fruits rouges", "biscuits", "framboises"],
    allergens: ["Gluten", "lait", "œuf"], conservation: "Au frais, sous 48h.", leadTime: "48h" },
  { slug: "tiramisu-speculoos-plat", name: "Tiramisu Spéculoos — Plat", flavor: "speculoos", size: "plat", price: 42,
    image: cakeVanille, ingredients: ["Mascarpone", "biscuits spéculoos", "café doux", "œuf"],
    allergens: ["Gluten", "lait", "œuf", "soja"], conservation: "Au frais, sous 48h.", leadTime: "48h" },
];

export const Route = createFileRoute("/gateaux/tiramisu")({
  head: () => ({
    meta: [
      { title: "Tiramisu Artisanal | Ö' Sweets Pâtisserie" },
      { name: "description", content: "Tiramisu classique café, pistache, fruits rouges ou spéculoos. Verrines individuelles ou plat à partager. Frais, sans conservateur." },
      { property: "og:title", content: "Tiramisu Artisanal | Ö' Sweets" },
      { property: "og:description", content: "Verrines individuelles ou plat à partager." },
      { property: "og:url", content: `${SITE.url}/gateaux/tiramisu` },
    ],
    links: [{ rel: "canonical", href: `${SITE.url}/gateaux/tiramisu` }],
    scripts: [jsonLdScript(breadcrumb([
      { name: "Accueil", path: "/" }, { name: "Gâteaux", path: "/gateaux" }, { name: "Tiramisu", path: "/gateaux/tiramisu" },
    ]))],
  }),
  component: () => (
    <CakeCatalogPage
      jsonLdPath="/gateaux/tiramisu"
      title="Tiramisu"
      subtitle="Le grand classique italien, revisité à la façon Ö' Sweets."
      heroImage={catCakes}
      items={ITEMS}
      flavors={["cafe", "pistache", "fruits-rouges", "speculoos"]}
      flavorLabels={{ cafe: "Café", pistache: "Pistache", "fruits-rouges": "Fruits rouges", speculoos: "Spéculoos" }}
      sizes={["verrine", "plat"]}
      sizeLabel="Format"
      sizeLabels={{ verrine: "Verrine", plat: "Plat à partager" }}
      freshnessNote="Produit frais — à conserver au frais, à consommer sous 48 heures."
    />
  ),
});
