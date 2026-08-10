import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { products } from "@/data/products";
import { cakeThemes } from "@/data/themes";
import { CategoryPage } from "@/components/CategoryPage";

export const Route = createFileRoute("/gateaux/anniversaire/$theme")({
  loader: ({ params }) => {
    const theme = cakeThemes.find((t) => t.id === params.theme);
    if (!theme) throw notFound();
    return theme;
  },
  head: ({ loaderData }) => ({
    meta: [
      { title: `Gâteaux ${loaderData?.label ?? ""} — Ö' Sweets` },
      { name: "description", content: `Découvrez nos gâteaux d'anniversaire sur le thème ${loaderData?.label}.` },
    ],
  }),
  notFoundComponent: () => (
    <div className="container-os py-20 text-center">
      <h1 className="font-display text-3xl">Thème introuvable</h1>
      <Link to="/gateaux/anniversaire" className="btn btn-gold mt-6">Tous les thèmes</Link>
    </div>
  ),
  component: Page,
});

function Page() {
  const theme = Route.useLoaderData();
  const list = products.filter((p) => p.themes?.includes(theme.id));

  return (
    <div>
      <CategoryPage
      jsonLdPath={`/gateaux/anniversaire/${theme.id}`}
        title={`${theme.emoji} ${theme.label}`}
        subtitle={`Gâteaux d'anniversaire sur le thème « ${theme.label} ». Tous personnalisables (parfum, taille, message).`}
        heroImage={theme.image}
        breadcrumb={[
          { label: "Accueil", to: "/" },
          { label: "Gâteaux", to: "/gateaux" },
          { label: "Anniversaire", to: "/gateaux/anniversaire" },
          { label: theme.label },
        ]}
        products={list}
        filters={{ stock: true, price: true, allergens: false }}
      />
      <section className="bg-sable py-12">
        <div className="container-os text-center">
          <p className="text-charbon/75 max-w-xl mx-auto">
            Vous ne trouvez pas exactement ce que vous cherchez ?
          </p>
          <Link to="/gateaux/anniversaire/personnaliser" className="btn btn-gold mt-5 inline-flex">
            Créer mon gâteau sur mesure
          </Link>
        </div>
      </section>
    </div>
  );
}
