import { createFileRoute } from "@tanstack/react-router";
import { SITE, breadcrumb, jsonLdScript } from "@/lib/seo";
import { z } from "zod";
import { zodValidator, fallback } from "@tanstack/zod-adapter";
import { useMemo } from "react";
import { products, type Product } from "@/data/products";
import { CategoryPage } from "@/components/CategoryPage";
import catPat from "@/assets/cat-patisserie.jpg";

type SubKey = "all" | "tartinables" | "huiles" | "vinaigres" | "epices" | "antipasti";

const subCategories: Record<
  SubKey,
  {
    label: string;
    subtitle: string;
    filter: (p: Product) => boolean;
  }
> = {
  all: {
    label: "L'Épicerie Salée",
    subtitle:
      "Tartinables, huiles, épices et antipasti — une sélection méditerranéenne d'exception.",
    filter: (p) => p.category === "sale",
  },
  tartinables: {
    label: "Tartinables salés",
    subtitle: "Tapenades, houmous, caviar d'aubergine — pour des apéritifs élégants.",
    filter: (p) => p.category === "sale" && !!p.themes?.includes("tartinables"),
  },
  huiles: {
    label: "Huiles & vinaigres",
    subtitle: "Huiles d'olive, huiles parfumées et vinaigres balsamiques.",
    filter: (p) =>
      p.category === "sale" &&
      (!!p.themes?.includes("huiles") || !!p.themes?.includes("vinaigres")),
  },
  vinaigres: {
    label: "Vinaigres",
    subtitle: "Vinaigres balsamiques et vinaigres de vin d'exception.",
    filter: (p) => p.category === "sale" && !!p.themes?.includes("vinaigres"),
  },
  epices: {
    label: "Épices & mélanges",
    subtitle: "Ras el hanout, harissa, dukkah, sels aromatisés.",
    filter: (p) => p.category === "sale" && !!p.themes?.includes("epices"),
  },
  antipasti: {
    label: "Olives, câpres & antipasti",
    subtitle: "Olives Kalamata, câpres, tomates séchées, antipasti méditerranéens.",
    filter: (p) => p.category === "sale" && !!p.themes?.includes("antipasti"),
  },
};

/*
 * `cat` est FACULTATIF, et surtout sans valeur par défaut : une valeur par
 * défaut obligerait le routeur à réécrire /epicerie-salee en
 * /epicerie-salee?cat=all par une redirection, à chaque visite. Son absence
 * vaut « all », résolu à la lecture juste en dessous. Le repli reste en
 * place pour une valeur présente mais inconnue (vieux lien, faute de
 * frappe) : elle retombe sur « all » au lieu de casser la page.
 */
const searchSchema = z.object({
  cat: fallback(
    z.enum(["all", "tartinables", "huiles", "vinaigres", "epices", "antipasti"]),
    "all",
  ).optional(),
});

export const Route = createFileRoute("/epicerie-salee")({
  validateSearch: zodValidator(searchSchema),
  head: () => ({
    meta: [
      { title: "L'Épicerie Salée · Ö' Sweets" },
      {
        name: "description",
        content:
          "Tartinables méditerranéens, huiles & vinaigres, épices d'exception et antipasti — la sélection salée d'Ö' Sweets.",
      },
      { property: "og:title", content: "L'Épicerie Salée · Ö' Sweets" },
      {
        property: "og:description",
        content:
          "Tapenades, houmous, huile d'olive, ras el hanout, olives et antipasti sélectionnés.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [{ rel: "canonical", href: `${SITE.url}/epicerie-salee` }],
    scripts: [
      jsonLdScript(
        breadcrumb([
          { name: "Accueil", path: "/" },
          { name: "L'Épicerie Salée", path: "/epicerie-salee" },
        ]),
      ),
    ],
  }),
  component: EpicerieSaleePage,
});

function EpicerieSaleePage() {
  const { cat } = Route.useSearch();
  // Pas de `cat` dans l'adresse = la sélection complète.
  const actuelle: SubKey = cat ?? "all";
  const sub = subCategories[actuelle];

  const filtered = useMemo(() => products.filter(sub.filter), [sub]);

  return (
    <CategoryPage
      jsonLdPath="/epicerie-salee"
      title={sub.label}
      subtitle={sub.subtitle}
      heroImage={catPat}
      breadcrumb={[
        { label: "Accueil", to: "/" },
        { label: "L'Épicerie Salée", to: "/epicerie-salee" },
        ...(actuelle !== "all" ? [{ label: sub.label }] : []),
      ]}
      products={filtered}
      filters={{ stock: true, price: true, allergens: true }}
    />
  );
}
