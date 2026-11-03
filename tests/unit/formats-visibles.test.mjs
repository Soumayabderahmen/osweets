import assert from "node:assert/strict";
import test from "node:test";

import {
  kgPalierPrice,
  optionLabel,
  personnesText,
  visibleOptions,
} from "../../src/lib/variant-label.ts";
import { currentUnitPrice } from "../../src/lib/cart-validation-pricing.ts";
import { kgMainSelection, variantPrice } from "../../src/lib/product-rules.ts";
import { optionParts } from "../../src/lib/option-parts.ts";
import { validateProductInput } from "../../src/lib/product-input.ts";

const kaak = {
  slug: "kaak-warka",
  name: "Kaak Warka",
  category: "traditionnelle",
  price: 32,
  sell_mode: "kg",
  sell_options: [
    { id: "g-100", grams: 100, label: "", hidden: true },
    { id: "g-250", grams: 250, label: "" },
    { id: "g-500", grams: 500, label: "", manualPrice: 15 },
    { id: "g-1000", grams: 1000, label: "" },
  ],
};

test("a hidden format stays stored but is never offered", () => {
  assert.deepEqual(
    visibleOptions(kaak.sell_options).map((o) => o.id),
    ["g-250", "g-500", "g-1000"],
  );
  assert.deepEqual(visibleOptions(undefined), []);
});

test("a kg step uses the manual price when one is entered, the per-kilo price otherwise", () => {
  assert.equal(kgPalierPrice(32, { grams: 250 }), 8);
  assert.equal(kgPalierPrice(32, { grams: 500, manualPrice: 15 }), 15);
  assert.equal(kgPalierPrice(32, { grams: 500, manualPrice: null }), 16);
  assert.equal(kgPalierPrice(32, { grams: 500, manualPrice: 0 }), 16);
  const product = { price: 32, sellMode: "kg" };
  assert.equal(variantPrice(product, { id: "g-500", label: "", grams: 500, manualPrice: 15 }), 15);
});

test("the main kg price follows a manual price on the reference weight", () => {
  const variants = [{ grams: 500 }, { grams: 1000, manualPrice: 30 }];
  assert.deepEqual(kgMainSelection({ price: 32, variants }), { grams: 1000, price: 30 });
});

test("the server refuses a hidden format and charges the manual kg price", () => {
  const hidden = currentUnitPrice(kaak, { name: "Kaak Warka", variantId: "g-100" });
  assert.equal(hidden.status?.blocking, true);
  const manual = currentUnitPrice(kaak, { name: "Kaak Warka", variantId: "g-500" });
  assert.equal(manual.price, 15);
  assert.equal(manual.status, undefined);

  const cheesecake = {
    slug: "cheesecake-kounefa",
    name: "Cheese-cake Kounefa",
    category: "orientale",
    price: 0,
    sell_mode: "format",
    sell_options: [
      { id: "part", label: "Part individuelle", servesMin: 1, servesMax: 1, price: 12 },
      { id: "petit", label: "Petit format", servesMin: 6, servesMax: 6, price: 0, hidden: true },
    ],
  };
  assert.equal(currentUnitPrice(cheesecake, { name: "x", variantId: "part" }).price, 12);
  assert.equal(
    currentUnitPrice(cheesecake, { name: "x", variantId: "petit" }).status?.blocking,
    true,
  );
});

test("a product whose formats are all hidden offers nothing", () => {
  const row = {
    slug: "x",
    name: "X",
    category: "orientale",
    price: 0,
    sell_mode: "format",
    sell_options: [{ id: "a", label: "Petit format", price: 0, hidden: true }],
  };
  assert.equal(currentUnitPrice(row, { name: "X", variantId: "a" }).status?.blocking, true);
});

test("one person is singular, a range is plural", () => {
  assert.equal(personnesText(1, 1), "1 personne");
  assert.equal(personnesText(6, 6), "6 personnes");
  assert.equal(personnesText(4, 6), "4–6 personnes");
  assert.equal(personnesText(null, 6), null);
  assert.equal(
    optionLabel({ label: "Part individuelle", servesMin: 1, servesMax: 1 }),
    "Part individuelle · 1 personne",
  );
  assert.deepEqual(
    optionParts(
      { sellMode: "format" },
      { id: "p", label: "Petit format", servesMin: 4, servesMax: 6 },
    ),
    { title: "Petit format", details: ["4–6 personnes"] },
  );
});

test("saving: a hidden format may wait for its price, a visible one may not", () => {
  const base = { sell_mode: "format", price: 0 };
  const ok = validateProductInput(
    {
      ...base,
      sell_options: [
        { id: "part", label: "Part individuelle", price: 12 },
        { id: "petit", label: "Petit format", price: 0, hidden: true },
      ],
    },
    [],
  );
  assert.deepEqual(
    ok.sell_options.map((o) => [o.id, o.price, o.hidden]),
    [
      ["part", 12, false],
      ["petit", 0, true],
    ],
  );
  assert.throws(
    () =>
      validateProductInput(
        { ...base, sell_options: [{ id: "petit", label: "Petit format", price: 0 }] },
        [],
      ),
    /masquez-le/,
  );
});

test("a container (pot, bowl, verrine) may have no weight, but never a negative one", () => {
  const out = validateProductInput(
    {
      sell_mode: "pot",
      sell_options: [
        { id: "pot", label: "Pot individuel", weightG: 180, price: 14 },
        { id: "verrine", label: "Verrine", price: 0, hidden: true },
        { id: "v2", label: "Verrine", pieces: 6, price: 9 },
      ],
    },
    [],
  );
  assert.deepEqual(
    out.sell_options.map((o) => [o.id, o.hidden]),
    [
      ["pot", false],
      ["verrine", true],
      ["v2", false],
    ],
  );
  assert.equal(optionLabel({ label: "Verrine", pieces: 6 }), "Verrine · 6 pièces");
  assert.throws(
    () =>
      validateProductInput(
        { sell_mode: "pot", sell_options: [{ id: "p", label: "Pot", weightG: -5, price: 3 }] },
        [],
      ),
    /invalide/,
  );
});

test("saving a kg product keeps the manual price and drops a stored computed one", () => {
  const out = validateProductInput(
    {
      sell_mode: "kg",
      price: 32,
      sell_options: [
        { id: "g-500", grams: 500, label: "", price: 16, manualPrice: "15,50" },
        { id: "g-1000", grams: 1000, label: "", hidden: true },
      ],
    },
    [],
  );
  assert.deepEqual(out.sell_options[0], {
    id: "g-500",
    grams: 500,
    label: "",
    manualPrice: 15.5,
    hidden: false,
  });
  assert.equal(out.sell_options[1].hidden, true);
  assert.equal(out.sell_options[1].manualPrice, null);
  assert.throws(
    () =>
      validateProductInput(
        { sell_mode: "kg", price: 32, sell_options: [{ id: "g", grams: 500, manualPrice: -2 }] },
        [],
      ),
    /supérieur à 0/,
  );
});
