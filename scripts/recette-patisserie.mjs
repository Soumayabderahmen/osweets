/**
 * Recette de la Pâtisserie Tunisienne.
 *
 * Une seule question, posée de six façons : est-ce que PostgreSQL commande
 * vraiment le front-office, sans qu'aucun fichier du code puisse le
 * contredire ?
 *
 * Le principe de chaque épreuve est le même. On change l'état en base —
 * exactement ce que le back-office écrit quand vous cliquez — puis on
 * demande les pages au serveur et on lit ce qu'elles contiennent. Pas de
 * navigateur, pas de dépendance en plus : le serveur rend déjà la page
 * complète, c'est donc elle qu'on inspecte.
 *
 * Toute modification est annulée à la fin, y compris si une épreuve
 * échoue en cours de route.
 *
 *   node scripts/recette-patisserie.mjs
 *   node scripts/recette-patisserie.mjs --url http://127.0.0.1:8080
 *
 * Sortie 0 = les six épreuves passent.
 */
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import pg from "pg";
import { guardTestData } from "./test-data-guard.mjs";
import { dbConfig, describe, loadEnv, root } from "./db-env.mjs";

loadEnv();

const arg = (nom, defaut) => {
  const i = process.argv.indexOf(nom);
  return i >= 0 ? process.argv[i + 1] : defaut;
};
const URL_BASE = arg("--url", "http://127.0.0.1:8080").replace(/\/$/, "");

let echecs = 0;
let epreuves = 0;

function verifier(intitule, condition, detail = "") {
  epreuves++;
  if (condition) {
    console.log(`  ✓ ${intitule}`);
  } else {
    echecs++;
    console.log(`  ✗ ${intitule}${detail ? ` — ${detail}` : ""}`);
  }
}

async function page(chemin) {
  const r = await fetch(URL_BASE + chemin, { redirect: "manual" });
  const html = r.status >= 200 && r.status < 400 ? await r.text() : "";
  return { statut: r.status, html };
}

/** Le slug apparaît-il comme lien de fiche produit sur cette page ? */
const cite = (html, slug) => html.includes(`/produits/${slug}"`);

/**
 * Épreuve « base éteinte ».
 *
 * Elle ne peut pas s'exécuter avec les autres : il faut vraiment arrêter
 * PostgreSQL. On la lance donc à part, quand la base est déjà à l'arrêt :
 *
 *   sudo systemctl stop postgresql        (ou l'équivalent chez vous)
 *   node scripts/recette-patisserie.mjs --panne
 *   sudo systemctl start postgresql
 *
 * Ce qu'elle exige : les pages pâtisserie disent qu'elles sont
 * indisponibles, le reste du site continue de répondre, et surtout aucun
 * nom de pâtisserie n'apparaît nulle part — s'il en apparaissait un, il ne
 * pourrait venir que d'un fichier du code.
 */
async function epreuvePanne() {
  console.log("Épreuve « PostgreSQL éteint »\n");

  const vivante = await page("/patisserie").catch(() => null);
  if (vivante && vivante.html.includes("Baklawa Pistache")) {
    console.error("La base répond encore : cette épreuve n'a de sens qu'avec PostgreSQL arrêté.");
    process.exit(1);
  }

  /*
   * Comment reconnaître une fuite ?
   *
   * Pas au nom : « Kaak Warka » figure dans la description du site, sur
   * toutes les pages, et c'est du texte de présentation, pas une fiche.
   * Une vraie fuite se voit à un lien de fiche produit. On relève donc tous
   * les liens `/produits/<slug>` rendus par le serveur, et on exige qu'ils
   * appartiennent tous au catalogue statique — celui des gâteaux, du salé,
   * des coffrets et des packs. Un slug pâtisserie qui apparaîtrait pendant
   * la panne ne pourrait venir que d'un fichier du code : c'est exactement
   * ce qu'on interdit.
   */
  const produitsTs = readFileSync(join(root, "src", "data", "products.ts"), "utf8");
  const slugsStatiques = new Set(
    [...produitsTs.matchAll(/slug:\s*"([a-z0-9-]+)"/g)].map((m) => m[1]),
  );
  const liensDe = (html) => [
    ...new Set([...html.matchAll(/\/produits\/([a-z0-9-]+)"/g)].map((m) => m[1])),
  ];

  const pagesPatisserie = [
    "/patisserie",
    "/patisserie?vue=%22tout%22",
    "/patisserie/amandes",
    "/composer?size=%2212%22",
  ];
  for (const chemin of pagesPatisserie) {
    const r = await page(chemin);
    verifier(
      `${chemin} annonce l'indisponibilité`,
      r.statut === 200 && r.html.includes("momentanément indisponible"),
      `statut ${r.statut}`,
    );
  }

  for (const chemin of pagesPatisserie) {
    const r = await page(chemin);
    const liens = liensDe(r.html);
    verifier(`${chemin} n'affiche aucune fiche produit`, liens.length === 0, liens.join(", "));
  }

  for (const chemin of ["/", "/galerie", "/cadeaux/ramadan", "/gateaux", "/favoris"]) {
    const r = await page(chemin);
    const fuites = liensDe(r.html).filter((slug) => !slugsStatiques.has(slug));
    verifier(
      `${chemin} : aucune fiche hors catalogue statique`,
      fuites.length === 0,
      fuites.join(", "),
    );
  }

  for (const chemin of ["/", "/gateaux", "/contact"]) {
    const r = await page(chemin);
    verifier(`${chemin} répond toujours`, r.statut === 200, `statut ${r.statut}`);
  }

  console.log(`\n${epreuves} vérification(s), ${echecs} échec(s).`);
  process.exit(echecs > 0 ? 1 : 0);
}

// ════════════════════════════════════════════════════════════════════
async function main() {
  if (process.argv.includes("--panne")) {
    console.log(`Boutique: ${URL_BASE}\n`);
    return epreuvePanne();
  }

  const config = dbConfig();
  console.log(`Base    : ${describe(config)}`);
  console.log(`Boutique: ${URL_BASE}\n`);

  const accueil = await page("/").catch(() => null);
  if (!accueil || accueil.statut >= 400) {
    console.error(
      `La boutique ne répond pas sur ${URL_BASE}.\n` +
        "Lancez « npm run dev » dans un autre terminal, puis relancez cette recette.",
    );
    process.exit(1);
  }

  const client = new pg.Client(config);
  await client.connect();
  const verifyRestored = await guardTestData(client);

  /** Ce qu'il faudra remettre en place, quoi qu'il arrive. */
  let temoin = null;
  let etatInitial = null;

  try {
    // ── choix du témoin : un produit vivant, rattaché à une collection
    const t = await client.query(
      `SELECT id, slug, name, price, short_desc, image_url, collections,
              archived, published, sell_mode, sell_options, variants
         FROM public.products
        WHERE archived = false AND published = true
          AND category IN ('traditionnelle', 'orientale', 'petits-fours')
          AND array_length(collections, 1) > 0
        ORDER BY sort_order, name LIMIT 1`,
    );
    if (!t.rowCount) {
      console.error("Aucun produit pâtisserie publié et rattaché à une collection.");
      process.exit(1);
    }
    temoin = t.rows[0];
    etatInitial = { ...temoin };
    const collection = temoin.collections[0];
    console.log(`Témoin  : ${temoin.name} (${temoin.slug}), collection « ${collection} »\n`);

    const cheminCollection = await (async () => {
      const c = await client.query("SELECT slug FROM public.collections WHERE product_key = $1", [
        collection,
      ]);
      return c.rowCount ? `/patisserie/${c.rows[0].slug}` : null;
    })();

    // ══════════════ 1. état de départ
    console.log("1. Le témoin est bien là au départ");
    {
      const cat = await page("/patisserie?vue=%22tout%22");
      verifier("présent au catalogue", cite(cat.html, temoin.slug));
      if (cheminCollection) {
        const col = await page(cheminCollection);
        verifier(`présent sur ${cheminCollection}`, cite(col.html, temoin.slug));
      }
      const fiche = await page(`/produits/${temoin.slug}`);
      verifier("sa fiche répond 200", fiche.statut === 200, `statut ${fiche.statut}`);
    }

    // ══════════════ 2. archivé depuis le back-office → il disparaît partout
    console.log("\n2. Archivé : il doit disparaître partout");
    await client.query(
      "UPDATE public.products SET archived = true, published = false WHERE id = $1",
      [temoin.id],
    );
    {
      const cat = await page("/patisserie?vue=%22tout%22");
      verifier("absent du catalogue", !cite(cat.html, temoin.slug));
      if (cheminCollection) {
        const col = await page(cheminCollection);
        verifier(`absent de ${cheminCollection}`, !cite(col.html, temoin.slug));
      }
      const composer = await page("/composer?size=%2212%22");
      // Le nom seul ne suffit pas : « Kaak Warka » figure aussi dans la
      // description du site, en en-tête de chaque page. On vise donc le
      // bouton de la vignette, qui n'existe que si le produit est proposé.
      verifier("absent du composer", !composer.html.includes(`Retirer ${temoin.name}`));
      const galerie = await page("/galerie");
      verifier(
        "absent de la galerie",
        !temoin.image_url || !galerie.html.includes(temoin.image_url),
      );
      for (const occasion of ["ramadan", "aid"]) {
        const c = await page(`/cadeaux/${occasion}`);
        verifier(`absent de /cadeaux/${occasion}`, !cite(c.html, temoin.slug));
      }
      const fiche = await page(`/produits/${temoin.slug}`);
      verifier("sa fiche répond 404", fiche.statut === 404, `statut ${fiche.statut}`);
    }

    // ══════════════ 3. restauré → il revient
    console.log("\n3. Restauré : il doit revenir");
    await client.query(
      "UPDATE public.products SET archived = false, published = true WHERE id = $1",
      [temoin.id],
    );
    {
      const cat = await page("/patisserie?vue=%22tout%22");
      verifier("de retour au catalogue", cite(cat.html, temoin.slug));
      const fiche = await page(`/produits/${temoin.slug}`);
      verifier("sa fiche répond de nouveau 200", fiche.statut === 200, `statut ${fiche.statut}`);
    }

    // ══════════════ 4. nom, prix, description
    console.log("\n4. Nom, prix et description changés : partout");
    const nouveauNom = "Témoin Recette Ö";
    const nouveauPrix = "123.45";
    const nouvelleDesc = "Description posée par la recette automatique.";

    /*
     * Le prix affiché n'est pas toujours celui du champ « prix ».
     *
     * Un produit vendu au format — deux options saisies au back-office —
     * s'annonce « dès 18,00 € », le prix de son plus petit format ; son
     * champ « prix » ne paraît nulle part. Cette épreuve changeait ce
     * champ et exigeait de le voir : elle accusait la boutique d'ignorer
     * le back-office alors qu'elle l'écoutait, simplement ailleurs.
     *
     * On regarde donc d'abord comment ce produit se vend, et on change le
     * prix là où la cliente le lit.
     */
    const colonneFormats =
      temoin.sell_mode !== "kg" && temoin.sell_options?.length
        ? "sell_options"
        : temoin.sell_mode !== "kg" && temoin.variants?.length
          ? "variants"
          : null;
    const formats = colonneFormats ? temoin[colonneFormats] : null;

    if (temoin.sell_mode === "kg") {
      await client.query(
        "UPDATE public.products SET name = $2, price = $3, short_desc = $4 WHERE id = $1",
        [temoin.id, nouveauNom, nouveauPrix, nouvelleDesc],
      );
    } else if (colonneFormats) {
      const modifies = formats.map((o) => ({ ...o, price: 123.45 }));
      await client.query(
        `UPDATE public.products
            SET name = $2, short_desc = $3, ${colonneFormats} = $4::jsonb
          WHERE id = $1`,
        [temoin.id, nouveauNom, nouvelleDesc, JSON.stringify(modifies)],
      );
    } else {
      await client.query(
        "UPDATE public.products SET name = $2, price = $3, short_desc = $4 WHERE id = $1",
        [temoin.id, nouveauNom, nouveauPrix, nouvelleDesc],
      );
    }
    {
      const fiche = await page(`/produits/${temoin.slug}`);
      verifier("nouveau nom sur la fiche", fiche.html.includes(nouveauNom));
      const kgGrams = (temoin.sell_options ?? []).map((o) => o.grams).filter((g) => g > 0);
      const mainKg = kgGrams.includes(1000)
        ? 1000
        : kgGrams.includes(500)
          ? 500
          : kgGrams.includes(100)
            ? 100
            : Math.max(...kgGrams, 0);
      const prixAttendu =
        temoin.sell_mode === "kg"
          ? ((Number(nouveauPrix) * mainKg) / 1000).toFixed(2).replace(".", ",")
          : "123,45";
      verifier(
        temoin.sell_mode === "kg"
          ? "nouveau prix/kg recalculé sur le grammage principal"
          : colonneFormats
            ? "nouveau prix de format sur la fiche (produit vendu au format)"
            : "nouveau prix sur la fiche",
        fiche.html.includes(prixAttendu),
      );
      verifier("nouvelle description sur la fiche", fiche.html.includes(nouvelleDesc));
      const cat = await page("/patisserie?vue=%22tout%22");
      verifier("nouveau nom au catalogue", cat.html.includes(nouveauNom));
    }

    // ══════════════ 5. image remplacée
    console.log("\n5. Image remplacée : partout");
    const chemin = `recette-temoin-${temoin.id.slice(0, 8)}.jpg`;
    const urlImage = `/api/public/media/${chemin}`;
    {
      // Un pixel JPEG suffit : ce qui compte est l'adresse, pas le dessin.
      const octets = Buffer.from(
        "/9j/4AAQSkZJRgABAQEAYABgAAD/2wBDAAgGBgcGBQgHBwcJCQgKDBQNDAsLDBkSEw8UHRofHh0a" +
          "HBwgJC4nICIsIxwcKDcpLDAxNDQ0Hyc5PTgyPC4zNDL/wAALCAABAAEBAREA/8QAFAABAAAAAAAA" +
          "AAAAAAAAAAAACf/EABQQAQAAAAAAAAAAAAAAAAAAAAD/2gAIAQEAAD8AKp//2Q==",
        "base64",
      );
      await client.query(
        `INSERT INTO public.media_files (path, content_type, bytes, size_bytes)
         VALUES ($1, 'image/jpeg', $2, $3)
         ON CONFLICT (path) DO NOTHING`,
        [chemin, octets, octets.byteLength],
      );
      await client.query("UPDATE public.products SET image_url = $2 WHERE id = $1", [
        temoin.id,
        urlImage,
      ]);
      const fiche = await page(`/produits/${temoin.slug}`);
      verifier("nouvelle image sur la fiche", fiche.html.includes(urlImage));
      const cat = await page("/patisserie?vue=%22tout%22");
      verifier("nouvelle image au catalogue", cat.html.includes(urlImage));
      const servie = await fetch(URL_BASE + urlImage);
      verifier("l'image est bien servie par la base", servie.status === 200);
    }

    // ══════════════ 6. les trois sources interdites
    console.log("\n6. Les trois sources interdites n'ont plus prise");
    {
      const produitsTs = readFileSync(join(root, "src", "data", "products.ts"), "utf8");
      const categories = ["traditionnelle", "orientale", "petits-fours"];
      const dedans = categories.filter((c) => produitsTs.includes(`category: "${c}"`));
      verifier(
        "src/data/products.ts ne contient aucune fiche pâtisserie",
        dedans.length === 0,
        dedans.join(", "),
      );

      const importeurs = [];
      const parcourir = (dossier) => {
        for (const nom of readdirSync(dossier)) {
          const chemin = join(dossier, nom);
          if (statSync(chemin).isDirectory()) parcourir(chemin);
          else if (/\.(ts|tsx)$/.test(nom) && !nom.startsWith("patisserie-fallback")) {
            if (readFileSync(chemin, "utf8").includes("patisserie-fallback")) {
              importeurs.push(chemin.replace(root + "/", ""));
            }
          }
        }
      };
      parcourir(join(root, "src"));
      verifier(
        "aucun module n'importe patisserie-fallback",
        importeurs.length === 0,
        importeurs.join(", "),
      );

      /*
       * Troisième source : les images.
       *
       * Une fiche dont la photo est désignée par `image_key` la fait
       * résoudre dans `src/assets` — la base ne porterait alors que le nom
       * du fichier, pas l'image, et le back-office ne pourrait pas la
       * changer. On exige donc une adresse servie par la base pour chaque
       * produit en vente.
       */
      const photos = await client.query(
        `SELECT slug FROM public.products
          WHERE archived = false
            AND category IN ('traditionnelle', 'orientale', 'petits-fours')
            AND coalesce(image_url, '') NOT LIKE '/api/public/media/%'`,
      );
      verifier(
        "chaque pâtisserie en vente a sa photo en base",
        photos.rowCount === 0,
        photos.rows.map((r) => r.slug).join(", "),
      );

      /*
       * Et la vérification par le résultat : ce que le serveur envoie
       * réellement. Une seule adresse `/src/assets/` sur une page
       * pâtisserie signifierait qu'un fichier du code s'y est glissé.
       *
       * `/composer` est volontairement hors de cette liste : il garde son
       * illustration de format, c'est un chantier à part.
       */
      const surfaces = [
        "/patisserie",
        "/patisserie?vue=%22tout%22",
        "/patisserie/amandes",
        "/patisserie/tradition",
        "/patisserie/aid",
        "/patisserie/perles",
        "/patisserie/ramadan",
        "/patisserie/pistache-machmoum-pignon",
        `/produits/${temoin.slug}`,
      ];
      for (const chemin of surfaces) {
        const r = await page(chemin);
        const fichiers = [
          ...new Set([...r.html.matchAll(/\/src\/assets\/([\w.-]+)/g)].map((m) => m[1])),
        ];
        verifier(
          `${chemin} ne sert aucune image du code`,
          fichiers.length === 0,
          fichiers.join(", "),
        );
      }
    }
  } finally {
    // ── remise en état, échec ou non
    if (temoin && etatInitial) {
      /*
       * Tout ce que l'épreuve a touché revient, y compris l'accroche et les
       * formats. `short_desc` manquait ici : la recette laissait derrière
       * elle « Description posée par la recette automatique. » sur la fiche
       * du témoin, et personne ne s'en apercevait avant de la relire.
       */
      await client.query(
        `UPDATE public.products
            SET name = $2, price = $3, short_desc = $4, image_url = $5,
                archived = $6, published = $7,
                sell_options = $8::jsonb, variants = $9::jsonb
          WHERE id = $1`,
        [
          etatInitial.id,
          etatInitial.name,
          etatInitial.price,
          etatInitial.short_desc,
          etatInitial.image_url,
          etatInitial.archived,
          etatInitial.published,
          JSON.stringify(etatInitial.sell_options ?? null),
          JSON.stringify(etatInitial.variants ?? null),
        ],
      );
      await client.query("DELETE FROM public.media_files WHERE path LIKE 'recette-temoin-%'");
      console.log("\nTémoin remis dans son état d'origine.");
    }
    try {
      await verifyRestored();
    } finally {
      await client.end();
    }
  }

  console.log(`\n${epreuves} vérification(s), ${echecs} échec(s).`);
  if (echecs > 0) {
    console.log("La migration n'est pas terminée.");
    process.exit(1);
  }
  console.log("La Pâtisserie Tunisienne est pilotée par le back-office.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
