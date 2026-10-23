import { createServerFn } from "@tanstack/react-start";

/**
 * Familles de pâtisseries (Samsa, Kounefa, Baklawa…).
 *
 * Une famille regroupe un type de gâteau, jamais une collection : c'est le
 * produit qui décide où il apparaît (Amandes, Ramadan, Aïd…).
 */
export interface FamilyRow {
  id: string;
  key: string;
  label: string;
  description: string;
  sort_order: number;
  created_at?: string;
  updated_at?: string;
}

/** Lecture publique — la fiche produit s'en sert pour « autres parfums ». */
export const listFamilies = createServerFn({ method: "GET" }).handler(
  async (): Promise<FamilyRow[]> => {
    const { query, isDatabaseConfigured } = await import("./db");
    if (!isDatabaseConfigured()) return [];
    try {
      return await query<FamilyRow>("SELECT * FROM public.families ORDER BY sort_order, label");
    } catch {
      return [];
    }
  },
);

/** Création ou mise à jour d'une famille. */
export const saveFamily = createServerFn({ method: "POST" })
  .inputValidator(
    (d: { id?: string; key: string; label: string; description?: string; sort_order?: number }) =>
      d,
  )
  .handler(async ({ data }): Promise<FamilyRow> => {
    const [{ queryOne }, { requireAdmin }] = await Promise.all([
      import("./db"),
      import("./session"),
    ]);
    await requireAdmin();
    const key = data.key.trim();
    if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(key))
      throw new Error("L'identifiant doit être en minuscules, sans accent ni espace.");
    if (!data.label.trim()) throw new Error("Le nom de la famille est obligatoire.");

    const row = data.id
      ? await queryOne<FamilyRow>(
          `UPDATE public.families SET label = $2, description = $3, sort_order = $4
            WHERE id = $1 RETURNING *`,
          [data.id, data.label.trim(), data.description ?? "", data.sort_order ?? 0],
        )
      : await queryOne<FamilyRow>(
          `INSERT INTO public.families (key, label, description, sort_order)
           VALUES ($1, $2, $3, $4) RETURNING *`,
          [key, data.label.trim(), data.description ?? "", data.sort_order ?? 0],
        );
    if (!row) throw new Error("Enregistrement impossible.");
    return row;
  });

/** Suppression — refusée tant que des produits portent la famille. */
export const deleteFamily = createServerFn({ method: "POST" })
  .inputValidator((d: { id: string }) => d)
  .handler(async ({ data }): Promise<{ ok: true }> => {
    const [{ query, queryOne }, { requireAdmin }] = await Promise.all([
      import("./db"),
      import("./session"),
    ]);
    await requireAdmin();
    const fam = await queryOne<FamilyRow>("SELECT * FROM public.families WHERE id = $1", [data.id]);
    if (!fam) throw new Error("Famille introuvable.");
    const used = await query<{ count: string }>(
      "SELECT count(*)::text AS count FROM public.products WHERE family = $1",
      [fam.key],
    );
    if (Number(used[0]?.count ?? 0) > 0)
      throw new Error("Des produits utilisent encore cette famille — détachez-les d'abord.");
    await query("DELETE FROM public.families WHERE id = $1", [data.id]);
    return { ok: true };
  });
