import {
  createContext,
  useContext,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { toast } from "sonner";
import { useHolidayMode, useShopSettings } from "@/components/layout/HolidayBanner";
import {
  CART_CURRENCY,
  canAddQuantity,
  canSetLineQuantity,
  lineUnitPrice,
  normalizeCartLine,
  revalidationNeededStatus,
  type CartLineStatus,
} from "@/lib/cart-rules";
import { isProductOrderable } from "@/lib/product-rules";
import { useSeasons } from "@/lib/seasons-hook";
import { mergeGift } from "@/lib/cart-patches";

export interface CartItem {
  slug: string;
  name: string;
  price: number;
  image: string;
  quantity: number;
  productId?: string;
  category?: string;
  gift?: { message?: string; wrap?: boolean };
  /** Parfum choisi, ou composition d'un coffret sur mesure. */
  variantId?: string;
  variantLabel?: string;
  /** Unité de vente affichée dans le panier (« coffret », « / 500 g »…). */
  unit?: string;
  unitPriceSnapshot?: number;
  currency?: string;
  priceLockedAt?: string;
  priceVersion?: string;
  lastValidatedAt?: string;
  validationStatus?: CartLineStatus;
  stockQty?: number;
  stockUnlimited?: boolean;
  inStock?: boolean;
  published?: boolean;
  archived?: boolean;
  draft?: boolean;
  noCart?: boolean;
  hidePrice?: boolean;
  seasonalOnly?: boolean;
  collections?: string[];
  prepLead?: string;
}

/** Identifiant de ligne panier — un même produit peut y figurer en plusieurs parfums. */
export const lineId = (i: { slug: string; variantId?: string }) =>
  i.variantId ? `${i.slug}|${i.variantId}` : i.slug;

interface ShopState {
  cart: CartItem[];
  favorites: string[];
  addToCart: (item: Omit<CartItem, "quantity">, qty?: number) => boolean;
  removeFromCart: (line: string) => void;
  updateQty: (line: string, qty: number) => void;
  replaceCart: (items: CartItem[] | ((items: CartItem[]) => CartItem[])) => void;
  clearCart: () => void;
  toggleFavorite: (slug: string) => void;
  isFavorite: (slug: string) => boolean;
  cartCount: number;
  /** Sous-total marchandise, emballage cadeau exclu. */
  cartTotal: number;
  /** Supplément d'emballage cadeau, au tarif des Réglages. */
  giftTotal: number;
  /** Prix unitaire d'un emballage cadeau, tel qu'affiché à la cliente. */
  giftWrapPrice: number;
  cartOpen: boolean;
  openCart: () => void;
  closeCart: () => void;
}

const ShopContext = createContext<ShopState | null>(null);

const CART_KEY = "osweets-cart-v1";
const FAV_KEY = "osweets-fav-v1";

export function ShopProvider({ children }: { children: ReactNode }) {
  const [cart, setCartState] = useState<CartItem[]>([]);
  const cartRef = useRef(cart);
  const setCart = useCallback((update: CartItem[] | ((previous: CartItem[]) => CartItem[])) => {
    const next = typeof update === "function" ? update(cartRef.current) : update;
    cartRef.current = next;
    setCartState(next);
    try {
      localStorage.setItem(CART_KEY, JSON.stringify(next));
    } catch {
      /* Storage can be disabled. */
    }
  }, []);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [hydrated, setHydrated] = useState(false);
  const [cartOpen, setCartOpen] = useState(false);
  /** Atelier fermé : la boutique reste consultable, le panier n'accepte rien. */
  const { closed } = useHolidayMode();
  const seasons = useSeasons();
  /*
   * Le prix de l'emballage cadeau vient des Réglages. Il était écrit dans
   * le JSX de la fiche produit — annoncé « +5 € », et jamais ajouté au
   * total. La cliente lisait un supplément qu'elle ne payait pas.
   */
  const { giftWrapPrice } = useShopSettings();

  useEffect(() => {
    try {
      const c = localStorage.getItem(CART_KEY);
      const f = localStorage.getItem(FAV_KEY);
      if (c) {
        const saved = JSON.parse(c);
        if (Array.isArray(saved)) setCart(saved);
      }
      if (f) setFavorites(JSON.parse(f));
    } catch {
      // Stockage local indisponible ou corrompu : on repart avec un état vide.
    }
    setHydrated(true);
  }, [setCart]);
  useEffect(() => {
    if (hydrated) localStorage.setItem(FAV_KEY, JSON.stringify(favorites));
  }, [favorites, hydrated]);

  const value = useMemo<ShopState>(
    () => ({
      cart,
      favorites,
      addToCart: (item, qty = 1) => {
        // Le contrôle vit ici, à l'entrée unique du panier, plutôt que sur
        // chacun des boutons « Ajouter » répartis dans le site.
        if (closed) {
          toast.error("L'atelier est fermé : les commandes rouvrent bientôt.");
          return false;
        }
        const orderable = isProductOrderable(item, seasons);
        if (!orderable.ok) {
          if (orderable.reason === "quote") {
            toast.error(`${item.name} est proposé sur devis.`);
          } else if (orderable.reason === "season_closed") {
            toast.error(`${item.name} est une édition saisonnière actuellement indisponible.`);
          } else if (orderable.reason === "out_of_stock") {
            toast.error(`${item.name} est épuisé.`);
          } else {
            toast.error(`${item.name} n'est plus disponible à la commande.`);
          }
          return false;
        }
        const normalized = normalizeCartLine(
          {
            ...item,
            quantity: Math.max(1, Math.trunc(Number(qty) || 1)),
            unitPriceSnapshot: item.unitPriceSnapshot ?? item.price,
            currency: item.currency || CART_CURRENCY,
          },
          new Date(),
        );
        const check = canAddQuantity(cartRef.current, normalized, normalized.quantity);
        if (!check.ok) {
          toast.error(
            check.max <= 0
              ? `${item.name} est épuisé.`
              : `Quantité insuffisante : ${check.max} unité(s) encore disponible(s).`,
          );
          return false;
        }
        setCart((prev) => {
          const id = lineId(item);
          const existing = prev.find((p) => lineId(p) === id);
          if (existing) {
            return prev.map((p) =>
              lineId(p) === id
                ? {
                    ...p,
                    quantity: p.quantity + normalized.quantity,
                    stockQty: normalized.stockQty ?? p.stockQty,
                    stockUnlimited: normalized.stockUnlimited ?? p.stockUnlimited,
                    inStock: normalized.inStock ?? p.inStock,
                    gift: mergeGift(p.gift, normalized.gift),
                    validationStatus: revalidationNeededStatus(p.name),
                  }
                : p,
            );
          }
          return [
            ...prev,
            { ...normalized, validationStatus: revalidationNeededStatus(normalized.name) },
          ];
        });
        setCartOpen(true);
        return true;
      },
      removeFromCart: (line) => setCart((p) => p.filter((i) => lineId(i) !== line)),
      updateQty: (line, qty) =>
        setCart((p) => {
          if (qty <= 0) return p.filter((i) => lineId(i) !== line);
          const current = p.find((i) => lineId(i) === line);
          if (!current) return p;
          const nextQty = Math.max(1, Math.trunc(Number(qty) || 1));
          const check = canSetLineQuantity(p, current, nextQty);
          if (nextQty > current.quantity && !check.ok) {
            toast.error(
              check.max <= 0
                ? `${current.name} est épuisé.`
                : `Quantité insuffisante : ${check.max} unité(s) disponible(s).`,
            );
            return p;
          }
          return p.map((i) =>
            lineId(i) === line
              ? { ...i, quantity: nextQty, validationStatus: revalidationNeededStatus(i.name) }
              : i,
          );
        }),
      replaceCart: setCart,
      clearCart: () => setCart([]),
      toggleFavorite: (slug) =>
        setFavorites((prev) =>
          prev.includes(slug) ? prev.filter((s) => s !== slug) : [...prev, slug],
        ),
      isFavorite: (slug) => favorites.includes(slug),
      cartCount: cart.reduce((sum, i) => sum + i.quantity, 0),
      cartTotal: cart.reduce((sum, i) => sum + i.quantity * lineUnitPrice(i), 0),
      /*
       * Un emballage par ligne emballée, quelle que soit la quantité :
       * trois pâtisseries offertes ensemble tiennent dans un seul écrin.
       */
      giftTotal: cart.filter((i) => i.gift?.wrap).length * giftWrapPrice,
      giftWrapPrice,
      cartOpen,
      openCart: () => setCartOpen(true),
      closeCart: () => setCartOpen(false),
    }),
    [cart, favorites, cartOpen, closed, giftWrapPrice, seasons, setCart],
  );

  return <ShopContext.Provider value={value}>{children}</ShopContext.Provider>;
}

export function useShop() {
  const ctx = useContext(ShopContext);
  if (!ctx) throw new Error("useShop must be used inside <ShopProvider>");
  return ctx;
}

export const formatPrice = (n: number) =>
  new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR" }).format(n);
