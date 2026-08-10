import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { giftCategories, products } from "@/data/products";
import { ProductCard } from "@/components/ProductCard";

export const Route = createFileRoute("/cadeaux/$slug")({
  loader: ({ params }) => {
    const cat = giftCategories.find((c) => c.slug === params.slug);
    if (!cat) throw notFound();
    return cat;
  },
  head: ({ loaderData }) => ({
    meta: [
      { title: `${loaderData?.label ?? "Cadeaux"} — Ö' Sweets` },
      { name: "description", content: loaderData?.desc ?? "" },
      { property: "og:title", content: `${loaderData?.label ?? "Cadeaux"} — Ö' Sweets` },
    ],
  }),
  notFoundComponent: () => <div className="container-os py-20 text-center"><h1 className="font-display text-3xl">Catégorie introuvable</h1><Link to="/cadeaux" className="btn btn-gold mt-6">Tous les cadeaux</Link></div>,
  errorComponent: () => <div className="container-os py-20 text-center">Erreur</div>,
  component: Page,
});

function Page() {
  const cat = Route.useLoaderData();
  const items = products.filter((p) => p.category === "coffret" || p.occasions?.includes(cat.slug));
  return (
    <div className="container-os section-y">
      <Link to="/cadeaux" className="text-xs uppercase tracking-[0.22em] text-charbon/60 hover:text-gold">← Tous les cadeaux</Link>
      <div className="text-center mt-8">
        <div className="text-4xl">{cat.icon}</div>
        <h1 className="font-display text-4xl md:text-5xl mt-3">{cat.label}</h1>
        <div className="mt-4"><span className="divider-gold" /></div>
        <p className="mt-5 max-w-2xl mx-auto text-charbon/70">{cat.desc}</p>
      </div>
      <div className="mt-14 grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {items.length > 0
          ? items.map((p) => <ProductCard key={p.slug} product={p} />)
          : <p className="col-span-full text-center text-charbon/60">De nouveaux coffrets arrivent bientôt. Contactez-nous pour une création sur mesure.</p>}
      </div>
    </div>
  );
}
