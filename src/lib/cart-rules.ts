export const CART_CURRENCY = "EUR";
export const PRICE_LOCK_DAYS = 15;
export const CART_FULL_REFRESH_HOURS = 48;
export const PRICE_LOCK_MS = PRICE_LOCK_DAYS * 24 * 60 * 60 * 1000;
export const CART_FULL_REFRESH_MS = CART_FULL_REFRESH_HOURS * 60 * 60 * 1000;

export type CartIssueCode =
  | "ok"
  | "price_initialized"
  | "price_updated"
  | "price_checked"
  | "old_cart_checked"
  | "missing_product"
  | "unpublished_product"
  | "archived_product"
  | "draft_product"
  | "season_closed"
  | "format_removed"
  | "not_sellable"
  | "out_of_stock"
  | "insufficient_stock"
  | "holiday_closed"
  | "revalidation_needed"
  | "validation_unavailable";

export interface CartLineStatus {
  code: CartIssueCode;
  message?: string;
  blocking?: boolean;
  oldPrice?: number;
  newPrice?: number;
  currentStock?: number | null;
  requested?: number;
}

export interface CartLineLike {
  slug: string;
  quantity: number;
  price: number;
  productId?: string;
  variantId?: string;
  unitPriceSnapshot?: number;
  currency?: string;
  priceLockedAt?: string;
  priceVersion?: string;
  lastValidatedAt?: string;
  validationStatus?: CartLineStatus;
  stockQty?: number;
  stockUnlimited?: boolean;
}

export function isoNow(now = new Date()): string {
  return now.toISOString();
}

function validDate(value?: string): Date | null {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

export function lineUnitPrice(line: CartLineLike): number {
  return Number(line.unitPriceSnapshot ?? line.price ?? 0);
}

export function normalizeCartLine<T extends CartLineLike>(line: T, now = new Date()): T {
  const price = Number(line.unitPriceSnapshot ?? line.price ?? 0);
  return {
    ...line,
    price,
    unitPriceSnapshot: price,
    currency: line.currency || CART_CURRENCY,
    priceLockedAt: line.priceLockedAt || isoNow(now),
    quantity: Math.max(1, Math.trunc(Number(line.quantity) || 1)),
  };
}

export function isPriceLockExpired(line: CartLineLike, now = new Date()): boolean {
  const lockedAt = validDate(line.priceLockedAt);
  if (!lockedAt) return true;
  return now.getTime() - lockedAt.getTime() >= PRICE_LOCK_MS;
}

export function priceLockNotice(line: CartLineLike): string {
  const lockedAt = validDate(line.priceLockedAt);
  if (!lockedAt) return "Le prix sera vérifié avant de continuer.";
  const end = new Intl.DateTimeFormat("fr-FR", {
    dateStyle: "short",
    timeStyle: "short",
    timeZone: "Europe/Paris",
  }).format(new Date(lockedAt.getTime() + PRICE_LOCK_MS));
  return `Prix conservé jusqu'au ${end} (heure de Paris), sans réservation de stock. Après 15 jours, le prix est actualisé avec notification de l'ancien et du nouveau prix.`;
}

export function needsFullCartRefresh(line: CartLineLike, now = new Date()): boolean {
  const validatedAt = validDate(line.lastValidatedAt);
  if (!validatedAt) return true;
  return now.getTime() - validatedAt.getTime() >= CART_FULL_REFRESH_MS;
}

export function sameCommercialLine(a: CartLineLike, b: CartLineLike): boolean {
  return a.slug === b.slug && (a.variantId ?? "") === (b.variantId ?? "");
}

export function quantityForProduct(
  cart: CartLineLike[],
  slug: string,
  exceptLine?: CartLineLike,
): number {
  return cart.reduce((sum, line) => {
    if (line.slug !== slug) return sum;
    if (exceptLine && sameCommercialLine(line, exceptLine)) return sum;
    return sum + Math.max(0, Math.trunc(Number(line.quantity) || 0));
  }, 0);
}

export function maxAdditionalQuantity(cart: CartLineLike[], item: CartLineLike): number {
  if (item.stockUnlimited !== false) return Number.POSITIVE_INFINITY;
  const stock = Math.max(0, Math.trunc(Number(item.stockQty) || 0));
  return Math.max(0, stock - quantityForProduct(cart, item.slug));
}

export function canAddQuantity(
  cart: CartLineLike[],
  item: CartLineLike,
  qty: number,
): { ok: boolean; max: number; requested: number } {
  const requested = Math.max(1, Math.trunc(Number(qty) || 1));
  const max = maxAdditionalQuantity(cart, item);
  return { ok: requested <= max, max, requested };
}

export function canSetLineQuantity(
  cart: CartLineLike[],
  line: CartLineLike,
  qty: number,
): { ok: boolean; max: number; requested: number } {
  const requested = Math.max(1, Math.trunc(Number(qty) || 1));
  if (line.stockUnlimited !== false) {
    return { ok: true, max: Number.POSITIVE_INFINITY, requested };
  }
  const stock = Math.max(0, Math.trunc(Number(line.stockQty) || 0));
  const max = Math.max(0, stock - quantityForProduct(cart, line.slug, line));
  return { ok: requested <= max, max, requested };
}

export function isBlockingCartLine(line: CartLineLike): boolean {
  return line.validationStatus?.blocking === true;
}

export function cartHasBlockingIssue(cart: CartLineLike[]): boolean {
  return cart.some(isBlockingCartLine);
}

export function revalidationNeededStatus(name: string): CartLineStatus {
  return {
    code: "revalidation_needed",
    blocking: true,
    message: `${name} doit être revérifié avant de continuer.`,
  };
}

export function priceChangeMessage(name: string, oldPrice: number, newPrice: number): string {
  const fmt = (n: number) =>
    new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR" }).format(n);
  if (newPrice > oldPrice) {
    return `Le prix de ${name} a été actualisé de ${fmt(oldPrice)} à ${fmt(newPrice)}, car sa période de garantie de 15 jours est terminée.`;
  }
  if (newPrice < oldPrice) {
    return `Bonne nouvelle : le prix de ${name} est passé de ${fmt(oldPrice)} à ${fmt(newPrice)}.`;
  }
  return `Le panier de ${name} a été vérifié avec le prix actuel.`;
}
