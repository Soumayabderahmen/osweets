import { randomBytes } from "node:crypto";
import { deleteCookie, getCookie, setCookie } from "@tanstack/react-start/server";
import { query, queryOne } from "./db";
import { verifyPassword } from "./password";

/**
 * Sessions du backoffice — code serveur.
 *
 * Ce module n'est jamais importé directement par un composant : il n'est
 * appelé que depuis le corps des fonctions serveur (`src/api/auth.ts`),
 * que le compilateur retire du bundle envoyé au navigateur.
 */
const COOKIE = "os_admin";
/** Durée de vie d'une session du backoffice. */
const SESSION_DAYS = 14;

export interface AdminIdentity {
  id: string;
  email: string;
  displayName: string | null;
}

/** Identité de l'administrateur connecté, ou `null`. */
export async function readSession(): Promise<AdminIdentity | null> {
  const token = getCookie(COOKIE);
  if (!token) return null;
  const row = await queryOne<{ id: string; email: string; display_name: string | null }>(
    `SELECT u.id, u.email, u.display_name
       FROM public.admin_sessions s
       JOIN public.admin_users u ON u.id = s.user_id
      WHERE s.token = $1 AND s.expires_at > now() AND u.active`,
    [token],
  );
  return row ? { id: row.id, email: row.email, displayName: row.display_name } : null;
}

/** Garde-fou de toutes les opérations d'administration. */
export async function requireAdmin(): Promise<AdminIdentity> {
  const admin = await readSession();
  if (!admin) throw new Error("Session expirée — reconnectez-vous.");
  return admin;
}

export async function authenticate(
  email: string,
  password: string,
): Promise<{ ok: boolean; error?: string; admin?: AdminIdentity }> {
  const user = await queryOne<{
    id: string;
    email: string;
    display_name: string | null;
    password_hash: string;
  }>(
    `SELECT id, email, display_name, password_hash
       FROM public.admin_users WHERE email = $1 AND active`,
    [email.toLowerCase().trim()],
  );

  // Message volontairement identique dans les deux cas : on n'indique jamais
  // si l'adresse existe.
  if (!user || !verifyPassword(password, user.password_hash)) {
    return { ok: false, error: "Adresse ou mot de passe incorrect." };
  }

  const token = randomBytes(32).toString("hex");
  await query(
    `INSERT INTO public.admin_sessions (token, user_id, expires_at)
     VALUES ($1, $2, now() + ($3 || ' days')::interval)`,
    [token, user.id, String(SESSION_DAYS)],
  );
  // Ménage des sessions périmées, tant qu'on y est.
  await query("DELETE FROM public.admin_sessions WHERE expires_at < now()");

  // `SameSite=None; Secure` : le backoffice s'affiche aussi dans l'aperçu
  // (iframe d'un autre domaine), où un cookie `lax` ne serait jamais renvoyé.
  setCookie(COOKIE, token, {
    httpOnly: true,
    sameSite: "none",
    secure: true,
    path: "/",
    maxAge: SESSION_DAYS * 24 * 60 * 60,
  });

  return { ok: true, admin: { id: user.id, email: user.email, displayName: user.display_name } };
}

export async function destroySession(): Promise<void> {
  const token = getCookie(COOKIE);
  if (token) await query("DELETE FROM public.admin_sessions WHERE token = $1", [token]);
  deleteCookie(COOKIE, { path: "/" });
}
