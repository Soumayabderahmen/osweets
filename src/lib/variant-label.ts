/**
 * Source unique de vérité pour les libellés de conditionnement.
 *
 * Les variantes servent aussi bien aux parfums qu'aux formats
 * (pot, bol, grand format, 12 personnes, 500 g…) et la vente au poids
 * propose 500 g / 1 kg. Fiche produit, aperçu rapide, panier, checkout et
 * confirmation de commande passent tous par ce module : impossible de
 * diverger d'un écran à l'autre.
 */
import { formatGrams } from "./weight.ts";

const FORMAT_RE =
  /format|personne|part\b|taille|grand|petit|bol|pot|verrine|plateau|coffret|kg|\bg\b/i;

/**
 * Grammages proposables en mode `kg` — la seule liste que l'administratrice
 * peut cocher/décocher. Le front n'en invente jamais d'autres.
 */
export const KG_GRAM_CHOICES = [100, 200, 250, 300, 500, 750, 1000] as const;

/**
 * Prix d'un palier `kg`, TOUJOURS calculé depuis le prix au kilo — jamais
 * stocké, pour ne jamais pouvoir se désynchroniser.
 */
export function kgOptionPrice(pricePerKg: number, grams: number): number {
  return Math.round(((pricePerKg * grams) / 1000) * 100) / 100;
}

/**
 * Mélange (ex. Dattes Farcies Variées) : si `piecesEstimate` est renseigné,
 * la somme des pièces de la composition doit lui correspondre. Ne renvoie
 * qu'un avertissement — jamais un blocage — et jamais de nombre inventé.
 */
export function compositionSumWarning(option: {
  piecesEstimate?: number | null;
  composition?: { flavor: string; pieces: number }[] | null;
}): string | null {
  if (!option.piecesEstimate || !option.composition?.length) return null;
  const total = option.composition.reduce((sum, c) => sum + (c.pieces || 0), 0);
  if (total !== option.piecesEstimate) {
    return `La composition (${total} pièces) ne correspond pas au total annoncé (${option.piecesEstimate} pièces).`;
  }
  return null;
}

export function optionLabel(option: {
  label: string;
  serves?: string;
  servesMin?: number | null;
  servesMax?: number | null;
  pieces?: number | null;
  weightG?: number | null;
}): string {
  const parts = [option.label];
  const alreadyMentionsPersonnes = /personne|part\b/i.test(option.label);
  if (option.servesMin != null && !alreadyMentionsPersonnes) {
    const range =
      option.servesMax != null && option.servesMax !== option.servesMin
        ? `${option.servesMin}–${option.servesMax}`
        : `${option.servesMin}`;
    parts.push(`${range} personnes`);
  } else if (!alreadyMentionsPersonnes) {
    const serves = option.serves?.trim();
    if (serves) parts.push(`Pour ${serves} personnes`);
  }
  if (option.pieces) parts.push(`${option.pieces} pièces`);
  if (option.weightG && !/\bg\b|kg/i.test(option.label)) parts.push(`${option.weightG} g`);
  return parts.join(" · ");
}

export const FORMAT_CHOICE_LABEL = "Choisissez votre format";
export const FLAVOR_CHOICE_LABEL = "Choisissez un parfum";
export const QUANTITY_CHOICE_LABEL = "Choisissez la quantité";
export const POT_CHOICE_LABEL = "Choisissez votre contenant";

/**
 * Libellé imposé par la façon de vendre choisie en back-office.
 * C'est elle qui fait autorité ; la lecture du texte ci-dessous n'est plus
 * qu'un repli pour les fiches du catalogue statique, qui n'ont pas de mode.
 */
export const SELL_MODE_LABEL: Record<"kg" | "format" | "pot", string> = {
  kg: QUANTITY_CHOICE_LABEL,
  format: FORMAT_CHOICE_LABEL,
  pot: POT_CHOICE_LABEL,
};

export const isFormatVariants = (variants?: { label: string }[]) =>
  !!variants?.some((v) => FORMAT_RE.test(v.label));

/**
 * Libellé du sélecteur de variantes.
 *
 * `sellMode` est la décision de l'administratrice : elle l'emporte toujours.
 * Sans elle — fiches du catalogue statique — on retombe sur la lecture du
 * texte, avec ses approximations connues.
 */
export const variantChoiceLabel = (
  variants?: { label: string }[],
  sellMode?: "" | "kg" | "format" | "pot",
) =>
  sellMode
    ? SELL_MODE_LABEL[sellMode]
    : isFormatVariants(variants)
      ? FORMAT_CHOICE_LABEL
      : FLAVOR_CHOICE_LABEL;

/**
 * Libellé du sélecteur affiché pour un produit donné.
 * Uniformisation automatique : variantes → format/parfum, sinon poids.
 */
export function selectorLabel(input: {
  variants?: { label: string }[];
  weightOptions?: unknown[];
  /** Façon de vendre décidée en back-office — prioritaire sur toute déduction. */
  sellMode?: "" | "kg" | "format" | "pot";
}): string | null {
  if (input.sellMode && input.variants?.length) return SELL_MODE_LABEL[input.sellMode];
  if (input.variants?.length) return variantChoiceLabel(input.variants);
  if ((input.weightOptions?.length ?? 0) > 1) return QUANTITY_CHOICE_LABEL;
  return null;
}

export interface PackagingInput {
  variants?: { label: string }[];
  /** Variante retenue (format ou parfum). */
  variantLabel?: string | null;
  /** Grammage retenu (500 g / 1 kg) lorsqu'il n'y a pas de variantes. */
  weightLabel?: string | null;
  weight?: string | null;
  pieces?: number | null;
  unit?: string | null;
}

/**
 * Détail du conditionnement à afficher.
 * Règle métier : sur un produit vendu au format (pot, bol, 12 personnes…),
 * c'est le format choisi qui fait foi — ni grammage ni nombre de pièces.
 */
export function packagingParts(input: PackagingInput): string[] {
  if (input.variants?.length) return input.variantLabel ? [input.variantLabel] : [];
  return [
    input.weightLabel || input.weight || null,
    input.pieces ? `${input.pieces} pièces` : null,
    !input.weight && !input.pieces && input.unit ? input.unit : null,
  ].filter(Boolean) as string[];
}

export const packagingText = (input: PackagingInput) => packagingParts(input).join(" · ");

/**
 * Conditionnement d'une ligne panier — même rendu dans le tiroir, le panier,
 * le récapitulatif du checkout et la confirmation de commande.
 */
export const cartPackaging = (item: { variantLabel?: string; unit?: string }) =>
  [item.variantLabel, item.unit].filter(Boolean).join(" · ");

export interface PackagingAudit {
  /** Libellé du sélecteur imposé au front (null = aucun choix à faire). */
  selector: string | null;
  /** Le grammage et le nombre de pièces sont masqués (vente au format). */
  hidesMeasures: boolean;
  /** Aperçu du conditionnement affiché tant qu'aucun choix n'est fait. */
  preview: string;
  warnings: string[];
}

/**
 * Validation partagée fiche / aperçu rapide / panier / back-office.
 * Un seul calcul décide du libellé et signale les fiches incohérentes
 * (formats et parfums mélangés, prix manquant, grammage inutile…).
 */
export function auditPackaging(input: {
  variants?: { id?: string; label: string; price?: number | null }[] | null;
  weightOptions?: unknown[];
  weight?: string | null;
  pieces?: number | null;
  unit?: string | null;
  /** Mode `kg` : validation dédiée (grammes, pas de libellé/prix par option). */
  sellMode?: "" | "kg" | "format" | "pot";
  pricePerKg?: number | null;
}): PackagingAudit {
  const variants = input.variants ?? [];

  if (input.sellMode === "kg") {
    const warnings: string[] = [];
    const grams = (variants as { grams?: number }[]).map((v) => v.grams ?? 0);
    if (!grams.length) warnings.push("Aucun grammage coché : rien n'est vendable pour l'instant.");
    if (grams.some((g) => !g || g <= 0)) warnings.push("Un grammage est invalide.");
    if (new Set(grams).size !== grams.length) warnings.push("Deux paliers ont le même grammage.");
    if (!input.pricePerKg || input.pricePerKg <= 0)
      warnings.push("Le prix au kilo doit être renseigné et supérieur à 0 € pour vendre.");
    return {
      selector: grams.length ? QUANTITY_CHOICE_LABEL : null,
      hidesMeasures: true,
      preview: grams
        .slice()
        .sort((a, b) => a - b)
        .map((g) => formatGrams(g))
        .join(" · "),
      warnings,
    };
  }

  const warnings: string[] = [];
  const formats = variants.filter((v) => FORMAT_RE.test(v.label));

  if (variants.length && formats.length && formats.length !== variants.length) {
    warnings.push(
      "Formats et parfums sont mélangés : le site affichera « " +
        FORMAT_CHOICE_LABEL +
        " ». Séparez-les en deux fiches pour rester clair.",
    );
  }
  if (variants.some((v) => !v.label.trim())) warnings.push("Une variante n'a pas de libellé.");
  if (variants.some((v) => !v.price)) warnings.push("Une variante n'a pas de prix.");
  const extended = variants as ((typeof variants)[number] & {
    weightG?: number | null;
    servesMin?: number | null;
    servesMax?: number | null;
  })[];
  if (input.sellMode === "pot" && extended.some((v) => !v.weightG))
    warnings.push("Un contenant n'a pas de poids/contenance.");
  if (
    input.sellMode === "format" &&
    extended.some((v) => {
      if (v.servesMin == null || v.servesMax == null) return false;
      return v.servesMin > v.servesMax;
    })
  )
    warnings.push("Le nombre de personnes minimum dépasse le maximum sur un format.");
  if (formats.length && (input.weight || input.pieces)) {
    warnings.push(
      "Vente au format : le grammage et le nombre de pièces ne seront pas affichés sur la fiche.",
    );
  }

  return {
    selector: selectorLabel({ variants, weightOptions: input.weightOptions }),
    hidesMeasures: variants.length > 0,
    preview: packagingText({
      variants,
      variantLabel: null,
      weight: input.weight,
      pieces: input.pieces,
      unit: input.unit,
    }),
    warnings,
  };
}
