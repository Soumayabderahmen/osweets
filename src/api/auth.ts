import { createServerFn } from "@tanstack/react-start";
import type { AdminIdentity } from "./session";

/**
 * Points d'entrée de l'authentification, appelables depuis le navigateur.
 *
 * Ce fichier ne contient que des `createServerFn` : toute la logique vit dans
 * `./session`, importé uniquement dans le corps des handlers. Le compilateur
 * remplace ces corps par un appel réseau côté client — ni la base ni les
 * cookies ne se retrouvent dans le bundle du navigateur.
 */
export type { AdminIdentity };

export const signIn = createServerFn({ method: "POST" })
  .validator((d: { email: string; password: string }) => d)
  .handler(async ({ data }): Promise<{ ok: boolean; error?: string; admin?: AdminIdentity }> => {
    const { authenticate } = await import("./session");
    return authenticate(data.email, data.password);
  });

export const signOut = createServerFn({ method: "POST" }).handler(async () => {
  const { destroySession } = await import("./session");
  await destroySession();
  return { ok: true };
});

export const currentAdmin = createServerFn({ method: "GET" }).handler(
  async (): Promise<AdminIdentity | null> => {
    const { readSession } = await import("./session");
    return readSession();
  },
);
