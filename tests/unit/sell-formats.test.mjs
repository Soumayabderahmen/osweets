import assert from "node:assert/strict";
import test from "node:test";

import {
  KG_GRAM_CHOICES,
  kgOptionPrice,
  optionLabel,
  compositionSumWarning,
} from "../../src/lib/variant-label.ts";
import { currentUnitPrice } from "../../src/lib/cart-validation-pricing.ts";
import {
  displayedProductPrice,
  isProductDiscoverable,
  isProductOrderable,
  kgMainGrams,
  kgMainSelection,
  kgMainUnitLabel,
  productBlockReason,
  variantPrice,
} from "../../src/lib/product-rules.ts";
import { validateProductInput } from "../../src/lib/product-input.ts";
import { weightOptions } from "../../src/lib/weight.ts";
import {
  collectionAssociatedProducts,
  collectionCounts,
} from "../../src/lib/collection-presentation.ts";
import { optionParts } from "../../src/lib/option-parts.ts";
import {
  activeCatalogCriteria,
  isPriceFilterActive,
  readCatalogQuery,
} from "../../src/lib/catalog-query.ts";
import { compositionGramsTotal, scaleGramComposition } from "../../src/lib/composition.ts";
import { familySuggestionGroups } from "../../src/lib/family-suggestions.ts";

// ---------------------------------------------------------------- KG ------

test("kg price is always price/kg x grams/1000, for every authorised gram", () => {
  const pricePerKg = 32;
  const expected = { 100: 3.2, 200: 6.4, 250: 8, 300: 9.6, 500: 16, 750: 24, 1000: 32 };
  for (const grams of KG_GRAM_CHOICES) {
    assert.equal(kgOptionPrice(pricePerKg, grams), expected[grams]);
  }
});

test("kg server pricing recomputes from price/kg, never trusts the browser", () => {
  const row = {
    slug: "kaak-warka",
    name: "Kaak Warka",
    category: "traditionnelle",
    price: 32,
    sell_mode: "kg",
    sell_options: [
      { id: "g-100", grams: 100, piecesEstimate: null },
      { id: "g-500", grams: 500, piecesEstimate: null },
      { id: "g-1000", grams: 1000, piecesEstimate: null },
    ],
  };

  assert.deepEqual(currentUnitPrice(row, { name: row.name, variantId: "g-500" }), {
    price: 16,
    variantId: "g-500",
    variantLabel: "500 g",
  });
  assert.deepEqual(currentUnitPrice(row, { name: row.name, variantId: "g-1000" }), {
    price: 32,
    variantId: "g-1000",
    variantLabel: "1 kg",
  });

  // Un grammage jamais coché par l'administratrice (250 g) est refusé.
  const rejected = currentUnitPrice(row, { name: row.name, variantId: "g-250" });
  assert.equal(rejected.price, 0);
  assert.equal(rejected.status.code, "format_removed");
  assert.equal(rejected.status.blocking, true);
});

test("kg server pricing ignores a falsified client price entirely", () => {
  // `currentUnitPrice` ne lit jamais de champ `price` dans la ligne panier —
  // seul `variantId`/`variantLabel` sont utilisés pour retrouver l'option.
  const row = {
    slug: "kaak-warka",
    name: "Kaak Warka",
    category: "traditionnelle",
    price: 32,
    sell_mode: "kg",
    sell_options: [{ id: "g-100", grams: 100, piecesEstimate: null }],
  };
  const falsified = { name: row.name, variantId: "g-100", price: 0.01 };
  const result = currentUnitPrice(row, falsified);
  assert.equal(result.price, 3.2);
});

test("kg product with no price/kg configured yet is blocked, not free", () => {
  const row = {
    slug: "baklawa-pistache",
    name: "Baklawa Pistache",
    category: "orientale",
    price: 38, // ancien prix boîte, PAS un prix au kilo
    sell_mode: "kg",
    sell_options: [],
  };
  assert.equal(isProductOrderable({ ...row, sellMode: "kg", draft: true }).ok, false);
  assert.equal(isProductOrderable({ ...row, sellMode: "kg", draft: true }).reason, "draft");
});

test("admin changing price/kg changes every computed price — nothing stored per tier", () => {
  const optionsFor = (pricePerKg) => [
    { id: "g-100", grams: 100 },
    { id: "g-500", grams: 500 },
  ];
  const before = optionsFor(32).map((o) => kgOptionPrice(32, o.grams));
  const after = optionsFor(40).map((o) => kgOptionPrice(40, o.grams));
  assert.deepEqual(before, [3.2, 16]);
  assert.deepEqual(after, [4, 20]);
});

test("REGRESSION: displayedProductPrice ne montre plus le grammage le moins cher pour un produit kg (priorite 1kg > 500g > 100g)", () => {
  // Ancien comportement (intentionnellement change) : le prix "principal"
  // prenait le grammage le moins cher, ce qui donnait un faux effet de
  // rabais ("des 3,20 e"). La regle demandee est desormais une priorite
  // fixe : 1 kg, sinon 500 g, sinon 100 g, sinon le grammage vendu le plus
  // eleve — jamais le minimum.
  const p = {
    price: 32,
    sellMode: "kg",
    variants: [
      { id: "g-500", label: "500 g", grams: 500 },
      { id: "g-100", label: "100 g", grams: 100 },
    ],
  };
  assert.equal(displayedProductPrice(p), 16, "500 g est vendu : priorite sur 100 g");
});

// ------------------------------------------------------------ FORMAT ------

test("format option composes servesMin/Max and pieces into one label", () => {
  assert.equal(
    optionLabel({ label: "Petit format", servesMin: 4, servesMax: 6, pieces: 12 }),
    "Petit format · 4–6 personnes · 12 pièces",
  );
  assert.equal(
    optionLabel({ label: "Grand format", servesMin: 12, servesMax: 12, pieces: 24 }),
    "Grand format · 12 personnes · 24 pièces",
  );
});

test("format server pricing picks the chosen option, petit vs grand", () => {
  const row = {
    slug: "kounefa-pistache",
    name: "Kounefa Pistache",
    category: "orientale",
    price: 46, // ancien prix, ne correspond a aucune option — doit rester ignore
    sell_options: [
      { id: "petit", label: "Petit format", price: 42, servesMin: 6, servesMax: 6 },
      { id: "grand", label: "Grand format", price: 76, servesMin: 12, servesMax: 12 },
    ],
  };
  assert.deepEqual(currentUnitPrice(row, { name: row.name, variantId: "petit" }), {
    price: 42,
    variantId: "petit",
    variantLabel: "Petit format · 6 personnes",
  });
  assert.deepEqual(currentUnitPrice(row, { name: row.name, variantId: "grand" }), {
    price: 76,
    variantId: "grand",
    variantLabel: "Grand format · 12 personnes",
  });
});

test("removing a format from the back-office degrades the cart line gracefully", () => {
  const row = {
    slug: "hrisset-louz",
    name: "Hrisset Louz",
    category: "traditionnelle",
    price: 30,
    sell_options: [{ id: "petit", label: "Petit format", price: 18, servesMin: 4, servesMax: 5 }],
  };
  const result = currentUnitPrice(row, { name: row.name, variantId: "grand" });
  assert.equal(result.status.code, "format_removed");
  assert.equal(result.status.blocking, true);
});

// --------------------------------------------------------------- POT ------

test("pot option composes container name and weight", () => {
  assert.equal(optionLabel({ label: "Pot individuel", weightG: 180 }), "Pot individuel · 180 g");
  assert.equal(optionLabel({ label: "Bol familial", weightG: 500 }), "Bol familial · 500 g");
});

test("pot server pricing: 180 g and 500 g have distinct real prices", () => {
  const row = {
    slug: "assida-zgougou",
    name: "Assida Zgougou",
    category: "traditionnelle",
    price: 14,
    sell_options: [
      { id: "pot", label: "Pot individuel", weightG: 180, price: 14 },
      { id: "bol", label: "Bol familial", weightG: 500, price: 35 },
    ],
  };
  assert.equal(currentUnitPrice(row, { name: row.name, variantId: "pot" }).price, 14);
  assert.equal(currentUnitPrice(row, { name: row.name, variantId: "bol" }).price, 35);
});

test("cart keeps the exact chosen container after server revalidation", () => {
  const row = {
    slug: "assida-zgougou",
    name: "Assida Zgougou",
    category: "traditionnelle",
    price: 14,
    sell_options: [
      { id: "pot", label: "Pot individuel", weightG: 180, price: 14 },
      { id: "bol", label: "Bol familial", weightG: 500, price: 35 },
    ],
  };
  const result = currentUnitPrice(row, { name: row.name, variantId: "bol" });
  assert.equal(result.variantLabel, "Bol familial · 500 g");
  assert.equal(result.price, 35);
});

// --------------------------------------------------- Dattes Farcies Variées

test("mixed composition warns when piece counts don't add up, never invents numbers", () => {
  const consistent = {
    piecesEstimate: 24,
    composition: [
      { flavor: "Pistache et pignon", pieces: 12 },
      { flavor: "Abricot", pieces: 12 },
    ],
  };
  assert.equal(compositionSumWarning(consistent), null);

  const inconsistent = {
    piecesEstimate: 24,
    composition: [
      { flavor: "Pistache et pignon", pieces: 10 },
      { flavor: "Abricot", pieces: 10 },
    ],
  };
  assert.match(compositionSumWarning(inconsistent), /ne correspond pas/);

  // Sans piecesEstimate ni composition, aucun avertissement invente de chiffre.
  assert.equal(compositionSumWarning({}), null);
});

// -------------------------------------------------------- variantPrice ----

test("variantPrice resolves kg from price/kg, and format/pot from their own stored price", () => {
  const kg = { price: 32, sellMode: "kg" };
  assert.equal(variantPrice(kg, { id: "g-500", label: "500 g", grams: 500 }), 16);

  const format = { price: 999, sellMode: "format" };
  assert.equal(variantPrice(format, { id: "petit", label: "Petit format", price: 42 }), 42);
});

// --------------------------------------- visibilite vs commandabilite -----

test("REGRESSION: a published, non-draft kg product with no price/kg is 'no_price', never 'draft'", () => {
  const p = {
    price: 38,
    sellMode: "kg",
    variants: [],
    published: true,
    draft: false,
    archived: false,
  };
  const { ok, reason } = isProductOrderable(p);
  assert.equal(ok, false);
  assert.equal(reason, "no_price");
  assert.notEqual(reason, "draft");
});

test("REGRESSION: server validateProductInput no longer requires a stored price on a kg grammage", () => {
  const input = {
    sell_mode: "kg",
    sell_options: [
      { id: "g-1000", label: "1 kg", grams: 1000 },
      { id: "g-500", label: "500 g", grams: 500 },
    ],
    published: true,
    draft: false,
  };
  // Ne doit PAS lever "doit avoir un prix supérieur à 0 €" : c'est le bug
  // rapporté ("Le format « 1 kg » doit avoir un prix supérieur à 0 €.").
  const out = validateProductInput(input, []);
  assert.equal(out.sell_options.length, 2);
});

test("REGRESSION: server validateProductInput still requires a price for format/pot options", () => {
  assert.throws(
    () =>
      validateProductInput(
        { sell_mode: "format", sell_options: [{ id: "petit", label: "Petit format" }] },
        [],
      ),
    /doit avoir un prix supérieur à 0/,
  );
  assert.throws(
    () =>
      validateProductInput(
        { sell_mode: "pot", sell_options: [{ id: "pot", label: "Pot individuel", price: 14 }] },
        [],
      ),
    /doit avoir un poids/,
  );
});

test("REGRESSION: validateProductInput rejects an invalid kg grammage (0 or negative)", () => {
  assert.throws(
    () =>
      validateProductInput(
        { sell_mode: "kg", sell_options: [{ id: "g-0", label: "0 g", grams: 0 }] },
        [],
      ),
    /grammage.*invalide/i,
  );
});

test("REGRESSION: a 'no_price' sibling is still discoverable (autres parfums), a draft/archived one is not", () => {
  const pending = {
    published: true,
    draft: false,
    archived: false,
    sellMode: "kg",
    price: 0,
    variants: [],
  };
  const draft = { published: true, draft: true, archived: false, price: 10 };
  const archived = { published: true, draft: false, archived: true, price: 10 };
  const unpublished = { published: false, draft: false, archived: false, price: 10 };

  assert.equal(productBlockReason(pending), "no_price");
  assert.equal(isProductDiscoverable(pending), true, "no_price sibling must stay discoverable");
  assert.equal(isProductDiscoverable(draft), false, "a real draft must not be suggested");
  assert.equal(isProductDiscoverable(archived), false, "an archived product must not be suggested");
  assert.equal(
    isProductDiscoverable(unpublished),
    false,
    "an unpublished product must not be suggested",
  );
});

test("REGRESSION: Dattes Farcies Variees is a legitimate sibling of a simple flavour via family only", () => {
  const variees = {
    slug: "dattes-farcies-variees",
    family: "dattes-farcies",
    flavorLabel: undefined,
    published: true,
    draft: false,
    archived: false,
    price: 0,
    sellMode: "kg",
    variants: [],
  };
  const abricot = {
    slug: "dattes-farcies-abricot",
    family: "dattes-farcies",
    flavorLabel: "Abricot",
    published: true,
    draft: false,
    archived: false,
    price: 0,
    sellMode: "kg",
    variants: [],
  };
  // familySiblings() ne filtre que par `family` + published — verifie juste
  // que les deux se qualifient bien comme decouvrables l'un pour l'autre.
  assert.equal(isProductDiscoverable(variees), true);
  assert.equal(isProductDiscoverable(abricot), true);
  assert.equal(variees.family, abricot.family);
});

test("REGRESSION: a kg product with no sell_options never falls back to the legacy weight generator", () => {
  // Bug reel trouve en recette : Bechkoutou (sellMode kg, sell_options vides,
  // ancien weight='300 g', price=26 conserve pour tracabilite) affichait un
  // faux selecteur 300g/500g/1kg a 26/43,33/86,67 EUR calcule depuis
  // l'ancien poids produit, alors qu'aucun grammage n'est autorise.
  const bechkoutou = {
    price: 26,
    weight: "300 g",
    category: "traditionnelle",
    sellMode: "kg",
    variants: undefined,
  };
  assert.deepEqual(weightOptions(bechkoutou), []);
});

test("REGRESSION: aucun format n'est jamais invente, quel que soit le mode de vente", () => {
  // Verrouille l'exigence « aucun format invente » pour les TROIS modes :
  // une facon de vendre choisie en back-office interdit definitivement le
  // generateur automatique base sur l'ancien champ texte `weight`, meme
  // quand la configuration commerciale n'est pas encore faite.
  for (const sellMode of ["kg", "format", "pot"]) {
    assert.deepEqual(
      weightOptions({
        price: 26,
        weight: "300 g",
        category: "traditionnelle",
        sellMode,
        variants: undefined,
      }),
      [],
      `mode ${sellMode} : aucun grammage ne doit etre fabrique automatiquement`,
    );
  }
  // Sans mode de vente (fiches historiques du catalogue statique), l'ancien
  // generateur reste actif : c'est le seul cas ou il a encore le droit de
  // proposer quelque chose.
  const historique = weightOptions({
    price: 26,
    weight: "500 g",
    category: "traditionnelle",
    sellMode: "",
    variants: undefined,
  });
  assert.ok(historique.length > 0, "une fiche sans mode de vente garde son comportement d'avant");
});

test("REGRESSION: option.label from catalog.ts is already composed — calling optionLabel() on it again must never be needed", () => {
  // Bug reel trouve en recette : Cheese-cake Kounefa (petit format,
  // servesMin=4, servesMax=6, pieces=4) affichait
  // "Petit format · 4-6 personnes · 4 pièces · 4 pièces" (pièces en double)
  // sur la fiche et en QuickView, parce que ces deux ecrans appelaient
  // optionLabel(v) une seconde fois sur un `v.label` deja compose par
  // rowToProduct() (src/lib/catalog.ts). Preuve du risque, documentee :
  const raw = { id: "petit", label: "Petit format", servesMin: 4, servesMax: 6, pieces: 4 };
  const composedOnce = optionLabel(raw);
  assert.equal(composedOnce, "Petit format · 4–6 personnes · 4 pièces");

  const composedTwice = optionLabel({ ...raw, label: composedOnce });
  assert.notEqual(
    composedTwice,
    composedOnce,
    "un second passage dans optionLabel() duplique bien la mention des pièces : c'est pour ça qu'il ne faut jamais l'appeler sur un label deja compose (utiliser directement v.label)",
  );
  assert.match(composedTwice, /pièces.*pièces/);
});

test("REGRESSION: a stale legacy `variants` snapshot (no weightG) must never block saving current sell_options", () => {
  // Bug reel trouve en recette : Bouza avait un ancien `variants` fige
  // (label "Pot individuel · 180 g", pas de weightG separe — forme
  // d'avant la restructuration). Comme le serveur fusionne la ligne
  // existante avec les valeurs soumises, `combined.variants` restait
  // present meme si le formulaire ne soumet plus jamais `variants`. La
  // validation traitait alors CETTE colonne obsolete, la trouvait
  // incomplete (pas de weightG), et bloquait la sauvegarde d'un
  // sell_options pourtant parfaitement valide.
  const input = {
    sell_mode: "pot",
    sell_options: [
      { id: "pot", label: "Pot individuel", price: 12, weightG: 180 },
      { id: "bol", label: "Bol familial", price: 30.01, weightG: 500 },
    ],
    variants: [
      { id: "pot", label: "Pot individuel · 180 g", price: 12 },
      { id: "bol", label: "Bol familial · 500 g", price: 30 },
    ],
  };
  const out = validateProductInput(input, []);
  assert.equal(out.sell_options.length, 2);
  assert.equal(out.sell_options[1].price, 30.01);
  // `variants` n'est pas revalide ni retouche : il repasse tel quel.
  assert.deepEqual(out.variants, input.variants);
});

// ------------------------------------------------- PRIX PRINCIPAL KG ------

test("kgMainGrams : priorite 1 kg > 500 g > 100 g > grammage le plus eleve", () => {
  assert.equal(kgMainGrams([100, 500, 1000]), 1000);
  assert.equal(kgMainGrams([100, 500]), 500);
  assert.equal(kgMainGrams([100]), 100);
  assert.equal(
    kgMainGrams([250, 750]),
    750,
    "aucun de 1kg/500g/100g : repli deterministe sur le plus eleve vendu",
  );
  assert.equal(kgMainGrams([]), null);
});

test("kgMainUnitLabel : /kg pour 1000 g, / <n> g sinon", () => {
  assert.equal(kgMainUnitLabel(1000), "/kg");
  assert.equal(kgMainUnitLabel(500), "/ 500 g");
  assert.equal(kgMainUnitLabel(250), "/ 250 g");
});

test("REGRESSION: le prix principal kg n'est plus jamais le grammage le moins cher (ex-bug du 'des 3,20 e')", () => {
  const product = {
    sellMode: "kg",
    price: 32,
    variants: [
      { id: "g-100", grams: 100 },
      { id: "g-500", grams: 500 },
      { id: "g-1000", grams: 1000 },
    ],
  };
  const main = kgMainSelection(product);
  assert.equal(main.grams, 1000);
  assert.equal(main.price, 32);
  assert.equal(
    displayedProductPrice(product),
    32,
    "displayedProductPrice() doit refleter la meme priorite, partout ou elle est utilisee",
  );
});

test("kgMainSelection renvoie null sans grammage coche ou sans prix/kg", () => {
  assert.equal(kgMainSelection({ sellMode: "kg", price: 32, variants: [] }), null);
  assert.equal(kgMainSelection({ sellMode: "kg", price: 0, variants: [{ grams: 500 }] }), null);
});

test("REGRESSION: le prix naturel 0 -> max collection n'est pas un filtre actif", () => {
  const bounds = { min: 0, max: 42 };
  const initial = readCatalogQuery(undefined, bounds);
  assert.equal(initial.priceMin, 0);
  assert.equal(initial.priceMax, 42);
  assert.equal(isPriceFilterActive(initial, bounds), false);
  assert.equal(activeCatalogCriteria(initial, bounds), 0);
  const changed = { ...initial, priceMax: 30, priceTouched: true };
  assert.equal(isPriceFilterActive(changed, bounds), true);
  assert.equal(activeCatalogCriteria(changed, bounds), 1);
});

test("REGRESSION: la composition 1 kg produit toujours un total entier exact", () => {
  const reference = [
    { flavor: "A", grams: 333 },
    { flavor: "B", grams: 333 },
    { flavor: "C", grams: 334 },
  ];
  assert.equal(compositionGramsTotal(reference), 1000);
  for (const target of [100, 250, 500, 750, 1000]) {
    assert.equal(compositionGramsTotal(scaleGramComposition(reference, target)), target);
  }
  assert.deepEqual(
    scaleGramComposition(
      [
        { flavor: "A", grams: 200 },
        { flavor: "B", grams: 800 },
      ],
      500,
    ),
    [
      { flavor: "A", grams: 100 },
      { flavor: "B", grams: 400 },
    ],
  );
});

test("REGRESSION: le serveur refuse une composition d'assortiment différente de 1000 g", () => {
  assert.throws(
    () => validateProductInput({ assortment_composition: [{ flavor: "Abricot", grams: 999 }] }, []),
    /exactement 1000 g/,
  );
  const valid = validateProductInput(
    {
      assortment_composition: [
        { flavor: "Abricot", grams: 400 },
        { flavor: "Noix", grams: 600 },
      ],
    },
    [],
  );
  assert.equal(compositionGramsTotal(valid.assortment_composition), 1000);
});

test("REGRESSION: un assortiment sans composition 1 kg reste visible mais non commandable", () => {
  const pending = {
    published: true,
    draft: false,
    archived: false,
    productType: "assortiment",
    assortmentComposition: [],
    sellMode: "kg",
    price: 55,
    variants: [{ id: "g-1000", grams: 1000 }],
  };
  assert.equal(isProductDiscoverable(pending), true);
  assert.equal(isProductOrderable(pending).reason, "no_price");
  assert.equal(
    isProductOrderable({ ...pending, assortmentComposition: [{ flavor: "A", grams: 1000 }] }).ok,
    true,
  );
});

test("REGRESSION: Kounefa sépare même type/autre parfum et autres types", () => {
  const current = produit({
    slug: "kechda-pistache",
    family: "kounefa",
    productType: "kechda",
    flavorLabel: "Pistache",
  });
  const same = produit({
    slug: "kechda-noisette",
    family: "kounefa",
    productType: "kechda",
    flavorLabel: "Noisette",
  });
  const other = produit({ slug: "fromage", family: "kounefa", productType: "fromage" });
  const duplicateType = produit({
    slug: "fromage-2",
    family: "kounefa",
    productType: "fromage",
    flavorLabel: "Noisette",
  });
  const hidden = produit({
    slug: "draft",
    family: "kounefa",
    productType: "chocolat",
    draft: true,
  });
  const groups = familySuggestionGroups(current, [current, same, other, duplicateType, hidden]);
  assert.deepEqual(
    groups.sameType.map((p) => p.slug),
    ["kechda-noisette"],
  );
  assert.deepEqual(
    groups.otherTypes.map((p) => p.slug),
    ["fromage"],
  );
});

// ------------------------------------------------- COLLECTIONS ------------

function produit(overrides) {
  return {
    id: overrides.slug,
    slug: overrides.slug,
    name: overrides.slug,
    category: "traditionnelle",
    price: 0,
    image: "",
    shortDesc: "",
    description: "",
    composition: [],
    ingredients: [],
    allergens: [],
    conservation: "",
    collections: ["tradition"],
    published: true,
    draft: false,
    archived: false,
    ...overrides,
  };
}

test("REGRESSION: collectionAssociatedProducts liste TOUS les produits associes, y compris archives/brouillon", () => {
  const produits = [
    produit({ slug: "a" }),
    produit({ slug: "b", archived: true }),
    produit({ slug: "c", draft: true }),
    produit({ slug: "d", collections: ["autre-collection"] }),
  ];
  const associes = collectionAssociatedProducts(produits, "tradition");
  assert.deepEqual(
    associes.map((p) => p.slug).sort(),
    ["a", "b", "c"],
    "le produit archive et le brouillon restent associes : seul 'd' (autre collection) est exclu",
  );
});

test("REGRESSION: collectionCounts distingue associes/publies/visibles/archives sans jamais se contredire avec le panneau admin", () => {
  const produits = [
    produit({ slug: "a" }), // publie, visible
    produit({ slug: "b", archived: true }), // archive : associe, mais ni publie ni visible
    produit({ slug: "c", draft: true }), // brouillon : associe, ni publie ni visible
    produit({ slug: "d", price: 0 }), // publie sans prix : compte quand meme comme publie+visible ("Tarif a venir")
  ];
  const counts = collectionCounts(produits, "tradition", []);
  assert.equal(counts.associated, 4);
  assert.equal(counts.archived, 1);
  assert.equal(counts.published, 2, "'a' et 'd' : publies, non brouillon, non archives");
  assert.equal(counts.visible, 2);
});

// ------------------------------------- SELECTEUR PARTAGE (QuickView = fiche) --

test("optionParts kg : titre = grammage, detail = estimation de pieces si elle existe", () => {
  assert.deepEqual(optionParts({ sellMode: "kg" }, { id: "g-500", label: "500 g", grams: 500 }), {
    title: "500 g",
    details: [],
  });
  assert.deepEqual(
    optionParts(
      { sellMode: "kg" },
      { id: "g-500", label: "500 g", grams: 500, piecesEstimate: 24 },
    ),
    { title: "500 g", details: ["≈ 24 pièces"] },
  );
});

test("optionParts format : titre = nom seul, details = personnes puis pieces", () => {
  const v = {
    id: "petit",
    // `label` est le libelle COMPOSE fabrique par rowToProduct()
    label: "Petit format · 4–6 personnes · 6 pièces",
    baseLabel: "Petit format",
    servesMin: 4,
    servesMax: 6,
    pieces: 6,
    price: 18,
  };
  assert.deepEqual(optionParts({ sellMode: "format" }, v), {
    title: "Petit format",
    details: ["4–6 personnes", "6 pièces"],
  });
});

test("optionParts pot : titre = nom du contenant, detail = poids", () => {
  const v = {
    id: "pot",
    label: "Pot individuel · 180 g",
    baseLabel: "Pot individuel",
    weightG: 180,
    price: 12,
  };
  assert.deepEqual(optionParts({ sellMode: "pot" }, v), {
    title: "Pot individuel",
    details: ["180 g"],
  });
});

test("REGRESSION: sans baseLabel (fiches statiques), optionParts retombe sur le libelle sans jamais le redecouper", () => {
  const v = { id: "x", label: "Format unique", price: 10 };
  assert.equal(optionParts({ sellMode: "format" }, v).title, "Format unique");
});

test("REGRESSION: le titre affiche ne duplique jamais les mentions deja presentes dans le libelle compose", () => {
  const v = {
    id: "petit",
    label: "Petit format · 4–6 personnes · 6 pièces",
    baseLabel: "Petit format",
    servesMin: 4,
    servesMax: 6,
    pieces: 6,
  };
  const { title, details } = optionParts({ sellMode: "format" }, v);
  assert.equal(title.includes("personnes"), false, "le titre ne reprend pas les details");
  assert.equal(
    `${title} ${details.join(" ")}`.match(/pièces/g).length,
    1,
    "une seule mention des pieces au total",
  );
});
