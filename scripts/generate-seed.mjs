/**
 * Génère un fichier de migration qui charge le catalogue statique
 * (`src/data/products.ts`) dans la table PostgreSQL `products`.
 *
 *   node scripts/generate-seed.mjs [univers] [fichier-de-sortie]
 *
 * `univers` vaut « patisserie » (défaut) ou « tout ». Les inserts sont
 * idempotents : ON CONFLICT (slug) DO NOTHING, donc relancer la migration
 * n'écrase jamais ce qui a été saisi dans le backoffice.
 */
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const src = readFileSync(join(root, "src", "data", "products.ts"), "utf8");

/** Hors périmètre « Pâtisserie Tunisienne ». */
const HORS_PERIMETRE = new Set(["cake", "coffret", "sale", "pack-fiancailles", "anniversaire"]);

/** Les imports d'images deviennent une clé d'asset lisible en base. */
const assets = {};
for (const m of src.matchAll(/^import\s+(\w+)\s+from\s+"@\/assets\/([^"]+)";/gm))
  assets[m[1]] = m[2];

/** Isole le littéral de tableau, en ignorant crochets et accolades dans les chaînes. */
function extractArray(text, from) {
  let depth = 0;
  let inStr = null;
  for (let i = from; i < text.length; i++) {
    const c = text[i];
    if (inStr) {
      if (c === "\\") i++;
      else if (c === inStr) inStr = null;
      continue;
    }
    if (c === '"' || c === "'" || c === "`") inStr = c;
    else if (c === "[" || c === "{") depth++;
    else if (c === "]" || c === "}") {
      depth--;
      if (depth === 0) return text.slice(from, i + 1);
    }
  }
  throw new Error("Tableau `products` introuvable.");
}

const decl = src.indexOf("export const products: Product[] =");
const body = extractArray(src, src.indexOf("[", src.indexOf("=", decl))).replace(
  /image:\s*([A-Za-z_$][\w$]*)/g,
  (s, id) => (assets[id] ? `image: ${JSON.stringify("asset:" + assets[id])}` : s),
);
const all = new Function("return " + body)();

const univers = process.argv[2] ?? "patisserie";
const list = univers === "tout" ? all : all.filter((p) => !HORS_PERIMETRE.has(p.category));

// ---- helpers SQL ----
const q = (v) => (v === undefined || v === null ? "NULL" : `'${String(v).replace(/'/g, "''")}'`);
const num = (v) => (v === undefined || v === null ? "NULL" : String(v));
const bool = (v) => (v === undefined || v === null ? "NULL" : v ? "true" : "false");
const arr = (v) => (!v || !v.length ? "'{}'" : `ARRAY[${v.map((x) => q(x)).join(", ")}]::text[]`);
const json = (v) => (v && v.length ? `${q(JSON.stringify(v))}::jsonb` : "NULL");

const COLUMNS = [
  "slug",
  "name",
  "category",
  "family",
  "flavor_label",
  "price",
  "price_per_piece",
  "unit",
  "weight",
  "pieces",
  "serves",
  "min_quantity",
  "prep_lead",
  "short_desc",
  "description",
  "conservation",
  "disclaimer",
  "delivery_mode",
  "image_key",
  "image_url",
  "composition",
  "ingredients",
  "allergens",
  "flavors",
  "varieties",
  "collections",
  "availability",
  "occasions",
  "pack_includes",
  "themes",
  "badge",
  "variants",
  "in_stock",
  "published",
  "draft",
  "seasonal_only",
  "local_only",
  "no_cart",
  "hide_price",
  "requires_cold",
  "customizable",
  "sort_order",
];

const row = (p, i) => {
  const key = typeof p.image === "string" && p.image.startsWith("asset:") ? p.image.slice(6) : null;
  const url = key ? null : p.image || null;
  return [
    q(p.slug),
    q(p.name),
    q(p.category),
    q(p.family),
    q(p.flavorLabel),
    num(p.price ?? 0),
    num(p.pricePerPiece),
    q(p.unit),
    q(p.weight),
    num(p.pieces),
    num(p.serves),
    q(p.minQuantity),
    q(p.prepLead),
    q(p.shortDesc ?? ""),
    q(p.description ?? ""),
    q(p.conservation ?? ""),
    q(p.disclaimer),
    q(p.deliveryMode),
    q(key),
    q(url),
    arr(p.composition),
    arr(p.ingredients),
    arr(p.allergens),
    arr(p.flavors),
    arr(p.varieties),
    arr(p.collections),
    arr(p.availability),
    arr(p.occasions),
    arr(p.packIncludes),
    arr(p.themes),
    q(p.badge),
    json(p.variants),
    bool(p.inStock ?? true),
    bool(p.published ?? true),
    bool(p.draft ?? false),
    bool(p.seasonalOnly ?? false),
    bool(p.localOnly ?? false),
    bool(p.noCart ?? false),
    bool(p.hidePrice ?? false),
    bool(p.requiresCold ?? false),
    bool(p.customizable),
    String((i + 1) * 10),
  ].join(", ");
};

const sql = `-- ============================================================
--  CHARGEMENT DU CATALOGUE EXISTANT  (univers : ${univers})
--  Fichier GÉNÉRÉ — ne pas éditer à la main.
--  Régénérer avec :  node scripts/generate-seed.mjs ${univers}
--  ${list.length} produits repris tels qu'ils sont aujourd'hui sur le site.
--  Idempotent : un slug déjà présent en base n'est jamais écrasé.
-- ============================================================

INSERT INTO public.products (
  ${COLUMNS.join(", ")}
) VALUES
${list.map((p, i) => `  (${row(p, i)})`).join(",\n")}
ON CONFLICT (slug) DO NOTHING;

-- ------------------------------------------------------------
--  Reprise des ajustements de l'ancien backoffice Supabase
--  (table product_overrides). Ignoré si la table n'existe pas —
--  c'est le cas sur une base PostgreSQL neuve.
-- ------------------------------------------------------------
DO $$
BEGIN
  IF to_regclass('public.product_overrides') IS NOT NULL THEN
    EXECUTE $sql$
      UPDATE public.products p SET
        name          = COALESCE(NULLIF(o.name, ''), p.name),
        price         = COALESCE(o.price, p.price),
        image_url     = COALESCE(NULLIF(o.image_url, ''), p.image_url),
        short_desc    = COALESCE(NULLIF(o.short_desc, ''), p.short_desc),
        description   = COALESCE(NULLIF(o.description, ''), p.description),
        collections   = COALESCE(o.collections, p.collections),
        composition   = COALESCE(o.composition, p.composition),
        allergens     = COALESCE(o.allergens, p.allergens),
        unit          = COALESCE(NULLIF(o.unit, ''), p.unit),
        pieces        = COALESCE(o.pieces, p.pieces),
        weight        = COALESCE(NULLIF(o.weight, ''), p.weight),
        family        = COALESCE(NULLIF(o.family, ''), p.family),
        variants      = COALESCE(o.variants, p.variants),
        seasonal_only = COALESCE(o.seasonal_only, p.seasonal_only),
        in_stock      = COALESCE(o.in_stock, p.in_stock),
        published     = o.published,
        draft         = CASE WHEN COALESCE(o.price, 0) > 0 THEN false ELSE p.draft END
      FROM public.product_overrides o
      WHERE o.slug = p.slug
    $sql$;
  END IF;
END $$;
`;

const out = process.argv[3] ?? join(root, "db", "migrations", "002_products_seed.sql");
writeFileSync(out, sql, "utf8");
console.log(`${list.length} produits écrits dans ${out}`);
