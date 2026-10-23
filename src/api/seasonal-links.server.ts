import type { PoolClient } from "pg";
import { isPatisserieCategory } from "../lib/patisserie-scope.ts";

export async function assertSeasonalLinks(client: PoolClient): Promise<void> {
  const result = await client.query<{ name: string; category: string }>(`
    SELECT p.name, p.category FROM public.products p
    WHERE p.seasonal_only AND NOT EXISTS (
      SELECT 1 FROM public.collections c JOIN public.seasons s ON s.season_key = c.product_key
      WHERE c.product_key = ANY(p.collections)
    )`);
  const orphan = result.rows.find((p) => isPatisserieCategory(p.category));
  if (orphan)
    throw new Error(
      `${orphan.name} doit rester lié à une collection avec calendrier. Ajoutez une autre saison ou retirez son caractère saisonnier avant cette modification.`,
    );
}
