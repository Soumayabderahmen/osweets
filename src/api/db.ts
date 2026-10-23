import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import pg from "pg";

/**
 * Connexion PostgreSQL — code serveur uniquement.
 *
 * Deux écritures sont acceptées dans `.env`, au choix :
 *
 *   DATABASE_URL=postgresql://postgres:root@localhost:5432/osweets
 *
 *   …ou la forme détaillée, à la Laravel :
 *   DB_HOST=localhost
 *   DB_PORT=5432
 *   DB_DATABASE=osweets
 *   DB_USERNAME=postgres
 *   DB_PASSWORD=root
 *
 * Ces valeurs ne partent jamais au navigateur : seules les fonctions
 * serveur de `src/server` y accèdent.
 */
const globalForPg = globalThis as unknown as { __osweetsPool?: pg.Pool };

/**
 * En développement, `vite dev` ne charge pas `.env` dans `process.env`
 * (seules les variables `VITE_*` arrivent côté client). On lit donc le
 * fichier une fois, sans dépendance, et sans écraser l'environnement réel
 * — en production, c'est l'hébergeur qui fournit les variables.
 */
let envLoaded = false;
function loadDotEnv() {
  if (envLoaded) return;
  envLoaded = true;
  const file = join(process.cwd(), ".env");
  if (!existsSync(file)) return;
  for (const line of readFileSync(file, "utf8").split("\n")) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*?)\s*$/);
    if (m && process.env[m[1]] === undefined) {
      process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
    }
  }
}

const MISSING =
  "Connexion à PostgreSQL non configurée. Renseigne dans .env soit\n" +
  "  DATABASE_URL=postgresql://postgres:motdepasse@localhost:5432/osweets\n" +
  "soit la forme détaillée : DB_HOST, DB_PORT, DB_DATABASE, DB_USERNAME, DB_PASSWORD.";

/** Construit la configuration du pilote à partir de l'une ou l'autre écriture. */
export function resolveConnection(): pg.PoolConfig {
  loadDotEnv();
  const env = process.env;
  // TLS exigé par la plupart des hébergeurs distants, inutile en local.
  const ssl = env.DATABASE_SSL === "require" ? { rejectUnauthorized: false } : undefined;

  if (env.DATABASE_URL) {
    // On décompose l'URL : sinon le pilote irait chercher hôte/port/utilisateur
    // dans les variables PG* de l'hébergeur, qui visent une autre base.
    try {
      const u = new URL(env.DATABASE_URL);
      const sslmode = u.searchParams.get("sslmode");
      // Neon n'expose que le port 5432 : un 6543 hérité (pooler d'un autre
      // hébergeur) ferait expirer toutes les connexions.
      const port = /\.neon\.tech$/i.test(u.hostname) ? 5432 : Number(u.port || 5432);
      return {
        host: u.hostname,
        port,

        database: decodeURIComponent(u.pathname.replace(/^\//, "")) || undefined,
        user: decodeURIComponent(u.username),
        password: decodeURIComponent(u.password),
        ssl: ssl ?? (sslmode && sslmode !== "disable" ? { rejectUnauthorized: false } : undefined),
      };
    } catch {
      return { connectionString: env.DATABASE_URL, ssl };
    }
  }

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

  throw new Error(MISSING);
}

/** La base est-elle configurée ? (sinon le site retombe sur le catalogue statique) */
export function isDatabaseConfigured(): boolean {
  loadDotEnv();
  return Boolean(process.env.DATABASE_URL || process.env.DB_DATABASE || process.env.DB_HOST);
}

function pool(): pg.Pool {
  if (!globalForPg.__osweetsPool) {
    const p = new pg.Pool({
      ...resolveConnection(),
      max: 5,
      idleTimeoutMillis: 30_000,
      // Sans plafond, une base injoignable fait attendre la page indéfiniment
      // au lieu d'échouer franchement. Mieux vaut une erreur nette en deux
      // secondes : c'est elle qui déclenche la page « indisponible ».
      connectionTimeoutMillis: 2_000,
    });

    /*
     * Indispensable, et pas seulement prudent.
     *
     * Quand PostgreSQL s'arrête, le pilote émet un événement `error` sur ses
     * connexions au repos. Sans écouteur, Node considère qu'une erreur n'a
     * pas été traitée et TUE LE PROCESSUS : tout le site tombe — les
     * gâteaux, le salé, les pages statiques — pour une panne qui ne
     * concernait que la base. La page « boutique momentanément
     * indisponible » ne pourrait alors jamais s'afficher, puisqu'il n'y
     * aurait plus de serveur pour la rendre.
     *
     * On journalise et on continue : la requête suivante rouvrira une
     * connexion, ou échouera proprement.
     */
    p.on("error", (e) => {
      console.error("[postgres] connexion perdue :", e.message);
    });

    globalForPg.__osweetsPool = p;
  }
  return globalForPg.__osweetsPool;
}

/** Requête paramétrée — jamais de concaténation de valeurs dans le SQL. */
export async function query<T = Record<string, unknown>>(
  text: string,
  params: unknown[] = [],
): Promise<T[]> {
  const result = await pool().query(text, params);
  return result.rows as T[];
}

/** Première ligne, ou `null`. */
export async function queryOne<T = Record<string, unknown>>(
  text: string,
  params: unknown[] = [],
): Promise<T | null> {
  const rows = await query<T>(text, params);
  return rows[0] ?? null;
}

/** Transaction courte : utilisee pour les operations admin multi-lignes. */
export async function transaction<T>(fn: (client: pg.PoolClient) => Promise<T>): Promise<T> {
  const client = await pool().connect();
  try {
    await client.query("BEGIN");
    const out = await fn(client);
    await client.query("COMMIT");
    return out;
  } catch (e) {
    await client.query("ROLLBACK");
    throw e;
  } finally {
    client.release();
  }
}
