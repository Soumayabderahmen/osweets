import type { ProductInput } from "./catalog";
import { parseFrenchPrice } from "./admin-values.ts";

export function validateProductInput(
  input: ProductInput,
  seasonKeys: readonly string[],
): ProductInput {
  const values = { ...input };
  if (values.price !== undefined) {
    const price = parseFrenchPrice(String(values.price));
    if (price === null || !Number.isFinite(price) || price < 0) throw new Error("Prix invalide.");
    values.price = price;
  }
  const isKg = values.sell_mode === "kg";
  if (values.assortment_composition !== undefined) {
    if (!Array.isArray(values.assortment_composition)) {
      throw new Error("Composition de l'assortiment invalide.");
    }
    const seen = new Set<string>();
    values.assortment_composition = values.assortment_composition.map((item) => {
      const flavor = item?.flavor?.trim();
      const grams = Number(item?.grams);
      if (
        !flavor ||
        seen.has(flavor.toLocaleLowerCase("fr")) ||
        !Number.isInteger(grams) ||
        grams <= 0
      ) {
        throw new Error(
          "Chaque parfum de l'assortiment doit être unique et avoir un poids entier positif.",
        );
      }
      seen.add(flavor.toLocaleLowerCase("fr"));
      return { flavor, grams };
    });
    if (values.assortment_composition.length) {
      const total = values.assortment_composition.reduce((sum, item) => sum + item.grams, 0);
      if (total !== 1000)
        throw new Error(
          `La composition de référence doit totaliser exactement 1000 g (actuellement ${total} g).`,
        );
    }
  }
  /*
   * Uniquement `sell_options` : c'est la seule source de vérité pour les
   * formats/pots/grammages désormais. L'ancienne colonne `variants` n'est
   * plus jamais soumise par le back-office (voir panels.tsx), mais reste
   * présente sur les fiches enregistrées avant ce chantier — avec une
   * forme différente (ex. poids encore fondu dans le libellé, pas de
   * `weightG` séparé). La valider ici la bloquerait pour rien : elle n'est
   * de toute façon jamais réécrite (absente des colonnes soumises), donc
   * la valider ne fait qu'empêcher de sauvegarder `sell_options` à cause
   * d'une donnée legacy qui ne sera pas persistée.
   */
  for (const key of ["sell_options"] as const) {
    const options = values[key];
    if (options == null) continue;
    if (!Array.isArray(options)) throw new Error("Formats invalides.");
    const ids = new Set<string>();
    values[key] = options.map((option) => {
      if (
        !option ||
        typeof option.id !== "string" ||
        !option.id.trim() ||
        ids.has(option.id.trim())
      ) {
        throw new Error("Chaque format doit avoir un identifiant unique et non vide.");
      }
      ids.add(option.id.trim());
      // Masqué : le format reste en base mais n'est pas proposé. Il peut
      // donc attendre son prix ; un format VISIBLE, lui, doit être complet.
      const hidden = option.hidden === true;

      // Mode kg : le prix d'un palier se calcule depuis le prix au kilo
      // (`values.price`) × grammes / 1000, sauf prix saisi à la main
      // (`manualPrice`). L'ancien champ `price` n'est jamais conservé.
      if (isKg) {
        const grams = Number(option.grams);
        if (!Number.isFinite(grams) || grams <= 0) {
          throw new Error("Un grammage coché est invalide.");
        }
        let manualPrice: number | null = null;
        if (option.manualPrice != null && String(option.manualPrice).trim() !== "") {
          manualPrice = parseFrenchPrice(String(option.manualPrice));
          if (manualPrice === null || !Number.isFinite(manualPrice) || manualPrice <= 0) {
            throw new Error("Un prix saisi à la main doit être supérieur à 0 €.");
          }
        }
        const { price: _storedKgPrice, ...withoutStoredPrice } = option;
        return {
          ...withoutStoredPrice,
          id: option.id.trim(),
          label: option.label?.trim() || "",
          manualPrice,
          hidden,
        };
      }

      if (!option.label?.trim()) throw new Error("Chaque format doit avoir un nom.");
      const parsed = parseFrenchPrice(String(option.price ?? ""));
      const price = parsed !== null && Number.isFinite(parsed) && parsed > 0 ? parsed : 0;
      if (!hidden && price <= 0) {
        throw new Error(
          `Le format « ${option.label} » doit avoir un prix supérieur à 0 € pour être affiché — masquez-le en attendant.`,
        );
      }
      // Contenant : le poids est facultatif (une verrine se vend souvent sans grammage).
      if (values.sell_mode === "pot" && option.weightG != null && String(option.weightG) !== "") {
        const weightG = Number(option.weightG);
        if (!Number.isFinite(weightG) || weightG <= 0) {
          throw new Error(`Le poids du contenant « ${option.label} » est invalide.`);
        }
      }
      if (values.sell_mode === "format") {
        const min = option.servesMin;
        const max = option.servesMax;
        if (min != null && max != null && Number(min) > Number(max)) {
          throw new Error(
            `« ${option.label} » : le nombre de personnes minimum dépasse le maximum.`,
          );
        }
      }
      return { ...option, id: option.id.trim(), label: option.label.trim(), price, hidden };
    });
  }
  /*
   * Volontairement AUCUN blocage ici si le prix/kg ou les formats manquent :
   * un produit publié dont la configuration commerciale n'est pas encore
   * complète reste PUBLIÉ. Ce n'est pas une raison de forcer un brouillon.
   * La boutique l'affiche avec un statut « Tarif à venir » et bloque
   * l'ajout au panier côté front — voir `productBlockReason` (raison
   * "no_price") dans `product-rules.ts`. On ne réécrit plus `draft` ici.
   */
  if (values.seasonal_only && !values.collections?.some((key) => seasonKeys.includes(key))) {
    throw new Error("Associez ce produit saisonnier à une collection liée à un calendrier.");
  }
  if ((values.local_only || values.requires_cold) && values.ship_national) {
    throw new Error(
      "Un produit réservé à la livraison locale ou nécessitant du froid ne peut pas être expédié en France.",
    );
  }
  return values;
}
