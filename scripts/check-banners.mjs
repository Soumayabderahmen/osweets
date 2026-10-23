/**
 * Vérifie que chaque bandeau tient debout tout seul.
 *
 * À lancer APRÈS `npm run db:migrate` et `npm run db:banners`, et AVANT de
 * supprimer les imports `src/assets`. Il répond à une seule question :
 * si on retire le filet aujourd'hui, est-ce qu'une page se retrouve sans
 * image ?
 *
 * Pour chaque collection et chaque bandeau de page, il exige trois choses :
 *   1. une adresse enregistrée ;
 *   2. la forme `/api/public/media/<fichier>` — donc servie par la base,
 *      pas par un fichier du site ;
 *   3. le fichier réellement présent dans `media_files`, avec ses octets.
 *
 * Une adresse qui pointe vers un média absent est le pire cas : la page
 * afficherait un cadre vide sans que rien ne proteste. C'est précisément
 * ce que ce script est là pour attraper.
 *
 * Il pose ensuite une quatrième question, dans l'autre sens : chaque clé
 * que le CODE demande existe-t-elle en base ? Vérifier les lignes
 * présentes ne suffit pas — elles peuvent toutes être impeccables pendant
 * qu'une page en réclame une qui n'existe pas et affiche un bandeau vide
 * sans un mot. Les clés sont relevées dans les sources, jamais recopiées
 * ici : une nouvelle page sera contrôlée sans qu'on y pense.
 *
 *   node scripts/check-banners.mjs
 *
 * Sortie 0 = tout est bon, on peut nettoyer.
 * Sortie 1 = au moins un bandeau ne tiendrait pas : ne rien supprimer.
 */
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import pg from "pg";
import { dbConfig, describe, loadEnv, root } from "./db-env.mjs";

loadEnv();

const PREFIXE = "/api/public/media/";

/** Les trois vérifications, dans l'ordre où elles peuvent échouer. */
async function verifier(client, url) {
  if (!url) return "aucune adresse enregistrée";
  if (!url.startsWith(PREFIXE)) {
    return `adresse hors base (${url}) — elle dépend encore d'un fichier du site`;
  }
  const chemin = url.slice(PREFIXE.length);
  const r = await client.query(
    `SELECT length(bytes) AS taille, content_type
       FROM public.media_files WHERE path = $1`,
    [chemin],
  );
  if (!r.rowCount) return `média introuvable en base (${chemin})`;
  const { taille, content_type } = r.rows[0];
  if (!taille || Number(taille) === 0) return `média vide (${chemin})`;
  if (!String(content_type).startsWith("image/")) {
    return `média qui n'est pas une image (${content_type})`;
  }
  return null;
}

/**
 * Les clés de bandeau que le code demande réellement.
 *
 * On les lit dans les sources plutôt que de les recopier ici : une liste
 * recopiée se désynchronise au premier ajout — et c'est justement le genre
 * d'écart que ce script doit détecter, pas reproduire.
 */
function clesDuCode() {
  const cles = new Set();
  const motifs = [
    /usePageBannerImage\(\s*"([a-z0-9-]+)"/g,
    /usePageBanner\(\s*"([a-z0-9-]+)"/g,
    /bannerKey=\{?\s*"([a-z0-9-]+)"/g,
  ];
  const parcourir = (dossier) => {
    for (const nom of readdirSync(dossier)) {
      const chemin = join(dossier, nom);
      if (statSync(chemin).isDirectory()) parcourir(chemin);
      else if (/\.(ts|tsx)$/.test(nom)) {
        const source = readFileSync(chemin, "utf8");
        for (const motif of motifs) {
          for (const m of source.matchAll(motif)) if (m[1]) cles.add(m[1]);
        }
      }
    }
  };
  parcourir(join(root, "src"));
  return cles;
}

/**
 * Les appels qui passent encore une image de secours.
 *
 * `usePageBannerImage("cle", monImage)` ferait revivre le problème qu'on
 * vient de retirer : deux sources pour un même bandeau, et plus moyen de
 * savoir laquelle a parlé. La base doit rester seule.
 */
function repliDansLeCode() {
  const fautifs = [];
  const motif = /usePageBannerImage\(\s*"([a-z0-9-]+)"\s*,\s*[^)\s]/g;
  const parcourir = (dossier) => {
    for (const nom of readdirSync(dossier)) {
      const chemin = join(dossier, nom);
      if (statSync(chemin).isDirectory()) parcourir(chemin);
      else if (/\.(ts|tsx)$/.test(nom)) {
        const source = readFileSync(chemin, "utf8");
        for (const m of source.matchAll(motif)) {
          fautifs.push(`${chemin.replace(root + "/", "")} (${m[1]})`);
        }
      }
    }
  };
  parcourir(join(root, "src"));
  return fautifs;
}

async function main() {
  const config = dbConfig();
  console.log(`Base : ${describe(config)}\n`);

  const client = new pg.Client(config);
  await client.connect();
  const problemes = [];
  let verifies = 0;

  try {
    const collections = await client.query(
      "SELECT product_key, label, image_url FROM public.collections ORDER BY sort_order",
    );
    console.log(`Collections (${collections.rowCount})`);
    for (const c of collections.rows) {
      const souci = await verifier(client, c.image_url);
      verifies++;
      if (souci) {
        problemes.push(`collection « ${c.label} » (${c.product_key}) : ${souci}`);
        console.log(`  ✗ ${c.label} — ${souci}`);
      } else {
        console.log(`  ✓ ${c.label}`);
      }
    }

    const pages = await client
      .query("SELECT key, label, image_url FROM public.page_banners ORDER BY key")
      .catch((e) => {
        // 42P01 = la table n'existe pas : la migration n'a pas encore tourné.
        if (e.code === "42P01") {
          console.log(
            "\nLa table page_banners n'existe pas encore." +
              "\nLancez d'abord :  npm run db:migrate  puis  npm run db:banners",
          );
          process.exit(1);
        }
        throw e;
      });
    console.log(`\nBandeaux de page (${pages.rowCount})`);
    for (const p of pages.rows) {
      const souci = await verifier(client, p.image_url);
      verifies++;
      if (souci) {
        problemes.push(`page « ${p.label || p.key} » (${p.key}) : ${souci}`);
        console.log(`  ✗ ${p.key} — ${souci}`);
      } else {
        console.log(`  ✓ ${p.key}`);
      }
    }

    // ── dans l'autre sens : le code réclame-t-il une clé qui n'existe pas ?
    console.log("\nClés réclamées par le code");
    const attendues = clesDuCode();
    const presentes = new Set(pages.rows.map((r) => r.key));
    for (const cle of [...attendues].sort()) {
      verifies++;
      if (presentes.has(cle)) {
        console.log(`  ✓ ${cle}`);
      } else {
        problemes.push(`« ${cle} » est demandée par le code mais absente de page_banners`);
        console.log(`  ✗ ${cle} — absente de la base : cette page n'aurait aucun bandeau`);
      }
    }
    // ── et personne ne doit garder une image de secours dans le code
    verifies++;
    const replis = repliDansLeCode();
    if (replis.length === 0) {
      console.log("  ✓ aucun visuel de secours codé en dur");
    } else {
      problemes.push(`visuel de secours encore codé en dur : ${replis.join(", ")}`);
      console.log(`  ✗ visuel de secours encore codé en dur : ${replis.join(", ")}`);
    }

    const orphelines = [...presentes].filter((k) => !attendues.has(k)).sort();
    if (orphelines.length) {
      console.log(`  · ${orphelines.length} ligne(s) qu'aucune page ne lit : ${orphelines.join(", ")}`);
    }
  } finally {
    await client.end();
  }

  console.log(`\n${verifies} bandeau(x) vérifié(s).`);
  if (problemes.length === 0) {
    console.log("Tous les bandeaux viennent de la base, et rien dans le code ne peut les contredire.");
    process.exit(0);
  }
  console.log(`\n${problemes.length} problème(s) — NE PAS supprimer les imports src/assets :`);
  for (const p of problemes) console.log(`  · ${p}`);
  process.exit(1);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
