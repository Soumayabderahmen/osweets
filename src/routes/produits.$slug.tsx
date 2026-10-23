import { createFileRoute, Link, notFound, redirect } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Heart, Plus, Minus, ShoppingBag, Truck, Package, Check, ChevronDown } from "lucide-react";
import { products, type Product } from "@/data/products";
import { seasonNames, seasonalNotice, toWindows } from "@/lib/season";
import { listSeasons, type SeasonRow } from "@/api/seasons";
import { formatPrice, useShop } from "@/lib/shop-store";
import { useShopSettings } from "@/components/layout/HolidayBanner";
import { useSeasons } from "@/lib/seasons-hook";
import { useFamilyLabel } from "@/lib/families-hook";
import { mergeComposition, scaleGramComposition } from "@/lib/composition";
import { universDe } from "@/lib/univers";
import { ProductCard } from "@/components/ProductCard";
import { ProductImage } from "@/components/ProductImage";
import { ProductGallery } from "@/components/ProductGallery";
import { familySiblings } from "@/lib/patisserie";
import { rowToProduct, useCatalog } from "@/lib/catalog";
import { PatisserieIndisponible } from "@/components/patisserie/Indisponible";
import { getProductBySlug, resolveOldSlug } from "@/api/catalog";
import { absUrl, jsonLdScript, productJsonLd, breadcrumb, SITE } from "@/lib/seo";
import { weightOptions } from "@/lib/weight";
import { OptionPicker, optionParts } from "@/components/OptionPicker";
import { quantityForProduct } from "@/lib/cart-rules";
import {
  displayedProductPrice,
  isProductDiscoverable,
  isProductOrderable,
  isProductOutOfStock,
  isProductStructuredAvailable,
  kgMainSelection,
  kgMainUnitLabel,
  productBlockReason,
  variantPrice,
} from "@/lib/product-rules";
import { QUANTITY_CHOICE_LABEL, packagingParts, variantChoiceLabel } from "@/lib/variant-label";
import { BADGE_LABEL } from "@/components/ProductCard";
import { useCollections } from "@/lib/collections";
import {
  familySuggestionGroups,
  productTaxonomyLabel,
  productTypeLabel,
} from "@/lib/family-suggestions";

/**
 * Ce que le chargeur peut rapporter.
 *
 * Trois issues, pas deux : la fiche, l'absence de fiche (404, levé), et
 * l'impossibilité de savoir — quand PostgreSQL ne répond pas. Sans cette
 * troisième, l'absence de réponse ressemblait à une absence de produit, et
 * c'est ce malentendu qui justifiait un catalogue de secours.
 */
type FicheChargee = { produit: Product; saisons: SeasonRow[] } | { indisponible: true };

export const Route = createFileRoute("/produits/$slug")({
  validateSearch: (search: Record<string, unknown>): { collection?: string } => ({
    collection: typeof search.collection === "string" ? search.collection : undefined,
  }),
  loader: async ({ params }): Promise<FicheChargee> => {
    /*
     * La base d'abord, toujours. Elle seule sait si ce produit est encore
     * en vente : une fiche archivée ou dépubliée n'en revient pas, et il
     * n'existe plus aucune copie ailleurs pour la faire revivre.
     */
    const [{ ok, row }, saisons] = await Promise.all([
      getProductBySlug({ data: { slug: params.slug } }).catch(() => ({ ok: false, row: null })),
      // Le calendrier accompagne la fiche : `head()` en a besoin, et il ne
      // peut pas appeler de crochet.
      listSeasons().catch(() => [] as SeasonRow[]),
    ]);

    // Base muette : on ne peut affirmer ni que la fiche existe, ni qu'elle
    // n'existe pas. Un 404 serait un mensonge durable pour les moteurs.
    if (!ok) return { indisponible: true };

    if (row) {
      const fromDb = rowToProduct(row);
      // Les catégories non migrées gardent leur visuel livré avec le site.
      if (!fromDb.image) {
        const statique = products.find((x) => x.slug === params.slug);
        if (statique) fromDb.image = statique.image;
      }
      return { produit: fromDb, saisons };
    }

    // La base a répondu et ne connaît pas ce slug : reste le catalogue
    // statique, qui porte encore les gâteaux, le salé, les coffrets et les
    // packs. La Pâtisserie Tunisienne, elle, n'y est plus.
    const statique = products.find((x) => x.slug === params.slug);
    if (statique) return { produit: statique, saisons };

    /*
     * Reste la mémoire des renommages. Elle vivait dans une liste du code
     * qu'il fallait compléter à la main après chaque changement de nom —
     * et qu'on oubliait. Un déclencheur en base la tient désormais seul,
     * et elle ne renvoie qu'une fiche encore en vente.
     */
    const ancienne = await resolveOldSlug({ data: { slug: params.slug } }).catch(() => ({
      ok: false,
      slug: null as string | null,
    }));
    if (ancienne.slug) {
      throw redirect({
        to: "/produits/$slug",
        params: { slug: ancienne.slug },
        statusCode: 301,
      });
    }
    // La base a parlé et ne connaît pas cette adresse, ni aujourd'hui ni hier.
    throw notFound();
  },
  head: ({ loaderData, params }) => {
    const charge = loaderData && "produit" in loaderData ? loaderData : null;
    const p = charge?.produit ?? null;
    const fenetres = toWindows(charge?.saisons ?? []);
    const path = `/produits/${params.slug}`;
    const available = p ? isProductStructuredAvailable(p, fenetres) : true;
    const notice = p ? seasonalNotice(p, fenetres) : null;
    const scripts = p
      ? [
          jsonLdScript(productJsonLd(p, { available, seasonNotice: notice, path })),
          jsonLdScript(
            breadcrumb([
              { name: "Accueil", path: "/" },
              // L'univers vient de la catégorie du produit : un cheesecake
              // n'est pas annoncé sous « Pâtisserie Tunisienne ».
              universDe(p),
              { name: p.name, path },
            ]),
          ),
        ]
      : [];
    /*
     * Ce que Google affiche.
     *
     * `seo_title` et `seo_description` étaient saisis dans le back-office,
     * enregistrés en base, déclarés dans le type — et jamais lus. La règle
     * est maintenant explicite : le champ saisi l'emporte, sinon on
     * retombe sur le nom et l'accroche du produit.
     */
    const titre = p?.seoTitle?.trim() || `${p?.name ?? "Produit"} — Ö' Sweets`;
    const desc = p?.seoDescription?.trim() || p?.shortDesc || "";

    return {
      meta: [
        { title: titre },
        { name: "description", content: desc },
        { property: "og:title", content: titre },
        { property: "og:description", content: desc },
        { property: "og:image", content: p?.image ? absUrl(p.image) : "" },
        { property: "og:type", content: "product" },
        { property: "og:url", content: absUrl(path) },
        { name: "twitter:card", content: "summary_large_image" },
        { name: "twitter:image", content: p?.image ? absUrl(p.image) : "" },
      ],
      links: [{ rel: "canonical", href: `${SITE.url}${path}` }],
      scripts,
    };
  },
  notFoundComponent: () => (
    <div className="container-os py-20 text-center">
      <h1 className="font-display text-3xl">Produit introuvable</h1>
      <Link to="/patisserie" className="btn btn-gold mt-6">
        Boutique
      </Link>
    </div>
  ),
  errorComponent: () => <div className="container-os py-20 text-center">Erreur</div>,
  component: Page,
});

function Page() {
  const charge = Route.useLoaderData();
  // PostgreSQL n'a pas répondu au chargement : on ne sait pas si cette fiche
  // existe encore. On le dit, plutôt que d'inventer une réponse.
  if ("indisponible" in charge) return <PatisserieIndisponible />;
  return <Fiche base={charge.produit} />;
}

function Fiche({ base }: { base: Product }) {
  // Le SSR sert la fiche statique (bon pour le SEO) ; dès que les ajustements
  // saisis en administration sont chargés, ils prennent le relais.
  const catalog = useCatalog(products);
  const p = catalog.find((x) => x.slug === base.slug) ?? base;
  const { cart, addToCart, toggleFavorite, isFavorite, giftWrapPrice } = useShop();
  const reglages = useShopSettings();
  const [qty, setQty] = useState(1);

  const [gift, setGift] = useState(false);
  /*
   * Le mot de la cliente était saisi dans un champ relié à rien : il
   * disparaissait au moment même où elle ajoutait au panier. Il vit
   * maintenant ici, et voyage avec la ligne jusqu'à la commande.
   */
  const [giftMessage, setGiftMessage] = useState("");
  const variants = p.variants ?? [];
  const [variantId, setVariantId] = useState<string | null>(null);
  const variant = variants.find((v) => v.id === variantId) ?? null;
  const needsVariant = variants.length > 0 && !variant;
  // Vente au poids : 500 g / 1 kg… (uniquement si la fiche n'a pas de variantes)
  const grammages = weightOptions(p);
  const [weightId, setWeightId] = useState<string | null>(null);
  const weightSel = grammages.find((w) => w.id === weightId) ?? grammages[0] ?? null;
  const unitPrice = variant
    ? variantPrice(p, variant)
    : weightSel
      ? weightSel.price
      : displayedProductPrice(p);
  // Grammage + prix de référence affichés en tête de fiche pour un produit
  // kg (« 32,00 € /kg »), jamais le grammage le moins cher.
  const kgMain = p.sellMode === "kg" ? kgMainSelection(p) : null;
  const kgKnownMain = kgMain ? { ...kgMain, pricePerKg: Number(p.price) } : null;
  const fav = isFavorite(p.slug);
  const saisons = useSeasons();
  /*
   * « Vous aimerez aussi ».
   *
   * La règle était fixe : les quatre premiers de la même catégorie, dans
   * l'ordre du catalogue. Impossible de mettre une fiche en avant sans
   * toucher au code. Le back-office peut désormais choisir ; s'il ne
   * choisit rien, l'ancienne règle sert de repli — jamais de vide.
   */
  const choisis = (p.recommended ?? [])
    .map((slug) => catalog.find((x) => x.slug === slug))
    .filter(
      (x): x is Product => Boolean(x) && x!.slug !== p.slug && isProductDiscoverable(x!, saisons),
    );
  const related = choisis.length
    ? choisis.slice(0, 4)
    : catalog
        .filter(
          (x) =>
            x.category === p.category && x.slug !== p.slug && isProductDiscoverable(x, saisons),
        )
        .slice(0, 4);
  const siblings = familySiblings(p, catalog).filter((s) => isProductDiscoverable(s, saisons));
  const suggestionGroups = familySuggestionGroups(p, catalog, saisons);
  /*
   * Fiche « assortiment » d'une famille : elle appartient à une famille mais
   * ne porte pas de parfum à elle (ex. Dattes Farcies Variées). Même critère
   * structurel que l'éditeur de composition du back-office — jamais un test
   * sur le nom du produit.
   */
  const isAssortment = p.productType === "assortiment";
  const parfumsInclus = isAssortment
    ? Array.from(new Set(siblings.map((s) => s.flavorLabel).filter(Boolean) as string[]))
    : [];
  const outOfStock = isProductOutOfStock(p);
  const alreadyInCart = quantityForProduct(cart, p.slug);
  const maxQty =
    p.stockUnlimited === false
      ? Math.max(0, Math.trunc(p.stockQty ?? 0) - alreadyInCart)
      : Infinity;
  const stockReached = !outOfStock && maxQty <= 0;
  const available = isProductOrderable(p, saisons).ok && maxQty > 0;
  // Configuration commerciale incomplète (prix/kg manquant, aucun format/pot
  // valide) : le produit reste visible et publié, mais pas commandable —
  // distinct d'une rupture de stock ou d'une fermeture saisonnière.
  const pendingConfig = productBlockReason(p, saisons) === "no_price";
  const notice = seasonalNotice(p, saisons);
  useEffect(() => {
    if (Number.isFinite(maxQty)) setQty((q) => Math.max(1, Math.min(maxQty, q)));
  }, [maxQty]);
  // La pastille nomme les fêtes du produit, pas « Ramadan / Aïd » pour tous.
  const fetes = seasonNames(p, saisons);
  const nomFamille = useFamilyLabel();
  const univers = universDe(p);
  const context = Route.useSearch().collection;
  const collections = useCollections();
  const parentCollection =
    collections.find((c) => c.key === context && c.filter(p)) ??
    collections.find((c) => c.filter(p));
  const composition = mergeComposition(p.composition, p.ingredients);
  const selectedAssortmentComposition =
    p.productType === "assortiment" && variant?.grams
      ? scaleGramComposition(p.assortmentComposition ?? [], variant.grams)
      : [];

  // Poids / pièces / conditionnement (bol, pot…) : on n'affiche que ce qui est renseigné.
  // Sur un produit vendu au format (pot, bol, 12 personnes…), c'est le format
  // choisi qui fait foi : on n'affiche ni grammage ni nombre de pièces.
  const measures = packagingParts({
    variants,
    variantLabel: variant?.label ?? null,
    weightLabel: weightSel?.label ?? null,
    weight: p.weight,
    pieces: p.pieces,
    unit: p.unit,
  });

  const choiceLabel = variantChoiceLabel(variants, p.sellMode);
  const quantityLabel = QUANTITY_CHOICE_LABEL;

  return (
    <div>
      <div className="container-os pt-8 text-[11px] uppercase tracking-[0.18em] text-charbon-soft">
        <Link to="/" className="hover:text-charbon">
          Accueil
        </Link>
        <span className="mx-2 text-charbon-soft/40">/</span>
        <Link to={univers.path} className="hover:text-charbon">
          {univers.name}
        </Link>
        <span className="mx-2 text-charbon-soft/40">/</span>
        {parentCollection && (
          <>
            <Link to={parentCollection.path}>{parentCollection.label}</Link>
            <span className="mx-2 text-charbon-soft/40">/</span>
          </>
        )}
        <span className="text-charbon">{p.name}</span>
      </div>

      <section className="container-os grid items-start gap-12 py-12 lg:grid-cols-2 lg:gap-16">
        <div className="lg:sticky lg:top-24 lg:self-start">
          <ProductGallery
            slug={p.slug}
            name={p.name}
            fallback={variant?.image ?? p.image}
            badge={
              outOfStock ? (
                <span className="absolute left-4 top-4 z-10 rounded-full bg-charbon/85 px-3 py-1 text-[10px] uppercase tracking-[0.22em] text-ivory">
                  Épuisé
                </span>
              ) : p.badge ? (
                <span className="absolute left-4 top-4 z-10 rounded-full bg-gradient-to-tr from-gold-dark to-gold-light px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.22em] text-white shadow-sm">
                  {BADGE_LABEL[p.badge]}
                </span>
              ) : null
            }
          />
        </div>

        <div>
          {outOfStock && (
            <div className="mb-4 border border-charbon/20 bg-charbon/5 px-4 py-3 text-sm text-charbon/80">
              Produit momentanément épuisé. Notre atelier le refait très bientôt — écrivez-nous pour
              être prévenu de son retour.
            </div>
          )}
          {p.seasonalOnly && (
            <span className="inline-block mb-3 text-[10px] uppercase tracking-[0.24em] text-gold border border-gold/50 px-3 py-1">
              Édition saisonnière{fetes.length ? ` — ${fetes.join(" · ")}` : ""}
            </span>
          )}
          {notice && (
            <div className="mb-4 border border-gold/40 bg-gold/10 text-charbon/80 text-sm px-4 py-3">
              {notice} Ce produit sera de nouveau disponible à la commande à l'approche de la
              saison.
            </div>
          )}
          {p.disclaimer && (
            <div className="mb-4 border border-gold/40 bg-gold/10 text-charbon/85 text-sm px-4 py-3 italic">
              {p.disclaimer}
            </div>
          )}
          <h1 className="font-display text-[34px] leading-tight md:text-[42px]">{p.name}</h1>
          {productTaxonomyLabel(p, nomFamille(p.family ?? "")) && (
            <p className="mt-1 text-[11px] uppercase tracking-[0.22em] text-gold">
              {productTaxonomyLabel(p, nomFamille(p.family ?? ""))}
            </p>
          )}
          {isAssortment && (
            <p className="mt-1 text-[11px] uppercase tracking-[0.22em] text-gold">
              Assortiment — plusieurs parfums de la famille {nomFamille(p.family ?? "")}
            </p>
          )}

          {p.hidePrice ? (
            <div className="mt-3 font-price text-2xl text-charbon">Sur devis</div>
          ) : pendingConfig ? (
            <div className="mt-3 font-price text-2xl text-charbon-soft">Tarif à venir</div>
          ) : unitPrice > 0 || variants.length ? (
            <div className="mt-3 font-price text-2xl text-charbon">
              {p.sellMode === "kg" && kgKnownMain && (
                <div className="mb-1 text-sm font-normal text-charbon-soft">
                  Prix au kilo : {formatPrice(kgKnownMain.pricePerKg)} /kg
                </div>
              )}
              {p.sellMode === "kg" && !variant
                ? kgKnownMain &&
                  `${formatPrice(kgKnownMain.price)} ${kgMainUnitLabel(kgKnownMain.grams)}`
                : variants.length && !variant
                  ? `dès ${formatPrice(displayedProductPrice(p))}`
                  : formatPrice(unitPrice)}
              {!variant && grammages.length <= 1 && p.sellMode !== "kg" && (
                <span className="ml-2 text-sm font-normal text-charbon-soft">
                  {weightSel?.label ?? p.unit ?? ""}
                </span>
              )}
            </div>
          ) : (
            <div className="mt-3 font-price text-2xl text-charbon">Sur devis</div>
          )}

          {measures.length > 0 && (
            <div
              data-testid="packaging"
              className="mt-2 text-[11px] uppercase tracking-[0.18em] text-charbon-soft"
            >
              {measures.join(" · ")}
            </div>
          )}

          {/* Assortiment : la cliente doit comprendre d'un coup d'œil ce que
              contient la boîte, avant même de choisir un grammage. */}
          {isAssortment && parfumsInclus.length > 0 && (
            <div className="mt-4 rounded-lg border border-border bg-sable/50 p-4">
              <div className="text-[11px] uppercase tracking-[0.22em] text-gold">
                Parfums de l'assortiment
              </div>
              <div className="mt-2.5 flex flex-wrap gap-2">
                {parfumsInclus.map((parfum) => (
                  <span
                    key={parfum}
                    className="rounded-full border border-beige bg-white px-3 py-1 text-xs text-charbon/80"
                  >
                    {parfum}
                  </span>
                ))}
              </div>
            </div>
          )}

          <div className="mt-6 space-y-4 leading-relaxed text-charbon-soft">
            <p>{p.description || p.shortDesc}</p>
          </div>

          {p.family &&
            (suggestionGroups.sameType.length > 0 || suggestionGroups.otherTypes.length > 0) && (
              <div className="mt-8 space-y-7 border-t border-line pt-6">
                {suggestionGroups.sameType.length > 0 && (
                  <div>
                    <div className="mb-4 text-[11px] uppercase tracking-[0.22em] text-charbon-soft">
                      {p.family === "dattes-farcies"
                        ? `Autres parfums — ${nomFamille(p.family)}`
                        : `Autres parfums — ${p.productType ?? nomFamille(p.family)}`}
                    </div>
                    <div className="grid grid-cols-3 gap-3 sm:grid-cols-4">
                      {suggestionGroups.sameType.map((s) => (
                        <Link
                          key={s.slug}
                          to="/produits/$slug"
                          params={{ slug: s.slug }}
                          className="group rounded-lg border border-beige bg-white p-2 text-center transition hover:border-gold"
                        >
                          <span className="mx-auto block aspect-square w-full overflow-hidden rounded-md bg-sand">
                            <ProductImage
                              src={s.image}
                              alt={s.name}
                              placeholderClassName="text-2xl"
                              className="transition-transform duration-700 group-hover:scale-105"
                            />
                          </span>
                          <span className="mt-2 block text-[11px] leading-snug text-charbon-soft transition-colors group-hover:text-charbon">
                            {s.flavorLabel ?? s.name}
                          </span>
                        </Link>
                      ))}
                    </div>
                  </div>
                )}
                {suggestionGroups.otherTypes.length > 0 && (
                  <div>
                    <div className="mb-4 text-[11px] uppercase tracking-[0.22em] text-charbon-soft">
                      Dans la famille {nomFamille(p.family)}
                    </div>
                    <div className="grid grid-cols-3 gap-3 sm:grid-cols-4">
                      {suggestionGroups.otherTypes.map((s) => (
                        <Link
                          key={s.slug}
                          to="/produits/$slug"
                          params={{ slug: s.slug }}
                          className="group rounded-lg border border-beige bg-white p-2 text-center transition hover:border-gold"
                        >
                          <span className="mx-auto block aspect-square w-full overflow-hidden rounded-md bg-sand">
                            <ProductImage
                              src={s.image}
                              alt={s.name}
                              className="transition-transform duration-700 group-hover:scale-105"
                            />
                          </span>
                          <span className="mt-2 block text-[11px] leading-snug text-charbon-soft">
                            {p.family === "dattes-farcies"
                              ? (s.flavorLabel ?? s.name)
                              : (productTypeLabel(s.productType) ?? s.name)}
                          </span>
                        </Link>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

          {/* Grammages / formats / contenants : composant partagé avec
              l'aperçu rapide, pour un rendu strictement identique. */}
          {variants.length > 0 && !!p.sellMode && !pendingConfig && (
            <div className="mt-8">
              <div className="text-[11px] uppercase tracking-[0.22em] text-gold mb-2.5">
                {choiceLabel}
              </div>
              <OptionPicker
                product={p}
                variants={variants}
                selectedId={variantId}
                onSelect={setVariantId}
                name="fiche-option"
              />

              {/* Répartition par parfum du grammage choisi (assortiment) —
                  affichée sous le choix, là où la cliente vient de cliquer. */}
              {variant && selectedAssortmentComposition.length > 0 && (
                <div className="mt-3 rounded-lg border border-border bg-sable/50 p-4">
                  <div className="flex items-baseline justify-between gap-4">
                    <span className="text-[11px] uppercase tracking-[0.22em] text-gold">
                      Composition de votre assortiment — {optionParts(p, variant).title}
                    </span>
                    {variant.piecesEstimate ? (
                      <span className="text-xs text-charbon-soft">
                        ≈ {variant.piecesEstimate} pièces
                      </span>
                    ) : null}
                  </div>
                  <ul className="mt-3 space-y-1.5">
                    {selectedAssortmentComposition.map((c) => (
                      <li key={c.flavor} className="flex items-baseline gap-3 text-sm">
                        <span className="text-charbon/80">{c.flavor}</span>
                        <span className="min-w-4 flex-1 border-b border-dotted border-charbon/20" />
                        <span className="font-price text-charbon">{c.grams} g</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          {variants.length > 0 && !p.sellMode && (
            <div className="mt-8">
              <div className="text-[11px] uppercase tracking-[0.22em] text-gold mb-2">
                {choiceLabel}
              </div>

              <div className="relative">
                <select
                  aria-label={choiceLabel}
                  value={variantId ?? ""}
                  onChange={(e) => setVariantId(e.target.value || null)}
                  className="w-full appearance-none border border-border bg-sable px-4 py-3 pr-10 text-sm text-charbon focus:border-gold focus:outline-none"
                >
                  <option value="">— {choiceLabel} —</option>
                  {variants.map((v) => (
                    <option key={v.id} value={v.id}>
                      {v.label} · {formatPrice(v.price ?? 0)}
                    </option>
                  ))}
                </select>
                <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gold" />
              </div>
            </div>
          )}

          {grammages.length > 1 && (
            <div className="mt-8">
              <div className="text-[11px] uppercase tracking-[0.22em] text-gold mb-2">
                {quantityLabel}
              </div>
              <div className="divide-y divide-border border border-border bg-sable/50">
                {grammages.map((w) => (
                  <label
                    key={w.id}
                    className={`flex cursor-pointer items-center justify-between gap-4 px-4 py-3 text-sm transition ${
                      weightSel?.id === w.id ? "bg-gold/10 text-charbon" : "hover:bg-sable"
                    }`}
                  >
                    <span className="flex items-center gap-3">
                      <input
                        type="radio"
                        name="grammage"
                        checked={weightSel?.id === w.id}
                        onChange={() => setWeightId(w.id)}
                        className="accent-[var(--gold)]"
                      />
                      {w.label}
                    </span>
                    <span className="font-price">{formatPrice(w.price)}</span>
                  </label>
                ))}
              </div>
            </div>
          )}

          {p.flavors && p.flavors.length > 0 && (
            <div className="mt-5">
              <div className="text-[11px] uppercase tracking-[0.22em] text-gold mb-2">
                Parfums disponibles
              </div>
              <div className="flex flex-wrap gap-2">
                {p.flavors.map((f) => (
                  <span key={f} className="text-xs px-3 py-1 bg-sable border border-border">
                    {f}
                  </span>
                ))}
              </div>
            </div>
          )}

          {p.varieties && p.varieties.length > 0 && (
            <div className="mt-5">
              <div className="text-[11px] uppercase tracking-[0.22em] text-gold mb-2">
                Variétés incluses
              </div>
              <div className="flex flex-wrap gap-2">
                {p.varieties.map((v) => (
                  <span key={v} className="text-xs px-3 py-1 bg-sable border border-border">
                    {v}
                  </span>
                ))}
              </div>
            </div>
          )}

          {typeof p.customizable === "boolean" && (
            <div className="mt-5 text-sm text-charbon/80">
              <span className="text-[11px] uppercase tracking-[0.22em] text-gold mr-2">
                Personnalisation
              </span>
              {p.customizable
                ? "Assortiment modifiable : choisissez vos variétés à la commande."
                : "Assortiment figé — composition non modifiable."}
            </div>
          )}

          {(p.pricePerPiece || p.minQuantity || p.serves || p.prepLead) && (
            <div className="mt-6 border border-border bg-sable/60 divide-y divide-border text-sm">
              {p.pricePerPiece && (
                <div className="flex justify-between gap-4 px-4 py-2">
                  <span className="text-charbon/60">Prix par pièce</span>
                  <span className="text-charbon/85">{formatPrice(p.pricePerPiece)}</span>
                </div>
              )}
              {p.minQuantity && (
                <div className="flex justify-between gap-4 px-4 py-2">
                  <span className="text-charbon/60">Quantité minimale</span>
                  <span className="text-charbon/85">{p.minQuantity}</span>
                </div>
              )}
              {p.serves && (
                <div className="flex justify-between gap-4 px-4 py-2">
                  <span className="text-charbon/60">Nombre de personnes</span>
                  <span className="text-charbon/85">environ {p.serves} personnes</span>
                </div>
              )}
              {p.prepLead && (
                <div className="flex justify-between gap-4 px-4 py-2">
                  <span className="text-charbon/60">Date de préparation</span>
                  <span className="text-charbon/85 text-right">{p.prepLead}</span>
                </div>
              )}
            </div>
          )}

          {p.deliveryMode && (
            <div className="mt-5 text-sm text-charbon/80">
              <div className="text-[11px] uppercase tracking-[0.22em] text-gold mb-1">
                {p.localOnly ? "Retrait ou livraison locale" : "Mode de livraison"}
              </div>
              {p.deliveryMode}
            </div>
          )}

          {p.localOnly && (
            <div className="mt-3 border border-gold/40 bg-gold/10 px-4 py-3 text-sm text-charbon/85">
              Produit frais : <strong>retrait à l'atelier</strong> ou{" "}
              <strong>livraison locale</strong> avec frais kilométriques.{" "}
              <strong>Aucune expédition nationale</strong> par transporteur.
            </div>
          )}

          {p.availability && !p.seasonalOnly && !outOfStock && (
            <div className="mt-5 text-sm text-charbon/70">
              <span className="font-medium">Disponible :</span> {p.availability.join(", ")}
            </div>
          )}

          {/* Qty + Add (hidden for noCart products) */}
          {p.noCart || p.hidePrice ? (
            <div className="mt-8">
              <Link
                to="/devis"
                search={{ type: p.name }}
                className="btn btn-gold w-full sm:w-auto justify-center"
              >
                <ShoppingBag className="h-4 w-4" /> Demander un devis
              </Link>
              <p className="mt-3 text-xs text-charbon/60">
                Ce produit est proposé uniquement dans nos coffrets, packs événementiels ou sur
                devis.
              </p>
            </div>
          ) : (
            <>
              <div className="mt-8 flex flex-wrap items-center gap-3 sm:gap-4">
                <div className="inline-flex items-center border border-charbon shrink-0">
                  <button
                    onClick={() => setQty((q) => Math.max(1, q - 1))}
                    className="h-12 w-12 grid place-items-center hover:bg-sable"
                  >
                    <Minus className="h-4 w-4" />
                  </button>
                  <span className="w-12 text-center font-price text-lg">{qty}</span>
                  <button
                    onClick={() => setQty((q) => Math.min(maxQty, q + 1))}
                    disabled={qty >= maxQty}
                    className="h-12 w-12 grid place-items-center hover:bg-sable"
                  >
                    <Plus className="h-4 w-4" />
                  </button>
                </div>
                <button
                  onClick={() => toggleFavorite(p.slug)}
                  className={`h-12 w-12 grid place-items-center border shrink-0 ${fav ? "border-gold bg-gold text-white" : "border-charbon hover:border-gold hover:text-gold"}`}
                  aria-label="Favoris"
                >
                  <Heart className={`h-4 w-4 ${fav ? "fill-current" : ""}`} />
                </button>
                <button
                  onClick={() =>
                    available &&
                    !needsVariant &&
                    addToCart(
                      {
                        slug: p.slug,
                        productId: p.id,
                        category: p.category,
                        // Le conditionnement s'affiche sur sa propre ligne (panier, commande).
                        name: p.name,
                        price: unitPrice,
                        image: variant?.image ?? p.image,
                        variantId:
                          variant?.id ?? (grammages.length > 1 ? weightSel?.id : undefined),
                        variantLabel: variant
                          ? variant.label
                          : grammages.length > 1
                            ? weightSel?.label
                            : undefined,
                        // Le format choisi remplace l'unité générique (« pot », « / 500 g »).
                        unit: variant || grammages.length > 1 ? "" : p.unit,
                        stockQty: p.stockQty,
                        stockUnlimited: p.stockUnlimited,
                        inStock: p.inStock,
                        published: p.published,
                        archived: p.archived,
                        draft: p.draft,
                        noCart: p.noCart,
                        hidePrice: p.hidePrice,
                        seasonalOnly: p.seasonalOnly,
                        collections: p.collections,
                        prepLead: p.prepLead,
                        gift: gift
                          ? { wrap: true, message: giftMessage.trim() || undefined }
                          : undefined,
                      },
                      qty,
                    )
                  }
                  disabled={!available || needsVariant}
                  className={`btn btn-gold w-full sm:flex-1 sm:w-auto justify-center order-last sm:order-none ${!available || needsVariant ? "opacity-50 cursor-not-allowed" : ""}`}
                >
                  <ShoppingBag className="h-4 w-4" />{" "}
                  {outOfStock
                    ? "Épuisé"
                    : pendingConfig
                      ? "Tarif à venir"
                      : stockReached
                        ? "Stock déjà dans le panier"
                        : !available
                          ? "Indisponible hors saison"
                          : needsVariant
                            ? choiceLabel
                            : "Ajouter au panier"}
                </button>
              </div>
              {pendingConfig && (
                <p className="mt-3 text-xs text-charbon/60">
                  Configuration en cours — ce produit n'est pas encore commandable en ligne.
                </p>
              )}

              <label className="mt-4 flex items-center gap-2 text-sm cursor-pointer">
                <input
                  type="checkbox"
                  checked={gift}
                  onChange={(e) => setGift(e.target.checked)}
                  className="accent-[var(--gold)]"
                />
                Emballage cadeau premium (+{formatPrice(giftWrapPrice)})
              </label>
              {gift && (
                <textarea
                  placeholder="Votre message (150 caractères)"
                  maxLength={150}
                  rows={3}
                  value={giftMessage}
                  onChange={(e) => setGiftMessage(e.target.value)}
                  className="mt-3 w-full bg-sable border border-border px-3 py-2 text-sm"
                />
              )}
            </>
          )}

          {/*
            Ces quatre lignes sont lues comme des engagements. Les deux
            premières décrivent la livraison : elles reprennent donc mot pour
            mot ce que les Réglages annoncent, et ce que le checkout
            appliquera. Auparavant elles promettaient « 24-48h » et un
            « retrait boutique 2h » que le checkout contredisait par un
            rendez-vous. Les deux dernières relèvent de la maison et ne
            dépendent d'aucun réglage.
          */}
          <div className="mt-10 grid grid-cols-2 gap-4 border-t border-border pt-6 text-xs text-charbon/70">
            <div className="flex items-center gap-2">
              <Truck className="h-4 w-4 text-gold" />
              {p.localOnly
                ? `Livraison locale · ${reglages.deliveryPerKm.toFixed(2).replace(".", ",")} €/km`
                : reglages.shippingDelay}
            </div>
            <div className="flex items-center gap-2">
              <Package className="h-4 w-4 text-gold" />
              {reglages.pickupDelay}
            </div>
            <div className="flex items-center gap-2">
              <Check className="h-4 w-4 text-gold" />
              Fait maison, à la commande
            </div>
            <div className="flex items-center gap-2">
              <Check className="h-4 w-4 text-gold" />
              Commande confirmée avant préparation
            </div>
          </div>

          <div className="mt-8 border-t border-border">
            {/*
              La conservation est propre à chaque recette : elle vient de la
              fiche, et d'elle seule. La page ajoutait auparavant, sous
              chaque produit, une phrase parlant de « gâteaux » à sortir du
              réfrigérateur — y compris pour un sablé qui n'y va jamais.
              Sans indication saisie, on ne dit rien plutôt qu'une
              approximation.
            */}
            {p.conservation?.trim() ? (
              <Accordion title="Conseils de conservation" defaultOpen>
                <p className="leading-relaxed">{p.conservation}</p>
              </Accordion>
            ) : null}

            {/*
              Un seul bloc. « Composition » et « Ingrédients » disaient deux
              fois la même chose — « Semoule de blé dur » d'un côté,
              « Semoule » de l'autre — et laissaient croire à deux listes.
              Les deux colonnes restent en base ; c'est l'affichage qui les
              réunit, en gardant l'entrée la plus précise.
            */}
            {composition.length > 0 && (
              <Accordion title="Composition">
                <ul className="space-y-1">
                  {composition.map((c) => (
                    <li key={c}>• {c}</li>
                  ))}
                </ul>
              </Accordion>
            )}

            {/*
              Allergènes — en attente.

              La liste actuelle n'a pas été vérifiée recette par recette, et
              une information d'allergène fausse est dangereuse. On ne
              l'affiche donc pas, et on n'affirme pas non plus qu'il n'y en
              a aucun : les deux seraient des affirmations que personne n'a
              contrôlées. Les données saisies restent en base, intactes,
              pour le jour où elles seront validées.
            */}
            <Accordion title="Allergènes">
              <p className="leading-relaxed text-charbon/70">Informations bientôt disponibles.</p>
              <p className="mt-3 text-xs leading-relaxed text-charbon/60">
                Nos pâtisseries sont façonnées dans un atelier qui manipule gluten, fruits à coque,
                sésame, œufs et lait : des traces sont possibles dans chaque recette. En cas
                d'allergie, écrivez-nous avant de commander.
              </p>
            </Accordion>
          </div>
        </div>
      </section>

      {related.length > 0 && (
        <section className="bg-sable section-y">
          <div className="container-os">
            <h2 className="font-display text-3xl text-center">Vous aimerez aussi</h2>
            <div className="mt-10 grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
              {related.map((r) => (
                <ProductCard key={r.slug} product={r} />
              ))}
            </div>
          </div>
        </section>
      )}
    </div>
  );
}

/** Bloc dépliable (conservation, composition, allergènes). */
function Accordion({
  title,
  defaultOpen = false,
  children,
}: {
  title: string;
  defaultOpen?: boolean;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border-b border-border">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="flex w-full items-center justify-between gap-4 py-4 text-left"
      >
        <span className="font-display text-lg">{title}</span>
        <ChevronDown
          className={`h-4 w-4 shrink-0 text-gold transition-transform duration-300 ${open ? "rotate-180" : ""}`}
        />
      </button>
      {open && <div className="pb-5 text-sm text-charbon/75">{children}</div>}
    </div>
  );
}
