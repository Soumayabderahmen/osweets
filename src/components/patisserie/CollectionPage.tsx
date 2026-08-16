import { useMemo } from "react";
import { Link } from "@tanstack/react-router";

import { products as baseProducts } from "@/data/products";
import { CategoryPage, type ExtraFilterGroup } from "@/components/CategoryPage";
import { WaitlistForm } from "@/components/patisserie/WaitlistForm";
import { useCatalog } from "@/lib/catalog";
import { filterAvailable } from "@/lib/season";
import { patisserieProducts, type CollectionKey } from "@/lib/patisserie";
import { useCollection } from "@/lib/collections";

interface CollectionPageProps {
  collection: CollectionKey;
  heroImage: string;
  /** Bandeau affiché au-dessus de la page (ex. hors saison). */
  notice?: React.ReactNode;
}

/**
 * Gabarit unique des 6 pages collection « Pâtisserie Tunisienne ».
 * Fil d'ariane sans « Boutique », bandeau photo, filtres à gauche, grille 3 colonnes,
 * et état vide « Arrive bientôt » avec inscription à la liste d'attente.
 */
export function CollectionPage({ collection, heroImage, notice }: CollectionPageProps) {
  // Le rendu serveur part des définitions du code (bon pour le référencement) ;
  // les textes saisis dans le back-office prennent le relais dès leur arrivée.
  const def = useCollection(collection);
  const catalog = useCatalog(baseProducts);

  const list = useMemo(
    () => filterAvailable(patisserieProducts(catalog).filter(def.filter)),
    [catalog, def],
  );

  /** Filtre « Famille » proposé uniquement quand la collection contient des familles. */
  const extraFilters: ExtraFilterGroup[] = useMemo(() => {
    const families = Array.from(new Set(list.map((p) => p.family).filter(Boolean))) as string[];
    if (families.length < 2) return [];
    return [
      {
        id: "family",
        label: "Famille",
        type: "multi",
        get: (p) => p.family ?? null,
        options: families.map((f) => ({ value: f, label: f.charAt(0).toUpperCase() + f.slice(1) })),
      },
    ];
  }, [list]);

  return (
    <CategoryPage
      jsonLdPath={def.path}
      title={def.h1}
      subtitle={def.subtitle}
      heroImage={heroImage}
      breadcrumb={[
        { label: "Accueil", to: "/" },
        { label: "Pâtisserie Tunisienne", to: "/patisserie" },
        { label: def.label },
      ]}
      products={list}
      filters={{ stock: true, price: true, allergens: true }}
      extraFilters={extraFilters}
      notice={notice}
      emptyState={
        <div className="mx-auto max-w-xl py-12 text-center">
          <div className="text-[11px] uppercase tracking-[0.3em] text-gold">Arrive bientôt</div>
          <h2 className="mt-4 font-display text-3xl text-charbon">
            Cette collection arrive bientôt
          </h2>
          <p className="mt-3 text-sm leading-relaxed text-charbon/70">
            Nos pâtissiers finalisent cette sélection. Laissez-nous votre e-mail : vous serez
            prévenu·e dès sa mise en ligne, avant tout le monde.
          </p>
          <WaitlistForm collection={def.key} className="mx-auto mt-6 max-w-md" />
          <Link
            to="/patisserie"
            search={{ vue: "tout" }}
            className="mt-8 inline-block border-b border-gold pb-0.5 text-[11px] uppercase tracking-[0.28em] text-gold"
          >
            Voir toute la pâtisserie tunisienne →
          </Link>
        </div>
      }
    />
  );
}
