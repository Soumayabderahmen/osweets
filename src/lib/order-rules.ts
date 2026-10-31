/** Règles d'une commande, sans base ni réseau : le serveur et les tests les partagent. */

export type OrderStatus = "nouvelle" | "confirmee" | "preparee" | "terminee" | "annulee";

export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  nouvelle: "Nouvelle",
  confirmee: "Confirmée",
  preparee: "Préparée",
  terminee: "Terminée",
  annulee: "Annulée",
};

export const isOrderStatus = (v: string): v is OrderStatus => v in ORDER_STATUS_LABELS;

/** Une commande annulée a rendu son stock : elle ne peut plus repartir. */
export const canChangeOrderStatus = (from: OrderStatus, to: OrderStatus) =>
  from !== "annulee" && from !== to;

const round = (n: number) => Math.round(n * 100) / 100;

export function orderTotals(
  lines: { unitPrice: number; quantity: number; giftWrap?: boolean }[],
  giftWrapPrice: number,
  deliveryFee: number,
) {
  const subtotal = round(lines.reduce((sum, l) => sum + l.unitPrice * l.quantity, 0));
  const giftTotal = round(lines.filter((l) => l.giftWrap).length * giftWrapPrice);
  const fee = round(deliveryFee);
  return { subtotal, giftTotal, deliveryFee: fee, total: round(subtotal + giftTotal + fee) };
}

export interface OrderContact {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  address: string;
  postalCode: string;
  city: string;
}

/** Message à montrer à la cliente, ou `null` si les coordonnées sont complètes. */
export function orderContactError(c: OrderContact, needsAddress: boolean): string | null {
  if (!c.firstName.trim() || !c.lastName.trim()) return "Indiquez votre prénom et votre nom.";
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(c.email.trim()) || c.email.length > 255)
    return "Adresse e-mail invalide.";
  if (c.phone.replace(/\D/g, "").length < 9) return "Numéro de téléphone invalide.";
  if (needsAddress && (!c.address.trim() || !c.postalCode.trim() || !c.city.trim()))
    return "Indiquez votre adresse de livraison complète.";
  return null;
}
