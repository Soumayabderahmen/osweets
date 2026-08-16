import { randomBytes, scryptSync, timingSafeEqual } from "node:crypto";

/**
 * Hachage des mots de passe administrateurs — scrypt, sans dépendance.
 * Format stocké : `scrypt$<sel>$<empreinte>`.
 */
export function hashPassword(password: string): string {
  const salt = randomBytes(16).toString("hex");
  return `scrypt$${salt}$${scryptSync(password, salt, 64).toString("hex")}`;
}

/** Comparaison à temps constant — ne révèle rien par la durée de la réponse. */
export function verifyPassword(password: string, stored: string): boolean {
  const [scheme, salt, hash] = stored.split("$");
  if (scheme !== "scrypt" || !salt || !hash) return false;
  const expected = Buffer.from(hash, "hex");
  const actual = scryptSync(password, salt, expected.length);
  return expected.length === actual.length && timingSafeEqual(expected, actual);
}
