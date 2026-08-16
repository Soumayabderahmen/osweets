/**
 * Reconstruit `src/lib/product-assets.ts` à partir du contenu de `src/assets`.
 * À relancer après avoir ajouté des photos dans le dossier.
 *
 *   node scripts/generate-asset-map.mjs
 */
import { readdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const files = readdirSync(join(root, "src", "assets"))
  .filter((f) => /\.(jpg|jpeg|png|webp|avif)$/i.test(f))
  .sort();

const ident = (f) =>
  "a_" +
  f
    .replace(/\.[^.]+$/, "")
    .replace(/[^a-zA-Z0-9]+(.)/g, (_, c) => c.toUpperCase())
    .replace(/[^a-zA-Z0-9]/g, "");

const out = `/**
 * Photos livrées avec le site (\`src/assets\`).
 *
 * La base ne stocke qu'une clé (\`image_key\`, le nom du fichier) : le bundler
 * a besoin d'un import statique pour empreinter et servir l'image. Le
 * backoffice propose donc cette liste, et \`image_url\` prend le dessus dès
 * qu'une photo est téléversée.
 *
 * Fichier GÉNÉRÉ — régénérer avec : node scripts/generate-asset-map.mjs
 */
${files.map((f) => `import ${ident(f)} from "@/assets/${f}";`).join("\n")}

/** Nom de fichier → URL construite par Vite. */
export const PRODUCT_ASSETS: Record<string, string> = {
${files.map((f) => `  ${JSON.stringify(f)}: ${ident(f)},`).join("\n")}
};

/** Liste triée pour le sélecteur de photo du backoffice. */
export const PRODUCT_ASSET_KEYS = Object.keys(PRODUCT_ASSETS).sort();

/** Résout la photo d'un produit : le téléversement prime sur la photo livrée. */
export function resolveProductImage(imageUrl?: string | null, imageKey?: string | null): string {
  if (imageUrl) return imageUrl;
  if (imageKey && PRODUCT_ASSETS[imageKey]) return PRODUCT_ASSETS[imageKey];
  return "";
}
`;

writeFileSync(join(root, "src", "lib", "product-assets.ts"), out, "utf8");
console.log(`${files.length} photos référencées.`);
