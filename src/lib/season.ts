/**
 * Disponibilité saisonnière — Ramadan, Aïd, et toute saison à venir.
 *
 * Ce fichier ne contient plus une seule date. Elles vivaient ici, écrites
 * année par année jusqu'en 2028 : passé cette échéance, la collection
 * Ramadan ne se serait plus ouverte, et rien n'aurait dit pourquoi. Le
 * calendrier hégirien se décale chaque année ; un fichier, non.
 *
 * Les fenêtres viennent maintenant de la table `seasons`, modifiable
 * depuis le back-office. Le code ne sait plus *quand* — il sait seulement
 * *comment* décider.
 *
 * Chaque fonction reçoit les saisons en argument, et c'est délibéré : un
 * appel qui les oublie ne doit pas conclure « hors saison » en silence, il
 * doit refuser de compiler.
 */
import type { Product } from "@/data/products";
import type { SeasonRow } from "@/api/seasons";
import { parisDay, shiftDay, validDay } from "./calendar-day.ts";

/** Une fenêtre d'ouverture, telle que la boutique la manipule. */
export interface SeasonWindow {
  key: string;
  label: string;
  /** Ouverture effective, précommande comprise. */
  opensOn: Date;
  closesOn: Date;
}

/**
 * Une date de base → un jour, quoi qu'on nous donne.
 *
 * Selon le chemin emprunté, la même colonne arrive en `Date` (rendu
 * serveur, sans passage par JSON) ou en texte ISO (rendu client). Un
 * `Date` relu comme du texte donnait « Fri Aug 2 » : une date invalide,
 * une comparaison toujours fausse, une collection qui ne s'ouvrait jamais
 * — et pas un mot d'erreur. On accepte donc les deux formes.
 */
function jourISO(v: unknown): string {
  if (v instanceof Date) return v.toISOString().slice(0, 10);
  const s = String(v ?? "");
  const m = s.match(/^\d{4}-\d{2}-\d{2}/);
  if (m) return m[0];
  const d = new Date(s);
  return Number.isNaN(d.getTime()) ? "" : d.toISOString().slice(0, 10);
}

/**
 * Ligne de base → fenêtre exploitable. Les inactives sont écartées, et
 * une ligne dont les dates sont illisibles aussi : mieux vaut une saison
 * fermée qu'une saison ouverte pour de mauvaises raisons.
 */
export function toWindows(rows: SeasonRow[]): SeasonWindow[] {
  const out: SeasonWindow[] = [];
  for (const r of rows) {
    if (!r.active) continue;
    const d1 = jourISO(r.starts_on);
    const d2 = jourISO(r.ends_on);
    if (!validDay(d1) || !validDay(d2) || d2 < d1) continue;
    out.push({
      key: r.season_key,
      label: r.label,
      // La précommande avance l'ouverture sans toucher aux dates de la fête.
      opensOn: new Date(`${shiftDay(d1, -Math.max(0, r.preorder_days ?? 0))}T00:00:00Z`),
      closesOn: new Date(`${d2}T23:59:59.999Z`),
    });
  }
  return out;
}

/** Cette saison est-elle ouverte à la commande, maintenant ? */
export function isSeasonActive(
  key: string,
  windows: SeasonWindow[],
  now: Date = new Date(),
): boolean {
  const day = parisDay(now);
  return windows.some(
    (w) => w.key === key && day >= jourISO(w.opensOn) && day <= jourISO(w.closesOn),
  );
}

/** Les clés de saison connues — sert au menu à distinguer les occasions. */
export function seasonKeys(rows: SeasonRow[]): Set<string> {
  return new Set(rows.map((r) => r.season_key));
}

/**
 * Le produit peut-il être présenté aujourd'hui ?
 *
 * Un produit non saisonnier l'est toujours. Un produit saisonnier ne
 * s'affiche que si l'une de ses collections est en saison — et si aucune
 * fenêtre n'est enregistrée pour elle, il reste caché : mieux vaut ne rien
 * proposer que promettre ce que l'atelier ne prépare pas.
 */
export function isProductAvailableNow(
  p: Product,
  windows: SeasonWindow[],
  now: Date = new Date(),
): boolean {
  if (!p.seasonalOnly) return true;
  const cols = (p.collections ?? []) as readonly string[];
  return cols.some((c) => isSeasonActive(c, windows, now));
}

/** Écarte les produits hors saison d'une liste. */
export function filterAvailable(
  list: Product[],
  windows: SeasonWindow[],
  now: Date = new Date(),
): Product[] {
  return list.filter((p) => isProductAvailableNow(p, windows, now));
}

/** « aid » → « Aïd ». Question d'orthographe, pas de commerce. */
function nomSimple(cle: string): string {
  if (cle === "aid") return "Aïd";
  if (cle === "ramadan") return "Ramadan";
  return cle.charAt(0).toUpperCase() + cle.slice(1);
}

/** « aid » → « l'Aïd ». Simple habillage, aucune décision métier ici. */
function nomLisible(cle: string): string {
  if (cle === "aid") return "l'Aïd";
  if (cle === "ramadan") return "le Ramadan";
  return nomSimple(cle);
}

/**
 * Les saisons d'un produit, nommées.
 *
 * La pastille annonçait « Ramadan / Aïd » à tout produit saisonnier, même
 * à celui qui ne sort qu'à l'Aïd — et elle l'aurait annoncé à une
 * troisième fête créée demain. Elle nomme désormais ce que le produit
 * relève vraiment.
 */
export function seasonNames(p: Product, windows: SeasonWindow[]): string[] {
  const cols = (p.collections ?? []) as readonly string[];
  const vus = new Set<string>();
  const noms: string[] = [];
  for (const c of cols) {
    if (vus.has(c) || !windows.some((w) => w.key === c)) continue;
    vus.add(c);
    noms.push(nomSimple(c));
  }
  return noms;
}

/**
 * Ce qu'on dit d'un produit saisonnier actuellement fermé.
 *
 * Le texte nomme les saisons du produit telles qu'elles sont enregistrées :
 * il ne parle plus de « Ramadan / Aïd » pour un produit qui n'en relève
 * pas.
 */
export function seasonalNotice(
  p: Product,
  windows: SeasonWindow[],
  now: Date = new Date(),
): string | null {
  if (!p.seasonalOnly) return null;
  if (isProductAvailableNow(p, windows, now)) return null;

  const cols = (p.collections ?? []) as readonly string[];
  const noms = Array.from(new Set(cols.filter((c) => windows.some((w) => w.key === c))));
  if (noms.length === 0) return "Édition saisonnière — actuellement hors saison.";
  const liste =
    noms.length === 1
      ? nomLisible(noms[0])
      : `${noms.slice(0, -1).map(nomLisible).join(", ")} et ${nomLisible(noms[noms.length - 1])}`;
  return `Édition saisonnière — proposée pour ${liste}.`;
}
