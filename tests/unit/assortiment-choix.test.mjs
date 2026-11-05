import assert from "node:assert/strict";
import test from "node:test";

import {
  decoderChoix,
  encoderChoix,
  parfumsAssortiment,
  portionsPour,
  verifierChoix,
} from "../../src/lib/assortiment-choix.ts";
import { currentUnitPrice } from "../../src/lib/cart-validation-pricing.ts";

const composition = [
  { flavor: "Pistache et pignon", grams: 200 },
  { flavor: "Noix", grams: 400 },
  { flavor: "Abricot", grams: 400 },
];

const variees = {
  slug: "dattes-farcies-variees",
  name: "Dattes Farcies Variées",
  category: "traditionnelle",
  price: 40,
  sell_mode: "kg",
  product_type: "assortiment",
  assortment_composition: composition,
  sell_options: [{ id: "g-1000", grams: 1000, label: "1 kg" }],
};

test("1 kg se découpe en 5 portions de 200 g ; 250 g ne se découpe pas", () => {
  assert.equal(portionsPour(1000), 5);
  assert.equal(portionsPour(400), 2);
  assert.equal(portionsPour(250), 0);
  assert.equal(portionsPour(100), 0);
});

test("la répartition fait l'aller-retour dans l'identifiant de ligne", () => {
  const parfums = parfumsAssortiment(composition);
  const id = encoderChoix("g-1000", parfums, { Noix: 2, Abricot: 3 });
  assert.equal(id, "g-1000~noix:2,abricot:3");
  assert.deepEqual(decoderChoix(id), {
    base: "g-1000",
    choix: [
      { cle: "noix", n: 2 },
      { cle: "abricot", n: 3 },
    ],
  });
  assert.deepEqual(decoderChoix("g-1000"), { base: "g-1000", choix: null });
});

test("le serveur refuse un total faux, un parfum inconnu ou un doublon", () => {
  assert.equal(verifierChoix(1000, composition, [{ cle: "noix", n: 4 }]).ok, false);
  assert.equal(verifierChoix(1000, composition, [{ cle: "fraise", n: 5 }]).ok, false);
  assert.equal(
    verifierChoix(1000, composition, [
      { cle: "noix", n: 2 },
      { cle: "noix", n: 3 },
    ]).ok,
    false,
  );
  assert.deepEqual(
    verifierChoix(1000, composition, [
      { cle: "noix", n: 2 },
      { cle: "pistache-et-pignon", n: 3 },
    ]),
    { ok: true, label: "1 kg · Noix 400 g, Pistache et pignon 600 g" },
  );
});

test("assortiment : prix au kilo, libellé écrit par le serveur, répartition exigée", () => {
  const ok = currentUnitPrice(variees, {
    name: "Dattes Farcies Variées",
    variantId: "g-1000~noix:2,abricot:3",
    variantLabel: "texte quelconque du navigateur",
  });
  assert.equal(ok.price, 40);
  assert.equal(ok.status, undefined);
  assert.equal(ok.variantLabel, "1 kg · Noix 400 g, Abricot 600 g");

  const sansChoix = currentUnitPrice(variees, { name: "Variées", variantId: "g-1000" });
  assert.equal(sansChoix.status?.blocking, true);

  const incomplet = currentUnitPrice(variees, { name: "Variées", variantId: "g-1000~noix:1" });
  assert.equal(incomplet.status?.blocking, true);
});

test("un produit au kilo ordinaire n'est pas concerné", () => {
  const noix = { ...variees, product_type: "parfum-simple" };
  const r = currentUnitPrice(noix, { name: "Noix", variantId: "g-1000" });
  assert.equal(r.status, undefined);
  assert.equal(r.variantLabel, "1 kg");
});
