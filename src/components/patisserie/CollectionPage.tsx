import { useMemo } from "react";
import { Link, notFound } from "@tanstack/react-router";

import { products as baseProducts } from "@/data/products";
import { CategoryPage, type ExtraFilterGroup } from "@/components/CategoryPage";
import { WaitlistForm } from "@/components/patisserie/WaitlistForm";
import { useCatalog, useEtatBase } from "@/lib/catalog";
import { useSeasons } from "@/lib/seasons-hook";
import { useFamilyLabel } from "@/lib/families-hook";
import { PatisserieIndisponible } from "@/components/patisserie/Indisponible";
import { filterAvailable } from "@/lib/season";
import { patisserieProducts } from "@/lib/patisserie";
import { useCollection } from "@/lib/collections";
import { usePageBannerImage } from "@/lib/banners";

interface CollectionPageProps {
  collection: string;
  /** Bandeau affiché au-dessus de la page (ex. hors saison). */
  notice?: React.ReactNode;
}

/**
 * Gabarit unique des 6 pages collection « Pâtisserie Tunisienne ».
 * Fil d'ariane sans « Boutique », bandeau photo, filtres à gauche, grille 3 colonnes,
 * et état vide « Arrive bientôt » avec inscription à la liste d'attente.
 */
export function CollectionPage({ collection, notice }: CollectionPageProps) {
  // Le rendu serveur part des définitions du code (bon pour le référencement) ;
  // les textes saisis dans le back-office prennent le relais dès leur arrivée.
  const live = useCollection(collection);
  // Repli neutre : une collection tout juste créée n'a pas encore de définition.
  const fallback = useMemo(
    () => ({
      key: collection,
      productKey: collection,
      path: `/patisserie/${collection}`,
      label: collection,
      h1: collection,
      title: collection,
      description: "",
      subtitle: "",
      published: true,
      sortOrder: 0,
      filter: (p: { collections?: readonly string[] }) =>
        (p.collections ?? []).includes(collection),
    }),
    [collection],
  );
  const catalog = useCatalog(baseProducts);
  const etatBase = useEtatBase();
  /*
   * Une collection créée depuis le back-office n'a pas forcément encore
   * son visuel. Elle reprend alors le bandeau par défaut, lui aussi réglé
   * depuis le back-office — plus aucune image ne vient du code.
   */
  const defaut = usePageBannerImage("patisserie-collection-defaut");

  const saisons = useSeasons();
  const nomFamille = useFamilyLabel();
  const def = useMemo(() => live ?? fallback, [fallback, live]);
  const list = useMemo(
    () => filterAvailable(patisserieProducts(catalog).filter(def.filter), saisons),
    [catalog, def, saisons],
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
        // Le nom vient de la table `families` : renommer « Samsa » en
        // « Samsa maison » au back-office change le filtre aussi.
        options: families.map((f) => ({ value: f, label: nomFamille(f) })),
      },
    ];
  }, [list, nomFamille]);

  /*
   * Sans la base, on ne sait pas ce que contient cette collection. Afficher
   * « aucun produit » serait un mensonge, et proposer une liste de secours
   * reviendrait à laisser un vieux fichier contredire le back-office.
   */
  if (etatBase === "panne") return <PatisserieIndisponible contexte={def.h1} />;

  if (!live) throw notFound();
  const publishedItems = patisserieProducts(catalog).filter(def.filter);
  const offSeason = publishedItems.length > 0 && list.length === 0;

  return (
    <CategoryPage
      collectionContext={{ key: def.key, label: def.label }}
      jsonLdPath={def.path}
      title={def.h1}
      subtitle={def.subtitle}
      heroImage={live?.image ?? defaut}
      breadcrumb={[
        { label: "Accueil", to: "/" },
        { label: "Pâtisserie Tunisienne", to: "/patisserie" },
        { label: def.label },
      ]}
      products={list}
      filters={{
        stock: true,
        price: true,
        // Le filtre par allergène supposait la liste vérifiée recette par
        // recette — elle ne l'est pas encore. Proposer « sans gluten » sur
        // une donnée non contrôlée est plus risqué que de ne rien proposer.
        // Il reviendra le jour où la fiche affichera les allergènes.
        allergens: false,
      }}
      extraFilters={extraFilters}
      notice={notice}
      emptyState={
        <div className="mx-auto max-w-xl py-12 text-center">
          <div className="text-[11px] uppercase tracking-[0.3em] text-gold">
            {offSeason ? "Hors saison" : "Sélection indisponible"}
          </div>
          <h2 className="mt-4 font-display text-3xl text-charbon">
            {offSeason
              ? "Cette collection est actuellement hors saison"
              : "Aucun produit proposé actuellement"}
          </h2>
          <p className="mt-3 text-sm leading-relaxed text-charbon/70">
            {offSeason
              ? "Les produits de cette sélection reviendront lors de leur prochaine saison."
              : "Cette collection ne propose pas de produit à la vente pour le moment."}
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
