import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo } from "react";
import { ArrowUpRight, ChevronRight } from "lucide-react";
import { products as baseProducts } from "@/data/products";
import { CategoryPage, type ExtraFilterGroup } from "@/components/CategoryPage";
import { useCatalog } from "@/lib/catalog";
import { useCollections } from "@/lib/collections";
import { filterAvailable } from "@/lib/season";
import {
  COLLECTIONS,
  COLLECTION_ORDER,
  collectionProducts,
  patisserieProducts,
  type CollectionKey,
} from "@/lib/patisserie";
import { Reveal } from "@/components/Reveal";
import { SITE, breadcrumb as breadcrumbJsonLd, jsonLdScript } from "@/lib/seo";
import catPat from "@/assets/cat-patisserie.jpg";
import imgAmandes from "@/assets/p-ghrayba.jpg";
import imgPistache from "@/assets/p-baklawa.jpg";
import imgPerles from "@/assets/plateau-or-assortiment-signature.jpg";
import imgTradition from "@/assets/p-kaak-warka.jpg";
import imgRamadan from "@/assets/p-samsa.jpg";
import imgAid from "@/assets/collection-aid-eid-mubarak.jpg";

/** Visuel de chaque collection — même photo que le bandeau de sa page. */
const COLLECTION_IMAGES: Record<CollectionKey, string> = {
  amandes: imgAmandes,
  "pistache-machmoum-pignon": imgPistache,
  perles: imgPerles,
  tradition: imgTradition,
  ramadan: imgRamadan,
  aid: imgAid,
};

const TITLE = "Nos collections — Pâtisserie Tunisienne | Ö' Sweets";
const DESCRIPTION =
  "Les six collections de pâtisserie tunisienne Ö' Sweets : Amandes, Pistache Machmoum & Pignon, Perles, Tradition, Ramadan et Aïd. Façonnées à la main à Évry-Courcouronnes.";

export const Route = createFileRoute("/patisserie/")({
  head: () => ({
    meta: [
      { title: TITLE },
      { name: "description", content: DESCRIPTION },
      { property: "og:title", content: TITLE },
      { property: "og:description", content: DESCRIPTION },
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
        numberOfItems: COLLECTION_ORDER.length,
        itemListElement: COLLECTION_ORDER.map((key, i) => ({
          "@type": "ListItem",
          position: i + 1,
          name: COLLECTIONS[key].label,
          url: `${SITE.url}${COLLECTIONS[key].path}`,
        })),
      }),
    ],
  }),
  component: Page,
});

function Page() {
  const { vue } = Route.useSearch();
  const catalog = useCatalog(baseProducts);
  const list = useMemo(() => filterAvailable(patisserieProducts(catalog)), [catalog]);

  // « Voir toutes nos pâtisseries » — le catalogue complet reste accessible.
  const extraFilters: ExtraFilterGroup[] = useMemo(
    () => [
      {
        id: "collection",
        label: "Collection",
        type: "multi",
        get: (p) => p.collections ?? [],
        options: [
          { value: "amandes", label: "Amandes" },
          { value: "pistache", label: "Pistache, Machmoum & Pignon" },
          { value: "perles", label: "Perles" },
          { value: "tradition", label: "Tradition" },
          { value: "ramadan", label: "Ramadan" },
          { value: "aid", label: "Aïd" },
        ],
      },
    ],
    [],
  );

  if (vue === "tout") {
    return (
      <CategoryPage
        jsonLdPath="/patisserie"
        title="Toutes nos pâtisseries"
        subtitle="Toute la pâtisserie tunisienne Ö' Sweets, toutes collections confondues. Façonnée à la main chaque matin à Évry-Courcouronnes."
        heroImage={catPat}
        breadcrumb={[
          { label: "Accueil", to: "/" },
          { label: "Pâtisserie Tunisienne", to: "/patisserie" },
          { label: "Toutes nos pâtisseries" },
        ]}
        products={list}
        filters={{ stock: true, price: true, allergens: true }}
        extraFilters={extraFilters}
      />
    );
  }

  return <CollectionsIndex catalog={list} />;
}

/** Page d'entrée de l'univers : les collections, pas les produits. */
function CollectionsIndex({ catalog }: { catalog: typeof baseProducts }) {
  // Ordre, libellés, accroches et visuels viennent de la base ; le code sert
  // de repli tant qu'elle n'a pas répondu.
  const collections = useCollections();

  const counts = useMemo(() => {
    const out = {} as Record<CollectionKey, number>;
    for (const key of COLLECTION_ORDER) out[key] = collectionProducts(key, catalog).length;
    return out;
  }, [catalog]);

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
                Pâtisserie Tunisienne
              </h1>
              <p className="mt-4 max-w-lg text-sm leading-relaxed text-charbon-soft md:text-[15px]">
                Six collections façonnées à la main dans notre atelier d'Évry-Courcouronnes.
                Choisissez la vôtre — par ingrédient ou par occasion.
              </p>
            </div>
            <div className="hidden md:col-span-5 md:block">
              <div className="h-[200px] overflow-hidden rounded-xl bg-beige">
                <img
                  src={catPat}
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
            {collections.length} collections
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
          {collections.map((def, i) => {
            const key = def.key;
            const count = counts[key] ?? 0;
            return (
              <Reveal key={key} delay={(i % 3) * 0.06}>
                <Link to={def.path} className="group block">
                  <div className="relative aspect-[4/5] overflow-hidden rounded-2xl bg-beige">
                    <img
                      src={def.image ?? COLLECTION_IMAGES[key]}
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
