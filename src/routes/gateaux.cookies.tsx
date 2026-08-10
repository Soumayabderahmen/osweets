import { createFileRoute } from "@tanstack/react-router";
import catCakes from "@/assets/cat-cakes.jpg";
import cakeChocolat from "@/assets/cake-chocolat.jpg";
import cakePistache from "@/assets/cake-pistache.jpg";
import cakeVanille from "@/assets/cake-vanille.jpg";
import cakeNoisette from "@/assets/cake-noisette.jpg";
import { CakeCatalogPage, type CakeItem } from "@/components/gateaux/CakeCatalogPage";
import { breadcrumb, jsonLdScript, SITE } from "@/lib/seo";

const ITEMS: CakeItem[] = [
  { slug: "cookie-chocolat", name: "Cookie Chocolat Intense", flavor: "chocolat", size: "unite", price: 3.5, image: cakeChocolat,
    ingredients: ["Farine", "beurre AOP", "chocolat noir 70%", "sucre roux", "œufs"],
    allergens: ["Gluten", "lait", "œuf"],
    conservation: "Se conserve 5 jours à température ambiante dans une boîte hermétique.",
    leadTime: "24h" },
  { slug: "cookie-pistache", name: "Cookie Pistache & Chocolat blanc", flavor: "pistache", size: "unite", price: 4, image: cakePistache,
    ingredients: ["Farine", "beurre", "pistaches d'Iran", "chocolat blanc", "sucre"],
    allergens: ["Gluten", "lait", "œuf", "fruits à coque"],
    conservation: "Se conserve 5 jours à l'abri de l'humidité.",
    leadTime: "24h" },
  { slug: "cookie-noisette", name: "Cookie Noisette & Praliné", flavor: "noisette", size: "unite", price: 4, image: cakeNoisette,
    ingredients: ["Farine", "beurre", "noisettes du Piémont", "praliné maison"],
    allergens: ["Gluten", "lait", "œuf", "fruits à coque"],
    conservation: "Se conserve 5 jours.",
    leadTime: "24h" },
  { slug: "cookie-vanille", name: "Cookie Vanille & Pépites", flavor: "vanille", size: "unite", price: 3.5, image: cakeVanille,
    ingredients: ["Farine", "beurre", "vanille Bourbon", "pépites de chocolat"],
    allergens: ["Gluten", "lait", "œuf"],
    conservation: "Se conserve 5 jours.",
    leadTime: "24h" },
  { slug: "cookie-box-12", name: "Coffret Cookies · 12 pièces", flavor: "chocolat", size: "boite", price: 34, image: cakeChocolat,
    ingredients: ["Assortiment des 4 recettes signature"],
    allergens: ["Gluten", "lait", "œuf", "fruits à coque"],
    conservation: "Se conserve 5 jours dans son emballage d'origine.",
    leadTime: "48h" },
];

export const Route = createFileRoute("/gateaux/cookies")({
  head: () => ({
    meta: [
      { title: "Cookies Artisanaux | Ö' Sweets Pâtisserie" },
      { name: "description", content: "Cookies moelleux façonnés à la main : chocolat noir, pistache, noisette, vanille. À l'unité ou en coffret." },
      { property: "og:title", content: "Cookies Artisanaux | Ö' Sweets" },
      { property: "og:url", content: `${SITE.url}/gateaux/cookies` },
    ],
    links: [{ rel: "canonical", href: `${SITE.url}/gateaux/cookies` }],
    scripts: [jsonLdScript(breadcrumb([
      { name: "Accueil", path: "/" },
      { name: "Gâteaux", path: "/gateaux" },
      { name: "Cookies", path: "/gateaux/cookies" },
    ]))],
  }),
  component: () => (
    <CakeCatalogPage
      jsonLdPath="/gateaux/cookies"
      title="Cookies"
      subtitle="Croustillants dehors, fondants dedans — nos cookies signature, cuits chaque matin."
      heroImage={catCakes}
      items={ITEMS}
      flavors={["chocolat", "pistache", "noisette", "vanille"]}
      flavorLabels={{ chocolat: "Chocolat", pistache: "Pistache", noisette: "Noisette", vanille: "Vanille" }}
      sizes={["unite", "boite"]}
      sizeLabel="Format"
      sizeLabels={{ unite: "À l'unité", boite: "Coffret" }}
      freshnessNote="Cuits chaque matin — se conservent 5 jours à l'abri de l'humidité."
    />
  ),
});
