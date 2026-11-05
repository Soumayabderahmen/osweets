/**
 * Assortiment composé par la cliente : le grammage choisi se découpe en
 * portions de 200 g, qu'elle répartit entre les parfums de l'assortiment
 * (1 kg = 5 portions : 2 Noix + 3 Abricot, par exemple).
 *
 * Le choix voyage dans l'identifiant de la ligne panier
 * (`g-1000~noix:2,abricot:3`) : deux répartitions différentes font deux
 * lignes, et le serveur relit, vérifie et libelle lui-même la répartition —
 * jamais à partir d'un texte écrit par le navigateur.
 */
import { formatGrams } from "./weight.ts";

export const PORTION_G = 200;

/** Nombre de portions d'un grammage ; 0 quand il ne se découpe pas en 200 g. */
export const portionsPour = (grams?: number | null) =>
  grams && grams >= PORTION_G && grams % PORTION_G === 0 ? grams / PORTION_G : 0;

export const cleParfum = (label: string) =>
  label
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

/** Les parfums de l'assortiment, tels que saisis dans sa composition (admin). */
export const parfumsAssortiment = (composition?: { flavor: string }[] | null) => {
  const vus = new Set<string>();
  return (composition ?? [])
    .map((c) => c.flavor.trim())
    .filter((f) => {
      const k = cleParfum(f);
      if (!k || vus.has(k)) return false;
      vus.add(k);
      return true;
    });
};

export function encoderChoix(optionId: string, parfums: string[], nombres: Record<string, number>) {
  const parts = parfums
    .map((f) => [cleParfum(f), Math.trunc(nombres[f] ?? 0)] as const)
    .filter(([, n]) => n > 0)
    .map(([k, n]) => `${k}:${n}`);
  return parts.length ? `${optionId}~${parts.join(",")}` : optionId;
}

export function decoderChoix(variantId?: string) {
  const [base, brut] = (variantId ?? "").split("~", 2);
  if (brut === undefined) return { base, choix: null };
  const choix: { cle: string; n: number }[] = [];
  for (const morceau of brut.split(",")) {
    const m = /^([a-z0-9-]+):(\d{1,2})$/.exec(morceau);
    if (!m) return { base, choix: [] };
    choix.push({ cle: m[1], n: Number(m[2]) });
  }
  return { base, choix };
}

/** « 1 kg · Noix 400 g, Abricot 600 g » */
export function libelleChoix(grams: number, lignes: { parfum: string; n: number }[]) {
  const detail = lignes.map((l) => `${l.parfum} ${formatGrams(l.n * PORTION_G)}`).join(", ");
  return detail ? `${formatGrams(grams)} · ${detail}` : formatGrams(grams);
}

/**
 * Relit une répartition reçue du navigateur. Renvoie le libellé officiel,
 * ou une erreur : parfum inconnu, doublon, ou total ≠ grammage choisi.
 */
export function verifierChoix(
  grams: number,
  composition: { flavor: string }[] | null | undefined,
  choix: { cle: string; n: number }[],
): { ok: true; label: string } | { ok: false } {
  const parfums = new Map(parfumsAssortiment(composition).map((f) => [cleParfum(f), f]));
  const vus = new Set<string>();
  const lignes: { parfum: string; n: number }[] = [];
  for (const { cle, n } of choix) {
    const parfum = parfums.get(cle);
    if (!parfum || vus.has(cle) || n <= 0) return { ok: false };
    vus.add(cle);
    lignes.push({ parfum, n });
  }
  const total = lignes.reduce((s, l) => s + l.n, 0);
  if (!lignes.length || total !== portionsPour(grams)) return { ok: false };
  return { ok: true, label: libelleChoix(grams, lignes) };
}
