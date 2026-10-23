import { createServerFn } from "@tanstack/react-start";

export interface WaitlistRow {
  id: string;
  email: string;
  collection: string;
  target_type: "legacy" | "collection" | "product";
  target_label: string;
  target_exists?: boolean;
  created_at: string;
}

/** Inscription publique — une même adresse ne s'inscrit qu'une fois par collection. */
export const joinWaitlist = createServerFn({ method: "POST" })
  .inputValidator(
    (d: { email: string; collection: string; targetType?: "collection" | "product" }) => d,
  )
  .handler(async ({ data }): Promise<{ ok: boolean }> => {
    const email = data.email.trim().toLowerCase();
    const collection = data.collection.trim();
    const targetType = data.targetType ?? "collection";
    if (
      !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email) ||
      email.length > 255 ||
      !collection ||
      collection.length > 255 ||
      !["collection", "product"].includes(targetType)
    ) {
      throw new Error("Adresse e-mail invalide.");
    }
    const { queryOne } = await import("./db");
    const target =
      targetType === "product"
        ? await queryOne<{ key: string; label: string }>(
            "SELECT slug AS key, name AS label FROM public.products WHERE slug = $1 AND published AND NOT archived AND NOT draft",
            [collection],
          )
        : await queryOne<{ key: string; label: string }>(
            "SELECT product_key AS key, label FROM public.collections WHERE (slug = $1 OR product_key = $1) AND published AND NOT hidden",
            [collection],
          );
    if (!target) throw new Error("Cette sélection n'est plus disponible.");
    await queryOne(
      `INSERT INTO public.patisserie_waitlist (email, collection, target_type, target_label)
       VALUES ($1, $2, $3, $4) ON CONFLICT (email, collection, target_type) DO NOTHING RETURNING id`,
      [email, target.key, targetType, target.label],
    );
    return { ok: true };
  });

export const listWaitlist = createServerFn({ method: "GET" }).handler(
  async (): Promise<WaitlistRow[]> => {
    const [{ query }, { requireAdmin }] = await Promise.all([import("./db"), import("./session")]);
    await requireAdmin();
    return query<WaitlistRow>(
      `SELECT w.*, CASE w.target_type
         WHEN 'product' THEN EXISTS (SELECT 1 FROM public.products p WHERE p.slug = w.collection)
         WHEN 'collection' THEN EXISTS (SELECT 1 FROM public.collections c WHERE c.product_key = w.collection)
         ELSE NULL END AS target_exists
       FROM public.patisserie_waitlist w ORDER BY created_at DESC`,
    );
  },
);
