import { createServerFn } from "@tanstack/react-start";
import type { CartValidationLineInput } from "./cart-validation";
import type { ProductRow } from "@/lib/catalog";
import type { FulfillmentMode } from "@/lib/fulfillment";
import type { OrderStatus } from "@/lib/order-rules";

export interface OrderInput {
  /** Tiré par le navigateur : renvoyer deux fois la commande n'en crée qu'une. */
  clientRef: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  mode: FulfillmentMode;
  date: string;
  km: number;
  address: string;
  address2: string;
  postalCode: string;
  city: string;
  country: string;
  billingSame: boolean;
  billingAddress: string;
  billingPostalCode: string;
  billingCity: string;
  instructions: string;
  /** Le total lu par la cliente : le serveur refuse d'en facturer un autre. */
  expectedTotal: number;
  lines: (CartValidationLineInput & {
    giftWrap?: boolean;
    giftMessage?: string;
    prepLead?: string;
    contents?: string[];
  })[];
}

export interface OrderItemRow {
  id: string;
  name: string;
  variant_label: string;
  quantity: number;
  unit_price: string;
  line_total: string;
  gift_wrap: boolean;
  gift_message: string;
  price_verified: boolean;
}

export interface OrderRow {
  id: string;
  number: string;
  status: OrderStatus;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  mode: FulfillmentMode;
  fulfillment_date: string;
  address: string;
  address2: string;
  postal_code: string;
  city: string;
  country: string;
  distance_km: string | null;
  billing_same: boolean;
  billing_address: string;
  billing_postal_code: string;
  billing_city: string;
  instructions: string;
  subtotal: string;
  gift_total: string;
  delivery_fee: string;
  total: string;
  created_at: string;
  items: OrderItemRow[];
}

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const clip = (v: unknown, max: number) =>
  String(v ?? "")
    .trim()
    .slice(0, max);

/**
 * Enregistre une commande.
 *
 * Rien de ce qu'envoie le navigateur n'est cru sur parole pour les montants :
 * le panier repasse par `validateCart`, les frais et le total sont recalculés
 * ici, et le stock est décompté dans la même transaction que l'écriture.
 * Aucun paiement n'est encaissé : l'atelier confirme ensuite la commande.
 */
export const createOrder = createServerFn({ method: "POST" })
  .inputValidator((d: OrderInput) => d)
  .handler(async ({ data }): Promise<{ number: string; total: number }> => {
    const [
      { transaction, query },
      { validateCart },
      { getSettings, localDeliveryPrice, shippingPrice },
      { validateFulfillmentDate },
      { productModes, FULFILLMENT_LABELS },
      { orderContactError, orderTotals },
      { currentUnitPrice },
      { boxPieces, boxPrice },
    ] = await Promise.all([
      import("./db"),
      import("./cart-validation"),
      import("./settings"),
      import("@/lib/checkout-date"),
      import("@/lib/fulfillment"),
      import("@/lib/order-rules"),
      import("@/lib/cart-validation-pricing"),
      import("@/lib/coffret"),
    ]);

    if (!UUID.test(data.clientRef ?? "")) throw new Error("Commande invalide. Rechargez la page.");
    if (!["shipping", "local", "pickup"].includes(data.mode))
      throw new Error("Choisissez un mode de réception.");
    const lines = (data.lines ?? []).slice(0, 100);
    if (!lines.length) throw new Error("Votre panier est vide.");
    const contactError = orderContactError(data, data.mode !== "pickup");
    if (contactError) throw new Error(contactError);

    const checked = await validateCart({ data: { lines } });
    if (!checked.ok || checked.blocking) {
      throw new Error(checked.messages[0] ?? "Votre panier doit être revérifié.");
    }

    // Un coffret est soumis aux mêmes contraintes que les pâtisseries qu'il contient.
    const contenus = lines.flatMap((l) => (l.contents ?? []).slice(0, 48));
    const slugs = [...checked.patches.map((p) => p.slug), ...contenus];
    const found = await query<ProductRow>(
      "SELECT * FROM public.products WHERE slug = ANY($1::text[])",
      [slugs],
    );
    const rows = new Map(found.map((r) => [r.slug, r]));

    const settings = await getSettings();
    const dateCheck = validateFulfillmentDate(data.date, {
      settings,
      prepLeads: lines.map((l) => rows.get(l.slug)?.prep_lead ?? l.prepLead),
    });
    if (!dateCheck.ok) throw new Error(dateCheck.message ?? "Date indisponible.");

    for (const r of rows.values()) {
      const modes = productModes({
        localOnly: r.local_only,
        requiresCold: r.requires_cold,
        shippable: r.ship_national,
        localDelivery: r.ship_local,
        pickup: r.ship_pickup,
      } as never);
      if (!modes.includes(data.mode)) {
        throw new Error(`${r.name} n'est pas disponible en ${FULFILLMENT_LABELS[data.mode]}.`);
      }
    }

    // Lignes dans l'ordre du panier, avec le prix que le serveur retient.
    const priced = lines.map((line, i) => {
      const patch = checked.patches[i];
      const row = rows.get(patch.slug);
      const pieces = boxPieces(line.slug);
      const quantity = Math.max(1, Math.min(500, Math.trunc(Number(line.quantity) || 1)));
      let unitPrice = Number(patch.price);
      let verified = false;
      if (row) {
        // Un prix garanti 15 jours peut être légitimement ancien : il reste
        // honoré, et l'écart est signalé à l'atelier.
        verified = Math.abs(currentUnitPrice(row, line).price - unitPrice) < 0.01;
      } else if (pieces !== null) {
        unitPrice = boxPrice(pieces);
        verified = true;
      }
      return {
        productId: row?.id ?? null,
        slug: patch.slug,
        name: clip(patch.name ?? line.name, 300),
        variantLabel: clip(patch.variantLabel ?? line.variantLabel, 2000),
        quantity,
        unitPrice,
        verified,
        giftWrap: Boolean(line.giftWrap),
        giftMessage: clip(line.giftMessage, 150),
        trackStock: Boolean(row && !row.stock_unlimited),
      };
    });

    const provisional = orderTotals(priced, settings.giftWrapPrice, 0);
    const km = Number(data.km) || 0;
    let fee = 0;
    if (data.mode === "shipping") fee = shippingPrice(settings, provisional.subtotal).price;
    if (data.mode === "local") {
      const local = localDeliveryPrice(settings, km, provisional.subtotal);
      if (km <= 0 || !local.available)
        throw new Error("Cette adresse est hors de notre zone de livraison.");
      fee = local.price;
    }
    const totals = orderTotals(priced, settings.giftWrapPrice, fee);
    if (Math.abs(totals.total - Number(data.expectedTotal)) >= 0.01) {
      throw new Error("Le montant de votre commande a changé. Vérifiez le récapitulatif.");
    }

    return transaction(async (client) => {
      const created = await client.query<{ id: string; number: string }>(
        `INSERT INTO public.orders
           (number, client_ref, first_name, last_name, email, phone, mode, fulfillment_date,
            address, address2, postal_code, city, country, distance_km,
            billing_same, billing_address, billing_postal_code, billing_city, instructions,
            subtotal, gift_total, delivery_fee, total)
         VALUES ('OS-' || nextval('public.orders_number_seq'), $1, $2, $3, $4, $5, $6, $7,
                 $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22)
         ON CONFLICT (client_ref) DO NOTHING
         RETURNING id, number`,
        [
          data.clientRef,
          clip(data.firstName, 120),
          clip(data.lastName, 120),
          clip(data.email, 255).toLowerCase(),
          clip(data.phone, 40),
          data.mode,
          data.date,
          data.mode === "pickup" ? "" : clip(data.address, 300),
          data.mode === "pickup" ? "" : clip(data.address2, 300),
          data.mode === "pickup" ? "" : clip(data.postalCode, 20),
          data.mode === "pickup" ? "" : clip(data.city, 120),
          data.mode === "pickup" ? "" : clip(data.country, 80),
          data.mode === "local" ? km : null,
          data.billingSame !== false,
          clip(data.billingAddress, 300),
          clip(data.billingPostalCode, 20),
          clip(data.billingCity, 120),
          clip(data.instructions, 2000),
          totals.subtotal,
          totals.giftTotal,
          totals.deliveryFee,
          totals.total,
        ],
      );

      // Déjà reçue (double clic, réseau coupé puis renvoi) : même réponse, rien de plus.
      if (!created.rows[0]) {
        const known = await client.query<{ number: string; total: string }>(
          "SELECT number, total FROM public.orders WHERE client_ref = $1",
          [data.clientRef],
        );
        return { number: known.rows[0].number, total: Number(known.rows[0].total) };
      }
      const order = created.rows[0];

      // Toujours dans le même ordre, pour que deux commandes ne se bloquent pas.
      const parProduit = new Map<string, { qty: number; name: string }>();
      for (const l of priced) {
        if (!l.trackStock || !l.productId) continue;
        const cur = parProduit.get(l.productId);
        parProduit.set(l.productId, { qty: (cur?.qty ?? 0) + l.quantity, name: l.name });
      }
      for (const [id, { qty, name }] of [...parProduit].sort(([a], [b]) => a.localeCompare(b))) {
        const taken = await client.query(
          `UPDATE public.products SET stock_qty = stock_qty - $2
            WHERE id = $1 AND NOT stock_unlimited AND stock_qty >= $2`,
          [id, qty],
        );
        if (!taken.rowCount) {
          throw new Error(`${name} vient de partir : il n'en reste plus assez.`);
        }
      }

      for (const l of priced) {
        await client.query(
          `INSERT INTO public.order_items
             (order_id, product_id, slug, name, variant_label, quantity, unit_price, line_total,
              gift_wrap, gift_message, price_verified)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
          [
            order.id,
            l.productId,
            l.slug,
            l.name,
            l.variantLabel,
            l.quantity,
            l.unitPrice,
            Math.round(l.unitPrice * l.quantity * 100) / 100,
            l.giftWrap,
            l.giftMessage,
            l.verified,
          ],
        );
      }
      return { number: order.number, total: totals.total };
    });
  });

/** Toutes les commandes, les plus récentes d'abord. */
export const listOrders = createServerFn({ method: "GET" }).handler(
  async (): Promise<OrderRow[]> => {
    const [{ query }, { requireAdmin }] = await Promise.all([import("./db"), import("./session")]);
    await requireAdmin();
    return query<OrderRow>(
      `SELECT o.*, to_char(o.fulfillment_date, 'YYYY-MM-DD') AS fulfillment_date,
              COALESCE(i.items, '[]'::json) AS items
         FROM public.orders o
         LEFT JOIN LATERAL (
           SELECT json_agg(oi ORDER BY oi.name) AS items
             FROM public.order_items oi
            WHERE oi.order_id = o.id
         ) i ON true
        ORDER BY o.created_at DESC`,
    );
  },
);

/** Change le statut. Annuler rend le stock, une seule fois : l'annulation est définitive. */
export const setOrderStatus = createServerFn({ method: "POST" })
  .inputValidator((d: { id: string; status: OrderStatus }) => d)
  .handler(async ({ data }): Promise<{ ok: true }> => {
    const [{ transaction }, { requireAdmin }, { canChangeOrderStatus, isOrderStatus }] =
      await Promise.all([import("./db"), import("./session"), import("@/lib/order-rules")]);
    await requireAdmin();
    if (!UUID.test(data.id) || !isOrderStatus(data.status)) throw new Error("Statut invalide.");

    await transaction(async (client) => {
      const found = await client.query<{ status: OrderStatus }>(
        "SELECT status FROM public.orders WHERE id = $1 FOR UPDATE",
        [data.id],
      );
      const from = found.rows[0]?.status;
      if (!from) throw new Error("Commande introuvable.");
      if (!canChangeOrderStatus(from, data.status)) {
        throw new Error("Une commande annulée ne peut plus changer de statut.");
      }
      if (data.status === "annulee") {
        await client.query(
          `UPDATE public.products p
              SET stock_qty = p.stock_qty + s.qty
             FROM (SELECT product_id, SUM(quantity)::int AS qty
                     FROM public.order_items
                    WHERE order_id = $1 AND product_id IS NOT NULL
                    GROUP BY product_id) s
            WHERE p.id = s.product_id AND NOT p.stock_unlimited`,
          [data.id],
        );
      }
      await client.query("UPDATE public.orders SET status = $2 WHERE id = $1", [
        data.id,
        data.status,
      ]);
    });
    return { ok: true };
  });
