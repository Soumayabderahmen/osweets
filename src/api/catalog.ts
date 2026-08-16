import { createServerFn } from "@tanstack/react-start";
import type { ProductInput, ProductRow } from "@/lib/catalog";

/** Colonnes modifiables depuis le backoffice — liste blanche stricte. */
const EDITABLE = [
  "slug",
  "name",
  "category",
  "family",
  "flavor_label",
  "price",
  "price_per_piece",
  "unit",
  "weight",
  "pieces",
  "serves",
  "min_quantity",
  "prep_lead",
  "short_desc",
  "description",
  "conservation",
  "disclaimer",
  "delivery_mode",
  "image_key",
  "image_url",
  "composition",
  "ingredients",
  "allergens",
  "flavors",
  "varieties",
  "collections",
  "availability",
  "occasions",
  "pack_includes",
  "themes",
  "badge",
  "variants",
  "in_stock",
  "published",
  "archived",
  "draft",
  "seasonal_only",
  "local_only",
  "no_cart",
  "hide_price",
  "requires_cold",
  "customizable",
  "sort_order",
] as const;

type EditableColumn = (typeof EDITABLE)[number];

/** `variants` est du jsonb : il faut le sérialiser et le caster explicitement. */
const bind = (column: EditableColumn, index: number) =>
  column === "variants" ? `$${index}::jsonb` : `$${index}`;
const prepare = (column: EditableColumn, value: unknown) =>
  column === "variants" ? (value === null ? null : JSON.stringify(value)) : value;

function columnsOf(values: ProductInput) {
  return EDITABLE.filter((c) => Object.prototype.hasOwnProperty.call(values, c));
}

/** Catalogue public : tout sauf les archives. */
export const listProducts = createServerFn({ method: "GET" }).handler(
  async (): Promise<ProductRow[]> => {
    const { query } = await import("./db");
    return query<ProductRow>(
      "SELECT * FROM public.products WHERE archived = false ORDER BY sort_order, name",
    );
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
  .validator((d: { id?: string; values: ProductInput }) => d)
  .handler(async ({ data }): Promise<ProductRow> => {
    const [{ queryOne }, { requireAdmin }] = await Promise.all([
      import("./db"),
      import("./session"),
    ]);
    await requireAdmin();
    const { id, values } = data;
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
  .validator((d: { id: string; published?: boolean; in_stock?: boolean; archived?: boolean }) => d)
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
      // Archiver retire aussi le produit de la boutique.
      if (data.archived) flags.push(["published", false]);
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
  .validator((d: { id: string }) => d)
  .handler(async ({ data }): Promise<ProductRow> => {
    const [{ queryOne }, { requireAdmin }] = await Promise.all([
      import("./db"),
      import("./session"),
    ]);
    await requireAdmin();
    const row = await queryOne<ProductRow>(
      `INSERT INTO public.products (
         slug, name, category, family, flavor_label, price, price_per_piece, unit, weight,
         pieces, serves, min_quantity, prep_lead, short_desc, description, conservation,
         disclaimer, delivery_mode, image_key, image_url, composition, ingredients, allergens,
         flavors, varieties, collections, availability, occasions, pack_includes, themes,
         badge, variants, in_stock, published, archived, draft, seasonal_only, local_only,
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
         p.name || ' (copie)', p.category, p.family, p.flavor_label, p.price, p.price_per_piece,
         p.unit, p.weight, p.pieces, p.serves, p.min_quantity, p.prep_lead, p.short_desc,
         p.description, p.conservation, p.disclaimer, p.delivery_mode, p.image_key, p.image_url,
         p.composition, p.ingredients, p.allergens, p.flavors, p.varieties, p.collections,
         p.availability, p.occasions, p.pack_includes, p.themes, p.badge, p.variants,
         p.in_stock, false, false, p.draft, p.seasonal_only, p.local_only, p.no_cart,
         p.hide_price, p.requires_cold, p.customizable, p.sort_order
       FROM public.products p
       WHERE p.id = $1
       RETURNING *`,
      [data.id],
    );
    if (!row) throw new Error("Produit introuvable.");
    return row;
  });
