/**
 * Génère `public/sitemap.xml` à partir des routes de fichiers TanStack
 * et des slugs du catalogue. Aucune dépendance : lancé par `npm run sitemap`
 * et automatiquement avant chaque build (script `prebuild`).
 */
import { readdirSync, readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

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

/** `patisserie.ramadan.tsx` → `/patisserie/ramadan` ; ignore les routes dynamiques. */
function routeToPath(file) {
  const name = file.replace(/\.tsx$/, "");
  if (name.startsWith("__") || name.includes("$")) return null;
  if (name === "index") return "/";
  const segments = name.split(".").filter((s) => s !== "index");
  return "/" + segments.join("/");
}

function staticRoutes() {
  return readdirSync(join(root, "src", "routes"))
    .filter((f) => f.endsWith(".tsx"))
    .map(routeToPath)
    .filter((p) => p && !EXCLUDED.has(p));
}

/**
 * Slugs du catalogue. On lit `products.ts` au lieu de l'importer :
 * le fichier est du TypeScript et importe ses visuels via Vite.
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
const paths = [...new Set([...staticRoutes(), ...productPaths()])].sort();

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
console.log(`sitemap.xml — ${paths.length} URL générées.`);
