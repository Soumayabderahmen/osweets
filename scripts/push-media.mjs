/**
 * Verse les photos des fiches Pâtisserie Tunisienne dans PostgreSQL.
 *
 * Avant : la photo d'un produit était un fichier livré avec le site
 * (`src/assets/p-baklawa.jpg`), désigné par `image_key`. Impossible de la
 * changer sans redéployer — donc impossible depuis le back-office.
 *
 * Après : les octets vivent dans `media_files`, et `products.image_url`
 * pointe vers `/api/public/media/<fichier>`. Le back-office reprend la main,
 * et la sauvegarde de la base emporte les images.
 *
 * Les fichiers de `src/assets/` ne sont PAS supprimés : cinq d'entre eux
 * servent aussi de bandeaux à des pages événements, qui n'ont rien à voir
 * avec le catalogue. Les effacer casserait sept pages pour rien.
 *
 * Idempotent : relancer le script ne crée pas de doublon.
 *
 *   node scripts/push-media.mjs            (aperçu, sans rien écrire)
 *   node scripts/push-media.mjs --write    (écrit vraiment)
 */
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import pg from "pg";
import { dbConfig, describe, loadEnv, root } from "./db-env.mjs";

loadEnv();

const ECRIRE = process.argv.includes("--write");
const ASSETS = join(root, "src", "assets");

/** Type MIME d'après l'extension — la base n'en accepte que quatre. */
const TYPES = {
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".webp": "image/webp",
  ".avif": "image/avif",
};

const typeDe = (nom) => TYPES[nom.slice(nom.lastIndexOf(".")).toLowerCase()] ?? null;

/** L'univers Pâtisserie Tunisienne, tel que le site le définit. */
const HORS_PATISSERIE = ["cake", "coffret", "sale", "pack-fiancailles", "anniversaire"];

async function main() {
  const config = dbConfig();
  const client = new pg.Client(config);
  await client.connect();
  console.log(`Base : ${describe(config)}`);

  const { rows } = await client.query(
    `SELECT id, slug, name, image_key, image_url
       FROM public.products
      WHERE category <> ALL($1::text[])
        AND image_key IS NOT NULL
      ORDER BY sort_order, name`,
    [HORS_PATISSERIE],
  );

  console.log(`${rows.length} fiches Pâtisserie Tunisienne avec une photo.\n`);

  let versees = 0;
  let deja = 0;
  let manquantes = 0;
  const vues = new Set();

  for (const p of rows) {
    const fichier = p.image_key;
    const chemin = join(ASSETS, fichier);
    const url = `/api/public/media/${fichier}`;

    if (!existsSync(chemin)) {
      console.log(`  ✗ ${p.name} — fichier introuvable : ${fichier}`);
      manquantes++;
      continue;
    }

    const type = typeDe(fichier);
    if (!type) {
      console.log(`  ✗ ${p.name} — format non accepté : ${fichier}`);
      manquantes++;
      continue;
    }

    const octets = readFileSync(chemin);

    // Une même photo peut servir à plusieurs fiches : on ne la verse qu'une fois.
    if (!vues.has(fichier)) {
      vues.add(fichier);
      const { rows: existe } = await client.query(
        "SELECT size_bytes FROM public.media_files WHERE path = $1",
        [fichier],
      );
      if (existe.length) {
        deja++;
        console.log(`  = ${fichier} — déjà en base (${(existe[0].size_bytes / 1024).toFixed(0)} ko)`);
      } else {
        if (ECRIRE) {
          await client.query(
            `INSERT INTO public.media_files (path, content_type, bytes, size_bytes)
             VALUES ($1, $2, $3, $4)
             ON CONFLICT (path) DO NOTHING`,
            [fichier, type, octets, octets.byteLength],
          );
        }
        versees++;
        console.log(`  + ${fichier} — ${(octets.byteLength / 1024).toFixed(0)} ko`);
      }
    }

    if (p.image_url !== url && ECRIRE) {
      await client.query("UPDATE public.products SET image_url = $2 WHERE id = $1", [p.id, url]);
    }
  }

  // La photo principale de la galerie suit la même adresse, pour que le
  // back-office et la boutique regardent exactement le même fichier.
  if (ECRIRE) {
    await client.query(
      `INSERT INTO public.product_images (product_id, url, alt, sort_order, is_primary)
       SELECT p.id, p.image_url, p.name, 0, true
         FROM public.products p
        WHERE p.category <> ALL($1::text[])
          AND p.image_url LIKE '/api/public/media/%'
          AND NOT EXISTS (SELECT 1 FROM public.product_images i WHERE i.product_id = p.id)`,
      [HORS_PATISSERIE],
    );
  }

  console.log(
    `\n${versees} photo(s) versée(s), ${deja} déjà présente(s), ${manquantes} introuvable(s).`,
  );
  if (!ECRIRE) console.log("\nAperçu seulement. Relancez avec --write pour écrire en base.");

  await client.end();
}

main().catch((e) => {
  console.error(e.message);
  process.exit(1);
});
