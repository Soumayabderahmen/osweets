import { createServerFn } from "@tanstack/react-start";

/** Formats acceptés au téléversement — la base applique la même règle. */
const ALLOWED_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "image/avif"]);

/** `/api/public/media/<chemin>` → `<chemin>`, ou `null` si l'adresse est externe. */
function mediaPathOf(url: string | null | undefined): string | null {
  const m = (url ?? "").match(/^\/api\/public\/media\/([A-Za-z0-9._-]+)$/);
  return m ? m[1] : null;
}

/** Une image de la galerie d'un produit. */
export interface ProductImageRow {
  id: string;
  product_id: string;
  url: string;
  alt: string;
  sort_order: number;
  is_primary: boolean;
  created_at?: string;
}

/** Galerie d'un produit — lecture publique (fiche produit). */
export const listProductImages = createServerFn({ method: "GET" })
  .inputValidator((d: { productId?: string; slug?: string }) => d)
  .handler(async ({ data }): Promise<ProductImageRow[]> => {
    const { query, isDatabaseConfigured } = await import("./db");
    if (!isDatabaseConfigured()) return [];
    if (!data.productId && !data.slug) return [];
    try {
      return await query<ProductImageRow>(
        `SELECT i.* FROM public.product_images i
           JOIN public.products p ON p.id = i.product_id
          WHERE ($1::uuid IS NULL OR i.product_id = $1::uuid)
            AND ($2::text IS NULL OR p.slug = $2::text)
          ORDER BY i.is_primary DESC, i.sort_order, i.created_at`,
        [data.productId ?? null, data.slug ?? null],
      );
    } catch {
      return [];
    }
  });

/** Toutes les galeries — utilisé par le back-office. */
export const listAllProductImages = createServerFn({ method: "GET" }).handler(
  async (): Promise<ProductImageRow[]> => {
    const [{ query }, { requireAdmin }] = await Promise.all([import("./db"), import("./session")]);
    await requireAdmin();
    return query<ProductImageRow>(
      "SELECT * FROM public.product_images ORDER BY product_id, is_primary DESC, sort_order",
    );
  },
);

/** Téléverse un fichier (encodé en base64) et renvoie son adresse publique. */
export const uploadProductImage = createServerFn({ method: "POST" })
  .inputValidator((d: { fileName: string; contentType: string; base64: string }) => d)
  .handler(async ({ data }): Promise<{ url: string }> => {
    const { requireAdmin } = await import("./session");
    await requireAdmin();
    const bytes = Buffer.from(data.base64, "base64");
    if (bytes.byteLength > 6 * 1024 * 1024) throw new Error("Image trop lourde (6 Mo maximum).");
    const safe = data.fileName
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .replace(/[^a-z0-9.]+/g, "-")
      .replace(/^-+|-+$/g, "");
    const path = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}-${safe || "image.jpg"}`;

    const type = ALLOWED_TYPES.has(data.contentType) ? data.contentType : "image/jpeg";
    const { query } = await import("./db");
    await query(
      `INSERT INTO public.media_files (path, content_type, bytes, size_bytes)
       VALUES ($1, $2, $3, $4)`,
      [path, type, bytes, bytes.byteLength],
    );
    return { url: `/api/public/media/${path}` };
  });

/** Ajoute une image à la galerie. La première devient l'image principale. */
export const addProductImage = createServerFn({ method: "POST" })
  .inputValidator((d: { productId: string; url: string; alt?: string }) => d)
  .handler(async ({ data }): Promise<ProductImageRow> => {
    const [{ query, queryOne }, { requireAdmin }] = await Promise.all([
      import("./db"),
      import("./session"),
    ]);
    await requireAdmin();
    const existing = await query<{ count: string }>(
      "SELECT count(*)::text AS count FROM public.product_images WHERE product_id = $1",
      [data.productId],
    );
    const first = Number(existing[0]?.count ?? 0) === 0;
    const row = await queryOne<ProductImageRow>(
      `INSERT INTO public.product_images (product_id, url, alt, sort_order, is_primary)
       VALUES ($1, $2, $3,
               COALESCE((SELECT max(sort_order) + 1 FROM public.product_images WHERE product_id = $1), 0),
               $4)
       RETURNING *`,
      [data.productId, data.url, data.alt ?? "", first],
    );
    if (!row) throw new Error("Ajout impossible.");
    if (first) {
      await query("UPDATE public.products SET image_url = $2 WHERE id = $1", [
        data.productId,
        data.url,
      ]);
    }
    return row;
  });

/** Désigne l'image principale : elle remplace aussi la photo de la fiche. */
export const setPrimaryImage = createServerFn({ method: "POST" })
  .inputValidator((d: { id: string }) => d)
  .handler(async ({ data }): Promise<{ ok: true }> => {
    const [{ query, queryOne }, { requireAdmin }] = await Promise.all([
      import("./db"),
      import("./session"),
    ]);
    await requireAdmin();
    const img = await queryOne<ProductImageRow>(
      "SELECT * FROM public.product_images WHERE id = $1",
      [data.id],
    );
    if (!img) throw new Error("Image introuvable.");
    await query("UPDATE public.product_images SET is_primary = false WHERE product_id = $1", [
      img.product_id,
    ]);
    await query("UPDATE public.product_images SET is_primary = true WHERE id = $1", [data.id]);
    await query("UPDATE public.products SET image_url = $2 WHERE id = $1", [
      img.product_id,
      img.url,
    ]);
    return { ok: true };
  });

/** Retire une image de la galerie. */
export const deleteProductImage = createServerFn({ method: "POST" })
  .inputValidator((d: { id: string }) => d)
  .handler(async ({ data }): Promise<{ ok: true }> => {
    const [{ query, queryOne }, { requireAdmin }] = await Promise.all([
      import("./db"),
      import("./session"),
    ]);
    await requireAdmin();
    const img = await queryOne<ProductImageRow>(
      "DELETE FROM public.product_images WHERE id = $1 RETURNING *",
      [data.id],
    );
    if (!img) throw new Error("Image introuvable.");

    // Le fichier n'est plus référencé nulle part : on le sort de la base.
    const path = mediaPathOf(img.url);
    if (path) {
      const stillUsed = await query<{ count: string }>(
        "SELECT count(*)::text AS count FROM public.product_images WHERE url = $1",
        [img.url],
      );
      if (Number(stillUsed[0]?.count ?? 0) === 0) {
        await query("DELETE FROM public.media_files WHERE path = $1", [path]);
      }
    }

    if (img.is_primary) {
      // La suivante prend la place de l'image principale.
      const next = await queryOne<ProductImageRow>(
        `UPDATE public.product_images SET is_primary = true
          WHERE id = (SELECT id FROM public.product_images WHERE product_id = $1
                       ORDER BY sort_order LIMIT 1)
        RETURNING *`,
        [img.product_id],
      );
      await query("UPDATE public.products SET image_url = $2 WHERE id = $1", [
        img.product_id,
        next?.url ?? null,
      ]);
    }
    return { ok: true };
  });

/** Réordonne la galerie : la liste reçue donne le nouvel ordre. */
export const reorderProductImages = createServerFn({ method: "POST" })
  .inputValidator((d: { ids: string[] }) => d)
  .handler(async ({ data }): Promise<{ ok: true }> => {
    const [{ query }, { requireAdmin }] = await Promise.all([import("./db"), import("./session")]);
    await requireAdmin();
    for (const [index, id] of data.ids.entries()) {
      await query("UPDATE public.product_images SET sort_order = $2 WHERE id = $1", [id, index]);
    }
    return { ok: true };
  });
