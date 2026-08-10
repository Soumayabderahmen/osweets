import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { Heart, ShoppingBag, Eye, FileText, BellRing, X } from "lucide-react";
import { toast } from "sonner";
import type { Product, ProductVariant } from "@/data/products";
import { allergenLabels } from "@/data/products";
import { formatPrice, useShop } from "@/lib/shop-store";
import { isProductAvailableNow, seasonalNotice } from "@/lib/season";
import { WaitlistForm } from "@/components/patisserie/WaitlistForm";
import { ProductImage } from "@/components/ProductImage";

interface ProductCardProps {
  product: Product;
  layout?: "grid" | "list";
}

/** Label displayed above the product name (gold uppercase, centered). */
const collectionLabel = (p: Product) => {
  if (p.badge === "bestseller") return "Meilleure vente";
  if (p.badge === "nouveau") return "Création Maison";
  if (p.badge === "commande") return "Sur Commande";
  if (p.collections?.includes("ramadan")) return "Collection Ramadan";
  if (p.collections?.includes("aid")) return "Collection Aïd";
  if (p.collections?.includes("tradition")) return "Tradition";
  switch (p.category) {
    case "petits-fours":
      return "Sélection Fine";
    case "traditionnelle":
      return "Tradition";
    case "orientale":
      return "Orient Signature";
    case "cake":
      return "Cake d'Auteur";
    case "coffret":
      return "Coffret Signature";
    default:
      return "Sélection Fine";
  }
};

/** Badge éditorial (coin haut gauche de la photo) — uniquement si pertinent. */
const cardBadge = (p: Product): string | null => {
  if (p.badge === "bestseller") return "Meilleure vente";
  if (p.badge === "nouveau") return "Nouveauté";
  if (p.badge === "commande") return "Sur commande";
  return null;
};

type Action = "cart" | "quote" | "notify";

function priceLabel(p: Product) {
  if (p.hidePrice) return "Sur devis";
  if (p.variants?.length) return `dès ${formatPrice(Math.min(...p.variants.map((v) => v.price)))}`;
  if (p.draft || p.price <= 0) return "Bientôt disponible";
  return formatPrice(p.price);
}

function resolveAction(p: Product): Action {
  if (p.noCart || p.hidePrice) return "quote";
  if (p.variants?.length) return "cart";
  if (p.draft || p.price <= 0) return "notify";
  if (!isProductAvailableNow(p) || p.inStock === false) return "notify";
  return "cart";
}

/** Round 44px action button used on card hover — "light" (favoris/aperçu) or "gold" (action principale). */
function RoundButton({
  label,
  onClick,
  children,
  active,
  tone = "light",
}: {
  label: string;
  onClick: () => void;
  children: React.ReactNode;
  active?: boolean;
  tone?: "light" | "gold";
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={label}
      aria-label={label}
      className={`h-11 w-11 shrink-0 rounded-full grid place-items-center shadow-md backdrop-blur-sm transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold ${
        tone === "gold" ? "bg-gold text-white hover:bg-charbon" : "bg-ivory/95 hover:bg-ivory"
      } ${active ? "ring-1 ring-gold" : ""}`}
    >
      {children}
    </button>
  );
}

export function ProductCard({ product, layout = "grid" }: ProductCardProps) {
  const { addToCart, toggleFavorite, isFavorite } = useShop();
  const [quickView, setQuickView] = useState(false);
  const fav = isFavorite(product.slug);
  const label = collectionLabel(product);
  const action = resolveAction(product);

  const hasVariants = !!product.variants?.length;

  const onCart = (variant?: ProductVariant) => {
    if (hasVariants && !variant) {
      setQuickView(true);
      return;
    }
    addToCart({
      slug: product.slug,
      name: variant ? `${product.name} · ${variant.label}` : product.name,
      price: variant ? variant.price : product.price,
      image: variant?.image ?? product.image,
      variantId: variant?.id,
      variantLabel: variant?.label,
    });
    toast.success(
      `${variant ? `${product.name} · ${variant.label}` : product.name} ajouté au panier`,
    );
  };

  const onFavorite = () => {
    toggleFavorite(product.slug);
    toast(fav ? `${product.name} retiré des favoris` : `${product.name} ajouté aux favoris`);
  };

  const actionMeta: Record<Action, { label: string; icon: React.ReactNode; run: () => void }> = {
    cart: {
      label: hasVariants ? "Choisir un parfum" : "Ajouter au panier",
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
  };

  if (layout === "list") {
    return (
      <>
        <div className="group relative flex flex-col gap-0 border-b border-line pb-6 sm:flex-row">
          <Link
            to="/produits/$slug"
            params={{ slug: product.slug }}
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
              className="mt-2 font-display text-2xl leading-tight text-charbon transition-opacity hover:opacity-60"
            >
              {product.name}
            </Link>
            {product.shortDesc && (
              <p className="mt-2 line-clamp-2 text-sm text-charbon-soft">{product.shortDesc}</p>
            )}
            <div className="mt-4 flex items-center justify-between gap-3">
              <span className="font-price text-base text-charbon-soft">{priceLabel(product)}</span>
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

  return (
    <>
      <div className="group relative flex h-full flex-col">
        {/* Photo carrée, sans cadre */}
        <div className="relative aspect-square w-full shrink-0 overflow-hidden rounded-xl bg-sand">
          <Link
            to="/produits/$slug"
            params={{ slug: product.slug }}
            className="absolute inset-0 block"
          >
            <ProductImage
              src={product.image}
              alt={product.name}
              className="transition-transform duration-700 ease-out group-hover:scale-105"
            />
          </Link>

          {/* Voile au survol (desktop) */}
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-charbon/25 to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100" />

          {badge && (
            <span className="pointer-events-none absolute left-3 top-3 rounded-full bg-charbon px-2.5 py-1.5 text-[9px] font-medium uppercase tracking-[0.2em] text-ivory">
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
            onClick={actionMeta[action].run}
            aria-label={`${actionMeta[action].label} — ${product.name}`}
            className="h-11 flex-1 rounded-full bg-charbon text-xs uppercase tracking-[0.15em] text-ivory"
          >
            {actionMeta[action].label}
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
          <Link
            to="/produits/$slug"
            params={{ slug: product.slug }}
            className="truncate text-[15px] font-medium text-charbon transition-colors hover:text-gold"
          >
            {product.name}
          </Link>

          {product.flavorLabel && (
            <span className="mt-1 text-[11px] tracking-[0.12em] uppercase text-charbon-soft">
              {product.flavorLabel}
            </span>
          )}

          <div className="mt-1.5 flex items-baseline justify-between gap-2">
            <span className="font-price text-sm font-semibold text-gold">
              {priceLabel(product)}
            </span>
            {product.unit && <span className="text-xs text-charbon-soft">{product.unit}</span>}
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

/** Aperçu rapide — modale accessible, sans quitter la page. */
function QuickView({
  product,
  onClose,
  onCart,
  action,
}: {
  product: Product;
  onClose: () => void;
  onCart: (variant?: ProductVariant) => void;
  action: Action;
}) {
  const variants = product.variants ?? [];
  const [variantId, setVariantId] = useState<string | null>(null);
  const [qty, setQty] = useState(1);
  const variant = variants.find((v) => v.id === variantId) ?? null;
  const needsVariant = variants.length > 0 && !variant;
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

  const notice = seasonalNotice(product);

  return (
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
        className="absolute inset-0 bg-charbon/40 backdrop-blur-[2px]"
      />
      <div className="relative z-10 max-h-[88vh] w-full max-w-4xl overflow-y-auto bg-ivory shadow-[0_20px_60px_rgba(42,35,32,0.18)]">
        <button
          type="button"
          onClick={onClose}
          aria-label="Fermer"
          className="absolute right-3 top-3 z-10 grid h-10 w-10 place-items-center rounded-full bg-ivory/95 shadow-[0_2px_10px_rgba(42,35,32,0.10)]"
        >
          <X className="h-4 w-4 text-charbon" />
        </button>
        <div className="grid sm:grid-cols-2">
          <div className="aspect-square overflow-hidden rounded-xl bg-sand">
            <ProductImage
              src={variant?.image ?? product.image}
              alt={product.name}
              loading="eager"
              placeholderClassName="text-6xl"
            />
          </div>
          <div className="p-8 sm:p-10">
            <span className="text-[10px] uppercase tracking-[0.24em] text-gold">
              {collectionLabel(product)}
            </span>
            <h2 className="mt-3 font-display text-[28px] leading-tight text-charbon">
              {product.name}
            </h2>
            <div className="mt-2 font-price text-lg text-charbon-soft">
              {variant ? formatPrice(variant.price) : priceLabel(product)}
            </div>

            {variants.length > 0 && (
              <div className="mt-4">
                <div className="text-[11px] uppercase tracking-[0.22em] text-gold">
                  Choisissez un parfum
                </div>
                <div className="mt-2 flex flex-wrap gap-2">
                  {variants.map((v) => (
                    <button
                      key={v.id}
                      type="button"
                      onClick={() => setVariantId(v.id)}
                      aria-pressed={variantId === v.id}
                      className={`rounded-full border px-4 py-1.5 text-xs transition ${
                        variantId === v.id
                          ? "border-gold bg-gold/10 text-gold"
                          : "border-border bg-sable text-charbon/80 hover:border-gold hover:text-gold"
                      }`}
                    >
                      {v.label} · {formatPrice(v.price)}
                    </button>
                  ))}
                </div>
              </div>
            )}
            <p className="mt-4 text-sm leading-relaxed text-charbon/75">{product.shortDesc}</p>

            {(product.weight || product.pieces) && (
              <div className="mt-3 text-[11px] uppercase tracking-[0.18em] text-charbon/55">
                {product.weight ?? ""}
                {product.weight && product.pieces ? " · " : ""}
                {product.pieces ? `${product.pieces} pièces` : ""}
              </div>
            )}

            {product.allergens.length > 0 && (
              <div className="mt-4 flex flex-wrap gap-1.5">
                {product.allergens.map((a) => (
                  <span key={a} className="border border-border bg-sable px-2.5 py-1 text-[11px]">
                    {allergenLabels[a]}
                  </span>
                ))}
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
                        onClick={() => setQty((q) => q + 1)}
                        className="h-10 w-10 grid place-items-center hover:bg-sable"
                      >
                        +
                      </button>
                    </div>
                    <button
                      onClick={() => {
                        if (needsVariant) return;
                        for (let i = 0; i < qty; i += 1) onCart(variant ?? undefined);
                        onClose();
                      }}
                      disabled={needsVariant}
                      className={`btn btn-gold flex-1 justify-center ${needsVariant ? "opacity-50 cursor-not-allowed" : ""}`}
                    >
                      <ShoppingBag className="h-4 w-4" /> Ajouter au panier
                    </button>
                  </div>
                  {needsVariant && <p className="text-xs text-charbon/60">Choisissez un parfum</p>}
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
                  <WaitlistForm collection={product.slug} className="mt-3" compact />
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
    </div>
  );
}
