/**
 * Verse les visuels de bandeau dans PostgreSQL.
 *
 * Avant : l'image en haut d'une page collection ou d'une page événement
 * était un fichier livré avec le site (`@/assets/p-ghrayba.jpg`). La
 * changer voulait dire modifier le code et redéployer.
 *
 * Après : les octets vivent dans `media_files`, et l'adresse
 * `/api/public/media/<fichier>` est enregistrée dans
 * `collections.image_url` pour les collections, dans
 * `page_banners.image_url` pour les pages. Le back-office reprend la main.
 *
 * Le script ne touche à rien qui a déjà une image en base : un visuel
 * remplacé depuis le back-office ne sera jamais réécrasé par un relancement.
 *
 *   node scripts/push-banners.mjs            (aperçu, sans rien écrire)
 *   node scripts/push-banners.mjs --write    (écrit vraiment)
 */
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import pg from "pg";
import { dbConfig, describe, loadEnv, root } from "./db-env.mjs";

loadEnv();

const ECRIRE = process.argv.includes("--write");
const ASSETS = join(root, "src", "assets");

const TYPES = {
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".webp": "image/webp",
  ".avif": "image/avif",
};
const typeDe = (nom) => TYPES[nom.slice(nom.lastIndexOf(".")).toLowerCase()] ?? null;

/**
 * Visuel de chacune des 6 collections — l'état actuel du site, repris tel
 * quel. `product_key` est la clé côté produits, celle que porte la ligne
 * `collections`.
 */
const COLLECTIONS = {
  amandes: "p-ghrayba.jpg",
  pistache: "p-baklawa.jpg",
  perles: "plateau-or-assortiment-signature.jpg",
  tradition: "p-kaak-warka.jpg",
  ramadan: "p-samsa.jpg",
  aid: "collection-aid-eid-mubarak.jpg",
};

/**
 * Un même fichier peut servir plusieurs pages (le buffet de mariage sert
 * trois pages événements). On ne le verse qu'une fois dans `media_files`,
 * et les lignes partagent la même adresse.
 */
const cache = new Map();

async function versee(client, fichier) {
  if (cache.has(fichier)) return cache.get(fichier);

  const source = join(ASSETS, fichier);
  if (!existsSync(source)) {
    console.log(`  ✗ ${fichier} — introuvable dans src/assets, ignoré`);
    cache.set(fichier, null);
    return null;
  }
  const type = typeDe(fichier);
  if (!type) {
    console.log(`  ✗ ${fichier} — format non accepté, ignoré`);
    cache.set(fichier, null);
    return null;
  }

  // Nom stable et lisible : « bandeau-p-ghrayba.jpg ». Stable, parce qu'un
  // deuxième passage doit retrouver le même fichier au lieu d'en créer un
  // jumeau à chaque exécution.
  const chemin = `bandeau-${fichier}`;
  const url = `/api/public/media/${chemin}`;

  const deja = await client.query("SELECT 1 FROM public.media_files WHERE path = $1", [chemin]);
  if (deja.rowCount) {
    console.log(`  = ${chemin} — déjà en base`);
    cache.set(fichier, url);
    return url;
  }

  const octets = readFileSync(source);
  if (ECRIRE) {
    await client.query(
      `INSERT INTO public.media_files (path, content_type, bytes, size_bytes)
       VALUES ($1, $2, $3, $4)`,
      [chemin, type, octets, octets.byteLength],
    );
  }
  console.log(`  + ${chemin} — ${(octets.byteLength / 1024).toFixed(0)} Ko`);
  cache.set(fichier, url);
  return url;
}

async function main() {
  const config = dbConfig();
  console.log(`Base : ${describe(config)}`);
  console.log(ECRIRE ? "Mode écriture.\n" : "Aperçu — rien ne sera écrit. Ajoutez --write.\n");

  const client = new pg.Client(config);
  await client.connect();
  try {
    console.log("Collections");
    for (const [cle, fichier] of Object.entries(COLLECTIONS)) {
      const ligne = await client.query(
        "SELECT product_key, image_url FROM public.collections WHERE product_key = $1",
        [cle],
      );
      if (!ligne.rowCount) {
        console.log(`  ✗ collection « ${cle} » absente de la base, ignorée`);
        continue;
      }
      if (ligne.rows[0].image_url) {
        console.log(`  = ${cle} — a déjà un visuel, on n'y touche pas`);
        continue;
      }
      const url = await versee(client, fichier);
      if (!url) continue;
      if (ECRIRE) {
        await client.query(
          "UPDATE public.collections SET image_url = $2, image_key = '' WHERE product_key = $1",
          [cle, url],
        );
      }
      console.log(`  → collection ${cle} = ${url}`);
    }

    console.log("\nBandeaux de page");
    const pages = await client.query(
      "SELECT key, image_key, image_url FROM public.page_banners ORDER BY key",
    );
    for (const p of pages.rows) {
      if (p.image_url) {
        console.log(`  = ${p.key} — a déjà un visuel, on n'y touche pas`);
        continue;
      }
      if (!p.image_key) {
        console.log(`  · ${p.key} — aucun fichier de départ, à renseigner depuis le back-office`);
        continue;
      }
      const url = await versee(client, p.image_key);
      if (!url) continue;
      if (ECRIRE) {
        await client.query("UPDATE public.page_banners SET image_url = $2 WHERE key = $1", [
          p.key,
          url,
        ]);
      }
      console.log(`  → page ${p.key} = ${url}`);
    }

    if (!ECRIRE) console.log("\nAperçu terminé. Relancez avec --write pour appliquer.");
    else console.log("\nTerminé.");
  } finally {
    await client.end();
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
