import { createFileRoute, Link, notFound, redirect } from "@tanstack/react-router";
import { useState } from "react";
import { Heart, Plus, Minus, ShoppingBag, Truck, Package, Check, ChevronDown } from "lucide-react";
import { products, allergenLabels, FAMILY_LABELS, type Product } from "@/data/products";
import { isProductAvailableNow, seasonalNotice } from "@/lib/season";
import { formatPrice, useShop } from "@/lib/shop-store";
import { ProductCard } from "@/components/ProductCard";
import { ProductImage } from "@/components/ProductImage";
import { familySiblings, isPublished, PRODUCT_SLUG_REDIRECTS } from "@/lib/patisserie";
import { useCatalog } from "@/lib/catalog";
import { absUrl, jsonLdScript, productJsonLd, breadcrumb, SITE } from "@/lib/seo";

export const Route = createFileRoute("/produits/$slug")({
  loader: ({ params }) => {
    // Une fiche existante prime toujours sur la table de redirection —
    // sans quoi un ancien slug devenu un vrai produit redirigerait au lieu de s'afficher.
    const p = products.find((x) => x.slug === params.slug);
    if (p) return p;
    const target = PRODUCT_SLUG_REDIRECTS[params.slug];
    if (target && products.some((x) => x.slug === target)) {
      throw redirect({ to: "/produits/$slug", params: { slug: target }, statusCode: 301 });
    }
    throw notFound();
  },
  head: ({ loaderData, params }) => {
    const p = loaderData;
    const path = `/produits/${params.slug}`;
    const available = p ? isProductAvailableNow(p) : true;
    const notice = p ? seasonalNotice(p) : null;
    const scripts = p
      ? [
          jsonLdScript(productJsonLd(p, { available, seasonNotice: notice, path })),
          jsonLdScript(
            breadcrumb([
              { name: "Accueil", path: "/" },
              { name: "Pâtisserie Tunisienne", path: "/patisserie" },
              { name: p.name, path },
            ]),
          ),
        ]
      : [];
    return {
      meta: [
        { title: `${p?.name ?? "Produit"} — Ö' Sweets` },
        { name: "description", content: p?.shortDesc ?? "" },
        { property: "og:title", content: `${p?.name ?? "Produit"} — Ö' Sweets` },
        { property: "og:description", content: p?.shortDesc ?? "" },
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
  const base = Route.useLoaderData() as Product;
  // Le SSR sert la fiche statique (bon pour le SEO) ; dès que les ajustements
  // saisis en administration sont chargés, ils prennent le relais.
  const catalog = useCatalog(products);
  const p = catalog.find((x) => x.slug === base.slug) ?? base;
  const { addToCart, toggleFavorite, isFavorite } = useShop();
  const [qty, setQty] = useState(1);
  const [open, setOpen] = useState<string | null>("composition");
  const [gift, setGift] = useState(false);
  const variants = p.variants ?? [];
  const [variantId, setVariantId] = useState<string | null>(null);
  const variant = variants.find((v) => v.id === variantId) ?? null;
  const needsVariant = variants.length > 0 && !variant;
  const unitPrice = variant ? variant.price : p.price;
  const fav = isFavorite(p.slug);
  const related = catalog
    .filter((x) => x.category === p.category && x.slug !== p.slug && isPublished(x))
    .slice(0, 4);
  const siblings = familySiblings(p, catalog);
  const outOfStock = p.inStock === false;
  const available = isProductAvailableNow(p) && !outOfStock;
  const notice = seasonalNotice(p);

  const acc = (id: string, title: string, content: React.ReactNode) => (
    <div className="border-b border-border">
      <button
        onClick={() => setOpen(open === id ? null : id)}
        className="w-full flex justify-between items-center py-4 text-left font-display text-base"
      >
        {title}
        <ChevronDown className={`h-4 w-4 transition ${open === id ? "rotate-180" : ""}`} />
      </button>
      {open === id && <div className="pb-5 text-sm text-charbon/75 leading-relaxed">{content}</div>}
    </div>
  );

  return (
    <div>
      <div className="container-os pt-8 text-[11px] uppercase tracking-[0.18em] text-charbon-soft">
        <Link to="/" className="hover:text-charbon">
          Accueil
        </Link>
        <span className="mx-2 text-charbon-soft/40">/</span>
        <Link to="/patisserie" className="hover:text-charbon">
          Pâtisserie Tunisienne
        </Link>
        <span className="mx-2 text-charbon-soft/40">/</span>
        <span className="text-charbon">{p.name}</span>
      </div>

      <section className="container-os grid gap-12 py-12 lg:grid-cols-2 lg:gap-16">
        <div className="relative aspect-square bg-sand">
          <ProductImage
            src={variant?.image ?? p.image}
            alt={p.name}
            loading="eager"
            placeholderClassName="text-7xl"
          />
          {outOfStock && (
            <span className="absolute left-4 top-4 rounded-full bg-charbon/85 px-3 py-1 text-[10px] uppercase tracking-[0.22em] text-ivory">
              Épuisé
            </span>
          )}
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
              Édition saisonnière — Ramadan / Aïd
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
          {!p.hidePrice && (unitPrice > 0 || variants.length) ? (
            <div className="mt-4 font-price text-xl text-charbon">
              {variants.length && !variant
                ? `dès ${formatPrice(Math.min(...variants.map((v) => v.price)))}`
                : formatPrice(unitPrice)}
              <span className="ml-2 text-sm text-charbon-soft">{p.unit ?? ""}</span>
            </div>
          ) : (
            <div className="mt-4 font-price text-xl text-charbon">Sur devis</div>
          )}
          {(p.weight || p.pieces) && (
            <div className="mt-1 text-[11px] uppercase tracking-[0.18em] text-charbon-soft">
              {p.weight ?? ""}
              {p.weight && p.pieces ? " · " : ""}
              {p.pieces ? `${p.pieces} pièces` : ""}
            </div>
          )}
          <p className="mt-6 leading-relaxed text-charbon-soft">{p.shortDesc}</p>

          {variants.length > 0 && (
            <div className="mt-6">
              <div className="text-[11px] uppercase tracking-[0.22em] text-gold mb-2">
                Choisissez un parfum
              </div>
              <div className="flex flex-wrap gap-2">
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

          {p.family && siblings.length > 0 && (
            <div className="mt-8 border-t border-line pt-6">
              <div className="mb-4 text-[11px] uppercase tracking-[0.22em] text-charbon-soft">
                Autres parfums — {FAMILY_LABELS[p.family]}
              </div>
              <div className="flex flex-wrap gap-6">
                {siblings.map((s) => (
                  <Link
                    key={s.slug}
                    to="/produits/$slug"
                    params={{ slug: s.slug }}
                    className="group w-20 text-center"
                  >
                    <span className="block h-20 w-20 overflow-hidden rounded-full bg-sand">
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

          {(p.pricePerPiece || p.minQuantity || p.serves || p.pieces || p.prepLead) && (
            <div className="mt-6 border border-border bg-sable/60 divide-y divide-border text-sm">
              {p.pieces && (
                <div className="flex justify-between gap-4 px-4 py-2">
                  <span className="text-charbon/60">Nombre de pièces</span>
                  <span className="text-charbon/85">{p.pieces} pièces</span>
                </div>
              )}
              {!p.hidePrice && (
                <div className="flex justify-between gap-4 px-4 py-2">
                  <span className="text-charbon/60">Prix du plateau</span>
                  <span className="text-charbon/85">{formatPrice(p.price)}</span>
                </div>
              )}
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

          {/* Allergens visible */}
          <div className="mt-6">
            <div className="text-[11px] uppercase tracking-[0.22em] text-gold mb-2">Allergènes</div>
            <div className="flex flex-wrap gap-2">
              {p.allergens.map((a) => (
                <span key={a} className="text-xs px-3 py-1 bg-sable border border-border">
                  {allergenLabels[a]}
                </span>
              ))}
            </div>
          </div>

          {p.availability && (
            <div className="mt-5 text-sm text-charbon/70">
              <span className="font-medium">Disponible :</span> {p.availability.join(", ")}
            </div>
          )}

          {/* Qty + Add (hidden for noCart products) */}
          {p.noCart ? (
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
                    onClick={() => setQty((q) => q + 1)}
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
                        name: variant ? `${p.name} · ${variant.label}` : p.name,
                        price: unitPrice,
                        image: variant?.image ?? p.image,
                        variantId: variant?.id,
                        variantLabel: variant?.label,
                        gift: gift ? {} : undefined,
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
                    : !available
                      ? "Indisponible hors saison"
                      : needsVariant
                        ? "Choisissez un parfum"
                        : "Ajouter au panier"}
                </button>
              </div>

              <label className="mt-4 flex items-center gap-2 text-sm cursor-pointer">
                <input
                  type="checkbox"
                  checked={gift}
                  onChange={(e) => setGift(e.target.checked)}
                  className="accent-[var(--gold)]"
                />
                🎁 C'est un cadeau (emballage premium +5€)
              </label>
              {gift && (
                <textarea
                  placeholder="Votre message (150 caractères)"
                  maxLength={150}
                  rows={3}
                  className="mt-3 w-full bg-sable border border-border px-3 py-2 text-sm"
                />
              )}
            </>
          )}

          <div className="mt-6 grid grid-cols-2 gap-4 text-xs text-charbon/70">
            <div className="flex items-center gap-2">
              <Truck className="h-4 w-4 text-gold" />
              {p.localOnly ? "Livraison locale (frais km)" : "Livraison 24-48h"}
            </div>
            <div className="flex items-center gap-2">
              <Package className="h-4 w-4 text-gold" />
              {p.localOnly ? "Retrait à l'atelier" : "Retrait boutique 2h"}
            </div>
            <div className="flex items-center gap-2">
              <Check className="h-4 w-4 text-gold" />
              Frais maison
            </div>
            <div className="flex items-center gap-2">
              <Check className="h-4 w-4 text-gold" />
              Paiement sécurisé
            </div>
          </div>

          <div className="mt-10">
            {p.packIncludes &&
              p.packIncludes.length > 0 &&
              acc(
                "pack",
                "Composition du pack",
                <ul className="space-y-1">
                  {p.packIncludes.map((c) => (
                    <li key={c}>• {c}</li>
                  ))}
                  {p.serves && <li className="text-gold mt-2">Pour environ {p.serves} invités</li>}
                </ul>,
              )}
            {acc(
              "composition",
              "Composition",
              <ul className="space-y-1">
                {p.composition.map((c) => (
                  <li key={c}>• {c}</li>
                ))}
              </ul>,
            )}
            {acc("ingredients", "Ingrédients", p.ingredients.join(" · "))}
            {acc(
              "allergens-d",
              "Allergènes détaillés",
              p.allergens.map((a) => allergenLabels[a]).join(", "),
            )}
            {acc("conservation", "Conservation & Dégustation", p.conservation)}
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
