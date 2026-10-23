import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import { currentUnitPrice } from "../../src/lib/cart-validation-pricing.ts";
import { validateProductInput } from "../../src/lib/product-input.ts";
import { parisDay } from "../../src/lib/calendar-day.ts";
import { toWindows, isSeasonActive } from "../../src/lib/season.ts";
import {
  applyCartValidation,
  cartRequestSignature,
  mergeGift,
} from "../../src/lib/cart-patches.ts";
import {
  collectionMetadata,
  collectionCounts,
  nextCollectionOrder,
  collectionState,
} from "../../src/lib/collection-presentation.ts";
import { readCatalogQuery, newestFirst } from "../../src/lib/catalog-query.ts";
import { optionLabel } from "../../src/lib/variant-label.ts";
import { filterPatisserieRows, isPatisserieCategory } from "../../src/lib/patisserie-scope.ts";
import { isProductOrderable } from "../../src/lib/product-rules.ts";
import { priceLockNotice, revalidationNeededStatus } from "../../src/lib/cart-rules.ts";

const product = {
  slug: "kaak-warka",
  name: "Kaak Warka",
  category: "traditionnelle",
  price: 32,
  published: true,
  archived: false,
  draft: false,
};
const line = {
  ...product,
  image: "",
  quantity: 1,
  variantId: "1kg",
  unitPriceSnapshot: 32,
  priceLockedAt: "2026-09-01T12:00:00.000Z",
};
const patch = {
  ...line,
  lineKey: "kaak-warka|1kg",
  lastValidatedAt: "2026-09-02T12:00:00.000Z",
  validationStatus: { code: "ok", blocking: false },
};
const result = (patches) => ({
  ok: true,
  checkedAt: "2026-09-02T12:00:00.000Z",
  patches,
  messages: [],
  blocking: false,
});

test("B-01 explicit 1 kg at 32 EUR must not resolve to an automatic 64 EUR option", () => {
  const row = { ...product, sell_options: [{ id: "1kg", label: "1 kg", price: 32 }] };
  assert.equal(
    currentUnitPrice(row, { name: product.name, variantId: "1kg", variantLabel: "1 kg" }).price,
    32,
  );
  assert.equal(
    currentUnitPrice(row, { name: product.name, variantId: "w-1000" }).status.code,
    "format_removed",
  );
  const automatic = { ...product, price: 38, sell_options: [], variants: [] };
  assert.equal(currentUnitPrice(automatic, { name: "Poids", variantId: "w-500" }).price, 38);
  assert.equal(currentUnitPrice(automatic, { name: "Poids", variantId: "w-1000" }).price, 76);
});
test("B-02 server input normalizes 22,50 and rejects free or negative formats", () => {
  const input = (price) => ({ ...product, sell_options: [{ id: "pot", label: "Pot", price }] });
  assert.equal(validateProductInput(input("22,50"), []).sell_options[0].price, 22.5);
  for (const value of ["0", "-1", "abc", "", "NaN"])
    assert.throws(() => validateProductInput(input(value), []));
});
test("I-08 server product input refuses seasonal products without a linked calendar", () => {
  assert.throws(
    () =>
      validateProductInput({ ...product, seasonal_only: true, collections: ["amandes"] }, ["aid"]),
    /calendrier/,
  );
  assert.doesNotThrow(() =>
    validateProductInput({ ...product, seasonal_only: true, collections: ["aid"] }, ["aid"]),
  );
  const api = readFileSync(new URL("../../src/api/catalog.ts", import.meta.url), "utf8");
  assert.match(api, /validateProductInput\(\s*combined/);
  assert.match(api, /JOIN public.collections c ON c.product_key = s.season_key/);
});
test("I-30 server refuses duplicate ids, preserves stable ids", () => {
  const option = { id: "stable", label: "Pot", price: 22.5 };
  assert.throws(
    () => validateProductInput({ ...product, sell_options: [option, option] }, []),
    /unique/,
  );
  assert.equal(
    validateProductInput({ ...product, sell_options: [option] }, []).sell_options[0].id,
    "stable",
  );
});
test("I-09 season boundaries use the Paris calendar day across process timezones", () => {
  const before = process.env.TZ;
  try {
    for (const zone of ["UTC", "America/Los_Angeles", "Europe/Paris", "Asia/Tokyo"]) {
      process.env.TZ = zone;
      const windows = toWindows([
        {
          season_key: "occasion",
          label: "Occasion",
          starts_on: "2026-09-07",
          ends_on: "2026-09-08",
          preorder_days: 1,
          active: true,
        },
      ]);
      assert.equal(parisDay(new Date("2026-09-05T22:00:00Z")), "2026-09-06");
      assert.equal(isSeasonActive("occasion", windows, new Date("2026-09-05T21:59:59Z")), false);
      assert.equal(isSeasonActive("occasion", windows, new Date("2026-09-05T22:00:00Z")), true);
      assert.equal(isSeasonActive("occasion", windows, new Date("2026-09-08T22:00:00Z")), false);
    }
  } finally {
    if (before === undefined) delete process.env.TZ;
    else process.env.TZ = before;
  }
});
test("C-10 no public localStorage season override remains", () => {
  assert.doesNotMatch(
    readFileSync(new URL("../../src/lib/season.ts", import.meta.url), "utf8"),
    /localStorage|os_season/,
  );
});
test("I-17 a late response never recreates deleted cart lines", () => {
  assert.deepEqual(
    applyCartValidation([], result([patch]), [{ ...line, lineKey: patch.lineKey }]),
    [],
  );
});
test("I-17 a late response cannot replace a newer quantity or re-added price period", () => {
  const edited = { ...line, quantity: 2, validationStatus: revalidationNeededStatus(line.name) };
  assert.deepEqual(
    applyCartValidation([edited], result([patch]), [{ ...line, lineKey: patch.lineKey }]),
    [edited],
  );
  const readded = { ...line, priceLockedAt: "2026-09-03T12:00:00Z" };
  assert.deepEqual(
    applyCartValidation([readded], result([patch]), [{ ...line, lineKey: patch.lineKey }]),
    [readded],
  );
});
test("I-18 C-06 colliding corrected formats merge quantities and both gift messages then block", () => {
  const old = { ...line, variantId: "old", gift: { wrap: true, message: "Premier message" } };
  const current = { ...line, quantity: 2, gift: { message: "Second message" } };
  const merged = applyCartValidation(
    [old, current],
    result([{ ...patch, lineKey: "kaak-warka|old" }, patch]),
  );
  assert.equal(merged.length, 1);
  assert.equal(merged[0].variantId, "1kg");
  assert.equal(merged[0].quantity, 3);
  assert.equal(merged[0].gift.wrap, true);
  assert.equal(merged[0].gift.message, "Premier message\nSecond message");
  assert.equal(merged[0].validationStatus.code, "revalidation_needed");
  assert.equal(merged[0].validationStatus.blocking, true);
  assert.equal(mergeGift({ message: "Bonjour" }, { message: "Bonjour" }).message, "Bonjour");
});
test("B-09 status remains blocking across persistence; status-only changes do not refetch", () => {
  const changed = { ...line, quantity: 2, validationStatus: revalidationNeededStatus(line.name) };
  assert.equal(JSON.parse(JSON.stringify(changed)).validationStatus.blocking, true);
  assert.notEqual(cartRequestSignature([line]), cartRequestSignature([changed]));
  assert.equal(
    cartRequestSignature([changed]),
    cartRequestSignature([{ ...changed, validationStatus: { code: "ok" } }]),
  );
});
test("I-05 empty SEO never revives old commercial copy", () => {
  assert.deepEqual(collectionMetadata({ label: "Nouveau nom", title: "", description: "" }), {
    title: "Nouveau nom | Ö' Sweets",
    description: "La collection Nouveau nom de la pâtisserie Ö' Sweets.",
  });
});
test("I-01 C-11 query state survives fresh bounds after refetch", () => {
  const stored = {
    sort: "desc",
    priceMin: 20,
    priceMax: 40,
    page: 2,
    exclude: ["lait"],
    layout: "list",
  };
  const initial = readCatalogQuery(stored, { min: 0, max: 100 });
  assert.deepEqual(readCatalogQuery(stored, { min: 10, max: 1000 }), initial);
});
test("C-04 newest sort uses created_at rather than input position", () => {
  const p = [
    { slug: "new", createdAt: "2026-09-02" },
    { slug: "old", createdAt: "2025-01-01" },
  ];
  assert.equal(newestFirst(p)[0].slug, "new");
  assert.equal(newestFirst([...p].reverse())[0].slug, "new");
});
test("I-23 collection counts distinguish associated, published and currently visible", () => {
  const base = { ...product, collections: ["amandes"] };
  assert.deepEqual(
    collectionCounts(
      [
        base,
        { ...base, draft: true },
        { ...base, published: false },
        { ...base, seasonalOnly: true },
      ],
      "amandes",
      [],
    ),
    // `archived` s'est ajoute au retour (compteur affiche desormais au
    // back-office) : aucun des 4 produits de ce cas n'est archive.
    { associated: 4, published: 2, visible: 1, commandable: 1, archived: 0 },
  );
});
test("I-22 I-24 collection state and default order are unambiguous", () => {
  assert.equal(collectionState({ published: true, hidden: true }), "hidden");
  assert.equal(collectionState({ published: false, hidden: false }), "unpublished");
  assert.equal(nextCollectionOrder([{ sort_order: 10 }, { sort_order: 90 }]), 100);
});
test("I-29 serves is included in the commercial option label", () => {
  assert.match(optionLabel({ label: "Grand", serves: "6", price: 22.5 }), /6 personnes/);
});
test("I-12 shared scope includes new pastry categories and excludes other universes", () => {
  assert.equal(isPatisserieCategory("nouvelle-patisserie"), true);
  for (const c of ["cake", "coffret", "sale", "pack-fiancailles", "anniversaire"])
    assert.equal(isPatisserieCategory(c), false);
});
test("admin pastry product list excludes other universes but keeps all pastry states", () => {
  const rows = [
    { slug: "kaak", category: "traditionnelle", archived: false },
    { slug: "cake", category: "cake", archived: false },
    { slug: "old-kaak", category: "traditionnelle", archived: true },
    { slug: "new-pastry", category: "nouvelle-patisserie", archived: false },
  ];
  assert.deepEqual(
    filterPatisserieRows(rows).map((row) => row.slug),
    ["kaak", "old-kaak", "new-pastry"],
  );
});
test("B-05 B-06 I-10 I-11 all public entry points use the same blocking states", () => {
  for (const override of [
    { archived: true },
    { published: false },
    { draft: true },
    { noCart: true },
    { hidePrice: true },
    { inStock: false },
    { seasonalOnly: true },
  ]) {
    assert.equal(
      isProductOrderable({ ...product, variants: [{ price: 32 }], ...override }, []).ok,
      false,
    );
  }
});
test("I-16 price guarantee information includes expiry and stock limitation", () => {
  const notice = priceLockNotice(line);
  assert.match(notice, /16\/09\/2026/);
  assert.match(notice, /14:00/);
  assert.match(notice, /sans réservation de stock/);
});
