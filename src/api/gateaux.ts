import { createServerFn } from "@tanstack/react-start";

/**
 * La partie « Gâteaux » : pages du menu, gâteaux de chaque page et
 * configurateur d'anniversaire (migration 034).
 *
 * Lecture publique (la boutique en vit) ; écriture réservée à l'admin.
 */

export interface GateauPageRow {
  key: string;
  column_label: string;
  title: string;
  description: string;
  image_key: string | null;
  image_url: string | null;
  tag: string;
  href: string;
  visible: boolean;
  sort_order: number;
}

export interface GateauRow {
  id: string;
  slug: string;
  page_key: string;
  name: string;
  price: string | number;
  format: string;
  lead_time: string;
  image_key: string | null;
  image_url: string | null;
  visible: boolean;
  sort_order: number;
}

export interface CakeSize {
  id: string;
  label: string;
  parts: number;
  price: number;
  visible: boolean;
}
export interface CakeThemeConfig {
  id: string;
  label: string;
  emoji: string;
  category: "age" | "motif" | "occasion";
  visible: boolean;
}
export interface GateauConfig {
  sizes: CakeSize[];
  flavors: { id: string; label: string }[];
  themes: CakeThemeConfig[];
  customSupplement: number;
  leadTime: string;
  message: boolean;
}

export interface GateauxData {
  /** La base a-t-elle répondu ? Sinon, le site garde ce qui est écrit dans le code. */
  ok: boolean;
  pages: GateauPageRow[];
  gateaux: GateauRow[];
  config: GateauConfig | null;
}

export const listGateaux = createServerFn({ method: "GET" }).handler(
  async (): Promise<GateauxData> => {
    const { query, queryOne, isDatabaseConfigured } = await import("./db");
    const vide: GateauxData = { ok: false, pages: [], gateaux: [], config: null };
    if (!isDatabaseConfigured()) return vide;
    try {
      const [pages, gateaux, config] = await Promise.all([
        query<GateauPageRow>("SELECT * FROM public.gateau_pages ORDER BY sort_order, title"),
        query<GateauRow>("SELECT * FROM public.gateaux ORDER BY page_key, sort_order, name"),
        queryOne<{ data: GateauConfig }>("SELECT data FROM public.gateau_config WHERE id = 1"),
      ]);
      return { ok: true, pages, gateaux, config: config?.data ?? null };
    } catch {
      // Base sans la migration 034 : le site garde ses gâteaux écrits.
      return vide;
    }
  },
);

const slugifier = (v: string) =>
  v
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

export interface GateauInput {
  name?: string;
  price?: number;
  format?: string;
  lead_time?: string;
  page_key?: string;
  image_url?: string | null;
  visible?: boolean;
}

/** Crée (sans `id`) ou modifie un gâteau. */
export const saveGateau = createServerFn({ method: "POST" })
  .inputValidator((d: { id?: string; values: GateauInput }) => d)
  .handler(async ({ data }): Promise<GateauRow> => {
    const [{ query, queryOne }, { requireAdmin }] = await Promise.all([
      import("./db"),
      import("./session"),
    ]);
    await requireAdmin();
    const v = data.values;
    if (v.name !== undefined && !v.name.trim()) throw new Error("Il manque le nom du gâteau.");
    if (v.price !== undefined && !(Number(v.price) >= 0))
      throw new Error("Le prix n'est pas valide.");
    if (!data.id) {
      if (!v.name || v.price === undefined || !v.page_key)
        throw new Error("Il faut un nom, un prix et une page.");
      const base = slugifier(v.name) || "gateau";
      let slug = base;
      for (let i = 2; await queryOne("SELECT 1 FROM public.gateaux WHERE slug = $1", [slug]); i++)
        slug = `${base}-${i}`;
      const ordre = await queryOne<{ n: number }>(
        "SELECT COALESCE(MAX(sort_order), 0) + 10 AS n FROM public.gateaux WHERE page_key = $1",
        [v.page_key],
      );
      const [row] = await query<GateauRow>(
        `INSERT INTO public.gateaux (slug, page_key, name, price, format, lead_time, image_url, visible, sort_order)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *`,
        [
          slug,
          v.page_key,
          v.name.trim(),
          Number(v.price),
          v.format ?? "",
          v.lead_time ?? "48 h",
          v.image_url ?? null,
          v.visible ?? true,
          ordre?.n ?? 0,
        ],
      );
      return row;
    }
    const champs: [string, unknown][] = [];
    if (v.name !== undefined) champs.push(["name", v.name.trim()]);
    if (v.price !== undefined) champs.push(["price", Number(v.price)]);
    if (v.format !== undefined) champs.push(["format", v.format]);
    if (v.lead_time !== undefined) champs.push(["lead_time", v.lead_time]);
    if (v.page_key !== undefined) champs.push(["page_key", v.page_key]);
    if (v.image_url !== undefined) champs.push(["image_url", v.image_url]);
    if (v.visible !== undefined) champs.push(["visible", v.visible]);
    if (!champs.length) throw new Error("Rien à enregistrer.");
    const [row] = await query<GateauRow>(
      `UPDATE public.gateaux SET ${champs.map(([k], i) => `${k} = $${i + 2}`).join(", ")}
        WHERE id = $1 RETURNING *`,
      [data.id, ...champs.map(([, val]) => val)],
    );
    if (!row) throw new Error("Gâteau introuvable.");
    return row;
  });

export interface GateauPageInput {
  title?: string;
  description?: string;
  image_url?: string | null;
  visible?: boolean;
}

export const saveGateauPage = createServerFn({ method: "POST" })
  .inputValidator((d: { key: string; values: GateauPageInput }) => d)
  .handler(async ({ data }) => {
    const [{ query }, { requireAdmin }] = await Promise.all([import("./db"), import("./session")]);
    await requireAdmin();
    const v = data.values;
    if (v.title !== undefined && !v.title.trim()) throw new Error("Il manque le titre de la page.");
    const champs: [string, unknown][] = [];
    if (v.title !== undefined) champs.push(["title", v.title.trim()]);
    if (v.description !== undefined) champs.push(["description", v.description]);
    if (v.image_url !== undefined) champs.push(["image_url", v.image_url]);
    if (v.visible !== undefined) champs.push(["visible", v.visible]);
    if (!champs.length) return { ok: true };
    await query(
      `UPDATE public.gateau_pages SET ${champs.map(([k], i) => `${k} = $${i + 2}`).join(", ")} WHERE key = $1`,
      [data.key, ...champs.map(([, val]) => val)],
    );
    return { ok: true };
  });

/** Nouvel ordre des pages d'une colonne (ou des gâteaux d'une page). */
export const reorderGateaux = createServerFn({ method: "POST" })
  .inputValidator((d: { table: "pages" | "gateaux"; ids: string[] }) => d)
  .handler(async ({ data }) => {
    const [{ query }, { requireAdmin }] = await Promise.all([import("./db"), import("./session")]);
    await requireAdmin();
    const table = data.table === "pages" ? "public.gateau_pages" : "public.gateaux";
    const cle = data.table === "pages" ? "key" : "id";
    for (const [i, id] of data.ids.entries())
      await query(`UPDATE ${table} SET sort_order = $2 WHERE ${cle}::text = $1`, [
        id,
        (i + 1) * 10,
      ]);
    return { ok: true };
  });

export const saveGateauConfig = createServerFn({ method: "POST" })
  .inputValidator((d: { config: GateauConfig }) => d)
  .handler(async ({ data }) => {
    const [{ query }, { requireAdmin }] = await Promise.all([import("./db"), import("./session")]);
    await requireAdmin();
    const c = data.config;
    if (!c.sizes.some((s) => s.visible)) throw new Error("Gardez au moins une taille proposée.");
    if (!c.flavors.length) throw new Error("Gardez au moins un parfum.");
    if (c.sizes.some((s) => !(Number(s.price) > 0)))
      throw new Error("Un prix de taille n'est pas valide.");
    await query(
      `INSERT INTO public.gateau_config (id, data) VALUES (1, $1::jsonb)
       ON CONFLICT (id) DO UPDATE SET data = EXCLUDED.data`,
      [JSON.stringify(c)],
    );
    return { ok: true };
  });
