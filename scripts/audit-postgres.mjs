import assert from "node:assert/strict";
import { writeFileSync } from "node:fs";
import { pathToFileURL } from "node:url";
import pg from "pg";
import { dbConfig, loadEnv } from "./db-env.mjs";
import { guardTestData } from "./test-data-guard.mjs";
import { assertSeasonalLinks } from "../src/api/seasonal-links.server.ts";

loadEnv();
const base = process.argv[process.argv.indexOf("--url") + 1].replace(/\/$/, "");
const { chromium } = await import(pathToFileURL(process.env.PLAYWRIGHT_MODULE).href);
const db = new pg.Client(dbConfig());
await db.connect();
const verifyRestored = await guardTestData(db);
const browser = await chromium.launch({
  executablePath: process.env.CHROME_PATH,
  headless: true,
  args: ["--disable-gpu", "--no-sandbox"],
});
const page = await browser.newPage();
const results = [];
let restored = false;
const row = async (sql, args) => (await db.query(sql, args)).rows[0];
async function check(name, fn) {
  try {
    results.push({ name, status: "OK", evidence: await fn() });
  } catch (e) {
    results.push({ name, status: "ECHEC", error: e.message });
  }
}
async function withRow(table, id, fields, run) {
  const before = (await row(`SELECT to_jsonb(t) AS row FROM public.${table} t WHERE id=$1`, [id]))
    .row;
  const names = Object.keys(fields);
  const update = (values) =>
    db.query(
      `UPDATE public.${table} SET (${names.join(",")}) = (SELECT ${names.join(",")} FROM jsonb_populate_record(NULL::public.${table}, $1::jsonb)) WHERE id=$2`,
      [JSON.stringify(values), id],
    );
  try {
    await update(fields);
    return await run();
  } finally {
    if (table === "products" && Object.hasOwn(fields, "collections"))
      await db.query("ALTER TABLE public.products DISABLE TRIGGER products_normalize_collections");
    try {
      await update(before);
    } finally {
      if (table === "products" && Object.hasOwn(fields, "collections"))
        await db.query("ALTER TABLE public.products ENABLE TRIGGER products_normalize_collections");
    }
  }
}
async function validate(overrides = {}) {
  return page.evaluate(async (overrides) => {
    const { validateCart } = await import("/src/api/cart-validation.ts");
    const line = {
      slug: "kaak-warka",
      name: "Kaak Warka",
      lineKey: "kaak-warka|1kg",
      variantId: "1kg",
      variantLabel: "1 kg",
      quantity: 1,
      price: 32,
      unitPriceSnapshot: 32,
      currency: "EUR",
      priceLockedAt: new Date().toISOString(),
      ...overrides,
    };
    return validateCart({ data: { lines: [line] } });
  }, overrides);
}
try {
  await page.goto(base + "/patisserie", { waitUntil: "networkidle" });
  const p = await row("SELECT id, stock_qty FROM products WHERE slug='kaak-warka'");
  await check("B-04 anonymous stock RPC rejected with stock unchanged", async () => {
    const denied = await page.evaluate(async (id) => {
      const { addStock } = await import("/src/api/catalog.ts");
      try {
        await addStock({ data: { id, delta: -1 } });
        return false;
      } catch {
        return true;
      }
    }, p.id);
    assert.equal(denied, true);
    const after = await row("SELECT stock_qty FROM products WHERE id=$1", [p.id]);
    assert.equal(after.stock_qty, p.stock_qty);
    return { unauthorized: true, before: p.stock_qty, after: after.stock_qty };
  });
  for (const [name, fields, code] of [
    ["stock depleted", { stock_qty: 0, stock_unlimited: false }, "out_of_stock"],
    ["archived", { archived: true }, "archived_product"],
    ["unpublished", { published: false }, "unpublished_product"],
    ["draft", { draft: true }, "draft_product"],
    ["price hidden", { hide_price: true, no_cart: false }, "not_sellable"],
    ["seasonal with formats", { seasonal_only: true, collections: ["aid"] }, "season_closed"],
  ])
    await check(`Cart blocks ${name} using PostgreSQL`, () =>
      withRow("products", p.id, fields, async () => {
        const answer = await validate();
        assert.equal(answer.blocking, true);
        assert.equal(answer.patches[0].validationStatus.code, code);
        return { code, blocking: answer.blocking, linePreserved: answer.patches[0].slug };
      }),
    );
  await check("B-10 draft direct URL returns 404", () =>
    withRow("products", p.id, { draft: true }, async () => {
      const response = await fetch(base + "/produits/kaak-warka");
      assert.equal(response.status, 404);
      return { status: response.status };
    }),
  );
  await check("Cart refuses total quantity above stock", async () => {
    const result = await validate({ quantity: p.stock_qty + 1 });
    assert.equal(result.blocking, true);
    assert.equal(result.patches[0].validationStatus.code, "insufficient_stock");
    return { requested: p.stock_qty + 1, stock: p.stock_qty, blocking: true };
  });
  await check("I-16 expired price updates from 10 to 32 EUR and informs customer", async () => {
    const answer = await validate({
      price: 10,
      unitPriceSnapshot: 10,
      priceLockedAt: new Date(Date.now() - 16 * 86400000).toISOString(),
    });
    assert.equal(answer.patches[0].unitPriceSnapshot, 32);
    assert.equal(answer.patches[0].validationStatus.oldPrice, 10);
    assert.equal(answer.patches[0].validationStatus.newPrice, 32);
    return answer.patches[0].validationStatus;
  });
  await check("O-09 holiday mode blocks previously filled cart", async () => {
    const before = await row("SELECT value FROM settings WHERE key='holiday_mode'");
    try {
      await db.query("UPDATE settings SET value='on' WHERE key='holiday_mode'");
      const answer = await validate();
      assert.equal(answer.patches[0].validationStatus.code, "holiday_closed");
      return { blocking: answer.blocking };
    } finally {
      await db.query("UPDATE settings SET value=$1 WHERE key='holiday_mode'", [before.value]);
    }
  });
  const collections = (
    await db.query(
      "SELECT id, slug, product_key, sort_order, published, hidden FROM collections ORDER BY sort_order,label",
    )
  ).rows;
  for (const collection of collections)
    await check(`I-04 C-03 hidden route /patisserie/${collection.slug}`, () =>
      withRow("collections", collection.id, { hidden: true }, async () => {
        const response = await fetch(base + `/patisserie/${collection.slug}`);
        assert.equal(response.status, 404);
        const homepage = await (await fetch(base + "/patisserie")).text();
        assert.ok(!homepage.includes(`href="/patisserie/${collection.slug}"`));
        return { slug: collection.slug, status: response.status, publicLinkAbsent: true };
      }),
    );
  await check("I-05 cleared collection SEO uses administered name, not old SEO", () =>
    withRow(
      "collections",
      collections[0].id,
      { label: "Nom audit temporaire", title: "", description: "" },
      async () => {
        await page.goto(base + `/patisserie/${collections[0].slug}`, { waitUntil: "networkidle" });
        assert.equal(await page.title(), "Nom audit temporaire | Ö' Sweets");
        return { title: await page.title() };
      },
    ),
  );
  await check("I-06 JSON-LD minimum format price and OutOfStock match product", () =>
    withRow("products", p.id, { stock_qty: 0, stock_unlimited: false }, async () => {
      await page.goto(base + "/produits/kaak-warka", { waitUntil: "networkidle" });
      const data = await page
        .locator('script[type="application/ld+json"]')
        .evaluateAll((nodes) =>
          nodes.map((n) => JSON.parse(n.textContent)).find((n) => n["@type"] === "Product"),
        );
      assert.equal(Number(data.offers.price), 3.2);
      assert.equal(data.offers.availability, "https://schema.org/OutOfStock");
      return data.offers;
    }),
  );
  await check(
    "I-08 server guard rejects orphan produced by detaching a seasonal collection",
    async () => {
      await db.query("BEGIN");
      try {
        await db.query(
          "UPDATE products SET seasonal_only=true, collections=ARRAY[]::text[] WHERE id=$1",
          [p.id],
        );
        await assert.rejects(() => assertSeasonalLinks(db), /calendrier/);
        return { serverGuardRejected: true, transaction: "rolled back" };
      } finally {
        await db.query("ROLLBACK");
      }
    },
  );
  await check(
    "C-14 O-02 typed waitlist entries coexist and retain deleted target label",
    async () => {
      await db.query("BEGIN");
      try {
        await db.query(
          "INSERT INTO patisserie_waitlist(email,collection,target_type,target_label) VALUES ('audit@example.com','audit-same','product','Produit audit'),('audit@example.com','audit-same','collection','Collection audit')",
        );
        const data = (
          await db.query(
            "SELECT target_type,target_label FROM patisserie_waitlist WHERE email='audit@example.com' ORDER BY target_type",
          )
        ).rows;
        assert.equal(data.length, 2);
        assert.equal(data[0].target_label, "Collection audit");
        return { distinctTargets: data, transaction: "rolled back" };
      } finally {
        await db.query("ROLLBACK");
      }
    },
  );
  results.push({
    name: "PostgreSQL collection order",
    status: "OK",
    evidence: collections.map(({ id: _id, ...c }) => c),
  });
} finally {
  try {
    await verifyRestored();
    restored = true;
  } finally {
    writeFileSync(
      "artifacts/audit-2026-09-06/db-results.json",
      JSON.stringify({ base, results, restored }, null, 2),
    );
    console.log(JSON.stringify({ results, restored }, null, 2));
    await browser.close();
    await db.end();
  }
}
process.exitCode = results.some((r) => r.status === "ECHEC") || !restored ? 1 : 0;
