/**
 * Charge `.env` (format KEY=valeur) sans dépendance et construit la
 * configuration de connexion PostgreSQL pour les scripts.
 *
 * Deux écritures acceptées :
 *   DATABASE_URL=postgresql://postgres:root@localhost:5432/osweets
 *   …ou DB_HOST / DB_PORT / DB_DATABASE / DB_USERNAME / DB_PASSWORD.
 *
 * Les variables déjà présentes dans l'environnement ont priorité sur `.env`.
 */
import { existsSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

export const root = join(dirname(fileURLToPath(import.meta.url)), "..");

export function loadEnv() {
  const file = join(root, ".env");
  if (!existsSync(file)) return;
  for (const line of readFileSync(file, "utf8").split("\n")) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*?)\s*$/);
    if (!m) continue;
    if (process.env[m[1]] === undefined) {
      process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
    }
  }
}

export function dbConfig() {
  loadEnv();
  const env = process.env;
  const ssl = env.DATABASE_SSL === "require" ? { rejectUnauthorized: false } : undefined;

  if (env.DATABASE_URL) return { connectionString: env.DATABASE_URL, ssl };

  if (env.DB_DATABASE || env.DB_HOST) {
    return {
      host: env.DB_HOST || "localhost",
      port: Number(env.DB_PORT || 5432),
      database: env.DB_DATABASE || "osweets",
      user: env.DB_USERNAME || "postgres",
      password: env.DB_PASSWORD,
      ssl,
    };
  }

  console.error(
    "Connexion à PostgreSQL non configurée. Renseigne dans .env soit\n" +
      "  DATABASE_URL=postgresql://postgres:motdepasse@localhost:5432/osweets\n" +
      "soit la forme détaillée : DB_HOST, DB_PORT, DB_DATABASE, DB_USERNAME, DB_PASSWORD.",
  );
  process.exit(1);
}

/** Décrit la cible, sans jamais afficher le mot de passe. */
export function describe(config) {
  if (config.connectionString) {
    return config.connectionString.replace(/:\/\/([^:@/]+):[^@]*@/, "://$1:***@");
  }
  return `${config.user}@${config.host}:${config.port}/${config.database}`;
}
