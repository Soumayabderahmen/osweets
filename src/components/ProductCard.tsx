import { useCallback, useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { Link } from "@tanstack/react-router";
import { Heart, ShoppingBag, Eye, FileText, BellRing, Clock, X } from "lucide-react";
import { toast } from "sonner";
import type { Product, ProductVariant } from "@/data/products";
import { useCatalog } from "@/lib/catalog";
import { familyMembers } from "@/lib/patisserie";
import { formatPrice, useShop } from "@/lib/shop-store";
import { seasonalNotice } from "@/lib/season";
import { useSeasons } from "@/lib/seasons-hook";
import { useFamilyLabel } from "@/lib/families-hook";
import { useCollections } from "@/lib/collections";
import { productTaxonomyLabel } from "@/lib/family-suggestions";
import { scaleGramComposition } from "@/lib/composition";
import { WaitlistForm } from "@/components/patisserie/WaitlistForm";
import { ProductImage } from "@/components/ProductImage";
import { weightOptions, formatGrams } from "@/lib/weight";
import { OptionPicker } from "@/components/OptionPicker";
import { quantityForProduct } from "@/lib/cart-rules";
import {
  displayedProductPrice,
  isProductDiscoverable,
  isProductOrderable,
  isProductOutOfStock,
  kgMainSelection,
  kgMainUnitLabel,
  productBlockReason,
  variantPrice,
} from "@/lib/product-rules";
import { QUANTITY_CHOICE_LABEL, packagingText, variantChoiceLabel } from "@/lib/variant-label";

/** Résumé du conditionnement affiché sur la carte, avant l'ouverture de la fiche. */
function cardConditioning(product: Product): string | null {
  const variants = product.variants ?? [];
  if (!variants.length) return null;
  if (product.sellMode === "kg") {
    return variants
      .slice()
      .sort((a, b) => (a.grams ?? 0) - (b.grams ?? 0))
      .map((v) => formatGrams(v.grams ?? 0))
      .join(" · ");
  }
  if (product.sellMode === "pot") {
    return variants
      .filter((v) => v.weightG)
      .map((v) => `${v.weightG} g`)
      .join(" · ");
  }
  if (product.sellMode === "format") {
    return variants
      .map((v) => {
        const range = v.servesMin
          ? `${v.servesMin}${v.servesMax && v.servesMax !== v.servesMin ? `–${v.servesMax}` : ""} pers.`
          : null;
        const nom =
          v.formatSize === "small" ? "Petit" : v.formatSize === "large" ? "Grand" : v.label;
        return [nom, range].filter(Boolean).join(" · ");
      })
      .join("  ·  ");
  }
  return null;
}

interface ProductCardProps {
  product: Product;
  layout?: "grid" | "list";
  collectionContext?: { key: string; label: string };
}

/**
 * Le mot doré au-dessus du nom du produit.
 *
 * Il nommait les collections de mémoire — « Collection Ramadan »,
 * « Tradition » —, si bien qu'une collection renommée au back-office
 * gardait son ancien nom sur les cartes, et qu'une collection créée
 * ensuite retombait en silence sur « Sélection Fine ».
 *
 * Il lit maintenant la première collection du produit, telle qu'elle
 * s'appelle en base. À défaut de collection, la pastille prend le relais,
 * puis la catégorie — deux repères qui, eux, ne changent pas de nom.
 */
const CATEGORIE_LABEL: Record<string, string> = {
  "petits-fours": "Sélection Fine",
  traditionnelle: "Tradition",
  orientale: "Orient Signature",
  cake: "Cake d'Auteur",
  coffret: "Coffret Signature",
};

function useCollectionLabel(): (p: Product) => string {
  const collections = useCollections();
  return useCallback(
    (p: Product) => {
      const cles = (p.collections ?? []) as readonly string[];
      for (const c of collections) {
        if (cles.includes(c.productKey)) return c.label;
      }
      if (p.badge) return BADGE_LABEL[p.badge];
      return CATEGORIE_LABEL[p.category] ?? "Sélection Fine";
    },
    [collections],
  );
}

/** Produit marqué épuisé en administration, ou stock fini tombé à zéro. */
const isOutOfStock = isProductOutOfStock;

/**
 * L'unité de vente (« le pot », « la pièce ») précise à quoi correspond le prix.
 * Sans prix affiché — fiche en cours de rédaction, produit sur devis — elle n'a
 * plus de sens : « Bientôt disponible le pot » ne veut rien dire, on la masque.
 */
const saleUnit = (p: Product): string | null => {
  if (!p.unit) return null;
  if (p.hidePrice || p.draft || displayedProductPrice(p) <= 0) return null;
  return p.unit;
};

/** Pastille promotionnelle — le texte affiché sur la photo. */
export const BADGE_LABEL: Record<NonNullable<Product["badge"]>, string> = {
  bestseller: "Meilleure vente",
  nouveau: "Nouveauté",
  commande: "Sur commande",
  promo: "Promotion",
  limitee: "Édition limitée",
};

/** Badge éditorial (coin haut gauche de la photo) — uniquement si pertinent. */
const cardBadge = (p: Product): string | null => {
  // La rupture prime sur les pastilles promotionnelles.
  if (isOutOfStock(p)) return "Épuisé";
  return p.badge ? BADGE_LABEL[p.badge] : null;
};

type Action = "cart" | "quote" | "notify" | "pending";

/**
 * Un produit publié dont la configuration commerciale n'est pas encore
 * complète (prix au kilo manquant, aucun format/pot valide) affiche
 * « Tarif à venir » — jamais 0 €, jamais un faux prix — sans devenir
 * invisible pour autant. C'est distinct d'un vrai brouillon éditorial.
 */
function isPendingConfig(p: Product, saisons: ReturnType<typeof useSeasons>): boolean {
  return productBlockReason(p, saisons) === "no_price";
}

function priceLabel(p: Product, saisons: ReturnType<typeof useSeasons>) {
  if (p.hidePrice) return "Sur devis";
  if (isPendingConfig(p, saisons)) return "Tarif à venir";
  // Kg : un prix de référence unique et son unité (« 32,00 €/kg »), jamais
  // un « dès » sur le grammage le moins cher — ça ferait croire à un rabais.
  if (p.sellMode === "kg") {
    const main = kgMainSelection(p);
    if (!main) return "Bientôt disponible";
    return `${formatPrice(main.price)} ${kgMainUnitLabel(main.grams)}`;
  }
  const displayed = displayedProductPrice(p);
  if (p.draft || displayed <= 0) return "Bientôt disponible";
  if ((p.variants?.length ?? 0) > 1 || weightOptions(p).length > 1) {
    return `dès ${formatPrice(displayed)}`;
  }
  return formatPrice(displayed);
}

function resolveAction(p: Product, saisons: ReturnType<typeof useSeasons>): Action {
  if (p.noCart || p.hidePrice) return "quote";
  if (isPendingConfig(p, saisons)) return "pending";
  return isProductOrderable(p, saisons).ok ? "cart" : "notify";
}

/** Round 44px action button used on card hover — "light" (favoris/aperçu) or "gold" (action principale). */
function RoundButton({
  label,
  onClick,
  children,
  active,
  tone = "light",
  disabled,
}: {
  label: string;
  onClick: () => void;
  children: React.ReactNode;
  active?: boolean;
  tone?: "light" | "gold";
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={disabled ? undefined : onClick}
      disabled={disabled}
      title={label}
      aria-label={label}
      className={`h-11 w-11 shrink-0 rounded-full grid place-items-center shadow-md backdrop-blur-sm transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold ${
        disabled
          ? "cursor-not-allowed bg-beige/70 text-charbon-soft"
          : tone === "gold"
            ? "bg-gold text-white hover:bg-charbon"
            : "bg-ivory/95 hover:bg-ivory"
      } ${active ? "ring-1 ring-gold" : ""}`}
    >
      {children}
    </button>
  );
}

export function ProductCard({ product, layout = "grid", collectionContext }: ProductCardProps) {
  const { addToCart, toggleFavorite, isFavorite } = useShop();
  const [quickView, setQuickView] = useState(false);
  const fav = isFavorite(product.slug);
  const collectionLabel = useCollectionLabel();
  const familyLabel = useFamilyLabel();
  const label = collectionContext?.label ?? collectionLabel(product);
  // La saison vient de la base : hors fenêtre, la carte propose d'être
  // prévenue au lieu d'ajouter au panier.
  const saisons = useSeasons();
  const action = resolveAction(product, saisons);

  const hasVariants = !!product.variants?.length;

  const onCart = (variant?: ProductVariant, quantity = 1): boolean => {
    if (hasVariants && !variant) {
      setQuickView(true);
      return false;
    }
    const ok = addToCart(
      {
        productId: product.id,
        slug: product.slug,
        name: product.name,
        category: product.category,
        price: variant ? variantPrice(product, variant) : product.price,
        image: variant?.image ?? product.image,
        variantId: variant?.id,
        variantLabel: variant?.label,
        unit: variant ? "" : product.unit,
        stockQty: product.stockQty,
        stockUnlimited: product.stockUnlimited,
        inStock: product.inStock,
        published: product.published,
        archived: product.archived,
        draft: product.draft,
        noCart: product.noCart,
        hidePrice: product.hidePrice,
        seasonalOnly: product.seasonalOnly,
        collections: product.collections,
        prepLead: product.prepLead,
      },
      quantity,
    );
    if (!ok) return false;
    toast.success(
      `${variant ? `${product.name} · ${variant.label}` : product.name} ajouté au panier`,
    );
    return true;
  };

  const onFavorite = () => {
    toggleFavorite(product.slug);
    toast(fav ? `${product.name} retiré des favoris` : `${product.name} ajouté aux favoris`);
  };

  const actionMeta: Record<Action, { label: string; icon: React.ReactNode; run: () => void }> = {
    cart: {
      label: hasVariants
        ? variantChoiceLabel(product.variants, product.sellMode)
        : "Ajouter au panier",
      icon: <ShoppingBag className="h-4 w-4 text-white" />,
      run: () => onCart(),
    },
    quote: {
      label: "Demander un devis",
      icon: <FileText className="h-4 w-4 text-white" />,
      run: () => setQuickView(true),
    },
    notify: {
      label: "Prévenez-moi",
      icon: <BellRing className="h-4 w-4 text-white" />,
      run: () => setQuickView(true),
    },
    pending: {
      label: "Tarif à venir",
      icon: <Clock className="h-4 w-4 text-charbon-soft" />,
      run: () => {},
    },
  };

  if (layout === "list") {
    return (
      <>
        <div className="group relative flex flex-col gap-0 border-b border-line pb-6 sm:flex-row">
          <Link
            to="/produits/$slug"
            params={{ slug: product.slug }}
            search={{ collection: collectionContext?.key }}
            className="relative block w-full shrink-0 aspect-square overflow-hidden rounded-xl bg-sand sm:w-52"
          >
            <ProductImage
              src={product.image}
              alt={product.name}
              className="transition-transform duration-700 group-hover:scale-105"
            />
          </Link>
          <div className="flex flex-1 flex-col justify-center py-5 sm:py-6 sm:pl-8">
            <span className="text-[10px] uppercase tracking-[0.24em] text-gold">{label}</span>
            <Link
              to="/produits/$slug"
              params={{ slug: product.slug }}
              search={{ collection: collectionContext?.key }}
              className="mt-2 font-display text-2xl leading-tight text-charbon transition-opacity hover:opacity-60"
            >
              {product.name}
            </Link>
            {product.shortDesc && (
              <p className="mt-2 line-clamp-2 text-sm text-charbon-soft">{product.shortDesc}</p>
            )}
            <div className="mt-4 flex items-center justify-between gap-3">
              <span className="flex flex-col gap-0.5">
                <span className="flex items-baseline gap-2">
                  <span className="font-price text-base text-charbon-soft">
                    {priceLabel(product, saisons)}
                  </span>
                  {saleUnit(product) && (
                    <span className="text-xs text-charbon-soft">{saleUnit(product)}</span>
                  )}
                  {isOutOfStock(product) && (
                    <span className="text-[10px] uppercase tracking-[0.18em] text-charbon-soft">
                      · Épuisé
                    </span>
                  )}
                </span>
                {cardConditioning(product) && (
                  <span className="text-[11px] text-charbon-soft/80">
                    {cardConditioning(product)}
                  </span>
                )}
              </span>
              <div className="flex items-center gap-2">
                <RoundButton
                  label={`Ajouter ${product.name} aux favoris`}
                  onClick={onFavorite}
                  active={fav}
                >
                  <Heart
                    className={`h-4 w-4 ${fav ? "text-favorite" : "text-charbon"}`}
                    style={fav ? { fill: "var(--favorite)", color: "var(--favorite)" } : undefined}
                  />
                </RoundButton>
                <RoundButton
                  label={`${actionMeta[action].label} — ${product.name}`}
                  onClick={actionMeta[action].run}
                  tone="gold"
                  disabled={action === "pending"}
                >
                  {actionMeta[action].icon}
                </RoundButton>
                <RoundButton
                  label={`Aperçu rapide — ${product.name}`}
                  onClick={() => setQuickView(true)}
                >
                  <Eye className="h-4 w-4 text-charbon" />
                </RoundButton>
              </div>
            </div>
          </div>
        </div>
        {quickView && (
          <QuickView
            product={product}
            onClose={() => setQuickView(false)}
            onCart={onCart}
            action={action}
          />
        )}
      </>
    );
  }

  const badge = cardBadge(product);
  const soldOut = isOutOfStock(product);

  return (
    <>
      <div className="group relative flex h-full flex-col">
        {/* Photo carrée, sans cadre */}
        <div className="relative aspect-square w-full shrink-0 overflow-hidden rounded-xl bg-sand">
          <Link
            to="/produits/$slug"
            params={{ slug: product.slug }}
            search={{ collection: collectionContext?.key }}
            className="absolute inset-0 block"
          >
            <ProductImage
              src={product.image}
              alt={product.name}
              className={`transition-transform duration-700 ease-out group-hover:scale-105 ${
                soldOut ? "opacity-60" : ""
              }`}
            />
          </Link>

          {/* Voile au survol (desktop) */}
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-charbon/25 to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100" />

          {badge && (
            <span
              className={`pointer-events-none absolute left-3 top-3 z-10 rounded-full px-2.5 py-1.5 text-[9px] font-semibold uppercase tracking-[0.2em] shadow-sm ${
                soldOut
                  ? "border border-beige bg-white text-charbon-soft"
                  : "bg-gradient-to-tr from-gold-dark to-gold-light text-white"
              }`}
            >
              {badge}
            </span>
          )}

          {/* Actions rondes flottantes — desktop uniquement, au survol */}
          <div className="absolute inset-x-0 bottom-4 z-10 hidden items-center justify-center gap-2.5 opacity-0 translate-y-2 transition-all duration-300 group-hover:opacity-100 group-hover:translate-y-0 group-focus-within:opacity-100 group-focus-within:translate-y-0 lg:flex">
            <RoundButton
              label={`${fav ? "Retirer" : "Ajouter"} ${product.name} ${fav ? "des" : "aux"} favoris`}
              onClick={onFavorite}
              active={fav}
            >
              <Heart
                className={`h-4 w-4 transition-colors ${fav ? "text-favorite" : "text-charbon"}`}
                style={fav ? { fill: "var(--favorite)", color: "var(--favorite)" } : undefined}
              />
            </RoundButton>
            <RoundButton
              label={`${actionMeta[action].label} — ${product.name}`}
              onClick={actionMeta[action].run}
              tone="gold"
              disabled={action === "pending"}
            >
              {actionMeta[action].icon}
            </RoundButton>
            <RoundButton
              label={`Aperçu rapide — ${product.name}`}
              onClick={() => setQuickView(true)}
            >
              <Eye className="h-4 w-4 text-charbon" />
            </RoundButton>
          </div>
        </div>

        {/* Actions — rangée permanente sous la card, mobile uniquement */}
        <div className="mt-3 flex items-center gap-2 lg:hidden">
          <button
            type="button"
            onClick={onFavorite}
            aria-label={`${fav ? "Retirer" : "Ajouter"} ${product.name} ${fav ? "des" : "aux"} favoris`}
            className="grid h-11 w-11 shrink-0 place-items-center rounded-full border border-beige"
          >
            <Heart
              className={`h-4 w-4 ${fav ? "text-favorite" : "text-charbon"}`}
              style={fav ? { fill: "var(--favorite)", color: "var(--favorite)" } : undefined}
            />
          </button>
          <button
            type="button"
            onClick={action === "pending" ? undefined : actionMeta[action].run}
            disabled={action === "pending"}
            aria-label={`${actionMeta[action].label} — ${product.name}`}
            title={actionMeta[action].label}
            className={`grid h-11 w-11 shrink-0 place-items-center rounded-full ${
              action === "pending"
                ? "cursor-not-allowed bg-beige/70 text-charbon-soft"
                : "bg-charbon text-ivory"
            }`}
          >
            {action === "pending" ? <Clock className="h-4 w-4" /> : actionMeta[action].icon}
          </button>
          <button
            type="button"
            onClick={() => setQuickView(true)}
            aria-label={`Aperçu rapide — ${product.name}`}
            className="grid h-11 w-11 shrink-0 place-items-center rounded-full border border-beige"
          >
            <Eye className="h-4 w-4 text-charbon" />
          </button>
        </div>

        {/* Texte — hérite de la police d'affichage globale (h1-h4), aucune classe font-* à ajouter */}
        <div className="mt-4 flex flex-1 flex-col text-left">
          {/* Surtitre collection — référence base44 */}
          <span className="mb-1 text-[10px] uppercase tracking-[0.15em] text-gold/70">{label}</span>
          <Link
            to="/produits/$slug"
            params={{ slug: product.slug }}
            search={{ collection: collectionContext?.key }}
            className="truncate text-[15px] font-medium text-charbon transition-colors hover:text-gold"
          >
            {product.name}
          </Link>

          {productTaxonomyLabel(product, product.family ? familyLabel(product.family) : "") && (
            <span className="mt-1 text-[11px] tracking-[0.12em] uppercase text-charbon-soft">
              {productTaxonomyLabel(product, product.family ? familyLabel(product.family) : "")}
            </span>
          )}

          {/* Prix et unité de vente collés — l'unité qualifie le prix, elle ne part pas à droite. */}
          <div className="mt-1.5 flex flex-wrap items-baseline gap-x-2 gap-y-1">
            <span className="font-price text-sm font-semibold text-gold">
              {priceLabel(product, saisons)}
            </span>
            {saleUnit(product) && (
              <span className="text-xs text-charbon-soft">{saleUnit(product)}</span>
            )}
            {soldOut && (
              <span className="text-[10px] uppercase tracking-[0.18em] text-charbon-soft">
                · Épuisé
              </span>
            )}
          </div>
          {cardConditioning(product) && (
            <div className="mt-0.5 max-w-full whitespace-normal break-words text-[11px] leading-relaxed text-charbon-soft/80">
              {cardConditioning(product)}
            </div>
          )}
        </div>
      </div>

      {quickView && (
        <QuickView
          product={product}
          onClose={() => setQuickView(false)}
          onCart={onCart}
          action={action}
        />
      )}
    </>
  );
}

/** Aperçu rapide — modale accessible, sans quitter la page. */
function QuickView({
  product,
  onClose,
  onCart,
  action,
}: {
  product: Product;
  onClose: () => void;
  onCart: (variant?: ProductVariant, quantity?: number) => boolean;
  action: Action;
}) {
  const collectionLabel = useCollectionLabel();
  const variants = product.variants ?? [];
  const [variantId, setVariantId] = useState<string | null>(null);
  const [qty, setQty] = useState(1);
  const { cart } = useShop();
  const alreadyInCart = quantityForProduct(cart, product.slug);
  const maxQty =
    product.stockUnlimited === false
      ? Math.max(0, Math.trunc(product.stockQty ?? 0) - alreadyInCart)
      : Infinity;
  const variant = variants.find((v) => v.id === variantId) ?? null;
  const assortmentComposition =
    product.productType === "assortiment" && variant?.grams
      ? scaleGramComposition(product.assortmentComposition ?? [], variant.grams)
      : [];
  const needsVariant = variants.length > 0 && !variant;
  const choiceLabel = variantChoiceLabel(variants, product.sellMode);
  // Vente au poids (500 g / 1 kg…) — même logique que la fiche produit.
  const grammages = weightOptions(product);
  const [weightId, setWeightId] = useState<string | null>(null);
  const weightSel = grammages.find((w) => w.id === weightId) ?? grammages[0] ?? null;
  const weightVariant: ProductVariant | undefined =
    grammages.length > 1 && weightSel
      ? { id: weightSel.id, label: weightSel.label, price: weightSel.price }
      : undefined;
  // Conditionnement affiché : recalculé à chaque changement de format ou de
  // grammage, via le même module que la fiche produit et le panier.
  const packaging = packagingText({
    variants,
    variantLabel: variant?.label ?? null,
    weightLabel: weightSel?.label ?? null,
    weight: product.weight,
    pieces: product.pieces,
    unit: product.unit,
  });

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [onClose]);

  const saisonsApercu = useSeasons();
  const notice = seasonalNotice(product, saisonsApercu);

  useEffect(() => {
    if (Number.isFinite(maxQty)) setQty((q) => Math.max(1, Math.min(maxQty, q)));
  }, [maxQty]);

  /** Les autres parfums de la même famille — leur nom vient de la base. */
  const catalogue = useCatalog();
  const nomFamille = useFamilyLabel();
  const siblings = product.family
    ? familyMembers(product.family, catalogue).filter(
        (s) => s.slug !== product.slug && isProductDiscoverable(s, saisonsApercu),
      )
    : [];

  /**
   * Rendu via un portail sur <body>.
   * Les cartes sont enveloppées dans <Reveal>, qui applique un `transform` :
   * un ancêtre transformé devient le bloc conteneur d'un `position: fixed`,
   * et la modale se retrouvait enfermée dans la cellule de la grille.
   */
  if (typeof document === "undefined") return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[90] flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-label={`Aperçu de ${product.name}`}
    >
      <button
        type="button"
        aria-label="Fermer l'aperçu"
        onClick={onClose}
        className="absolute inset-0 animate-fade-in bg-charbon/50 backdrop-blur-sm"
      />
      <div className="relative z-10 max-h-[90vh] w-full max-w-3xl animate-scale-in overflow-auto rounded-2xl bg-ivory shadow-2xl">
        <button
          type="button"
          onClick={onClose}
          aria-label="Fermer"
          className="absolute right-4 top-4 z-10 grid h-10 w-10 place-items-center rounded-full bg-white/90 shadow-sm backdrop-blur transition-colors hover:bg-white"
        >
          <X className="h-4 w-4 text-charbon" />
        </button>
        <div className="grid md:grid-cols-2">
          {/*
            La photo occupe toute la hauteur du panneau sur ordinateur
            (`md:aspect-auto`) et vient épouser les coins arrondis de la carte.
          */}
          <div className="aspect-square bg-sable md:aspect-auto">
            <ProductImage
              src={variant?.image ?? product.image}
              alt={product.name}
              loading="eager"
              placeholderClassName="text-6xl"
            />
          </div>
          <div className="p-7 lg:p-9">
            <span className="text-[10px] uppercase tracking-[0.24em] text-gold">
              {collectionLabel(product)}
            </span>
            <h2 className="mt-3 font-display text-[28px] leading-tight text-charbon">
              {product.name}
            </h2>
            {productTaxonomyLabel(product, product.family ? nomFamille(product.family) : "") && (
              <p className="mt-1 text-[10px] uppercase tracking-[0.18em] text-gold">
                {productTaxonomyLabel(product, product.family ? nomFamille(product.family) : "")}
              </p>
            )}
            {/* Prix : une seule ligne forte, et — en vente au poids — le prix
                au kilo juste en dessous, qui reste la référence de la cliente
                quel que soit le grammage choisi. */}
            <div className="mt-3 flex flex-wrap items-baseline gap-x-2.5 gap-y-1">
              <span className="font-price text-2xl leading-none text-charbon">
                {variant
                  ? formatPrice(variantPrice(product, variant))
                  : weightVariant
                    ? formatPrice(weightVariant.price ?? 0)
                    : priceLabel(product, saisonsApercu)}
              </span>
              {saleUnit(product) && (
                <span className="text-xs text-charbon-soft">{saleUnit(product)}</span>
              )}
              {isOutOfStock(product) && (
                <span className="rounded-full border border-beige bg-white px-2.5 py-1 text-[10px] uppercase tracking-[0.18em] text-charbon-soft">
                  Épuisé
                </span>
              )}
            </div>
            {product.sellMode === "kg" && Number(product.price) > 0 && (
              <div className="mt-1.5 text-xs text-charbon-soft">
                Prix au kilo :{" "}
                <span className="font-price text-charbon">
                  {formatPrice(Number(product.price))} /kg
                </span>
              </div>
            )}

            {/* Conditionnement (poids ET/OU pièces) puis allergènes : les mêmes
                informations que la fiche produit, remontées près du prix. */}
            {/* Conditionnement : sur un produit vendu au format (pot, bol,
                12 personnes…), c'est le format choisi qui fait foi. */}
            {packaging && (
              <div
                data-testid="qv-packaging"
                className="mt-2 text-[11px] uppercase tracking-[0.18em] text-charbon/55"
              >
                {packaging}
              </div>
            )}

            {grammages.length > 1 && (
              <div className="mt-4">
                <div className="text-[11px] uppercase tracking-[0.22em] text-gold">
                  {QUANTITY_CHOICE_LABEL}
                </div>
                <div className="mt-2 divide-y divide-border border border-border bg-sable/50">
                  {grammages.map((w) => (
                    <label
                      key={w.id}
                      className={`flex cursor-pointer items-center justify-between gap-4 px-3 py-2 text-sm transition ${
                        weightSel?.id === w.id ? "bg-gold/10 text-charbon" : "hover:bg-sable"
                      }`}
                    >
                      <span className="flex items-center gap-2.5">
                        <input
                          type="radio"
                          name="qv-grammage"
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

            {/* Grammages / formats / contenants : même composant que la fiche
                produit, pour que les deux écrans ne puissent pas diverger. */}
            {variants.length > 0 && !!product.sellMode && action !== "pending" && (
              <div className="mt-5">
                <div className="mb-2 text-[11px] uppercase tracking-[0.22em] text-gold">
                  {choiceLabel}
                </div>
                <OptionPicker
                  product={product}
                  variants={variants}
                  selectedId={variantId}
                  onSelect={setVariantId}
                  name="qv-option"
                  compact
                />
                {assortmentComposition.length > 0 && (
                  <div className="mt-3 rounded-lg border border-beige bg-sable/60 p-3">
                    <div className="text-[10px] uppercase tracking-[0.18em] text-gold">
                      Composition de votre assortiment
                    </div>
                    <ul className="mt-2 space-y-1 text-xs text-charbon-soft">
                      {assortmentComposition.map((item) => (
                        <li key={item.flavor} className="flex justify-between gap-3">
                          <span>{item.flavor}</span>
                          <b className="font-price text-charbon">{item.grams} g</b>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}

            {variants.length > 0 && !product.sellMode && (
              <div className="mt-4">
                <div className="text-[11px] uppercase tracking-[0.22em] text-gold">
                  {choiceLabel}
                </div>

                <select
                  aria-label={choiceLabel}
                  value={variantId ?? ""}
                  onChange={(e) => setVariantId(e.target.value || null)}
                  className="mt-2 w-full border border-border bg-sable px-3 py-2.5 text-sm text-charbon focus:border-gold focus:outline-none"
                >
                  <option value="">— {choiceLabel} —</option>
                  {variants.map((v) => (
                    <option key={v.id} value={v.id}>
                      {v.label} · {formatPrice(v.price ?? 0)}
                    </option>
                  ))}
                </select>
              </div>
            )}
            <p className="mt-4 text-sm leading-relaxed text-charbon/75">{product.shortDesc}</p>

            {/* Autres parfums de la famille — même ligne que sur la fiche produit */}
            {product.family && siblings.length > 0 && (
              <div className="mt-5 border-t border-line pt-4">
                <div className="mb-3 text-[11px] uppercase tracking-[0.22em] text-charbon-soft">
                  Autres parfums — {nomFamille(product.family)}
                </div>
                <div className="flex flex-wrap gap-4">
                  {siblings.map((s) => (
                    <Link
                      key={s.slug}
                      to="/produits/$slug"
                      params={{ slug: s.slug }}
                      onClick={onClose}
                      className="group/sib w-14 text-center"
                    >
                      <span className="block h-14 w-14 overflow-hidden rounded-full bg-sand">
                        <ProductImage
                          src={s.image}
                          alt={s.name}
                          placeholderClassName="text-xl"
                          className="transition-transform duration-700 group-hover/sib:scale-105"
                        />
                      </span>
                      <span className="mt-1.5 block text-[10px] leading-snug text-charbon-soft transition-colors group-hover/sib:text-gold">
                        {s.flavorLabel ?? s.name}
                      </span>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {notice && (
              <p className="mt-4 border border-gold/40 bg-gold/10 px-3 py-2 text-xs text-charbon/80">
                {notice}
              </p>
            )}

            <div className="mt-6 space-y-3">
              {action === "cart" && (
                <>
                  <div className="flex items-center gap-3">
                    <div className="inline-flex items-center border border-charbon">
                      <button
                        type="button"
                        aria-label="Diminuer la quantité"
                        onClick={() => setQty((q) => Math.max(1, q - 1))}
                        className="h-10 w-10 grid place-items-center hover:bg-sable"
                      >
                        −
                      </button>
                      <span className="w-10 text-center font-price">{qty}</span>
                      <button
                        type="button"
                        aria-label="Augmenter la quantité"
                        onClick={() => setQty((q) => Math.min(maxQty, q + 1))}
                        disabled={qty >= maxQty}
                        className="h-10 w-10 grid place-items-center hover:bg-sable"
                      >
                        +
                      </button>
                    </div>
                    <button
                      onClick={() => {
                        if (needsVariant) return;
                        if (onCart(variant ?? weightVariant, qty)) onClose();
                      }}
                      disabled={needsVariant || maxQty <= 0}
                      className={`btn btn-gold flex-1 justify-center ${needsVariant || maxQty <= 0 ? "opacity-50 cursor-not-allowed" : ""}`}
                    >
                      <ShoppingBag className="h-4 w-4" />{" "}
                      {maxQty <= 0 ? "Épuisé" : "Ajouter au panier"}
                    </button>
                  </div>
                  {needsVariant && <p className="text-xs text-charbon/60">{choiceLabel}</p>}
                </>
              )}
              {action === "quote" && (
                <Link
                  to="/devis"
                  search={{ type: product.name }}
                  onClick={onClose}
                  className="btn btn-gold w-full justify-center"
                >
                  <FileText className="h-4 w-4" /> Demander un devis
                </Link>
              )}
              {action === "notify" && (
                <div className="border border-gold/40 bg-gold/5 p-4">
                  <div className="text-[11px] uppercase tracking-[0.2em] text-gold">
                    Prévenez-moi
                  </div>
                  <p className="mt-1 text-xs text-charbon/70">
                    Laissez votre e-mail : nous vous préviendrons dès que ce produit est disponible.
                  </p>
                  <WaitlistForm
                    collection={product.slug}
                    targetType="product"
                    className="mt-3"
                    compact
                  />
                </div>
              )}
              {action === "pending" && (
                <div className="flex items-center gap-2 border border-beige bg-sable/60 p-4 text-sm text-charbon-soft">
                  <Clock className="h-4 w-4 shrink-0" />
                  Configuration en cours — ce produit n'est pas encore commandable en ligne.
                </div>
              )}
              <Link
                to="/produits/$slug"
                params={{ slug: product.slug }}
                onClick={onClose}
                className="block text-center text-[11px] uppercase tracking-[0.2em] text-charbon/70 hover:text-gold"
              >
                Voir la fiche complète →
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
}
