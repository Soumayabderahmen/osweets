/**
 * Sort la Pâtisserie Tunisienne du catalogue statique.
 *
 * Deux gestes, dans cet ordre :
 *
 *   1. Écrit `src/data/patisserie-fallback.ts` à partir de la base. Ce
 *      fichier est GÉNÉRÉ : il ne se modifie plus à la main, il ne sert que
 *      de filet quand PostgreSQL ne répond pas. Le back-office reste la
 *      seule façon de changer quoi que ce soit.
 *
 *   2. Retire les fiches correspondantes de `src/data/products.ts`, ainsi
 *      que les imports de photos devenus inutiles.
 *
 * Le fichier d'origine est sauvegardé à côté avant toute écriture.
 *
 *   node scripts/extract-patisserie.mjs            (aperçu)
 *   node scripts/extract-patisserie.mjs --write    (écrit vraiment)
 */
import { copyFileSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import pg from "pg";
import { dbConfig, describe, loadEnv, root } from "./db-env.mjs";

loadEnv();
const ECRIRE = process.argv.includes("--write");

const FICHIER = join(root, "src", "data", "products.ts");
const REPLI = join(root, "src", "data", "patisserie-fallback.ts");

/** L'univers Pâtisserie Tunisienne, tel que le site le définit. */
const HORS_PATISSERIE = ["cake", "coffret", "sale", "pack-fiancailles", "anniversaire"];
const estPatisserie = (categorie) => !HORS_PATISSERIE.includes(categorie);

/**
 * Découpe le tableau `products` en blocs de premier niveau.
 * On compte les accolades en ignorant celles qui vivent dans une chaîne —
 * un `{` dans une description ne doit pas décaler le découpage.
 */
function decouper(source) {
  const entete = "export const products: Product[] = [";
  const debut = source.indexOf(entete);
  if (debut < 0) throw new Error("Tableau `products` introuvable.");
  // Le crochet du tableau, pas celui de l'annotation `Product[]`.
  const ouvre = debut + entete.length - 1;

  const blocs = [];
  let i = ouvre + 1;
  let profondeur = 0;
  let depart = -1;
  let chaine = null;
  let echap = false;

  while (i < source.length) {
    const c = source[i];

    if (chaine) {
      if (echap) echap = false;
      else if (c === "\\") echap = true;
      else if (c === chaine) chaine = null;
      i++;
      continue;
    }
    if (c === '"' || c === "'" || c === "`") {
      chaine = c;
      i++;
      continue;
    }
    if (c === "{") {
      if (profondeur === 0) depart = i;
      profondeur++;
    } else if (c === "}") {
      profondeur--;
      if (profondeur === 0) {
        // on emporte la virgule et le retour à la ligne qui suivent
        let fin = i + 1;
        while (fin < source.length && (source[fin] === "," || source[fin] === "\n")) fin++;
        blocs.push({ debut: depart, fin, texte: source.slice(depart, fin) });
      }
    } else if (c === "]" && profondeur === 0) {
      break;
    }
    i++;
  }
  return blocs;
}

const champ = (texte, nom) => {
  const m = texte.match(new RegExp(`\\b${nom}:\\s*"([^"]*)"`));
  return m ? m[1] : null;
};

async function main() {
  const config = dbConfig();
  const client = new pg.Client(config);
  await client.connect();
  console.log(`Base : ${describe(config)}\n`);

  // ------------------------------------------------------ 1. le filet
  const { rows } = await client.query(
    `SELECT * FROM public.products
      WHERE category <> ALL($1::text[]) AND archived = false
      ORDER BY sort_order, name`,
    [HORS_PATISSERIE],
  );
  console.log(`${rows.length} fiches Pâtisserie Tunisienne lues en base.`);

  if (rows.length === 0) {
    console.error(
      "\nAucune fiche en base : je m'arrête. Lancez d'abord `npm run db:migrate`,\n" +
        "sinon le site se retrouverait sans catalogue.",
    );
    process.exit(1);
  }

  const repli =
    `/**\n` +
    ` * Pâtisserie Tunisienne — copie de secours.\n` +
    ` *\n` +
    ` * FICHIER GÉNÉRÉ, ne pas modifier à la main : il est réécrit par\n` +
    ` *   node scripts/extract-patisserie.mjs --write\n` +
    ` *\n` +
    ` * La vérité est en base, et le back-office est la seule façon de la\n` +
    ` * changer. Cette copie ne sert qu'à une chose : si PostgreSQL ne répond\n` +
    ` * pas, la boutique affiche quand même ses produits plutôt qu'une page\n` +
    ` * vide — y compris pour Google.\n` +
    ` */\n` +
    `import type { ProductRow } from "@/lib/catalog";\n\n` +
    `export const PATISSERIE_FALLBACK: ProductRow[] = ${JSON.stringify(rows, null, 2)};\n`;

  // ------------------------------------------ 2. le fichier statique
  const source = readFileSync(FICHIER, "utf8");
  const blocs = decouper(source);
  console.log(`${blocs.length} fiches dans src/data/products.ts.`);

  const aRetirer = blocs.filter((b) => estPatisserie(champ(b.texte, "category")));
  console.log(`${aRetirer.length} à retirer, ${blocs.length - aRetirer.length} conservées.\n`);
  for (const b of aRetirer) console.log(`  − ${champ(b.texte, "slug")}`);

  let suite = source;
  for (const b of [...aRetirer].reverse()) {
    suite = suite.slice(0, b.debut) + suite.slice(b.fin);
  }
  // Remet l'indentation du premier élément restant, mangée par la découpe.
  suite = suite.replace("export const products: Product[] = [\n\n", "export const products: Product[] = [\n");

  // Imports de photos devenus inutiles
  const lignes = suite.split("\n");
  const gardees = [];
  const importsRetires = [];
  for (const l of lignes) {
    const m = l.match(/^import\s+(\w+)\s+from\s+"@\/assets\/[^"]+";$/);
    if (m) {
      const nom = m[1];
      const utilise = new RegExp(`(^|[^\\w])${nom}([^\\w]|$)`, "m").test(
        suite.replace(l, ""),
      );
      if (!utilise) {
        importsRetires.push(nom);
        continue;
      }
    }
    gardees.push(l);
  }
  suite = gardees.join("\n");
  if (importsRetires.length)
    console.log(`\n${importsRetires.length} import(s) de photo devenus inutiles retirés.`);

  if (ECRIRE) {
    copyFileSync(FICHIER, `${FICHIER}.avant-extraction`);
    writeFileSync(FICHIER, suite, "utf8");
    // Le filet de secours n'est plus écrit : la propriétaire a tranché
    // (option C). Sans PostgreSQL, la Pâtisserie Tunisienne affiche
    // « Boutique momentanément indisponible » — elle ne ressort pas un
    // vieux fichier qui contredirait le back-office.
    console.log(`✓ src/data/products.ts allégé — copie gardée en products.ts.avant-extraction.`);
    console.log(`  (${rows.length} fiches lues en base ; aucun filet de secours écrit.)`);
  } else {
    console.log("\nAperçu seulement. Relancez avec --write pour écrire.");
  }

  await client.end();
}

main().catch((e) => {
  console.error(e.message);
  process.exit(1);
});
