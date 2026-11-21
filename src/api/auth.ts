import { createServerFn } from "@tanstack/react-start";
import type { AdminIdentity, AdminSession } from "./session";

/**
 * Points d'entrée de l'authentification, appelables depuis le navigateur.
 *
 * Ce fichier ne contient que des `createServerFn` : toute la logique vit dans
 * `./session`, importé uniquement dans le corps des handlers. Le compilateur
 * remplace ces corps par un appel réseau côté client — ni la base ni les
 * cookies ne se retrouvent dans le bundle du navigateur.
 */
export type { AdminIdentity, AdminSession };

export const signIn = createServerFn({ method: "POST" })
  .inputValidator((d: { email: string; password: string }) => d)
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

/* ------------------------------------------------------------------ Mon profil */

export const updateProfile = createServerFn({ method: "POST" })
  .inputValidator((d: { displayName: string; email: string }) => d)
  .handler(async ({ data }): Promise<AdminIdentity> => {
    const { updateMyProfile } = await import("./session");
    return updateMyProfile(data);
  });

export const changePassword = createServerFn({ method: "POST" })
  .inputValidator((d: { current: string; next: string }) => d)
  .handler(async ({ data }) => {
    const { changeMyPassword } = await import("./session");
    await changeMyPassword(data.current, data.next);
    return { ok: true };
  });

export const listSessions = createServerFn({ method: "GET" }).handler(
  async (): Promise<AdminSession[]> => {
    const { listMySessions } = await import("./session");
    return listMySessions();
  },
);

export const revokeSession = createServerFn({ method: "POST" })
  .inputValidator((d: { id: string }) => d)
  .handler(async ({ data }) => {
    const { revokeMySession } = await import("./session");
    await revokeMySession(data.id);
    return { ok: true };
  });
