/**
 * Applique les migrations de `db/migrations` sur la base PostgreSQL.
 *
 *   npm run db:migrate
 *
 * Chaque fichier est joué une seule fois, dans une transaction, et
 * enregistré dans la table `schema_migrations`. Relancer la commande
 * n'applique que les nouveaux fichiers.
 */
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import pg from "pg";
import { dbConfig, describe, root } from "./db-env.mjs";

const config = dbConfig();
const client = new pg.Client(config);
await client.connect();
console.log(`Base : ${describe(config)}`);

await client.query(`
  CREATE TABLE IF NOT EXISTS public.schema_migrations (
    filename text PRIMARY KEY,
    applied_at timestamptz NOT NULL DEFAULT now()
  )
`);

const { rows } = await client.query("SELECT filename FROM public.schema_migrations");
const done = new Set(rows.map((r) => r.filename));

const files = readdirSync(join(root, "db", "migrations"))
  .filter((f) => f.endsWith(".sql"))
  .sort();

let applied = 0;
for (const file of files) {
  if (done.has(file)) continue;
  const sql = readFileSync(join(root, "db", "migrations", file), "utf8");
  try {
    await client.query("BEGIN");
    await client.query(sql);
    await client.query("INSERT INTO public.schema_migrations (filename) VALUES ($1)", [file]);
    await client.query("COMMIT");
    console.log(`✓ ${file}`);
    applied++;
  } catch (e) {
    await client.query("ROLLBACK");
    console.error(`✗ ${file}\n${e.message}`);
    await client.end();
    process.exit(1);
  }
}

console.log(applied ? `${applied} migration(s) appliquée(s).` : "Base déjà à jour.");
await client.end();
