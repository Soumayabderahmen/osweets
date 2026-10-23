import { createServerFn } from "@tanstack/react-start";
import { validDay } from "@/lib/calendar-day";

/**
 * Le calendrier saisonnier.
 *
 * Les dates de Ramadan et de l'Aïd étaient écrites dans `season.ts`,
 * année par année, jusqu'en 2028. Passé cette échéance la collection
 * Ramadan ne se serait plus jamais ouverte, et rien n'aurait signalé
 * pourquoi : le calendrier hégirien se décale, le code ne le suit pas.
 *
 * Une ligne par occurrence, modifiable depuis le back-office. Le code ne
 * connaît plus aucune date.
 */
export interface SeasonRow {
  id: string;
  /** Clé de la collection concernée : « ramadan », « aid »… */
  season_key: string;
  label: string;
  /** Dates de la fête, au format ISO. */
  starts_on: string;
  ends_on: string;
  /** Ouvre la collection ce nombre de jours avant `starts_on`. */
  preorder_days: number;
  active: boolean;
}

/** Toutes les fenêtres saisonnières — lecture publique, la boutique en vit. */
export const listSeasons = createServerFn({ method: "GET" }).handler(
  async (): Promise<SeasonRow[]> => {
    const { query, isDatabaseConfigured } = await import("./db");
    if (!isDatabaseConfigured()) return [];
    try {
      // Les dates sortent en texte, jamais en objet Date : au rendu serveur
      // la valeur arrive telle quelle, sans passer par JSON, et un Date brut
      // se relisait « Fri Aug 21 2026 » — la fenêtre devenait illisible et la
      // collection restait fermée sans que rien ne proteste.
      return await query<SeasonRow>(
        `SELECT id, season_key, label,
                to_char(starts_on, 'YYYY-MM-DD') AS starts_on,
                to_char(ends_on,   'YYYY-MM-DD') AS ends_on,
                preorder_days, active
           FROM public.seasons
          ORDER BY season_key, starts_on`,
      );
    } catch {
      return [];
    }
  },
);

export interface SeasonInput {
  season_key: string;
  label: string;
  starts_on: string;
  ends_on: string;
  preorder_days: number;
  active: boolean;
}

/** Crée ou met à jour une fenêtre. */
export const saveSeason = createServerFn({ method: "POST" })
  .inputValidator((d: { id?: string; values: SeasonInput }) => d)
  .handler(async ({ data }): Promise<SeasonRow> => {
    const [{ transaction }, { requireAdmin }] = await Promise.all([
      import("./db"),
      import("./session"),
    ]);
    await requireAdmin();
    const v = data.values;
    if (!/^[a-z0-9-]+$/.test(v.season_key)) throw new Error("Clé de saison invalide.");
    if (
      !validDay(v.starts_on) ||
      !validDay(v.ends_on) ||
      !Number.isInteger(v.preorder_days) ||
      v.preorder_days < 0
    )
      throw new Error("Dates ou délai de précommande invalides.");
    if (v.ends_on < v.starts_on) throw new Error("La fin doit suivre le début.");

    return transaction(async (client) => {
      const queryOne = async <T>(sql: string, values: unknown[]) =>
        (await client.query(sql, values)).rows[0] as T | undefined;
      const row = data.id
        ? await queryOne<SeasonRow>(
            `UPDATE public.seasons
              SET season_key = $2, label = $3, starts_on = $4, ends_on = $5,
                  preorder_days = $6, active = $7
            WHERE id = $1 RETURNING *`,
            [data.id, v.season_key, v.label, v.starts_on, v.ends_on, v.preorder_days, v.active],
          )
        : await queryOne<SeasonRow>(
            `INSERT INTO public.seasons (season_key, label, starts_on, ends_on, preorder_days, active)
           VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
            [v.season_key, v.label, v.starts_on, v.ends_on, v.preorder_days, v.active],
          );
      if (!row) throw new Error("Enregistrement impossible.");
      const { assertSeasonalLinks } = await import("./seasonal-links.server");
      await assertSeasonalLinks(client);
      return row;
    });
  });

/** Supprime une fenêtre passée dont on n'a plus l'usage. */
export const deleteSeason = createServerFn({ method: "POST" })
  .inputValidator((d: { id: string }) => d)
  .handler(async ({ data }): Promise<{ ok: true }> => {
    const [{ transaction }, { requireAdmin }] = await Promise.all([
      import("./db"),
      import("./session"),
    ]);
    await requireAdmin();
    await transaction(async (client) => {
      await client.query("DELETE FROM public.seasons WHERE id = $1", [data.id]);
      const { assertSeasonalLinks } = await import("./seasonal-links.server");
      await assertSeasonalLinks(client);
    });
    return { ok: true };
  });
