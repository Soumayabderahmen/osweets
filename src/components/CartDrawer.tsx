import { Link } from "@tanstack/react-router";
import { X, Plus, Minus, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { formatPrice, lineId, useShop } from "@/lib/shop-store";
import { ProductImage } from "@/components/ProductImage";
import { cartPackaging } from "@/lib/variant-label";
import type { Product } from "@/data/products";
import { useCatalog } from "@/lib/catalog";
import { lineUnitPrice, priceLockNotice } from "@/lib/cart-rules";
import { useCartValidation } from "@/lib/use-cart-validation";

/**
 * Unité de vente affichée sous le nom (« coffret », « / 500 g »…).
 * L'unité portée par la ligne prime — un coffret sur mesure n'existe pas au catalogue.
 */
const unitFor = (item: { slug: string; unit?: string }, catalogue: Product[]) =>
  item.unit ?? catalogue.find((p) => p.slug === item.slug)?.unit;

export function CartDrawer() {
  const { cart, cartOpen, closeCart, updateQty, removeFromCart, cartTotal, giftTotal } = useShop();
  const validation = useCartValidation();
  const [validatedOpen, setValidatedOpen] = useState(false);
  // Le catalogue vient de la base : sans lui, une ligne pâtisserie perdrait
  // son unité de vente (« le pot ») dans le panier.
  const catalogue = useCatalog();

  // Lock body scroll when open
  useEffect(() => {
    if (!cartOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [cartOpen]);

  // Escape to close
  useEffect(() => {
    if (!cartOpen) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && closeCart();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [cartOpen, closeCart]);

  useEffect(() => {
    if (!cartOpen) {
      setValidatedOpen(false);
      return;
    }
    if (validatedOpen || cart.length === 0) return;
    setValidatedOpen(true);
    void validation.refresh();
  }, [cart.length, cartOpen, validatedOpen, validation]);

  return (
    <>
      {/* Voile */}
      <div
        onClick={closeCart}
        aria-hidden={!cartOpen}
        className={`fixed inset-0 z-[60] bg-charbon/40 backdrop-blur-sm transition-opacity duration-300 ${
          cartOpen ? "pointer-events-auto opacity-100" : "pointer-events-none opacity-0"
        }`}
      />

      {/* Tiroir */}
      <aside
        aria-hidden={!cartOpen}
        aria-label="Panier"
        className={`fixed right-0 top-0 z-[70] flex h-full w-full max-w-md flex-col bg-ivory shadow-2xl transition-transform duration-300 ease-out ${
          cartOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        {/* En-tête */}
        <div className="flex items-center justify-between border-b border-beige px-6 py-5">
          <div>
            <h2 className="font-display text-xl text-charbon">Votre panier</h2>
            <p className="mt-0.5 text-xs text-charbon-soft">
              {cart.length} article{cart.length > 1 ? "s" : ""}
            </p>
          </div>
          <button
            onClick={closeCart}
            aria-label="Fermer le panier"
            className="p-2 transition-colors hover:text-gold"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {cart.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center px-6 text-center">
            <span className="mb-4 font-display text-6xl text-gold/20">Ö</span>
            <p className="text-sm text-charbon-soft">
              Votre panier est vide — Nos pâtisseries vous attendent.
            </p>
            <Link
              to="/patisserie"
              onClick={closeCart}
              className="mt-5 inline-flex h-11 items-center rounded-full border border-charbon px-6 text-xs uppercase tracking-[0.18em] text-charbon transition-colors hover:bg-charbon hover:text-ivory"
            >
              Découvrir la boutique
            </Link>
          </div>
        ) : (
          <>
            {/* Lignes */}
            <div className="flex-1 space-y-5 overflow-auto px-6 py-5">
              {(validation.checking || validation.messages.length > 0) && (
                <div className="rounded-lg border border-gold/30 bg-gold/10 px-4 py-3 text-xs leading-relaxed text-charbon/75">
                  {validation.checking ? (
                    <p>Vérification du panier avec l'atelier...</p>
                  ) : (
                    validation.messages.map((message) => <p key={message}>{message}</p>)
                  )}
                </div>
              )}
              {cart.map((it) => {
                // Même détail de conditionnement que le panier et le checkout.
                const packaging = cartPackaging({ ...it, unit: unitFor(it, catalogue) });
                return (
                  <div key={lineId(it)} className="flex gap-4">
                    <div className="h-20 w-20 shrink-0 overflow-hidden rounded-xl bg-sable">
                      <ProductImage src={it.image} alt={it.name} placeholderClassName="text-2xl" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-charbon">{it.name}</p>
                      {packaging && (
                        <p data-testid="drawer-packaging" className="mt-0.5 text-xs text-gold">
                          {packaging}
                        </p>
                      )}
                      {/* L'emballage cadeau et son mot se voient dès le panier :
                          la cliente doit reconnaître ce qu'elle a demandé. */}
                      {it.gift?.wrap && (
                        <p className="mt-0.5 text-xs text-gold">🎁 Emballage cadeau</p>
                      )}
                      {it.gift?.message && (
                        <p className="mt-0.5 line-clamp-2 text-[11px] italic text-charbon-soft">
                          « {it.gift.message} »
                        </p>
                      )}
                      {it.validationStatus?.message && (
                        <p
                          className={`mt-1.5 text-xs ${
                            it.validationStatus.blocking ? "text-destructive" : "text-charbon-soft"
                          }`}
                        >
                          {it.validationStatus.message}
                        </p>
                      )}
                      <p className="mt-1.5 text-sm text-charbon">
                        {lineUnitPrice(it) > 0 ? formatPrice(lineUnitPrice(it)) : "Prix à venir"}
                      </p>
                      <p className="mt-1 text-xs text-charbon-soft">{priceLockNotice(it)}</p>
                      <div className="mt-2 flex items-center gap-3">
                        <div className="flex items-center rounded-full border border-beige">
                          <button
                            onClick={() => updateQty(lineId(it), it.quantity - 1)}
                            aria-label="Diminuer"
                            className="flex h-7 w-7 items-center justify-center text-charbon transition-colors hover:text-gold"
                          >
                            <Minus className="h-3 w-3" />
                          </button>
                          <span className="w-6 text-center text-xs">{it.quantity}</span>
                          <button
                            onClick={() => updateQty(lineId(it), it.quantity + 1)}
                            aria-label="Augmenter"
                            className="flex h-7 w-7 items-center justify-center text-charbon transition-colors hover:text-gold"
                          >
                            <Plus className="h-3 w-3" />
                          </button>
                        </div>
                        <button
                          onClick={() => removeFromCart(lineId(it))}
                          aria-label={`Retirer ${it.name}`}
                          className="text-charbon-soft transition-colors hover:text-charbon"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Pied */}
            <div className="border-t border-beige px-6 py-5">
              <div className="mb-2 flex items-center justify-between">
                <span className="text-sm text-charbon-soft">Sous-total</span>
                <span className="font-display text-2xl text-charbon">
                  {cartTotal > 0 ? formatPrice(cartTotal) : "—"}
                </span>
              </div>
              {giftTotal > 0 && (
                <div className="mb-4 flex items-center justify-between text-sm">
                  <span className="text-charbon-soft">Emballage cadeau</span>
                  <span className="text-charbon">{formatPrice(giftTotal)}</span>
                </div>
              )}
              <p className="mb-4 text-xs text-charbon-soft/70">
                Livraison &amp; taxes calculées à l'étape suivante.
              </p>
              {validation.blocking ? (
                <button
                  type="button"
                  disabled
                  className="flex h-12 w-full cursor-not-allowed items-center justify-center rounded-full bg-charbon/45 text-xs uppercase tracking-[0.2em] text-ivory"
                >
                  Corrigez le panier
                </button>
              ) : (
                <Link
                  to="/checkout"
                  onClick={closeCart}
                  className="flex h-12 w-full items-center justify-center rounded-full bg-charbon text-xs uppercase tracking-[0.2em] text-ivory transition-colors hover:bg-gold"
                >
                  Passer commande
                </Link>
              )}
              <Link
                to="/panier"
                onClick={closeCart}
                className="mt-3 block text-center text-xs text-charbon-soft transition-colors hover:text-gold"
              >
                Voir le panier
              </Link>
            </div>
          </>
        )}
      </aside>
    </>
  );
}
