import { createFileRoute, Link } from "@tanstack/react-router";
import { useShop } from "@/lib/shop-store";
import { useCatalog, useEtatBase } from "@/lib/catalog";
import { ProductCard } from "@/components/ProductCard";

export const Route = createFileRoute("/favoris")({
  head: () => ({ meta: [{ title: "Mes Favoris — Ö' Sweets" }] }),
  component: Page,
});

function Page() {
  const { favorites, toggleFavorite } = useShop();
  // Le catalogue vient de la base : un favori pâtisserie n'existe plus
  // dans le fichier statique, il ne doit pas disparaître de cette page.
  const catalogue = useCatalog();
  const items = catalogue.filter((p) => favorites.includes(p.slug));
  const etat = useEtatBase();
  const missing =
    etat === "ok" ? favorites.filter((slug) => !catalogue.some((p) => p.slug === slug)) : [];
  return (
    <div className="container-os section-y">
      <div className="text-center">
        <div className="eyebrow">Mes favoris</div>
        <h1 className="font-display text-4xl md:text-5xl mt-3">Vos coups de cœur</h1>
      </div>
      {missing.map((slug) => (
        <div key={slug} className="mt-6 border-b border-border py-4 flex justify-between gap-4">
          <p>Ce favori n'est plus disponible : {slug}.</p>
          <button type="button" className="underline" onClick={() => toggleFavorite(slug)}>
            Retirer des favoris
          </button>
        </div>
      ))}
      {items.length === 0 && missing.length === 0 ? (
        <div className="text-center mt-16">
          <p className="text-charbon/60">Aucun favori pour le moment.</p>
          <Link to="/patisserie" className="btn btn-gold mt-6 inline-flex">
            Découvrir la boutique
          </Link>
        </div>
      ) : (
        <div className="mt-12 grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {items.map((p) => (
            <ProductCard key={p.slug} product={p} />
          ))}
        </div>
      )}
    </div>
  );
}
