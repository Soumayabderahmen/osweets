import { createServerFn } from "@tanstack/react-start";
import type { ProductInput, ProductRow } from "@/lib/catalog";
import { bind, columnsOf, prepare } from "./catalog-columns";
import { validateProductInput } from "@/lib/product-input";
import { isPatisserieCategory } from "@/lib/patisserie-scope";

/** Catalogue public : tout sauf les archives. */
/**
 * Le catalogue public.
 *
 * `ok` dit si la base a répondu. Sans lui, une base injoignable et une
 * boutique vide se ressemblent — et c'est précisément la confusion qui
 * permettait à un fichier statique de prendre le relais en douce. Ici,
 * `ok: false` veut dire « je ne sais pas », jamais « il n'y a rien ».
 */
export const listProducts = createServerFn({ method: "GET" }).handler(
  async (): Promise<{ ok: boolean; rows: ProductRow[] }> => {
    const { query, isDatabaseConfigured } = await import("./db");
    if (!isDatabaseConfigured()) return { ok: false, rows: [] };
    try {
      const rows = await query<ProductRow>(
        `SELECT * FROM public.products
          WHERE archived = false
            AND published = true
            AND draft = false
          ORDER BY sort_order, name`,
      );
      return { ok: true, rows };
    } catch {
      return { ok: false, rows: [] };
    }
  },
);

/** Catalogue complet, archives comprises — backoffice. */
export const listProductsForAdmin = createServerFn({ method: "GET" }).handler(
  async (): Promise<ProductRow[]> => {
    const [{ query }, { requireAdmin }] = await Promise.all([import("./db"), import("./session")]);
    await requireAdmin();
    return query<ProductRow>("SELECT * FROM public.products ORDER BY sort_order, name");
  },
);

/** Création ou mise à jour d'une fiche. */
export const saveProduct = createServerFn({ method: "POST" })
  .inputValidator((d: { id?: string; values: ProductInput }) => d)
  .handler(async ({ data }): Promise<ProductRow> => {
    const [{ queryOne, query }, { requireAdmin }] = await Promise.all([
      import("./db"),
      import("./session"),
    ]);
    await requireAdmin();
    const { id } = data;
    const previous = id
      ? await queryOne<ProductRow>("SELECT * FROM public.products WHERE id = $1", [id])
      : null;
    if (id && !previous) throw new Error("Produit introuvable.");
    const combined = { ...previous, ...data.values };
    const seasons = await query<{ season_key: string }>(
      "SELECT DISTINCT s.season_key FROM public.seasons s JOIN public.collections c ON c.product_key = s.season_key",
    );
    const checked = isPatisserieCategory(combined.category)
      ? validateProductInput(
          combined,
          seasons.map((s) => s.season_key),
        )
      : combined;
    const values = Object.fromEntries(
      Object.keys(data.values).map((key) => [key, checked[key as keyof typeof checked]]),
    ) as ProductInput;
    const columns = columnsOf(values);
    if (!columns.length) throw new Error("Aucun champ à enregistrer.");

    if (id) {
      // Le slug reste figé : d'anciens liens et des redirections pointent dessus.
      const updatable = columns.filter((c) => c !== "slug");
      const assignments = updatable.map((c, i) => `${c} = ${bind(c, i + 2)}`).join(", ");
      const row = await queryOne<ProductRow>(
        `UPDATE public.products SET ${assignments} WHERE id = $1 RETURNING *`,
        [id, ...updatable.map((c) => prepare(c, values[c]))],
      );
      if (!row) throw new Error("Produit introuvable.");
      return row;
    }

    const placeholders = columns.map((c, i) => bind(c, i + 1)).join(", ");
    const row = await queryOne<ProductRow>(
      `INSERT INTO public.products (${columns.join(", ")}) VALUES (${placeholders}) RETURNING *`,
      columns.map((c) => prepare(c, values[c])),
    );
    if (!row) throw new Error("Création impossible.");
    return row;
  });

/** Bascule rapide depuis la liste : publication, stock, archivage. */
export const setProductFlags = createServerFn({ method: "POST" })
  .inputValidator(
    (d: { id: string; published?: boolean; in_stock?: boolean; archived?: boolean }) => d,
  )
  .handler(async ({ data }): Promise<ProductRow> => {
    const [{ queryOne }, { requireAdmin }] = await Promise.all([
      import("./db"),
      import("./session"),
    ]);
    await requireAdmin();
    const flags: Array<["published" | "in_stock" | "archived", boolean]> = [];
    if (data.published !== undefined) flags.push(["published", data.published]);
    if (data.in_stock !== undefined) flags.push(["in_stock", data.in_stock]);
    if (data.archived !== undefined) {
      flags.push(["archived", data.archived]);
      // Archiver retire le produit de la boutique ; le restaurer l'y remet.
      // Il n'y a que deux états : en boutique, ou archivé.
      flags.push(["published", !data.archived]);
    }
    if (!flags.length) throw new Error("Aucun changement demandé.");

    const assignments = flags.map(([c], i) => `${c} = $${i + 2}`).join(", ");
    const row = await queryOne<ProductRow>(
      `UPDATE public.products SET ${assignments} WHERE id = $1 RETURNING *`,
      [data.id, ...flags.map(([, v]) => v)],
    );
    if (!row) throw new Error("Produit introuvable.");
    return row;
  });

/** Duplique une fiche — pratique pour décliner un nouveau parfum. */
export const duplicateProduct = createServerFn({ method: "POST" })
  .inputValidator((d: { id: string }) => d)
  .handler(async ({ data }): Promise<ProductRow> => {
    const [{ queryOne }, { requireAdmin }] = await Promise.all([
      import("./db"),
      import("./session"),
    ]);
    await requireAdmin();
    const row = await queryOne<ProductRow>(
      `INSERT INTO public.products (
         slug, name, category, family, product_type, flavor_label, assortment_composition, price, price_per_piece, unit, weight,
         pieces, serves, min_quantity, prep_lead, short_desc, description, seo_title, seo_description, conservation,
         disclaimer, delivery_mode, image_key, image_url, composition, ingredients, allergens,
         flavors, varieties, collections, recommended, availability, occasions, pack_includes, themes,
         badge, variants, sell_mode, sell_options, stock_qty, stock_alert, stock_unlimited,
         ship_pickup, ship_local, ship_national,
         in_stock, published, archived, draft, seasonal_only, local_only,
         no_cart, hide_price, requires_cold, customizable, sort_order
       )
       SELECT
         -- suffixe « -copie », « -copie-2 »… jusqu'à trouver un slug libre
         (SELECT s.candidate FROM (
            SELECT CASE WHEN n = 1 THEN p.slug || '-copie'
                        ELSE p.slug || '-copie-' || n END AS candidate
              FROM generate_series(1, 50) AS n
          ) s
          WHERE NOT EXISTS (SELECT 1 FROM public.products x WHERE x.slug = s.candidate)
          LIMIT 1),
         p.name || ' (copie)', p.category, p.family, p.product_type, p.flavor_label, p.assortment_composition, p.price, p.price_per_piece,
          p.unit, p.weight, p.pieces, p.serves, p.min_quantity, p.prep_lead, p.short_desc,
          p.description, p.seo_title, p.seo_description, p.conservation, p.disclaimer, p.delivery_mode, p.image_key, p.image_url,
          p.composition, p.ingredients, p.allergens, p.flavors, p.varieties, p.collections,
          p.recommended, p.availability, p.occasions, p.pack_includes, p.themes, p.badge, p.variants,
         p.sell_mode, p.sell_options, 0, p.stock_alert, p.stock_unlimited,
         p.ship_pickup, p.ship_local, p.ship_national,
         p.in_stock, false, true, p.draft, p.seasonal_only, p.local_only, p.no_cart,
         p.hide_price, p.requires_cold, p.customizable, p.sort_order
       FROM public.products p
       WHERE p.id = $1
       RETURNING *`,
      [data.id],
    );
    if (!row) throw new Error("Produit introuvable.");
    return row;
  });

/** Fiche publique par identifiant d'URL — la base fait autorité. */
export const getProductBySlug = createServerFn({ method: "GET" })
  .inputValidator((d: { slug: string }) => d)
  .handler(async ({ data }): Promise<{ ok: boolean; row: ProductRow | null }> => {
    const { queryOne, isDatabaseConfigured } = await import("./db");
    if (!isDatabaseConfigured()) return { ok: false, row: null };
    try {
      /*
       * Archivé ou dépublié : la fiche n'existe pas pour la cliente. C'est
       * le back-office qui l'a décidé, et rien ne doit pouvoir revenir
       * sur cette décision — surtout pas par l'adresse directe.
       */
      const row = await queryOne<ProductRow>(
        "SELECT * FROM public.products WHERE slug = $1 AND archived = false AND published = true AND draft = false",
        [data.slug],
      );
      return { ok: true, row };
    } catch {
      return { ok: false, row: null };
    }
  });

/**
 * L'adresse actuelle d'une ancienne adresse de fiche.
 *
 * Renommer un produit depuis le back-office cassait son ancienne adresse
 * jusqu'à ce qu'un développeur ajoute une ligne dans une liste du code.
 * Un déclencheur en base mémorise maintenant chaque renommage, et cette
 * fonction relit cette mémoire.
 *
 * La cible est vérifiée dans le même mouvement : une fiche archivée ou
 * dépubliée ne renvoie rien. Rediriger vers elle ferait revenir par
 * l'ancienne adresse ce que le back-office a retiré de la vente.
 */
export const resolveOldSlug = createServerFn({ method: "GET" })
  .inputValidator((d: { slug: string }) => d)
  .handler(async ({ data }): Promise<{ ok: boolean; slug: string | null }> => {
    const { queryOne, isDatabaseConfigured } = await import("./db");
    if (!isDatabaseConfigured()) return { ok: false, slug: null };
    try {
      const row = await queryOne<{ slug: string }>(
        `SELECT p.slug
           FROM public.product_slug_history h
           JOIN public.products p ON p.id = h.product_id
          WHERE h.old_slug = $1
             AND p.archived = false
             AND p.published = true
             AND p.draft = false`,
        [data.slug],
      );
      return { ok: true, slug: row?.slug ?? null };
    } catch {
      return { ok: false, slug: null };
    }
  });

/**
 * Fixe la réserve d'un produit. `in_stock` suit tout seul : c'est un
 * déclencheur en base qui le calcule, jamais le navigateur.
 */
export const setStock = createServerFn({ method: "POST" })
  .inputValidator((d: { id: string; qty?: number; alert?: number; unlimited?: boolean }) => d)
  .handler(async ({ data }): Promise<ProductRow> => {
    const [{ queryOne }, { requireAdmin }] = await Promise.all([
      import("./db"),
      import("./session"),
    ]);
    await requireAdmin();
    const sets: string[] = [];
    const args: unknown[] = [data.id];
    if (data.qty !== undefined) {
      sets.push(`stock_qty = $${args.length + 1}`);
      args.push(Math.max(0, Math.trunc(data.qty)));
    }
    if (data.alert !== undefined) {
      sets.push(`stock_alert = $${args.length + 1}`);
      args.push(Math.max(0, Math.trunc(data.alert)));
    }
    if (data.unlimited !== undefined) {
      sets.push(`stock_unlimited = $${args.length + 1}`);
      args.push(data.unlimited);
    }
    if (!sets.length) throw new Error("Aucun changement demandé.");
    const row = await queryOne<ProductRow>(
      `UPDATE public.products SET ${sets.join(", ")} WHERE id = $1 RETURNING *`,
      args,
    );
    if (!row) throw new Error("Produit introuvable.");
    return row;
  });

/** Réapprovisionnement : ajoute (ou retire) des pièces à la réserve. */
export const addStock = createServerFn({ method: "POST" })
  .inputValidator((d: { id: string; delta: number }) => d)
  .handler(async ({ data }): Promise<ProductRow> => {
    const [{ queryOne }, { requireAdmin }] = await Promise.all([
      import("./db"),
      import("./session"),
    ]);
    await requireAdmin();
    const row = await queryOne<ProductRow>(
      `UPDATE public.products
          SET stock_qty = GREATEST(0, stock_qty + $2)
        WHERE id = $1 RETURNING *`,
      [data.id, Math.trunc(data.delta)],
    );
    if (!row) throw new Error("Produit introuvable.");
    return row;
  });

/** Suppression définitive — uniquement depuis les archives. */
export const deleteProductForever = createServerFn({ method: "POST" })
  .inputValidator((d: { id: string }) => d)
  .handler(async ({ data }): Promise<{ ok: true }> => {
    const [{ query, queryOne }, { requireAdmin }] = await Promise.all([
      import("./db"),
      import("./session"),
    ]);
    await requireAdmin();
    const row = await queryOne<ProductRow>("SELECT * FROM public.products WHERE id = $1", [
      data.id,
    ]);
    if (!row) throw new Error("Produit introuvable.");
    if (!row.archived)
      throw new Error("Archivez d'abord la fiche : la suppression définitive part des archives.");
    await query("DELETE FROM public.products WHERE id = $1", [data.id]);
    return { ok: true };
  });
