import { createServerFn } from "@tanstack/react-start";

/**
 * Réglages de la boutique — tarifs de livraison et fermeture de l'atelier.
 *
 * Ces valeurs vivaient dans le code : les changer demandait un développeur.
 * Elles vivent maintenant dans la table `settings`, une ligne par réglage,
 * et l'écran Réglages du back-office les modifie directement.
 */
export interface ShopSettings {
  /** Prix de départ d'une livraison locale, en euros. */
  deliveryStart: number;
  /** Prix du kilomètre, en euros. */
  deliveryPerKm: number;
  /** Au-delà de ce rayon, la livraison locale n'est plus proposée. */
  deliveryRadiusKm: number;
  /** Montant de commande à partir duquel la livraison locale est offerte. */
  deliveryFreeFrom: number;
  /** Prix d'un colis. */
  shippingPrice: number;
  /** Montant de commande à partir duquel le colis est offert. */
  shippingFreeFrom: number;
  /** Atelier fermé : aucune commande n'est possible. */
  holidayMode: boolean;
  /** Dates affichées à la cliente, en toutes lettres. */
  holidayFrom: string;
  holidayUntil: string;
  /** Supplément d'emballage cadeau, en euros. */
  giftWrapPrice: number;
  /** Adresse du point de retrait, telle qu'elle est montrée. */
  workshopAddress: string;
  /** Délai annoncé pour un colis — « Colis 48-72h ». */
  shippingDelay: string;
  /** Modalité de retrait annoncée — « Sur rendez-vous à l'atelier ». */
  pickupDelay: string;
}

/** Valeurs de repli, utilisées tant que la base n'a pas répondu. */
export const DEFAULT_SETTINGS: ShopSettings = {
  deliveryStart: 5,
  deliveryPerKm: 1.2,
  deliveryRadiusKm: 30,
  deliveryFreeFrom: 150,
  shippingPrice: 9.9,
  shippingFreeFrom: 80,
  holidayMode: false,
  holidayFrom: "",
  holidayUntil: "",
  giftWrapPrice: 5,
  workshopAddress: "Atelier Ö' Sweets — Évry-Courcouronnes (91)",
  shippingDelay: "Colis 48-72h",
  pickupDelay: "Sur rendez-vous à l'atelier",
};

/** Nom de la ligne en base ← champ de l'objet. */
const KEYS = {
  delivery_start: "deliveryStart",
  delivery_per_km: "deliveryPerKm",
  delivery_radius_km: "deliveryRadiusKm",
  delivery_free_from: "deliveryFreeFrom",
  shipping_price: "shippingPrice",
  shipping_free_from: "shippingFreeFrom",
  holiday_mode: "holidayMode",
  holiday_from: "holidayFrom",
  holiday_until: "holidayUntil",
  gift_wrap_price: "giftWrapPrice",
  workshop_address: "workshopAddress",
  shipping_delay: "shippingDelay",
  pickup_delay: "pickupDelay",
} as const;

type SettingKey = keyof typeof KEYS;

const NUMERIC: readonly SettingKey[] = [
  "delivery_start",
  "delivery_per_km",
  "delivery_radius_km",
  "delivery_free_from",
  "shipping_price",
  "shipping_free_from",
  "gift_wrap_price",
];

/** Une valeur texte de la base → la valeur typée attendue par le site. */
function decode(key: SettingKey, raw: string): number | boolean | string {
  if (NUMERIC.includes(key)) {
    const n = Number(String(raw).replace(",", "."));
    return Number.isFinite(n) ? n : 0;
  }
  if (key === "holiday_mode") return raw === "on";
  return raw;
}

/** Réglages de la boutique. Lisible sans être connectée : le site en a besoin. */
export const getSettings = createServerFn({ method: "GET" }).handler(
  async (): Promise<ShopSettings> => {
    const { query, isDatabaseConfigured } = await import("./db");
    if (!isDatabaseConfigured()) return DEFAULT_SETTINGS;
    try {
      const rows = await query<{ key: string; value: string }>(
        "SELECT key, value FROM public.settings",
      );
      const out: ShopSettings = { ...DEFAULT_SETTINGS };
      for (const r of rows) {
        const field = KEYS[r.key as SettingKey];
        if (!field) continue;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (out as any)[field] = decode(r.key as SettingKey, r.value);
      }
      return out;
    } catch {
      return DEFAULT_SETTINGS;
    }
  },
);

/**
 * Enregistre un ou plusieurs réglages. Seules les clés connues passent :
 * une clé inventée est ignorée, jamais écrite.
 */
export const saveSettings = createServerFn({ method: "POST" })
  .inputValidator((d: { values: Partial<Record<SettingKey, string>> }) => d)
  .handler(async ({ data }): Promise<ShopSettings> => {
    const [{ query }, { requireAdmin }] = await Promise.all([
      import("./db"),
      import("./session"),
    ]);
    await requireAdmin();
    const entries = Object.entries(data.values).filter(
      ([k, v]) => k in KEYS && typeof v === "string",
    ) as [SettingKey, string][];
    for (const [key, value] of entries) {
      await query(
        `INSERT INTO public.settings (key, value) VALUES ($1, $2)
         ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value`,
        [key, value],
      );
    }
    return getSettings();
  });

/** Le prix d'une livraison locale, calculé au même endroit partout. */
export function localDeliveryPrice(
  s: ShopSettings,
  distanceKm: number,
  orderTotal: number,
): { available: boolean; price: number; free: boolean } {
  if (distanceKm > s.deliveryRadiusKm) return { available: false, price: 0, free: false };
  if (s.deliveryFreeFrom > 0 && orderTotal >= s.deliveryFreeFrom)
    return { available: true, price: 0, free: true };
  const price = s.deliveryStart + s.deliveryPerKm * distanceKm;
  return { available: true, price: Math.round(price * 100) / 100, free: false };
}

/** Le prix d'un colis, même logique. */
export function shippingPrice(s: ShopSettings, orderTotal: number) {
  const free = s.shippingFreeFrom > 0 && orderTotal >= s.shippingFreeFrom;
  return { price: free ? 0 : s.shippingPrice, free };
}
