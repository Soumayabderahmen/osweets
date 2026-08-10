import { createFileRoute } from "@tanstack/react-router";
import catCakes from "@/assets/cat-cakes.jpg";
import cakeCitron from "@/assets/cake-citron.jpg";
import cakeChocolat from "@/assets/cake-chocolat.jpg";
import cakePistache from "@/assets/cake-pistache.jpg";
import cakeVanille from "@/assets/cake-vanille.jpg";
import { CakeCatalogPage, type CakeItem } from "@/components/gateaux/CakeCatalogPage";
import { breadcrumb, jsonLdScript, SITE } from "@/lib/seo";

const ITEMS: CakeItem[] = [
  { slug: "verrine-fruits-rouges", name: "Verrine Fruits Rouges", flavor: "fruits-rouges", size: "individuelle", price: 5.5, image: cakeCitron,
    ingredients: ["Crème mascarpone", "coulis de fruits rouges", "biscuit sablé", "framboises fraîches"],
    allergens: ["Gluten", "lait", "œuf"],
    conservation: "Au frais, à consommer sous 24h.",
    leadTime: "24h" },
  { slug: "verrine-chocolat", name: "Verrine Chocolat Noir", flavor: "chocolat", size: "individuelle", price: 5.5, image: cakeChocolat,
    ingredients: ["Mousse chocolat noir 70%", "biscuit cacao", "éclats de chocolat"],
    allergens: ["Gluten", "lait", "œuf", "soja"],
    conservation: "Au frais, sous 24h.",
    leadTime: "24h" },
  { slug: "verrine-pistache", name: "Verrine Pistache & Fleur d'oranger", flavor: "pistache", size: "individuelle", price: 6, image: cakePistache,
    ingredients: ["Crème pistache d'Iran", "fleur d'oranger", "sablé amande"],
    allergens: ["Gluten", "lait", "œuf", "fruits à coque"],
    conservation: "Au frais, sous 24h.",
    leadTime: "24h" },
  { slug: "verrine-vanille-caramel", name: "Verrine Vanille & Caramel", flavor: "vanille", size: "individuelle", price: 5.5, image: cakeVanille,
    ingredients: ["Crème vanille Bourbon", "caramel beurre salé", "sablé breton"],
    allergens: ["Gluten", "lait", "œuf"],
    conservation: "Au frais, sous 24h.",
    leadTime: "24h" },
  { slug: "verrine-plateau-12", name: "Plateau Verrines · 12 pièces", flavor: "chocolat", size: "plateau", price: 58, image: cakeChocolat,
    ingredients: ["Assortiment de 4 saveurs signature"],
    allergens: ["Gluten", "lait", "œuf", "fruits à coque"],
    conservation: "Au frais, à consommer sous 24h.",
    leadTime: "48h" },
];

export const Route = createFileRoute("/gateaux/verrines")({
  head: () => ({
    meta: [
      { title: "Verrines Individuelles | Ö' Sweets Pâtisserie" },
      { name: "description", content: "Verrines signature : fruits rouges, chocolat, pistache, vanille & caramel. À l'unité ou en plateau pour vos réceptions." },
      { property: "og:title", content: "Verrines Individuelles | Ö' Sweets" },
      { property: "og:url", content: `${SITE.url}/gateaux/verrines` },
    ],
    links: [{ rel: "canonical", href: `${SITE.url}/gateaux/verrines` }],
    scripts: [jsonLdScript(breadcrumb([
      { name: "Accueil", path: "/" },
      { name: "Gâteaux", path: "/gateaux" },
      { name: "Verrines", path: "/gateaux/verrines" },
    ]))],
  }),
  component: () => (
    <CakeCatalogPage
      jsonLdPath="/gateaux/verrines"
      title="Verrines"
      subtitle="Desserts individuels raffinés, parfaits pour vos réceptions et cocktails."
      heroImage={catCakes}
      items={ITEMS}
      flavors={["fruits-rouges", "chocolat", "pistache", "vanille"]}
      flavorLabels={{ "fruits-rouges": "Fruits rouges", chocolat: "Chocolat", pistache: "Pistache", vanille: "Vanille" }}
      sizes={["individuelle", "plateau"]}
      sizeLabel="Format"
      sizeLabels={{ individuelle: "Individuelle", plateau: "Plateau" }}
      freshnessNote="Produit frais — se conserve entre 0 et 4°C, à consommer dans les 24 heures."
      crossLink={{ label: "Idéal pour une réception d'entreprise", to: "/evenements/entreprise" }}
    />
  ),
});
