import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

export interface CartItem {
  slug: string;
  name: string;
  price: number;
  image: string;
  quantity: number;
  gift?: { message?: string; wrap?: boolean };
  /** Parfum choisi (produits à variantes, ex. la kounefa). */
  variantId?: string;
  variantLabel?: string;
}

/** Identifiant de ligne panier — un même produit peut y figurer en plusieurs parfums. */
export const lineId = (i: { slug: string; variantId?: string }) =>
  i.variantId ? `${i.slug}|${i.variantId}` : i.slug;

interface ShopState {
  cart: CartItem[];
  favorites: string[];
  addToCart: (item: Omit<CartItem, "quantity">, qty?: number) => void;
  removeFromCart: (line: string) => void;
  updateQty: (line: string, qty: number) => void;
  clearCart: () => void;
  toggleFavorite: (slug: string) => void;
  isFavorite: (slug: string) => boolean;
  cartCount: number;
  cartTotal: number;
  cartOpen: boolean;
  openCart: () => void;
  closeCart: () => void;
}

const ShopContext = createContext<ShopState | null>(null);

const CART_KEY = "osweets-cart-v1";
const FAV_KEY = "osweets-fav-v1";

export function ShopProvider({ children }: { children: ReactNode }) {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [hydrated, setHydrated] = useState(false);
  const [cartOpen, setCartOpen] = useState(false);

  useEffect(() => {
    try {
      const c = localStorage.getItem(CART_KEY);
      const f = localStorage.getItem(FAV_KEY);
      if (c) setCart(JSON.parse(c));
      if (f) setFavorites(JSON.parse(f));
    } catch {}
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (hydrated) localStorage.setItem(CART_KEY, JSON.stringify(cart));
  }, [cart, hydrated]);
  useEffect(() => {
    if (hydrated) localStorage.setItem(FAV_KEY, JSON.stringify(favorites));
  }, [favorites, hydrated]);

  const value = useMemo<ShopState>(() => ({
    cart,
    favorites,
    addToCart: (item, qty = 1) => {
      setCart((prev) => {
        const id = lineId(item);
        const existing = prev.find((p) => lineId(p) === id);
        if (existing) {
          return prev.map((p) =>
            lineId(p) === id ? { ...p, quantity: p.quantity + qty } : p,
          );
        }
        return [...prev, { ...item, quantity: qty }];
      });
      setCartOpen(true);
    },
    removeFromCart: (line) => setCart((p) => p.filter((i) => lineId(i) !== line)),
    updateQty: (line, qty) =>
      setCart((p) =>
        qty <= 0
          ? p.filter((i) => lineId(i) !== line)
          : p.map((i) => (lineId(i) === line ? { ...i, quantity: qty } : i)),
      ),
    clearCart: () => setCart([]),
    toggleFavorite: (slug) =>
      setFavorites((prev) => (prev.includes(slug) ? prev.filter((s) => s !== slug) : [...prev, slug])),
    isFavorite: (slug) => favorites.includes(slug),
    cartCount: cart.reduce((sum, i) => sum + i.quantity, 0),
    cartTotal: cart.reduce((sum, i) => sum + i.quantity * i.price, 0),
    cartOpen,
    openCart: () => setCartOpen(true),
    closeCart: () => setCartOpen(false),
  }), [cart, favorites, cartOpen]);

  return <ShopContext.Provider value={value}>{children}</ShopContext.Provider>;
}

export function useShop() {
  const ctx = useContext(ShopContext);
  if (!ctx) throw new Error("useShop must be used inside <ShopProvider>");
  return ctx;
}

export const formatPrice = (n: number) =>
  new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR" }).format(n);
