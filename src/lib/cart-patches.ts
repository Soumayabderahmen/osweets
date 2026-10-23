import type { CartItem } from "./shop-store";
import type { CartValidationResult, CartValidationLineInput } from "../api/cart-validation";
import { revalidationNeededStatus } from "./cart-rules.ts";

export const cartLineId = (i: { slug: string; variantId?: string }) =>
  i.variantId ? `${i.slug}|${i.variantId}` : i.slug;

export function mergeGift(a?: CartItem["gift"], b?: CartItem["gift"]): CartItem["gift"] {
  if (!a && !b) return undefined;
  const messages = [...new Set([a?.message?.trim(), b?.message?.trim()].filter(Boolean))];
  return { wrap: Boolean(a?.wrap || b?.wrap), message: messages.join("\n") || undefined };
}

export function cartRequestSignature(cart: CartItem[]): string {
  return JSON.stringify(
    cart.map((i) => [cartLineId(i), i.quantity, i.priceLockedAt, i.unitPriceSnapshot]),
  );
}

export function applyCartValidation(
  cart: CartItem[],
  result: CartValidationResult,
  sentLines: CartValidationLineInput[] = [],
): CartItem[] {
  const patches = new Map(result.patches.map((p) => [p.lineKey, p]));
  const sent = new Map(sentLines.map((p) => [p.lineKey, p]));
  const merged = new Map<string, CartItem>();
  for (const item of cart) {
    const key = cartLineId(item);
    const patch = patches.get(key);
    const input = sent.get(key);
    const stale =
      input && (input.quantity !== item.quantity || input.priceLockedAt !== item.priceLockedAt);
    const older = item.lastValidatedAt && item.lastValidatedAt > result.checkedAt;
    const next: CartItem =
      !patch || stale || older
        ? item
        : {
            ...item,
            ...patch,
            price: patch.unitPriceSnapshot,
            quantity: item.quantity,
            gift: item.gift,
            productId: patch.productId ?? item.productId,
            name: patch.name ?? item.name,
            image: patch.image ?? item.image,
          };
    const id = cartLineId(next);
    const previous = merged.get(id);
    if (!previous) merged.set(id, next);
    else
      merged.set(id, {
        ...previous,
        quantity: previous.quantity + next.quantity,
        gift: mergeGift(previous.gift, next.gift),
        validationStatus: revalidationNeededStatus(next.name),
      });
  }
  return [...merged.values()];
}
