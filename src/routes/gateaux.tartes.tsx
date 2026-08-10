import { createFileRoute } from "@tanstack/react-router";
import catCakes from "@/assets/cat-cakes.jpg";
import cakeCitron from "@/assets/cake-citron.jpg";
import cakeChocolat from "@/assets/cake-chocolat.jpg";
import cakeVanille from "@/assets/cake-vanille.jpg";
import cakePistache from "@/assets/cake-pistache.jpg";
import { CakeCatalogPage, type CakeItem } from "@/components/gateaux/CakeCatalogPage";
import { breadcrumb, jsonLdScript, SITE } from "@/lib/seo";

const ITEMS: CakeItem[] = [
  { slug: "tarte-fruits-6", name: "Tarte aux fruits de saison — 6 parts", flavor: "fruits", size: "6 parts", price: 28, image: cakeVanille,
    ingredients: ["Pâte sablée", "crème d'amande", "fruits frais de saison"],
    allergens: ["Gluten", "lait", "œuf", "fruits à coque"],
    conservation: "Au frais, à consommer le jour même.", leadTime: "48h", seasonal: true },
  { slug: "tarte-citron-6", name: "Tarte Citron Meringuée — 6 parts", flavor: "citron", size: "6 parts", price: 30, image: cakeCitron,
    ingredients: ["Pâte sablée", "crème citron", "meringue italienne"],
    allergens: ["Gluten", "lait", "œuf"], conservation: "Au frais, sous 48h.", leadTime: "48h" },
  { slug: "tarte-citron-8", name: "Tarte Citron Meringuée — 8 parts", flavor: "citron", size: "8 parts", price: 38, image: cakeCitron,
    ingredients: ["Pâte sablée", "crème citron", "meringue"], allergens: ["Gluten", "lait", "œuf"],
    conservation: "Au frais, sous 48h.", leadTime: "48h" },
  { slug: "tarte-chocolat-6", name: "Tarte Chocolat — 6 parts", flavor: "chocolat", size: "6 parts", price: 32, image: cakeChocolat,
    ingredients: ["Pâte sablée cacao", "ganache chocolat noir 70%", "fleur de sel"],
    allergens: ["Gluten", "lait", "œuf", "soja"], conservation: "Température ambiante 48h.", leadTime: "48h" },
  { slug: "tarte-amandine-6", name: "Tarte Amandine — 6 parts", flavor: "amande", size: "6 parts", price: 28, image: cakePistache,
    ingredients: ["Pâte sablée", "crème d'amande", "amandes effilées"],
    allergens: ["Gluten", "lait", "œuf", "fruits à coque"], conservation: "48h à sec.", leadTime: "48h" },
  { slug: "tarte-amandine-8", name: "Tarte Amandine — 8 parts", flavor: "amande", size: "8 parts", price: 36, image: cakePistache,
    ingredients: ["Pâte sablée", "crème d'amande", "amandes"], allergens: ["Gluten", "lait", "œuf", "fruits à coque"],
    conservation: "48h à sec.", leadTime: "48h" },
];

export const Route = createFileRoute("/gateaux/tartes")({
  head: () => ({
    meta: [
      { title: "Tartes Fines Artisanales | Ö' Sweets Pâtisserie" },
      { name: "description", content: "Tartes fruits de saison, citron meringuée, chocolat, amandine. Pâte sablée maison, garnitures fraîches. Commande sur mesure." },
      { property: "og:title", content: "Tartes Fines Artisanales | Ö' Sweets" },
      { property: "og:description", content: "Pâte sablée croustillante, garnitures de saison." },
      { property: "og:url", content: `${SITE.url}/gateaux/tartes` },
    ],
    links: [{ rel: "canonical", href: `${SITE.url}/gateaux/tartes` }],
    scripts: [jsonLdScript(breadcrumb([
      { name: "Accueil", path: "/" }, { name: "Gâteaux", path: "/gateaux" }, { name: "Tartes", path: "/gateaux/tartes" },
    ]))],
  }),
  component: () => (
    <CakeCatalogPage
      jsonLdPath="/gateaux/tartes"
      title="Tartes"
      subtitle="Pâte sablée croustillante, garnitures fruits de saison, chocolat, citron et amande."
      heroImage={catCakes}
      items={ITEMS}
      flavors={["fruits", "citron", "chocolat", "amande"]}
      flavorLabel="Type"
      flavorLabels={{ fruits: "Fruits de saison", citron: "Citron meringuée", chocolat: "Chocolat", amande: "Amandine" }}
      sizes={["6 parts", "8 parts"]}
      sizeLabel="Taille"
      seasonalNote="Les tartes aux fruits frais varient selon la saison — disponibilité confirmée à la commande."
    />
  ),
});
