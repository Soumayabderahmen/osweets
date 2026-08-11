import { Link } from "@tanstack/react-router";
import { X, Plus, Minus, Trash2, ShoppingBag } from "lucide-react";
import { useEffect } from "react";
import { formatPrice, lineId, useShop } from "@/lib/shop-store";
import { ProductImage } from "@/components/ProductImage";

export function CartDrawer() {
  const { cart, cartOpen, closeCart, updateQty, removeFromCart, cartTotal, cartCount } = useShop();

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

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={closeCart}
        aria-hidden={!cartOpen}
        className={`fixed inset-0 z-[60] bg-charbon/40 backdrop-blur-sm transition-opacity duration-300 ${
          cartOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        }`}
      />

      {/* Drawer */}
      <aside
        aria-hidden={!cartOpen}
        aria-label="Panier"
        className={`fixed top-0 right-0 z-[70] h-full w-full sm:w-[420px] max-w-full bg-ivory shadow-xl flex flex-col transition-transform duration-300 ease-out ${
          cartOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-beige">
          <div className="flex items-center gap-2">
            <ShoppingBag className="h-4 w-4 text-gold" />
            <span className="font-display text-lg">
              Panier{" "}
              {cartCount > 0 && <span className="text-charbon/50 text-sm">({cartCount})</span>}
            </span>
          </div>
          <button onClick={closeCart} aria-label="Fermer" className="p-2 -mr-2 hover:text-gold">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Items */}
        <div className="flex-1 overflow-y-auto">
          {cart.length === 0 ? (
            <div className="h-full grid place-items-center text-center px-6">
              <div>
                <span
                  className="font-display text-6xl text-gold/30"
                  style={{ filter: "drop-shadow(0 2px 3px rgba(42,35,32,0.18))" }}
                >
                  Ö
                </span>
                <p className="mt-4 font-display text-xl">Votre panier est vide</p>
                <p className="mt-2 text-sm text-charbon/60">Nos pâtisseries vous attendent.</p>
                <Link
                  to="/patisserie"
                  onClick={closeCart}
                  className="btn btn-gold mt-6 inline-flex"
                >
                  Découvrir la boutique
                </Link>
              </div>
            </div>
          ) : (
            <ul className="divide-y divide-beige">
              {cart.map((it) => (
                <li key={lineId(it)} className="flex gap-3 p-4">
                  <div className="h-20 w-20 shrink-0 overflow-hidden rounded-xl bg-sable">
                    <ProductImage src={it.image} alt={it.name} placeholderClassName="text-2xl" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-display text-sm leading-tight truncate">{it.name}</div>
                    <div className="font-price text-gold text-lg mt-0.5">
                      {formatPrice(it.price)}
                    </div>
                    <div className="mt-2 flex items-center justify-between gap-2">
                      <div className="inline-flex items-center border border-charbon/70">
                        <button
                          onClick={() => updateQty(lineId(it), it.quantity - 1)}
                          className="h-8 w-8 grid place-items-center hover:bg-sable"
                          aria-label="Diminuer"
                        >
                          <Minus className="h-3 w-3" />
                        </button>
                        <span className="w-8 text-center text-sm">{it.quantity}</span>
                        <button
                          onClick={() => updateQty(lineId(it), it.quantity + 1)}
                          className="h-8 w-8 grid place-items-center hover:bg-sable"
                          aria-label="Augmenter"
                        >
                          <Plus className="h-3 w-3" />
                        </button>
                      </div>
                      <button
                        onClick={() => removeFromCart(lineId(it))}
                        className="text-charbon/40 hover:text-destructive p-1"
                        aria-label="Supprimer"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Footer */}
        {cart.length > 0 && (
          <div className="border-t border-beige p-5 space-y-3 bg-ivory">
            <div className="flex justify-between text-sm text-charbon/70">
              <span>Sous-total</span>
              <span className="font-price text-lg text-charbon">{formatPrice(cartTotal)}</span>
            </div>
            <p className="text-[11px] text-charbon/50">Livraison calculée à l'étape suivante.</p>
            <Link
              to="/panier"
              onClick={closeCart}
              className="btn btn-outline-gold w-full justify-center"
            >
              Voir le panier
            </Link>
            <Link to="/checkout" onClick={closeCart} className="btn btn-gold w-full justify-center">
              Paiement
            </Link>
          </div>
        )}
      </aside>
    </>
  );
}
