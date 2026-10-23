/**
 * « Composition » et « Ingrédients » n'en font plus qu'un.
 *
 * La fiche affichait deux blocs que rien ne distinguait vraiment : d'un
 * côté « Semoule de blé dur, Pâte de dattes deglet nour, Sirop miel », de
 * l'autre « Semoule, Dattes, Huile, Miel, Cannelle ». La cliente lisait
 * deux fois la même chose, en moins précis la seconde fois, et pouvait
 * croire à deux listes différentes.
 *
 * Les deux colonnes restent en base — on ne jette pas ce qui a été saisi.
 * C'est l'affichage qui les réunit, en gardant l'entrée la plus précise
 * quand deux se recouvrent.
 */

/**
 * Casse, accents, ponctuation et pluriels mis de côté.
 *
 * Le pluriel compte : « Amandes » et « Amande entière » désignent la même
 * chose, et sans cette réduction la liste aurait affiché les deux.
 */
function normaliser(v: string): string {
  return v
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim()
    .split(" ")
    .map((mot) => (mot.length > 3 && mot.endsWith("s") ? mot.slice(0, -1) : mot))
    .join(" ");
}

/**
 * `b` dit-il la même chose que `a`, en plus court ?
 *
 * « Semoule » face à « Semoule de blé dur » : oui — on garde le second.
 * « Miel » face à « Sirop miel » : oui également. On exige des mots
 * entiers, pour que « ail » ne se fasse pas absorber par « aïoli ».
 */
function contenuDans(court: string, long: string): boolean {
  if (court === long) return true;
  if (court.length >= long.length) return false;
  return new RegExp(`(^| )${court.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}( |$)`).test(long);
}

/**
 * Une seule liste, la plus précise possible.
 *
 * L'ordre de `composition` est conservé — c'est la liste rédigée — puis
 * viennent les ingrédients qu'elle ne mentionnait pas.
 */
export function mergeComposition(
  composition: readonly string[] = [],
  ingredients: readonly string[] = [],
): string[] {
  const brut = [...composition, ...ingredients].map((v) => (v ?? "").trim()).filter(Boolean);

  const gardees: { texte: string; cle: string }[] = [];
  for (const texte of brut) {
    const cle = normaliser(texte);
    if (!cle) continue;

    // Une entrée déjà couverte, en plus détaillé, n'apporte rien.
    if (gardees.some((g) => contenuDans(cle, g.cle))) continue;

    // À l'inverse, une entrée plus précise remplace celles qu'elle englobe.
    const remplacees = gardees.filter((g) => contenuDans(g.cle, cle));
    for (const r of remplacees) gardees.splice(gardees.indexOf(r), 1);

    gardees.push({ texte, cle });
  }
  return gardees.map((g) => g.texte);
}

export interface GramCompositionItem {
  flavor: string;
  grams: number;
}

export function compositionGramsTotal(items: readonly GramCompositionItem[]): number {
  return items.reduce((sum, item) => sum + item.grams, 0);
}

/**
 * Met une composition de référence 1 kg à l'échelle d'un grammage vendu.
 * La méthode des plus grands restes garantit un total entier exact, même
 * lorsque les proportions produisent des décimales.
 */
export function scaleGramComposition(
  reference: readonly GramCompositionItem[],
  targetGrams: number,
): GramCompositionItem[] {
  if (
    compositionGramsTotal(reference) !== 1000 ||
    !Number.isInteger(targetGrams) ||
    targetGrams <= 0
  ) {
    return [];
  }
  const raw = reference.map((item, index) => {
    const exact = (item.grams * targetGrams) / 1000;
    return { ...item, index, grams: Math.floor(exact), remainder: exact - Math.floor(exact) };
  });
  const missing = targetGrams - raw.reduce((sum, item) => sum + item.grams, 0);
  const priority = [...raw].sort((a, b) => b.remainder - a.remainder || a.index - b.index);
  for (let i = 0; i < missing; i++) priority[i % priority.length].grams += 1;
  return raw.map(({ flavor, grams }) => ({ flavor, grams }));
}
