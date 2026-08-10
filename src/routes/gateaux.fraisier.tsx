import { createFileRoute } from "@tanstack/react-router";
import catCakes from "@/assets/cat-cakes.jpg";
import cakeVanille from "@/assets/cake-vanille.jpg";
import { CakeCatalogPage, type CakeItem } from "@/components/gateaux/CakeCatalogPage";
import { breadcrumb, jsonLdScript, SITE } from "@/lib/seo";

const ITEMS: CakeItem[] = [
  { slug: "fraisier-6", name: "Fraisier — 6 parts", flavor: "fraise", size: "6 parts", price: 42, image: cakeVanille,
    ingredients: ["Génoise moelleuse", "crème mousseline vanille", "fraises fraîches", "pâte d'amande"],
    allergens: ["Gluten", "lait", "œuf", "fruits à coque"],
    conservation: "Au frais 0-4°C, à consommer sous 24h.", leadTime: "72h", seasonal: true },
  { slug: "fraisier-8", name: "Fraisier — 8 parts", flavor: "fraise", size: "8 parts", price: 56, image: cakeVanille,
    ingredients: ["Génoise", "crème mousseline vanille", "fraises fraîches", "pâte d'amande"],
    allergens: ["Gluten", "lait", "œuf", "fruits à coque"],
    conservation: "Au frais 0-4°C, sous 24h.", leadTime: "72h", seasonal: true },
  { slug: "fraisier-10", name: "Fraisier — 10 parts", flavor: "fraise", size: "10 parts", price: 72, image: cakeVanille,
    ingredients: ["Génoise", "crème mousseline vanille", "fraises fraîches", "pâte d'amande"],
    allergens: ["Gluten", "lait", "œuf", "fruits à coque"],
    conservation: "Au frais 0-4°C, sous 24h.", leadTime: "72h", seasonal: true },
];

export const Route = createFileRoute("/gateaux/fraisier")({
  head: () => ({
    meta: [
      { title: "Fraisier Artisanal de Saison | Ö' Sweets" },
      { name: "description", content: "Fraisier signature : génoise moelleuse, crème mousseline vanille, fraises fraîches. Produit de saison, sur commande 72h à l'avance." },
      { property: "og:title", content: "Fraisier Artisanal de Saison | Ö' Sweets" },
      { property: "og:description", content: "Un classique français revisité, saisonnier." },
      { property: "og:url", content: `${SITE.url}/gateaux/fraisier` },
    ],
    links: [{ rel: "canonical", href: `${SITE.url}/gateaux/fraisier` }],
    scripts: [jsonLdScript(breadcrumb([
      { name: "Accueil", path: "/" }, { name: "Gâteaux", path: "/gateaux" }, { name: "Fraisier", path: "/gateaux/fraisier" },
    ]))],
  }),
  component: () => (
    <CakeCatalogPage
      jsonLdPath="/gateaux/fraisier"
      title="Fraisier"
      subtitle="Génoise moelleuse, crème mousseline vanille et fraises fraîches de saison."
      heroImage={catCakes}
      items={ITEMS}
      flavors={["fraise"]}
      flavorLabels={{ fraise: "Fraise" }}
      sizes={["6 parts", "8 parts", "10 parts"]}
      sizeLabel="Taille"
      seasonalFilter
      seasonalNote="Produit saisonnier — disponible d'avril à septembre selon la saison des fraises. Hors saison, activez le rappel."
      freshnessNote="À conserver au frais et à consommer dans les 24h suivant la réception. Sortir 15 min avant dégustation."
    />
  ),
});
