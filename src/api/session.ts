import { randomBytes } from "node:crypto";
import { deleteCookie, getCookie, getRequestHeader, setCookie } from "@tanstack/react-start/server";
import { query, queryOne } from "./db";
import { hashPassword, verifyPassword } from "./password";

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
  if (!row) return null;
  // Dernière visite, notée au plus toutes les 5 minutes.
  await query(
    `UPDATE public.admin_sessions SET last_seen_at = now()
      WHERE token = $1 AND last_seen_at < now() - interval '5 minutes'`,
    [token],
  );
  return { id: row.id, email: row.email, displayName: row.display_name };
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
    `INSERT INTO public.admin_sessions (token, user_id, expires_at, user_agent)
     VALUES ($1, $2, now() + ($3 || ' days')::interval, $4)`,
    [token, user.id, String(SESSION_DAYS), (getRequestHeader("user-agent") ?? "").slice(0, 400)],
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

/* ------------------------------------------------------------------ profil */

export interface AdminSession {
  id: string;
  userAgent: string | null;
  createdAt: string;
  lastSeenAt: string;
  current: boolean;
}

/** Les appareils connectés au compte, le plus récent d'abord. */
export async function listMySessions(): Promise<AdminSession[]> {
  const admin = await requireAdmin();
  const token = getCookie(COOKIE);
  const rows = await query<{
    id: string;
    user_agent: string | null;
    created_at: string;
    last_seen_at: string;
    current: boolean;
  }>(
    `SELECT id, user_agent, created_at, last_seen_at, token = $2 AS current
       FROM public.admin_sessions
      WHERE user_id = $1 AND expires_at > now()
      ORDER BY (token = $2) DESC, last_seen_at DESC`,
    [admin.id, token ?? ""],
  );
  return rows.map((r) => ({
    id: r.id,
    userAgent: r.user_agent,
    createdAt: new Date(r.created_at).toISOString(),
    lastSeenAt: new Date(r.last_seen_at).toISOString(),
    current: r.current,
  }));
}

/** Ferme une session (un appareil) ; `"autres"` ferme toutes sauf celle-ci. */
export async function revokeMySession(id: string | "autres"): Promise<void> {
  const admin = await requireAdmin();
  const token = getCookie(COOKIE) ?? "";
  if (id === "autres") {
    await query("DELETE FROM public.admin_sessions WHERE user_id = $1 AND token <> $2", [
      admin.id,
      token,
    ]);
    return;
  }
  await query("DELETE FROM public.admin_sessions WHERE user_id = $1 AND id = $2 AND token <> $3", [
    admin.id,
    id,
    token,
  ]);
}

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Nom affiché et adresse de connexion. */
export async function updateMyProfile(input: {
  displayName: string;
  email: string;
}): Promise<AdminIdentity> {
  const admin = await requireAdmin();
  const email = input.email.toLowerCase().trim();
  const displayName = input.displayName.trim().slice(0, 80) || null;
  if (!EMAIL.test(email)) throw new Error("Cette adresse e-mail n'est pas valide.");
  const pris = await queryOne<{ id: string }>(
    "SELECT id FROM public.admin_users WHERE email = $1 AND id <> $2",
    [email, admin.id],
  );
  if (pris) throw new Error("Cette adresse est déjà utilisée par un autre compte.");
  await query("UPDATE public.admin_users SET email = $1, display_name = $2 WHERE id = $3", [
    email,
    displayName,
    admin.id,
  ]);
  return { id: admin.id, email, displayName };
}

export const MOT_DE_PASSE_MIN = 10;

/** Change le mot de passe, puis ferme les autres appareils. */
export async function changeMyPassword(current: string, next: string): Promise<void> {
  const admin = await requireAdmin();
  const row = await queryOne<{ password_hash: string }>(
    "SELECT password_hash FROM public.admin_users WHERE id = $1",
    [admin.id],
  );
  if (!row || !verifyPassword(current, row.password_hash))
    throw new Error("Le mot de passe actuel n'est pas le bon.");
  if (next.length < MOT_DE_PASSE_MIN)
    throw new Error(`Le nouveau mot de passe doit faire au moins ${MOT_DE_PASSE_MIN} caractères.`);
  if (next === current) throw new Error("Le nouveau mot de passe est le même que l'actuel.");
  await query("UPDATE public.admin_users SET password_hash = $1 WHERE id = $2", [
    hashPassword(next),
    admin.id,
  ]);
  await revokeMySession("autres");
}
