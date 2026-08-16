import { createServerFn } from "@tanstack/react-start";

export interface WaitlistRow {
  id: string;
  email: string;
  collection: string;
  created_at: string;
}

/** Inscription publique — une même adresse ne s'inscrit qu'une fois par collection. */
export const joinWaitlist = createServerFn({ method: "POST" })
  .validator((d: { email: string; collection: string }) => d)
  .handler(async ({ data }): Promise<{ ok: boolean }> => {
    const email = data.email.trim().toLowerCase();
    const collection = data.collection.trim().slice(0, 64);
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email) || email.length > 255 || !collection) {
      throw new Error("Adresse e-mail invalide.");
    }
    const { query } = await import("./db");
    await query(
      `INSERT INTO public.patisserie_waitlist (email, collection)
       VALUES ($1, $2) ON CONFLICT (email, collection) DO NOTHING`,
      [email, collection],
    );
    return { ok: true };
  });

export const listWaitlist = createServerFn({ method: "GET" }).handler(
  async (): Promise<WaitlistRow[]> => {
    const [{ query }, { requireAdmin }] = await Promise.all([import("./db"), import("./session")]);
    await requireAdmin();
    return query<WaitlistRow>(
      "SELECT id, email, collection, created_at FROM public.patisserie_waitlist ORDER BY created_at DESC",
    );
  },
);
