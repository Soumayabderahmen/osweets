import { createServerFn } from "@tanstack/react-start";

/** Une ligne de la table `collections`. */
export interface CollectionRow {
  id: string;
  product_key: string;
  slug: string;
  label: string;
  h1: string;
  title: string;
  description: string;
  subtitle: string;
  image_key: string | null;
  image_url: string | null;
  sort_order: number;
  published: boolean;
  /** Masquage public complet : la collection reste administrable. */
  hidden: boolean;
  created_at?: string;
  updated_at?: string;
  /** Que faire quand la collection n'a aucun produit : « soon » ou « hide ». */
  empty_behavior: string;
}

/** Champs modifiables depuis le back-office — le slug reste figé. */
export type CollectionInput = Partial<
  Omit<CollectionRow, "id" | "slug" | "product_key" | "created_at" | "updated_at">
>;

const EDITABLE = [
  "label",
  "h1",
  "title",
  "description",
  "subtitle",
  "image_key",
  "image_url",
  "sort_order",
  "published",
  "hidden",
  "empty_behavior",
] as const;

/** Collections de la boutique, dans l'ordre d'affichage. */
export const listCollections = createServerFn({ method: "GET" }).handler(
  async (): Promise<CollectionRow[]> => {
    const { query, isDatabaseConfigured } = await import("./db");
    if (!isDatabaseConfigured()) return [];
    try {
      return await query<CollectionRow>(
        "SELECT * FROM public.collections ORDER BY sort_order, label",
      );
    } catch {
      return [];
    }
  },
);

export const saveCollection = createServerFn({ method: "POST" })
  .inputValidator((d: { id: string; values: CollectionInput }) => d)
  .handler(async ({ data }): Promise<CollectionRow> => {
    const [{ queryOne }, { requireAdmin }] = await Promise.all([
      import("./db"),
      import("./session"),
    ]);
    await requireAdmin();

    const columns = EDITABLE.filter((c) => Object.prototype.hasOwnProperty.call(data.values, c));
    if (!columns.length) throw new Error("Aucun champ à enregistrer.");

    const assignments = columns.map((c, i) => `${c} = $${i + 2}`).join(", ");
    const row = await queryOne<CollectionRow>(
      `UPDATE public.collections SET ${assignments} WHERE id = $1 RETURNING *`,
      [data.id, ...columns.map((c) => data.values[c])],
    );
    if (!row) throw new Error("Collection introuvable.");
    return row;
  });

/** Identifiant d'URL : minuscules, tirets, sans accent. */
const slugify = (v: string) =>
  v
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

/** Création d'une collection — sa page `/patisserie/<slug>` existe aussitôt. */
export const createCollection = createServerFn({ method: "POST" })
  .inputValidator(
    (d: { label: string; slug?: string; product_key?: string; values?: CollectionInput }) => d,
  )
  .handler(async ({ data }): Promise<CollectionRow> => {
    const [{ queryOne, transaction }, { requireAdmin }] = await Promise.all([
      import("./db"),
      import("./session"),
    ]);
    await requireAdmin();

    const label = data.label.trim();
    if (!label) throw new Error("Donnez un nom à la collection.");
    const slug = slugify(data.slug?.trim() || label);
    const productKey = slugify(data.product_key?.trim() || slug);
    if (!slug || !productKey) throw new Error("Nom de collection invalide.");

    const clash = await queryOne<{ id: string }>(
      "SELECT id FROM public.collections WHERE slug = $1 OR product_key = $2",
      [slug, productKey],
    );
    if (clash) throw new Error("Une collection utilise déjà cette adresse.");

    const values: CollectionInput = { ...(data.values ?? {}) };
    const sortOrder =
      values.sort_order === undefined
        ? undefined
        : Math.max(0, Math.trunc(Number(values.sort_order) || 0));
    const row = await transaction(async (client) => {
      const inserted = await client.query<CollectionRow>(
        `INSERT INTO public.collections (
           product_key, slug, label, h1, title, description, subtitle, image_key, image_url,
           sort_order, published, hidden, empty_behavior
         )
         VALUES (
           $1, $2, $3, $4, $5, $6, $7, $8, $9,
           COALESCE($10::integer, (SELECT COALESCE(MAX(sort_order), 0) + 10 FROM public.collections)),
           $11, $12, $13
         )
         RETURNING *`,
        [
          productKey,
          slug,
          label,
          values.h1 || label,
          values.title ?? "",
          values.description ?? "",
          values.subtitle ?? "",
          values.image_key ?? null,
          values.image_url ?? null,
          sortOrder ?? null,
          values.published ?? false,
          values.hidden ?? false,
          values.empty_behavior ?? "soon",
        ],
      );
      return inserted.rows[0] ?? null;
    });
    if (!row) throw new Error("Création impossible.");
    return row;
  });

const uuidList = (ids: string[]) =>
  [...new Set(ids)].filter((id) =>
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id),
  );

/**
 * Retire des produits d'une collection.
 *
 * Les produits restent intacts et gardent leurs autres collections : seule
 * l'etiquette de cette collection est enlevee du tableau `products.collections`.
 */
export const removeProductsFromCollection = createServerFn({ method: "POST" })
  .inputValidator((d: { collectionId: string; productIds: string[] }) => d)
  .handler(async ({ data }): Promise<{ ok: true; count: number }> => {
    const [{ queryOne, transaction }, { requireAdmin }] = await Promise.all([
      import("./db"),
      import("./session"),
    ]);
    await requireAdmin();

    const ids = uuidList(data.productIds ?? []);
    if (!ids.length) return { ok: true, count: 0 };

    const col = await queryOne<CollectionRow>("SELECT * FROM public.collections WHERE id = $1", [
      data.collectionId,
    ]);
    if (!col) throw new Error("Collection introuvable.");

    const count = await transaction(async (client) => {
      const result = await client.query(
        `UPDATE public.products
            SET collections = array_remove(collections, $2)
          WHERE id = ANY($1::uuid[])
            AND $2 = ANY(collections)`,
        [ids, col.product_key],
      );
      const { assertSeasonalLinks } = await import("./seasonal-links.server");
      await assertSeasonalLinks(client);
      return result.rowCount ?? 0;
    });
    return { ok: true, count };
  });

/**
 * Ajoute des produits existants a une collection sans creer de doublon.
 */
export const addProductsToCollection = createServerFn({ method: "POST" })
  .inputValidator((d: { collectionId: string; productIds: string[] }) => d)
  .handler(async ({ data }): Promise<{ ok: true; count: number }> => {
    const [{ queryOne, transaction }, { requireAdmin }] = await Promise.all([
      import("./db"),
      import("./session"),
    ]);
    await requireAdmin();

    const ids = uuidList(data.productIds ?? []);
    if (!ids.length) return { ok: true, count: 0 };

    const col = await queryOne<CollectionRow>("SELECT * FROM public.collections WHERE id = $1", [
      data.collectionId,
    ]);
    if (!col) throw new Error("Collection introuvable.");

    const count = await transaction(async (client) => {
      const result = await client.query(
        `UPDATE public.products
            SET collections = (
              SELECT COALESCE(array_agg(DISTINCT v ORDER BY v), ARRAY[]::text[])
                FROM unnest(array_append(collections, $2)) AS v
               WHERE trim(v) <> ''
            )
          WHERE id = ANY($1::uuid[])
            AND archived = false
            AND NOT ($2 = ANY(collections))`,
        [ids, col.product_key],
      );
      return result.rowCount ?? 0;
    });
    return { ok: true, count };
  });

/** Suppression — retire ses relations, jamais les produits. */
export const deleteCollection = createServerFn({ method: "POST" })
  .inputValidator((d: { id: string }) => d)
  .handler(async ({ data }): Promise<{ ok: true }> => {
    const [{ queryOne, transaction }, { requireAdmin }] = await Promise.all([
      import("./db"),
      import("./session"),
    ]);
    await requireAdmin();

    const row = await queryOne<CollectionRow>("SELECT * FROM public.collections WHERE id = $1", [
      data.id,
    ]);
    if (!row) throw new Error("Collection introuvable.");

    await transaction(async (client) => {
      // The collections_detach_products trigger owns association cleanup.
      await client.query("DELETE FROM public.collections WHERE id = $1", [data.id]);
      const { assertSeasonalLinks } = await import("./seasonal-links.server");
      await assertSeasonalLinks(client);
    });
    return { ok: true };
  });
