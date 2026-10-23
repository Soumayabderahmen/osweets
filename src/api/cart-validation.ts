import { createServerFn } from "@tanstack/react-start";
import type { ProductRow } from "@/lib/catalog";
import {
  CART_CURRENCY,
  isPriceLockExpired,
  needsFullCartRefresh,
  priceChangeMessage,
  type CartLineStatus,
} from "@/lib/cart-rules";
import { currentUnitPrice } from "@/lib/cart-validation-pricing";
import { isProductAvailableNow, toWindows } from "@/lib/season";
import type { SeasonRow } from "@/api/seasons";
import { isPatisserieCategory } from "@/lib/patisserie-scope";

export interface CartValidationLineInput {
  lineKey: string;
  slug: string;
  productId?: string;
  category?: string;
  name: string;
  image?: string;
  quantity: number;
  price: number;
  variantId?: string;
  variantLabel?: string;
  unitPriceSnapshot?: number;
  currency?: string;
  priceLockedAt?: string;
  lastValidatedAt?: string;
}

export interface CartValidationPatch {
  lineKey: string;
  slug: string;
  productId?: string;
  name?: string;
  image?: string;
  price: number;
  unitPriceSnapshot: number;
  currency: string;
  priceLockedAt: string;
  lastValidatedAt: string;
  variantId?: string;
  variantLabel?: string;
  stockQty?: number;
  stockUnlimited?: boolean;
  inStock?: boolean;
  published?: boolean;
  draft?: boolean;
  noCart?: boolean;
  hidePrice?: boolean;
  validationStatus?: CartLineStatus;
}

export interface CartValidationResult {
  ok: boolean;
  checkedAt: string;
  patches: CartValidationPatch[];
  messages: string[];
  blocking: boolean;
}

const validUuid = (id?: string) =>
  !!id && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id);

const lineIdOf = (line: { slug: string; variantId?: string }) =>
  line.variantId ? `${line.slug}|${line.variantId}` : line.slug;

function imageOf(row: ProductRow, fallback?: string) {
  if (row.image_url) return row.image_url;
  if (row.image_key) return `/api/public/media/${row.image_key}`;
  return fallback;
}

function stockStatus(
  row: ProductRow,
  line: CartValidationLineInput,
  requestedForProduct: number,
): CartLineStatus | null {
  if (row.stock_unlimited) return null;
  const stock = Math.max(0, Math.trunc(Number(row.stock_qty) || 0));
  if (stock <= 0) {
    return {
      code: "out_of_stock",
      blocking: true,
      currentStock: stock,
      requested: requestedForProduct,
      message: `${row.name} est épuisé. Retirez-le du panier pour continuer.`,
    };
  }
  if (requestedForProduct > stock) {
    return {
      code: "insufficient_stock",
      blocking: true,
      currentStock: stock,
      requested: requestedForProduct,
      message: `Vous avez demandé ${requestedForProduct} unité(s) de ${row.name}, mais seulement ${stock} sont encore disponibles.`,
    };
  }
  return null;
}

export const validateCart = createServerFn({ method: "POST" })
  .inputValidator((d: { lines: CartValidationLineInput[] }) => d)
  .handler(async ({ data }): Promise<CartValidationResult> => {
    const { query, isDatabaseConfigured } = await import("./db");
    const checkedAt = new Date().toISOString();
    const lines = (data.lines ?? []).map((line) => ({
      ...line,
      lineKey: line.lineKey || lineIdOf(line),
      quantity: Math.max(1, Math.trunc(Number(line.quantity) || 1)),
    }));

    if (!isDatabaseConfigured()) {
      return {
        ok: false,
        checkedAt,
        patches: lines.map((line) => ({
          lineKey: line.lineKey,
          slug: line.slug,
          price: Number(line.unitPriceSnapshot ?? line.price ?? 0),
          unitPriceSnapshot: Number(line.unitPriceSnapshot ?? line.price ?? 0),
          currency: line.currency || CART_CURRENCY,
          priceLockedAt: line.priceLockedAt || checkedAt,
          lastValidatedAt: checkedAt,
          validationStatus: {
            code: "validation_unavailable",
            blocking: true,
            message:
              "La vérification du panier est momentanément indisponible. Réessayez avant de commander.",
          },
        })),
        messages: ["La vérification du panier est momentanément indisponible."],
        blocking: true,
      };
    }

    const slugs = [...new Set(lines.map((line) => line.slug).filter(Boolean))];
    const ids = [...new Set(lines.map((line) => line.productId).filter(validUuid))];
    const rows =
      slugs.length || ids.length
        ? await query<ProductRow>(
            `SELECT *
             FROM public.products
            WHERE slug = ANY($1::text[])
               OR id = ANY($2::uuid[])`,
            [slugs, ids],
          )
        : [];
    const seasons = await query<SeasonRow>(
      `SELECT id, season_key, label,
              to_char(starts_on, 'YYYY-MM-DD') AS starts_on,
              to_char(ends_on, 'YYYY-MM-DD') AS ends_on,
              preorder_days, active
         FROM public.seasons`,
    );
    const holiday = await query<{ value: string }>(
      `SELECT value
         FROM public.settings
        WHERE key = 'holiday_mode'`,
    );
    if (!holiday.length)
      throw new Error("La vérification du panier est momentanément indisponible.");
    const windows = toWindows(seasons);
    const holidayClosed = holiday[0]?.value === "on";
    const bySlug = new Map(rows.map((row) => [row.slug, row]));
    const byId = new Map(rows.map((row) => [row.id, row]));

    const requested = new Map<string, number>();
    for (const line of lines) {
      const row = (line.productId && byId.get(line.productId)) || bySlug.get(line.slug);
      if (!row) continue;
      requested.set(row.slug, (requested.get(row.slug) ?? 0) + line.quantity);
    }

    const patches: CartValidationPatch[] = [];
    const messages: string[] = [];

    for (const line of lines) {
      const row = (line.productId && byId.get(line.productId)) || bySlug.get(line.slug);
      const oldPrice = Number(line.unitPriceSnapshot ?? line.price ?? 0);
      let price = oldPrice;
      let priceLockedAt = line.priceLockedAt || checkedAt;
      let status: CartLineStatus | undefined;

      if (!row) {
        const knownDbLine = !!line.productId || isPatisserieCategory(line.category);
        status = knownDbLine
          ? {
              code: "missing_product",
              blocking: true,
              message: `${line.name} n'existe plus dans le catalogue. Retirez-le du panier.`,
            }
          : undefined;
        patches.push({
          lineKey: line.lineKey,
          slug: line.slug,
          price,
          unitPriceSnapshot: price,
          currency: line.currency || CART_CURRENCY,
          priceLockedAt,
          lastValidatedAt: checkedAt,
          validationStatus: status,
        });
        if (status?.message) messages.push(status.message);
        continue;
      }

      const current = currentUnitPrice(row, line);
      price = oldPrice || current.price;
      if (current.status) status = current.status;
      if (!status && current.price <= 0) {
        status = {
          code: "not_sellable",
          blocking: true,
          message: `${row.name} n'a pas de prix commandable en ligne. Retirez-le du panier.`,
        };
      }
      if (
        !status &&
        row.product_type === "assortiment" &&
        (row.assortment_composition ?? []).reduce(
          (sum, item) => sum + Number(item.grams || 0),
          0,
        ) !== 1000
      ) {
        status = {
          code: "not_sellable",
          blocking: true,
          message: `${row.name} est encore en cours de configuration : sa composition n'est pas finalisée. Retirez-le du panier.`,
        };
      }

      const expired = isPriceLockExpired(line, new Date(checkedAt));
      const missingPriceMetadata =
        line.unitPriceSnapshot === undefined || !line.priceLockedAt || !line.currency;
      // Une ligne jamais validée vient d'être ajoutée : ce n'est pas un
      // « panier ancien », et le lui annoncer inquiéterait pour rien.
      const oldRefresh =
        Boolean(line.lastValidatedAt) && needsFullCartRefresh(line, new Date(checkedAt));

      if (missingPriceMetadata || expired) {
        price = current.price;
        priceLockedAt = checkedAt;
        const changed = Math.abs(oldPrice - current.price) >= 0.01;
        const code = missingPriceMetadata
          ? "price_initialized"
          : changed
            ? "price_updated"
            : "price_checked";
        const message = changed
          ? priceChangeMessage(row.name, oldPrice, current.price)
          : oldRefresh
            ? `${row.name} a été revérifié avec le prix actuel.`
            : undefined;
        if (message) messages.push(message);
        if (message && !status) {
          status = {
            code,
            blocking: false,
            message,
            oldPrice,
            newPrice: current.price,
          };
        }
      } else if (oldRefresh && !status?.blocking) {
        const message = `${row.name} est toujours disponible : votre panier ancien vient d'être revérifié.`;
        messages.push(message);
        status = { code: "old_cart_checked", blocking: false, message };
      }

      if (holidayClosed) {
        status = {
          code: "holiday_closed",
          blocking: true,
          message: "L'atelier est actuellement fermé : les commandes reprendront à la réouverture.",
        };
      } else if (row.archived) {
        status = {
          code: "archived_product",
          blocking: true,
          message: `${row.name} a été archivé. Retirez-le du panier pour continuer.`,
        };
      } else if (!row.published) {
        status = {
          code: "unpublished_product",
          blocking: true,
          message: `${row.name} n'est plus publié. Retirez-le du panier pour continuer.`,
        };
      } else if (row.draft) {
        status = {
          code: "draft_product",
          blocking: true,
          message: `${row.name} est en brouillon. Retirez-le du panier pour continuer.`,
        };
      } else if (row.no_cart || row.hide_price) {
        status = {
          code: "not_sellable",
          blocking: true,
          message: `${row.name} n'est plus commandable en ligne. Retirez-le du panier.`,
        };
      } else if (
        !isProductAvailableNow(
          {
            slug: row.slug,
            name: row.name,
            category: row.category as never,
            price: Number(row.price ?? 0),
            image: imageOf(row, line.image) ?? "",
            shortDesc: row.short_desc ?? "",
            description: row.description ?? "",
            composition: row.composition ?? [],
            ingredients: row.ingredients ?? [],
            allergens: [],
            conservation: row.conservation ?? "",
            collections: row.collections as never,
            seasonalOnly: row.seasonal_only,
          },
          windows,
        )
      ) {
        status = {
          code: "season_closed",
          blocking: true,
          message: `${row.name} est une édition saisonnière actuellement indisponible.`,
        };
      } else {
        const s = stockStatus(row, line, requested.get(row.slug) ?? line.quantity);
        if (s) status = s;
      }

      if (status?.message && status.blocking) messages.push(status.message);

      patches.push({
        lineKey: line.lineKey,
        slug: row.slug,
        productId: row.id,
        name: row.name,
        image: imageOf(row, line.image),
        price,
        unitPriceSnapshot: price,
        currency: line.currency || CART_CURRENCY,
        priceLockedAt,
        lastValidatedAt: checkedAt,
        variantId: current.variantId ?? line.variantId,
        variantLabel: current.variantLabel ?? line.variantLabel,
        stockQty: row.stock_qty,
        stockUnlimited: row.stock_unlimited,
        inStock: row.in_stock,
        published: row.published,
        draft: row.draft,
        noCart: row.no_cart,
        hidePrice: row.hide_price,
        validationStatus: status,
      });
    }

    const blocking = patches.some((patch) => patch.validationStatus?.blocking);
    return { ok: true, checkedAt, patches, messages: [...new Set(messages)], blocking };
  });
