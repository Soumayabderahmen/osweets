import { createFileRoute } from "@tanstack/react-router";
import catCakes from "@/assets/cat-cakes.jpg";
import cakeVanille from "@/assets/cake-vanille.jpg";
import cakeChocolat from "@/assets/cake-chocolat.jpg";
import cakePistache from "@/assets/cake-pistache.jpg";
import cakeCitron from "@/assets/cake-citron.jpg";
import cakeNoisette from "@/assets/cake-noisette.jpg";
import { CakeCatalogPage, type CakeItem } from "@/components/gateaux/CakeCatalogPage";
import { breadcrumb, jsonLdScript, SITE } from "@/lib/seo";

const ITEMS: CakeItem[] = [
  { slug: "cupcake-vanille", name: "Cupcake Vanille Bourbon", flavor: "vanille", size: "unite", price: 4, image: cakeVanille,
    ingredients: ["Farine", "beurre AOP", "vanille Bourbon", "cream cheese", "sucre glace"],
    allergens: ["Gluten", "lait", "œuf"],
    conservation: "Au frais, à consommer sous 48h.",
    leadTime: "24h",
    customization: ["Couleur du glaçage", "Topping personnalisé"] },
  { slug: "cupcake-chocolat", name: "Cupcake Chocolat Noir", flavor: "chocolat", size: "unite", price: 4, image: cakeChocolat,
    ingredients: ["Cacao intense", "beurre", "chocolat noir 70%", "ganache"],
    allergens: ["Gluten", "lait", "œuf"],
    conservation: "Au frais, sous 48h.",
    leadTime: "24h" },
  { slug: "cupcake-pistache", name: "Cupcake Pistache", flavor: "pistache", size: "unite", price: 4.5, image: cakePistache,
    ingredients: ["Pistache d'Iran", "beurre", "crème mascarpone", "sucre glace"],
    allergens: ["Gluten", "lait", "œuf", "fruits à coque"],
    conservation: "Au frais, sous 48h.",
    leadTime: "24h" },
  { slug: "cupcake-citron", name: "Cupcake Citron Meringué", flavor: "citron", size: "unite", price: 4, image: cakeCitron,
    ingredients: ["Zestes de citron bio", "curd citron", "meringue italienne"],
    allergens: ["Gluten", "lait", "œuf"],
    conservation: "Au frais, sous 48h.",
    leadTime: "24h" },
  { slug: "cupcake-noisette", name: "Cupcake Noisette & Praliné", flavor: "noisette", size: "unite", price: 4.5, image: cakeNoisette,
    ingredients: ["Noisettes du Piémont", "praliné maison", "ganache"],
    allergens: ["Gluten", "lait", "œuf", "fruits à coque"],
    conservation: "Au frais, sous 48h.",
    leadTime: "24h" },
  { slug: "cupcake-box-12", name: "Coffret Cupcakes · 12 pièces", flavor: "vanille", size: "boite", price: 44, image: cakeVanille,
    ingredients: ["Assortiment des 5 saveurs signature"],
    allergens: ["Gluten", "lait", "œuf", "fruits à coque"],
    conservation: "Au frais, à consommer sous 48h.",
    leadTime: "48h" },
];

export const Route = createFileRoute("/gateaux/cupcakes")({
  head: () => ({
    meta: [
      { title: "Cupcakes Signature | Ö' Sweets Pâtisserie" },
      { name: "description", content: "Cupcakes gourmands : vanille, chocolat, pistache, citron meringué, noisette praliné. Personnalisables pour vos événements." },
      { property: "og:title", content: "Cupcakes Signature | Ö' Sweets" },
      { property: "og:url", content: `${SITE.url}/gateaux/cupcakes` },
    ],
    links: [{ rel: "canonical", href: `${SITE.url}/gateaux/cupcakes` }],
    scripts: [jsonLdScript(breadcrumb([
      { name: "Accueil", path: "/" },
      { name: "Gâteaux", path: "/gateaux" },
      { name: "Cupcakes", path: "/gateaux/cupcakes" },
    ]))],
  }),
  component: () => (
    <CakeCatalogPage
      jsonLdPath="/gateaux/cupcakes"
      title="Cupcakes"
      subtitle="Gâteaux individuels au glaçage soyeux — personnalisables pour toutes vos occasions."
      heroImage={catCakes}
      items={ITEMS}
      flavors={["vanille", "chocolat", "pistache", "citron", "noisette"]}
      flavorLabels={{ vanille: "Vanille", chocolat: "Chocolat", pistache: "Pistache", citron: "Citron", noisette: "Noisette" }}
      sizes={["unite", "boite"]}
      sizeLabel="Format"
      sizeLabels={{ unite: "À l'unité", boite: "Coffret" }}
      freshnessNote="Frais — à conserver entre 0 et 4°C, à consommer sous 48h."
      crossLink={{ label: "Parfait pour une baby shower", to: "/evenements/baby-shower" }}
    />
  ),
});
