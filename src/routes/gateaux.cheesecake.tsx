import { createFileRoute } from "@tanstack/react-router";
import catCakes from "@/assets/cat-cakes.jpg";
import cakeCitron from "@/assets/cake-citron.jpg";
import cakeChocolat from "@/assets/cake-chocolat.jpg";
import cakeVanille from "@/assets/cake-vanille.jpg";
import cakePistache from "@/assets/cake-pistache.jpg";
import { CakeCatalogPage, type CakeItem } from "@/components/gateaux/CakeCatalogPage";
import { breadcrumb, jsonLdScript, SITE } from "@/lib/seo";

const ITEMS: CakeItem[] = [
  { slug: "cheesecake-nature", name: "Cheesecake Nature", flavor: "nature", size: "entier", price: 32, image: cakeVanille,
    ingredients: ["Fromage frais", "biscuit sablé beurre", "crème fraîche", "sucre", "vanille"],
    allergens: ["Gluten", "lait", "œuf"],
    conservation: "À conserver au frais entre 0 et 4°C, à consommer sous 48h.",
    leadTime: "48h",
    customization: ["Message chocolat", "Décor fruits frais"],
  },
  { slug: "cheesecake-speculoos", name: "Cheesecake Spéculoos", flavor: "speculoos", size: "entier", price: 36, image: cakeChocolat,
    ingredients: ["Fromage frais", "biscuits spéculoos", "beurre", "crème", "sucre roux"],
    allergens: ["Gluten", "lait", "œuf", "soja"],
    conservation: "À conserver au frais, sous 48h.",
    leadTime: "48h" },
  { slug: "cheesecake-fruits-rouges", name: "Cheesecake Fruits Rouges", flavor: "fruits-rouges", size: "entier", price: 38, image: cakeCitron,
    ingredients: ["Fromage frais", "biscuit sablé", "coulis fruits rouges", "framboises fraîches"],
    allergens: ["Gluten", "lait", "œuf"],
    conservation: "À conserver au frais, sous 48h.",
    leadTime: "48h" },
  { slug: "cheesecake-pistache", name: "Cheesecake Pistache", flavor: "pistache", size: "entier", price: 42, image: cakePistache,
    ingredients: ["Fromage frais", "pistaches d'Iran", "biscuit amande", "sucre"],
    allergens: ["Gluten", "lait", "œuf", "fruits à coque"],
    conservation: "À conserver au frais, sous 48h.",
    leadTime: "48h" },
  { slug: "cheesecake-citron", name: "Cheesecake Citron", flavor: "citron", size: "entier", price: 34, image: cakeCitron,
    ingredients: ["Fromage frais", "zestes de citron bio", "biscuit sablé", "meringue"],
    allergens: ["Gluten", "lait", "œuf"],
    conservation: "À conserver au frais, sous 48h.",
    leadTime: "48h" },
  { slug: "cheesecake-part-nature", name: "Part Cheesecake Nature", flavor: "nature", size: "part", price: 6, image: cakeVanille,
    ingredients: ["Fromage frais", "biscuit sablé", "vanille"],
    allergens: ["Gluten", "lait", "œuf"],
    conservation: "Au frais, sous 24h.",
    leadTime: "24h" },
];

export const Route = createFileRoute("/gateaux/cheesecake")({
  head: () => ({
    meta: [
      { title: "Cheesecake Artisanal | Ö' Sweets Pâtisserie" },
      { name: "description", content: "Cheesecakes signature : nature, spéculoos, fruits rouges, pistache, citron. Frais et façonnés à la commande. Livraison Île-de-France." },
      { property: "og:title", content: "Cheesecake Artisanal | Ö' Sweets" },
      { property: "og:description", content: "Cheesecakes onctueux, entiers ou parts individuelles." },
      { property: "og:url", content: `${SITE.url}/gateaux/cheesecake` },
    ],
    links: [{ rel: "canonical", href: `${SITE.url}/gateaux/cheesecake` }],
    scripts: [jsonLdScript(breadcrumb([
      { name: "Accueil", path: "/" },
      { name: "Gâteaux", path: "/gateaux" },
      { name: "Cheesecake", path: "/gateaux/cheesecake" },
    ]))],
  }),
  component: () => (
    <CakeCatalogPage
      jsonLdPath="/gateaux/cheesecake"
      title="Cheesecake"
      subtitle="Onctueux, aérien, à la new-yorkaise ou revisité aux saveurs orientales."
      heroImage={catCakes}
      items={ITEMS}
      flavors={["nature", "speculoos", "fruits-rouges", "pistache", "citron"]}
      flavorLabels={{ nature: "Nature", speculoos: "Spéculoos", "fruits-rouges": "Fruits rouges", pistache: "Pistache", citron: "Citron" }}
      sizes={["entier", "part"]}
      sizeLabel="Format"
      sizeLabels={{ entier: "Entier", part: "Parts individuelles" }}
      freshnessNote="Produit frais — se conserve entre 0 et 4°C, à consommer dans les 48 heures suivant la réception."
      crossLink={{ label: "Idéal en dessert de baby shower", to: "/evenements/baby-shower" }}
    />
  ),
});

