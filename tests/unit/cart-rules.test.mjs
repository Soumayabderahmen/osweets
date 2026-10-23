import assert from "node:assert/strict";
import test from "node:test";

import {
  canAddQuantity,
  canSetLineQuantity,
  cartHasBlockingIssue,
  isPriceLockExpired,
  lineUnitPrice,
  needsFullCartRefresh,
  normalizeCartLine,
  revalidationNeededStatus,
} from "../../src/lib/cart-rules.ts";
import {
  firstVisibleCollections,
  isCollectionPublic,
  shouldShowCollection,
} from "../../src/lib/collection-visibility.ts";
import { patisserieMenuGroups } from "../../src/lib/patisserie-menu.ts";
import { parseFrenchPrice, isStrictlyPositivePrice } from "../../src/lib/admin-values.ts";
import { currentUnitPrice } from "../../src/lib/cart-validation-pricing.ts";
import { validateFulfillmentDate } from "../../src/lib/checkout-date.ts";
import { displayedProductPrice, isProductOrderable } from "../../src/lib/product-rules.ts";

test("cart lines keep a 15 day price lock", () => {
  const locked = normalizeCartLine(
    { slug: "kaak-warka", price: 32, quantity: 1 },
    new Date("2026-01-01T12:00:00.000Z"),
  );

  assert.equal(locked.unitPriceSnapshot, 32);
  assert.equal(locked.currency, "EUR");
  assert.equal(locked.priceLockedAt, "2026-01-01T12:00:00.000Z");
  assert.equal(lineUnitPrice(locked), 32);
  assert.equal(isPriceLockExpired(locked, new Date("2026-01-16T11:59:59.999Z")), false);
  assert.equal(isPriceLockExpired(locked, new Date("2026-01-16T12:00:00.000Z")), true);
});

test("quantity changes do not reset the existing price lock", () => {
  const locked = normalizeCartLine(
    { slug: "kaak-warka", price: 32, quantity: 1 },
    new Date("2026-01-01T12:00:00.000Z"),
  );
  const changedQuantity = { ...locked, quantity: 2 };
  const readded = normalizeCartLine(
    { slug: "kaak-warka", price: 35, quantity: 1 },
    new Date("2026-01-20T09:00:00.000Z"),
  );

  assert.equal(changedQuantity.priceLockedAt, locked.priceLockedAt);
  assert.equal(changedQuantity.unitPriceSnapshot, 32);
  assert.equal(readded.priceLockedAt, "2026-01-20T09:00:00.000Z");
  assert.equal(readded.unitPriceSnapshot, 35);
});

test("cart lines need a full PostgreSQL refresh after 48 hours", () => {
  const line = {
    slug: "kaak-warka",
    price: 32,
    quantity: 1,
    lastValidatedAt: "2026-01-01T08:00:00.000Z",
  };

  assert.equal(needsFullCartRefresh(line, new Date("2026-01-03T07:59:59.999Z")), false);
  assert.equal(needsFullCartRefresh(line, new Date("2026-01-03T08:00:00.000Z")), true);
});

test("finite stock is shared across formats of the same product", () => {
  const oneKg = {
    slug: "kaak-warka",
    variantId: "1kg",
    price: 32,
    quantity: 1,
    stockUnlimited: false,
    stockQty: 2,
  };
  const halfKg = { ...oneKg, variantId: "500g", price: 18 };

  assert.deepEqual(canAddQuantity([oneKg], halfKg, 1), { ok: true, max: 1, requested: 1 });
  assert.deepEqual(canAddQuantity([oneKg, halfKg], { ...oneKg, variantId: "250g" }, 1), {
    ok: false,
    max: 0,
    requested: 1,
  });
  assert.deepEqual(canSetLineQuantity([oneKg, halfKg], oneKg, 2), {
    ok: false,
    max: 1,
    requested: 2,
  });
});

test("collection visibility respects publication, hidden flag and empty policy", () => {
  assert.equal(isCollectionPublic({ published: true, hidden: false }), true);
  assert.equal(isCollectionPublic({ published: false, hidden: false }), false);
  assert.equal(isCollectionPublic({ published: true, hidden: true }), false);
  assert.equal(
    shouldShowCollection({ published: true, hidden: false, emptyBehavior: "soon" }, 0),
    true,
  );
  assert.equal(
    shouldShowCollection({ published: true, hidden: false, emptyBehavior: "hide" }, 0),
    false,
  );
  assert.equal(
    shouldShowCollection({ published: true, hidden: false, emptyBehavior: "hide" }, 1),
    true,
  );
});

test("menu collections keep admin order and stop at four visible entries", () => {
  const collections = [
    { slug: "amandes", published: true, hidden: false, emptyBehavior: "soon" },
    { slug: "test-cache", published: true, hidden: true, emptyBehavior: "soon" },
    { slug: "vide", published: true, hidden: false, emptyBehavior: "hide" },
    { slug: "pistache", published: true, hidden: false, emptyBehavior: "soon" },
    { slug: "perles", published: true, hidden: false, emptyBehavior: "soon" },
    { slug: "tradition", published: true, hidden: false, emptyBehavior: "soon" },
    { slug: "ramadan", published: true, hidden: false, emptyBehavior: "soon" },
  ];
  const counts = new Map([
    ["vide", 0],
    ["amandes", 4],
    ["pistache", 2],
    ["perles", 3],
    ["tradition", 5],
    ["ramadan", 1],
  ]);

  assert.deepEqual(
    firstVisibleCollections(collections, (c) => counts.get(c.slug) ?? 0).map((c) => c.slug),
    ["amandes", "pistache", "perles", "tradition"],
  );
});

test("French admin prices keep decimal commas and reject non-positive prices", () => {
  assert.equal(parseFrenchPrice("22,50"), 22.5);
  assert.equal(parseFrenchPrice(" 1 234,56 "), 1234.56);
  assert.equal(isStrictlyPositivePrice("22,50"), true);
  assert.equal(isStrictlyPositivePrice("0"), false);
  assert.equal(isStrictlyPositivePrice("-4,20"), false);
  assert.equal(isStrictlyPositivePrice("abc"), false);
});

test("fulfillment dates reject past dates and honor preparation and holidays", () => {
  const now = new Date("2026-09-01T10:00:00.000Z");

  assert.deepEqual(validateFulfillmentDate("2026-08-31", { now }).ok, false);

  const withPrep = validateFulfillmentDate("2026-09-02", {
    now,
    prepLeads: ["3 jours"],
  });
  assert.equal(withPrep.ok, false);
  assert.equal(withPrep.min, "2026-09-04");

  const afterPrep = validateFulfillmentDate("2026-09-04", {
    now,
    prepLeads: ["3 jours"],
  });
  assert.equal(afterPrep.ok, true);

  const holiday = validateFulfillmentDate("2026-09-04", {
    now,
    settings: { holidayMode: true, holidayUntil: "2026-09-10" },
  });
  assert.equal(holiday.ok, false);
  assert.equal(holiday.min, "2026-09-11");
});

test("quantity edits keep checkout blocked until server revalidation returns", () => {
  const status = revalidationNeededStatus("Kaak Warka");
  assert.equal(status.code, "revalidation_needed");
  assert.equal(status.blocking, true);
  assert.equal(
    cartHasBlockingIssue([
      { slug: "kaak-warka", price: 32, quantity: 2, validationStatus: status },
    ]),
    true,
  );
});

test("server cart pricing accepts generated weight option ids", () => {
  const row = {
    slug: "poids-test",
    name: "Produit au poids",
    category: "traditionnelle",
    price: 16,
    unit: "500 g",
    weight: "500 g",
    sell_options: [],
    variants: [],
  };

  assert.deepEqual(currentUnitPrice(row, { name: row.name, variantId: "w-500" }), {
    price: 16,
    variantId: "w-500",
    variantLabel: "500 g",
  });
  assert.deepEqual(currentUnitPrice(row, { name: row.name, variantId: "w-1000" }), {
    price: 32,
    variantId: "w-1000",
    variantLabel: "1 kg",
  });
  assert.equal(
    currentUnitPrice(row, { name: row.name, variantId: "w-250" }).status.code,
    "format_removed",
  );
});

test("product orderability blocks seasonal formats and hidden prices", () => {
  const base = {
    slug: "aid-format",
    name: "Aïd format",
    category: "traditionnelle",
    price: 10,
    image: "",
    shortDesc: "",
    description: "",
    composition: [],
    ingredients: [],
    allergens: [],
    conservation: "",
    inStock: true,
    stockUnlimited: true,
    published: true,
  };
  const seasons = [
    {
      key: "aid",
      label: "Aïd",
      opensOn: new Date("2026-01-01T00:00:00.000Z"),
      closesOn: new Date("2026-01-05T23:59:59.000Z"),
    },
  ];

  assert.deepEqual(
    isProductOrderable(
      {
        ...base,
        seasonalOnly: true,
        collections: ["aid"],
        variants: [{ id: "1kg", label: "1 kg", price: 32 }],
      },
      seasons,
      new Date("2026-02-01T12:00:00.000Z"),
    ),
    { ok: false, reason: "season_closed" },
  );
  assert.deepEqual(isProductOrderable({ ...base, hidePrice: true }, seasons), {
    ok: false,
    reason: "quote",
  });
  assert.equal(
    displayedProductPrice({
      ...base,
      variants: [
        { id: "1kg", label: "1 kg", price: 32 },
        { id: "500g", label: "500 g", price: 18 },
      ],
    }),
    18,
  );
});

test("patisserie mega menu keeps four pastry collections and dynamic occasions", () => {
  const col = (productKey, label, patch = {}) => ({
    key: productKey,
    productKey,
    path: `/patisserie/${productKey}`,
    label,
    h1: label,
    title: label,
    description: "",
    subtitle: "",
    published: true,
    hidden: false,
    emptyBehavior: "soon",
    sortOrder: 1,
    filter: (p) => (p.collections ?? []).includes(productKey),
    ...patch,
  });
  const product = (slug, collection) => ({
    slug,
    name: slug,
    category: "traditionnelle",
    price: 10,
    image: "",
    shortDesc: "",
    description: "",
    composition: [],
    ingredients: [],
    allergens: [],
    conservation: "",
    published: true,
    collections: [collection],
  });
  const seasons = [
    {
      key: "ramadan",
      label: "Ramadan",
      opensOn: new Date("2027-01-01T00:00:00.000Z"),
      closesOn: new Date("2027-02-01T00:00:00.000Z"),
    },
    {
      key: "aid",
      label: "Aïd",
      opensOn: new Date("2027-03-01T00:00:00.000Z"),
      closesOn: new Date("2027-04-01T00:00:00.000Z"),
    },
  ];

  const groups = patisserieMenuGroups(
    [
      col("amandes", "Amandes"),
      col("test", "test"),
      col("cachee", "Cachée", { hidden: true }),
      col("pistache", "Pistache, Machmoum & Pignon"),
      col("perles", "Perles"),
      col("tradition", "Tradition"),
      col("extra", "Extra"),
      col("ramadan", "Ramadan"),
      col("aid", "Aïd"),
    ],
    [
      product("p-amandes", "amandes"),
      product("p-cachee", "cachee"),
      product("p-pistache", "pistache"),
      product("p-perles", "perles"),
      product("p-tradition", "tradition"),
      product("p-extra", "extra"),
      product("p-ramadan", "ramadan"),
      product("p-aid", "aid"),
    ],
    seasons,
  );

  assert.deepEqual(
    groups.pastries.map((c) => c.productKey),
    ["amandes", "test", "pistache", "perles"],
  );
  assert.deepEqual(
    groups.occasions.map((c) => c.productKey),
    ["ramadan", "aid"],
  );

  const withoutRamadan = patisserieMenuGroups(
    [col("ramadan", "Ramadan", { hidden: true }), col("aid", "Aïd")],
    [product("p-ramadan", "ramadan"), product("p-aid", "aid")],
    seasons,
  );
  assert.deepEqual(
    withoutRamadan.occasions.map((c) => c.productKey),
    ["aid"],
  );
});
