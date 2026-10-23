import { createServerFn } from "@tanstack/react-start";

/**
 * Bandeaux de page.
 *
 * Une page collection tire son visuel de sa propre ligne `collections`.
 * Les autres pages — l'entrée de la Pâtisserie Tunisienne, les pages
 * événements, les cadeaux — n'ont pas de collection à laquelle se
 * raccrocher : leur bandeau vit ici, une ligne par page, et le
 * back-office le change sans qu'on touche au code.
 */
export interface PageBannerRow {
  key: string;
  label: string;
  image_key: string;
  image_url: string;
  title: string;
  subtitle: string;
  updated_at?: string;
}

/** Tous les bandeaux — lecture publique, c'est de l'habillage de page. */
export const listPageBanners = createServerFn({ method: "GET" }).handler(
  async (): Promise<PageBannerRow[]> => {
    const { query, isDatabaseConfigured } = await import("./db");
    // Base injoignable : les pages gardent le visuel livré avec le site.
    if (!isDatabaseConfigured()) return [];
    try {
      return await query<PageBannerRow>("SELECT * FROM public.page_banners ORDER BY key");
    } catch {
      return [];
    }
  },
);

/**
 * Enregistre le bandeau d'une page.
 *
 * `image_url` seule est modifiable côté back-office : `image_key` désigne
 * l'ancien fichier de `src/assets`, un repli temporaire que la migration
 * doit faire disparaître, pas une valeur à saisir.
 */
export const savePageBanner = createServerFn({ method: "POST" })
  .inputValidator((d: { key: string; imageUrl?: string; title?: string; subtitle?: string }) => d)
  .handler(async ({ data }): Promise<PageBannerRow> => {
    const [{ queryOne }, { requireAdmin }] = await Promise.all([
      import("./db"),
      import("./session"),
    ]);
    await requireAdmin();
    if (!/^[a-z0-9-]+$/.test(data.key)) throw new Error("Clé de page invalide.");

    const row = await queryOne<PageBannerRow>(
      `UPDATE public.page_banners
          SET image_url = COALESCE($2, image_url),
              title     = COALESCE($3, title),
              subtitle  = COALESCE($4, subtitle)
        WHERE key = $1
      RETURNING *`,
      [data.key, data.imageUrl ?? null, data.title ?? null, data.subtitle ?? null],
    );
    if (!row) throw new Error("Cette page n'a pas de bandeau enregistré.");
    return row;
  });
