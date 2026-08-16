/**
 * Crée (ou met à jour) un compte administrateur du backoffice.
 *
 *   npm run db:admin -- contact@osweets.fr "MotDePasseSolide"
 *
 * Le mot de passe est haché avec scrypt — il n'est jamais stocké en clair.
 */
import { randomBytes, scryptSync } from "node:crypto";
import pg from "pg";
import { dbConfig } from "./db-env.mjs";

const [email, password, displayName] = process.argv.slice(2);
if (!email || !password) {
  console.error('Usage : npm run db:admin -- <email> <motdepasse> ["Nom affiché"]');
  process.exit(1);
}
if (password.length < 10) {
  console.error("Choisis un mot de passe d'au moins 10 caractères.");
  process.exit(1);
}

const salt = randomBytes(16).toString("hex");
const hash = scryptSync(password, salt, 64).toString("hex");

const client = new pg.Client(dbConfig());
await client.connect();
await client.query(
  `INSERT INTO public.admin_users (email, password_hash, display_name)
   VALUES ($1, $2, $3)
   ON CONFLICT (email) DO UPDATE
     SET password_hash = EXCLUDED.password_hash,
         display_name = COALESCE(EXCLUDED.display_name, public.admin_users.display_name),
         active = true`,
  [email.toLowerCase().trim(), `scrypt$${salt}$${hash}`, displayName ?? null],
);
await client.end();
console.log(`Compte administrateur prêt : ${email}`);
