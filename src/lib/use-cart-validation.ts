import { useCallback, useEffect, useRef, useState } from "react";
import { validateCart, type CartValidationResult } from "@/api/cart-validation";
import { cartHasBlockingIssue } from "@/lib/cart-rules";
import { applyCartValidation, cartRequestSignature } from "@/lib/cart-patches";
import { formatPrice, lineId, useShop, type CartItem } from "@/lib/shop-store";

export { applyCartValidation } from "@/lib/cart-patches";
export const cartValidationSummary = (cart: CartItem[]) =>
  cart.map((i) => i.validationStatus?.message).filter((m): m is string => Boolean(m));
export const linePriceLabel = (item: CartItem) => formatPrice(item.unitPriceSnapshot ?? item.price);

export function useCartValidation() {
  const { cart, replaceCart } = useShop();
  const latest = useRef(cart);
  latest.current = cart;
  const request = useRef(0);
  const [checking, setChecking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [checkedSignature, setCheckedSignature] = useState("");
  const [lastCheckedAt, setLastCheckedAt] = useState<string>();
  const signature = cartRequestSignature(cart);

  const refresh = useCallback(async (): Promise<CartValidationResult> => {
    const serial = ++request.current;
    const snapshot = latest.current;
    const sentSignature = cartRequestSignature(snapshot);
    if (!snapshot.length) {
      setChecking(false);
      setError(null);
      setCheckedSignature(sentSignature);
      return {
        ok: true,
        checkedAt: new Date().toISOString(),
        patches: [],
        messages: [],
        blocking: false,
      };
    }
    setChecking(true);
    setError(null);
    const lines = snapshot.map((item) => ({ ...item, lineKey: lineId(item) }));
    try {
      const result = await validateCart({ data: { lines } });
      if (serial !== request.current || sentSignature !== cartRequestSignature(latest.current)) {
        return { ...result, blocking: true };
      }
      replaceCart((prev) => applyCartValidation(prev, result, lines));
      setCheckedSignature(sentSignature);
      setLastCheckedAt(result.checkedAt);
      if (!result.ok) setError("La vérification du panier est momentanément indisponible.");
      return result;
    } catch {
      const message =
        "La vérification du panier est momentanément indisponible. Réessayez dans un instant.";
      if (serial === request.current) setError(message);
      return {
        ok: false,
        checkedAt: new Date().toISOString(),
        patches: [],
        messages: [message],
        blocking: true,
      };
    } finally {
      if (serial === request.current) setChecking(false);
    }
  }, [replaceCart]);

  useEffect(() => {
    void refresh();
    // A request follows each commercial change, not status-only patches.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [signature]);

  return {
    checking,
    blocking:
      cart.length > 0 &&
      (checking || Boolean(error) || signature !== checkedSignature || cartHasBlockingIssue(cart)),
    messages: error ? [error] : cartValidationSummary(cart),
    lastCheckedAt,
    refresh,
  };
}
