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
  created_at?: string;
  updated_at?: string;
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
] as const;

/** Collections de la boutique, dans l'ordre d'affichage. */
export const listCollections = createServerFn({ method: "GET" }).handler(
  async (): Promise<CollectionRow[]> => {
    const { query } = await import("./db");
    return query<CollectionRow>("SELECT * FROM public.collections ORDER BY sort_order, label");
  },
);

export const saveCollection = createServerFn({ method: "POST" })
  .validator((d: { id: string; values: CollectionInput }) => d)
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
