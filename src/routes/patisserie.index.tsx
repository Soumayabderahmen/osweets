import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo } from "react";
import { ArrowUpRight, ChevronRight } from "lucide-react";
import { products as baseProducts } from "@/data/products";
import { CategoryPage, type ExtraFilterGroup } from "@/components/CategoryPage";
import { useCatalog, useEtatBase } from "@/lib/catalog";
import { useSeasons } from "@/lib/seasons-hook";
import { PatisserieIndisponible } from "@/components/patisserie/Indisponible";
import { useCollections } from "@/lib/collections";
import { shouldShowCollection } from "@/lib/collection-visibility";
import { filterAvailable, type SeasonWindow } from "@/lib/season";
import { patisserieProducts, type CollectionKey } from "@/lib/patisserie";
import { Reveal } from "@/components/Reveal";
import { SITE, breadcrumb as breadcrumbJsonLd, jsonLdScript } from "@/lib/seo";
import { usePageBanner, usePageBannerImage } from "@/lib/banners";

const TITLE = "Nos collections — Pâtisserie Tunisienne | Ö' Sweets";

/**
 * Ce que Google lit sous le titre.
 *
 * La phrase annonçait « les six collections », puis les nommait une par
 * une. Une collection créée, renommée ou dépubliée depuis le back-office
 * la laissait fausse — et c'est justement la page où le décalage se voit
 * le plus. Elle se compose maintenant à partir des collections publiées.
 */
function descriptionDepuis(cols: { label: string }[]): string {
  if (!cols.length) {
    return "Les collections de pâtisserie tunisienne Ö' Sweets, façonnées à la main à Évry-Courcouronnes.";
  }
  const noms =
    cols.length === 1
      ? cols[0].label
      : `${cols
          .slice(0, -1)
          .map((c) => c.label)
          .join(", ")} et ${cols[cols.length - 1].label}`;
  return `Nos collections de pâtisserie tunisienne Ö' Sweets : ${noms}. Façonnées à la main à Évry-Courcouronnes.`;
}

export const Route = createFileRoute("/patisserie/")({
  /*
   * La liste envoyée à Google doit refléter les collections réellement
   * publiées : `head()` ne peut pas appeler de crochet, elle passe donc
   * par le chargeur.
   */
  loader: async () => {
    const { listCollections } = await import("@/api/collections");
    const rows = await listCollections().catch(() => []);
    return rows
      .filter((c) => c.published && !c.hidden)
      .sort((a, b) => a.sort_order - b.sort_order)
      .map((c) => ({ label: c.label, path: `/patisserie/${c.slug}` }));
  },
  head: ({ loaderData }) => {
    const description = descriptionDepuis(loaderData ?? []);
    return {
      meta: [
        { title: TITLE },
        { name: "description", content: description },
        { property: "og:title", content: TITLE },
        { property: "og:description", content: description },
        { property: "og:type", content: "website" },
        { property: "og:url", content: `${SITE.url}/patisserie` },
        { name: "twitter:card", content: "summary_large_image" },
      ],
      links: [{ rel: "canonical", href: `${SITE.url}/patisserie` }],
      scripts: [
        jsonLdScript(
          breadcrumbJsonLd([
            { name: "Accueil", path: "/" },
            { name: "Pâtisserie Tunisienne", path: "/patisserie" },
          ]),
        ),
        jsonLdScript({
          "@context": "https://schema.org",
          "@type": "ItemList",
          name: "Collections — Pâtisserie Tunisienne",
          url: `${SITE.url}/patisserie`,
          numberOfItems: (loaderData ?? []).length,
          itemListElement: (loaderData ?? []).map((c, i) => ({
            "@type": "ListItem",
            position: i + 1,
            name: c.label,
            url: `${SITE.url}${c.path}`,
          })),
        }),
      ],
    };
  },
  component: Page,
});

function Page() {
  const { vue } = Route.useSearch();
  const catalog = useCatalog(baseProducts);
  // Le visuel du haut est piloté depuis le back-office (page « patisserie »).
  const banniere = usePageBannerImage("patisserie");
  const etatBase = useEtatBase();
  const saisons = useSeasons();
  const list = useMemo(
    () => filterAvailable(patisserieProducts(catalog), saisons),
    [catalog, saisons],
  );

  // « Voir toutes nos pâtisseries » — le catalogue complet reste accessible.
  // Les collections viennent de la base : une collection créée en
  // back-office apparaît ici sans qu'on touche au code.
  const collections = useCollections();
  const extraFilters: ExtraFilterGroup[] = useMemo(
    () => [
      {
        id: "collection",
        label: "Collection",
        type: "multi",
        get: (p) => p.collections ?? [],
        options: collections.map((c) => ({ value: c.productKey, label: c.label })),
      },
    ],
    [collections],
  );

  if (etatBase === "panne") return <PatisserieIndisponible />;

  if (vue === "tout") {
    return (
      <CategoryPage
        jsonLdPath="/patisserie"
        title="Toutes nos pâtisseries"
        subtitle="Toute la pâtisserie tunisienne Ö' Sweets, toutes collections confondues. Façonnée à la main chaque matin à Évry-Courcouronnes."
        heroImage={banniere}
        breadcrumb={[
          { label: "Accueil", to: "/" },
          { label: "Pâtisserie Tunisienne", to: "/patisserie" },
          { label: "Toutes nos pâtisseries" },
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
      />
    );
  }

  return <CollectionsIndex catalog={list} banniere={banniere} saisons={saisons} />;
}

/** Page d'entrée de l'univers : les collections, pas les produits. */
function CollectionsIndex({
  catalog,
  banniere,
  saisons,
}: {
  catalog: typeof baseProducts;
  banniere?: string;
  saisons: SeasonWindow[];
}) {
  // Ordre, libellés, accroches et visuels viennent de la base ; le code sert
  // de repli tant qu'elle n'a pas répondu.
  const collections = useCollections();

  /*
   * Les compteurs se calculent sur les collections de la base, pas sur une
   * liste de clés écrite dans le code : une collection créée en
   * back-office affichait sinon « Bientôt disponible » alors qu'elle
   * contenait des produits.
   */
  const counts = useMemo(() => {
    const out: Record<string, number> = {};
    const dispo = filterAvailable(patisserieProducts(catalog), saisons);
    for (const c of collections) out[c.key] = dispo.filter(c.filter).length;
    return out;
  }, [catalog, collections, saisons]);

  /*
   * « Masquer complètement » : une collection vide qui a fait ce choix
   * quitte la grille jusqu'à ce qu'elle ait un produit.
   */
  const visibles = collections.filter((c) => shouldShowCollection(c, counts[c.key] ?? 0));

  // Titre et accroche viennent du back-office, avec un repli sobre.
  const entete = usePageBanner("patisserie");

  return (
    <div className="bg-background min-h-[60vh]">
      {/* Fil d'ariane */}
      <div className="container-os py-6">
        <nav className="text-xs text-charbon-soft" aria-label="Fil d'ariane">
          <ol className="flex flex-wrap items-center gap-1">
            <li className="flex items-center gap-1">
              <Link to="/" className="transition-colors hover:text-gold">
                Accueil
              </Link>
              <ChevronRight className="h-3 w-3 text-charbon-soft/50" />
            </li>
            <li>
              <span className="text-charbon" aria-current="page">
                Pâtisserie Tunisienne
              </span>
            </li>
          </ol>
        </nav>
      </div>

      {/* Bandeau — même gabarit que les pages collection */}
      <section className="bg-sable">
        <div className="container-os min-h-[180px] py-12 lg:py-16">
          <div className="grid items-center gap-8 md:grid-cols-12">
            <div className="md:col-span-7">
              <span className="text-[11px] uppercase tracking-[0.25em] text-gold">Nos univers</span>
              <h1 className="mt-3 font-display text-[32px] leading-tight text-charbon md:text-[40px]">
                {entete.title}
              </h1>
              {entete.subtitle && (
                <p className="mt-4 max-w-lg text-sm leading-relaxed text-charbon-soft md:text-[15px]">
                  {entete.subtitle}
                </p>
              )}
            </div>
            <div className="hidden md:col-span-5 md:block">
              <div className="h-[200px] overflow-hidden rounded-xl bg-beige">
                <img
                  src={banniere}
                  alt=""
                  aria-hidden="true"
                  className="h-full w-full object-cover"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Les 6 collections */}
      <section className="container-os py-12 lg:py-16">
        <div className="mb-10 flex items-baseline justify-between">
          <p className="text-xs tracking-wide text-charbon-soft">
            {visibles.length} collection{visibles.length > 1 ? "s" : ""}
          </p>
          <Link
            to="/patisserie"
            search={{ vue: "tout" }}
            className="hidden text-xs uppercase tracking-[0.18em] text-charbon transition-colors hover:text-gold sm:inline-flex"
          >
            Voir toutes nos pâtisseries →
          </Link>
        </div>

        <div className="grid gap-x-6 gap-y-12 sm:grid-cols-2 lg:grid-cols-3">
          {visibles.map((def, i) => {
            const key = def.key;
            const count = counts[key] ?? 0;
            return (
              <Reveal key={key} delay={(i % 3) * 0.06}>
                <Link to={def.path} className="group block">
                  <div className="relative aspect-[4/5] overflow-hidden rounded-2xl bg-beige">
                    <img
                      src={def.image}
                      alt={def.label}
                      loading="lazy"
                      className="absolute inset-0 h-full w-full object-cover transition-transform duration-[1100ms] ease-out group-hover:scale-105"
                    />
                    {/* Dégradé plus soutenu que sur l'accueil : ici le titre porte la navigation. */}
                    <div className="absolute inset-0 bg-gradient-to-t from-charbon/75 via-charbon/20 to-transparent" />
                    <span className="absolute left-5 top-5 font-display text-lg text-ivory/90">
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    <ArrowUpRight className="absolute right-5 top-5 h-5 w-5 -translate-y-1 text-ivory opacity-0 transition-all group-hover:translate-y-0 group-hover:opacity-100" />
                    <div className="absolute inset-x-0 bottom-0 p-5">
                      <h2 className="font-display text-2xl text-ivory">{def.label}</h2>
                      <p className="mt-1 text-[11px] uppercase tracking-[0.18em] text-ivory/75">
                        {count > 0
                          ? `${count} produit${count > 1 ? "s" : ""}`
                          : "Bientôt disponible"}
                      </p>
                    </div>
                  </div>
                  <p className="mt-4 line-clamp-2 text-sm leading-relaxed text-charbon-soft">
                    {def.subtitle}
                  </p>
                </Link>
              </Reveal>
            );
          })}
        </div>

        <div className="mt-14 text-center sm:hidden">
          <Link to="/patisserie" search={{ vue: "tout" }} className="btn btn-outline-gold">
            Voir toutes nos pâtisseries
          </Link>
        </div>
      </section>
    </div>
  );
}
