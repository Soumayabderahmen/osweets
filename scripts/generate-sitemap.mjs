/**
 * Génère `public/sitemap.xml` à partir des routes de fichiers TanStack
 * et des slugs du catalogue. Aucune dépendance : lancé par `npm run sitemap`
 * et automatiquement avant chaque build (script `prebuild`).
 */
import { readdirSync, readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import pg from "pg";
import { dbConfig, loadEnv } from "./db-env.mjs";

loadEnv();

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const SITE = "https://osweetspatisserie.lovable.app";

/** Pages privées ou transactionnelles : jamais indexées. */
const EXCLUDED = new Set(["/admin", "/checkout", "/panier", "/mon-compte", "/favoris"]);

/** Priorité éditoriale — le reste retombe sur 0.6. */
const PRIORITY = [
  [/^\/$/, "1.0"],
  [/^\/patisserie$/, "0.9"],
  [/^\/patisserie\//, "0.8"],
  [/^\/produits\//, "0.7"],
  [/^\/(gateaux|cadeaux|evenements|epicerie-salee|packs)/, "0.7"],
];

const priorityOf = (path) => PRIORITY.find(([re]) => re.test(path))?.[1] ?? "0.6";

/**
 * Les collections de la Pâtisserie Tunisienne ont leur propre fichier de
 * route pour six d'entre elles, mais une collection créée depuis le
 * back-office vit sur la route générique `/patisserie/$slug` — ignorée
 * ici, puisqu'elle est dynamique. Elle n'entrait donc jamais au sitemap,
 * et Google ne la découvrait pas. On les prend en base, toutes.
 */
const COLLECTIONS_STATIQUES = new Set([
  "patisserie.amandes.tsx",
  "patisserie.pistache-machmoum-pignon.tsx",
  "patisserie.perles.tsx",
  "patisserie.tradition.tsx",
  "patisserie.ramadan.tsx",
  "patisserie.aid.tsx",
]);

/** `patisserie.ramadan.tsx` → `/patisserie/ramadan` ; ignore les routes dynamiques. */
function routeToPath(file) {
  const name = file.replace(/\.tsx$/, "");
  if (name.startsWith("__") || name.includes("$")) return null;
  if (name === "index") return "/";
  const segments = name.split(".").filter((s) => s !== "index");
  return "/" + segments.join("/");
}

function staticRoutes() {
  return (
    readdirSync(join(root, "src", "routes"))
      .filter((f) => f.endsWith(".tsx"))
      // Les pages collection viennent de la base, pas de leur fichier :
      // c'est la publication en back-office qui décide, pas l'existence
      // d'un `.tsx`.
      .filter((f) => !COLLECTIONS_STATIQUES.has(f))
      .map(routeToPath)
      .filter((p) => p && !EXCLUDED.has(p))
  );
}

/**
 * La Pâtisserie Tunisienne vient de PostgreSQL.
 *
 * Produits publiés et non archivés, collections publiées. Un produit
 * dépublié ou archivé disparaît du sitemap sans qu'on touche à ce script,
 * et une collection créée ce matin y entre le soir même.
 */
async function patisserieDepuisLaBase() {
  const client = new pg.Client(dbConfig());
  try {
    await client.connect();
  } catch (e) {
    console.warn(
      "sitemap : PostgreSQL injoignable, la Pâtisserie Tunisienne est omise.\n " + e.message,
    );
    return null;
  }
  try {
    const produits = await client.query(
      `SELECT slug FROM public.products
        WHERE archived = false AND published = true
          AND draft = false
          AND category IN ('traditionnelle', 'orientale', 'petits-fours')`,
    );
    const collections = await client.query(
      `SELECT c.slug
         FROM public.collections c
        WHERE c.published = true
          AND COALESCE(c.hidden, false) = false
          AND (
            c.empty_behavior <> 'hide'
            OR EXISTS (
              SELECT 1
                FROM public.products p
               WHERE c.product_key = ANY(p.collections)
                 AND p.archived = false
                 AND p.published = true
                 AND p.draft = false
            )
          )`,
    );
    return [
      ...produits.rows.map((r) => `/produits/${r.slug}`),
      ...collections.rows.map((r) => `/patisserie/${r.slug}`),
    ];
  } finally {
    await client.end();
  }
}

/**
 * Slugs des univers non migrés (gâteaux, salé, coffrets, packs). On lit
 * `products.ts` au lieu de l'importer : le fichier est du TypeScript et
 * importe ses visuels via Vite. La Pâtisserie Tunisienne n'y est plus.
 */
function productPaths() {
  const src = readFileSync(join(root, "src", "data", "products.ts"), "utf8");
  const slugs = [...src.matchAll(/^\s*slug:\s*"([^"]+)"/gm)].map((m) => m[1]);
  // Les fiches encore en brouillon (prix non arrêté) restent hors sitemap.
  const drafts = new Set(
    [...src.matchAll(/slug:\s*"([^"]+)",[\s\S]{0,600}?draft:\s*true/g)].map((m) => m[1]),
  );
  return [...new Set(slugs)].filter((s) => !drafts.has(s)).map((s) => `/produits/${s}`);
}

const today = new Date().toISOString().slice(0, 10);
const patisserie = await patisserieDepuisLaBase();
const paths = [...new Set([...staticRoutes(), ...productPaths(), ...(patisserie ?? [])])].sort();

const xml = [
  '<?xml version="1.0" encoding="UTF-8"?>',
  '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
  ...paths.map((p) =>
    [
      "  <url>",
      `    <loc>${SITE}${p}</loc>`,
      `    <lastmod>${today}</lastmod>`,
      `    <priority>${priorityOf(p)}</priority>`,
      "  </url>",
    ].join("\n"),
  ),
  "</urlset>",
  "",
].join("\n");

mkdirSync(join(root, "public"), { recursive: true });
writeFileSync(join(root, "public", "sitemap.xml"), xml, "utf8");
console.log(
  `sitemap.xml — ${paths.length} URL générées` +
    (patisserie ? ` (dont ${patisserie.length} depuis PostgreSQL).` : ", sans la pâtisserie."),
);
