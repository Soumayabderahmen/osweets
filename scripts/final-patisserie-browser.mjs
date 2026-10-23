import assert from "node:assert/strict";
import { mkdirSync, writeFileSync } from "node:fs";
import { randomBytes, scryptSync } from "node:crypto";
import { pathToFileURL } from "node:url";
import pg from "pg";
import { dbConfig } from "./db-env.mjs";

const { chromium } = await import(pathToFileURL(process.env.PLAYWRIGHT_MODULE).href);
const base = process.argv[process.argv.indexOf("--url") + 1].replace(/\/$/, "");
const output = "artifacts/final-patisserie-2026-09-08";
mkdirSync(output, { recursive: true });
const db = new pg.Client(dbConfig());
await db.connect();
const browser = await chromium.launch({
  executablePath: process.env.CHROME_PATH,
  headless: true,
  args: ["--no-sandbox"],
});
const results = [];
const errors = [];
const adminEmail = "audit-ui-final@example.invalid";
const adminPassword = `Audit-${randomBytes(12).toString("hex")}`;
let compositionBefore;

async function check(name, run) {
  try {
    results.push({ name, status: "PASS", evidence: await run() });
  } catch (error) {
    results.push({ name, status: "FAIL", error: error.message });
  }
}
const productLinks = (page) => page.locator('main a[href^="/produits/"]');
const visibleProductSlugs = async (page) => [
  ...new Set(
    await productLinks(page).evaluateAll((links) => links.map((a) => a.getAttribute("href"))),
  ),
];

async function openAdminProduct(page, search, file) {
  const input = page.getByPlaceholder(/Rechercher un produit/);
  await input.fill(search);
  await page.waitForTimeout(150);
  await page.getByTitle("Modifier").first().click();
  const panel = page.locator("aside.panel");
  await panel.waitFor({ state: "visible" });
  const focus =
    file === "bo-kounefa.png"
      ? panel.locator(".family-structure")
      : file === "bo-dattes-variees.png"
        ? panel.locator(".compo-reference")
        : file === "bo-kg.png"
          ? panel.locator(".sellbox").filter({ hasText: "Grammages disponibles" })
          : file === "bo-format.png"
            ? panel.locator(".sellbox").filter({ hasText: "Petit format / Grand format" })
            : panel.locator(".sellbox").filter({ hasText: "Les pots" });
  await focus.scrollIntoViewIfNeeded();
  await focus.screenshot({ path: `${output}/${file}` });
  const text = await panel.innerText();
  await panel.getByRole("button", { name: "Fermer", exact: true }).click();
  await input.fill("");
  return text;
}

try {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(adminPassword, salt, 64).toString("hex");
  await db.query(
    `INSERT INTO admin_users(email,password_hash,display_name,active) VALUES($1,$2,'Audit visuel temporaire',true) ON CONFLICT(email) DO UPDATE SET password_hash=excluded.password_hash,active=true`,
    [adminEmail, `scrypt$${salt}$${hash}`],
  );

  const context = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
  const page = await context.newPage();
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(message.text());
  });

  for (const collection of ["ramadan", "tradition"]) {
    await check(`Filtres ${collection} sur URL propre`, async () => {
      const response = await page.goto(`${base}/patisserie/${collection}`, {
        waitUntil: "networkidle",
      });
      assert.equal(response.status(), 200);
      const aside = page
        .locator("aside")
        .filter({ has: page.getByLabel("Prix minimum") })
        .first();
      await aside.waitFor();
      const min = Number(await aside.getByLabel("Prix minimum").inputValue());
      const max = Number(await aside.getByLabel("Prix maximum").inputValue());
      assert.equal(min, 0);
      assert.ok(max > 0);
      assert.match(await aside.locator("h2").innerText(), /\(0\)/);
      const initial = await visibleProductSlugs(page);
      await page.screenshot({
        path: `${output}/filtres-${collection}-desktop.png`,
        fullPage: true,
      });
      await aside.getByLabel("Prix maximum").fill(String(Math.max(1, max - 1)));
      await page.waitForTimeout(250);
      assert.match(await aside.locator("h2").innerText(), /\(1\)/);
      const filtered = await visibleProductSlugs(page);
      await aside.getByRole("button", { name: /Réinitialiser/i }).click();
      await page.waitForTimeout(250);
      assert.equal(Number(await aside.getByLabel("Prix minimum").inputValue()), 0);
      assert.equal(Number(await aside.getByLabel("Prix maximum").inputValue()), max);
      assert.match(await aside.locator("h2").innerText(), /\(0\)/);
      assert.equal(new URL(page.url()).searchParams.has("f"), false);
      assert.deepEqual(await visibleProductSlugs(page), initial);
      return {
        min,
        max,
        initialCount: initial.length,
        filteredCount: filtered.length,
        resetCount: initial.length,
      };
    });
  }

  await check("Filtres mobile Tradition", async () => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(`${base}/patisserie/tradition`, { waitUntil: "networkidle" });
    await page.getByRole("button", { name: /^Filtrer \(0\)$/i }).click();
    const dialog = page
      .locator("div.fixed.inset-0")
      .filter({ has: page.getByLabel("Prix minimum") });
    assert.equal(Number(await dialog.getByLabel("Prix minimum").inputValue()), 0);
    await page.screenshot({ path: `${output}/filtres-mobile.png`, fullPage: true });
    return { trigger: await page.getByRole("button", { name: /^Filtrer \(0\)$/i }).innerText() };
  });

  await page.setViewportSize({ width: 1440, height: 1000 });
  await check("Carte et QuickView KG Kaak Warka", async () => {
    await page.goto(`${base}/patisserie/amandes`, { waitUntil: "networkidle" });
    const card = page
      .locator('a[href^="/produits/kaak-warka"]')
      .first()
      .locator("xpath=ancestor::div[contains(@class,'group')][1]");
    await card.screenshot({ path: `${output}/carte-kg-desktop.png` });
    await page
      .getByRole("button", { name: /Aperçu rapide.*Kaak Warka/i })
      .first()
      .click();
    const dialog = page.getByRole("dialog", { name: /Aperçu de Kaak Warka/i });
    await dialog.waitFor();
    const options = await dialog
      .locator('input[type="radio"]')
      .evaluateAll((els) => els.map((e) => e.parentElement?.innerText));
    await dialog.screenshot({ path: `${output}/quickview-kg.png` });
    assert.equal(options.length, 7);
    await dialog.getByRole("button", { name: "Fermer", exact: true }).click();
    return { options };
  });

  await check("Carte KG mobile et panier 1 kg validé par le serveur", async () => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(`${base}/patisserie/amandes`, { waitUntil: "networkidle" });
    const card = page
      .locator('a[href^="/produits/kaak-warka"]')
      .first()
      .locator("xpath=ancestor::div[contains(@class,'group')][1]");
    await card.screenshot({ path: `${output}/carte-kg-mobile.png` });
    await page
      .getByRole("button", { name: /Aperçu rapide.*Kaak Warka/i })
      .first()
      .click();
    const dialog = page.getByRole("dialog", { name: /Aperçu de Kaak Warka/i });
    await dialog.getByText("1 kg", { exact: true }).click();
    await dialog.getByRole("button", { name: "Ajouter au panier", exact: true }).click();
    await page.goto(`${base}/panier`, { waitUntil: "networkidle" });
    await page.waitForFunction(() => {
      const line = JSON.parse(localStorage.getItem("osweets-cart-v1") || "[]")[0];
      return line?.variantLabel === "1 kg" && line?.lastValidatedAt;
    });
    const line = await page.evaluate(
      () => JSON.parse(localStorage.getItem("osweets-cart-v1") || "[]")[0],
    );
    assert.equal(line.quantity, 1);
    assert.equal(line.unitPriceSnapshot, 32);
    assert.notEqual(line.validationStatus?.blocking, true);
    return {
      quantity: line.quantity,
      variant: line.variantLabel,
      serverPrice: line.unitPriceSnapshot,
    };
  });

  await check("Fiches KG, FORMAT, POT, Kounefa et Dattes", async () => {
    await page.setViewportSize({ width: 1440, height: 1000 });
    const routes = [
      ["kaak-warka", "fiche-kg.png"],
      ["cheesecake-kounefa", "fiche-kounefa.png"],
      ["dattes-farcies-amandes", "fiche-dattes-farcies.png"],
      ["dattes-farcies-variees", "fiche-variees.png"],
    ];
    const evidence = {};
    for (const [slug, file] of routes) {
      const response = await page.goto(`${base}/produits/${slug}`, { waitUntil: "networkidle" });
      assert.equal(response.status(), 200, slug);
      evidence[slug] = (await page.locator("main").innerText()).slice(0, 700);
      await page.screenshot({ path: `${output}/${file}`, fullPage: true });
    }
    assert.match(evidence["cheesecake-kounefa"], /KOUNEFA\s*—\s*CHEESE-CAKE/i);
    assert.doesNotMatch(evidence["dattes-farcies-amandes"], /Composition de votre assortiment/i);
    return evidence;
  });

  await check("Back-office KG, FORMAT, POT, Kounefa, Variées et collection Tradition", async () => {
    await page.goto(`${base}/admin`, { waitUntil: "networkidle" });
    await page.getByLabel("Adresse e-mail").fill(adminEmail);
    await page.getByLabel("Mot de passe").fill(adminPassword);
    await page.getByRole("button", { name: /Se connecter/ }).click();
    const pastry = page.getByRole("button", { name: /Pâtisserie Tunisienne/ });
    if ((await pastry.getAttribute("aria-expanded")) !== "true") await pastry.click();
    await page.locator(".subnav button").filter({ hasText: "Produits" }).click();
    const panels = {};
    panels.kg = await openAdminProduct(page, "Kaak Warka", "bo-kg.png");
    panels.format = await openAdminProduct(page, "Cheese-cake Kounefa", "bo-format.png");
    panels.pot = await openAdminProduct(page, "Bouza", "bo-pot.png");
    panels.kounefa = await openAdminProduct(page, "Kounefa Kechda", "bo-kounefa.png");
    panels.variees = await openAdminProduct(
      page,
      "Dattes Farcies Variees",
      "bo-dattes-variees.png",
    );
    assert.match(panels.kg, /Prix au kilo/i);
    assert.match(panels.kounefa, /Famille[\s\S]*Type[\s\S]*Parfum/i);
    assert.match(panels.variees, /référence 1 kg/i);
    await page.getByRole("button", { name: /^Collections/ }).click();
    const tradition = page.locator(".ccard").filter({ hasText: "Tradition" }).first();
    const cardText = await tradition.innerText();
    await tradition.getByRole("button", { name: /Ses produits/ }).click();
    const memberPanel = page.locator("aside.panel");
    const memberText = await memberPanel.innerText();
    await memberPanel.screenshot({ path: `${output}/bo-tradition-ses-produits.png` });
    return {
      cardText,
      associatedRows: await memberPanel.locator(".pick > label").count(),
      memberText: memberText.slice(0, 1000),
    };
  });

  await check("Composition temporaire 1kg -> 500/250/750 restaurée", async () => {
    compositionBefore = (
      await db.query(
        "SELECT assortment_composition,sell_options FROM products WHERE slug='dattes-farcies-variees'",
      )
    ).rows[0];
    const reference = [
      { flavor: "Abricot", grams: 143 },
      { flavor: "Amandes", grams: 143 },
      { flavor: "Framboise et Pistache", grams: 143 },
      { flavor: "Noisettes", grams: 143 },
      { flavor: "Noix", grams: 143 },
      { flavor: "Pistache et Pignon", grams: 143 },
      { flavor: "Chocolat", grams: 142 },
    ];
    const options = [250, 500, 750, 1000].map((grams) => ({
      id: `g-${grams}`,
      label: grams === 1000 ? "1 kg" : `${grams} g`,
      grams,
    }));
    await db.query(
      "UPDATE products SET assortment_composition=$1::jsonb,sell_options=$2::jsonb WHERE slug='dattes-farcies-variees'",
      [JSON.stringify(reference), JSON.stringify(options)],
    );
    const fresh = await context.newPage();
    await fresh.goto(`${base}/produits/dattes-farcies-variees`, { waitUntil: "networkidle" });
    const totals = {};
    for (const grams of [250, 500, 750, 1000]) {
      await fresh
        .getByText(grams === 1000 ? "1 kg" : `${grams} g`, { exact: true })
        .first()
        .click();
      const text = await fresh
        .getByText(/Composition de votre assortiment/i)
        .locator("xpath=ancestor::div[contains(@class,'rounded-lg')][1]")
        .innerText();
      totals[grams] = [...text.matchAll(/(\d+) g/g)].reduce(
        (sum, match) => sum + Number(match[1]),
        0,
      );
      assert.equal(totals[grams], grams);
    }
    await fresh.screenshot({
      path: `${output}/fiche-variees-composition-test.png`,
      fullPage: true,
    });
    await fresh.close();
    await db.query(
      "UPDATE products SET assortment_composition=$1::jsonb,sell_options=$2::jsonb WHERE slug='dattes-farcies-variees'",
      [
        JSON.stringify(compositionBefore.assortment_composition),
        JSON.stringify(compositionBefore.sell_options),
      ],
    );
    compositionBefore = undefined;
    return { totals, data: "fixture temporaire restaurée" };
  });
  await context.close();
} finally {
  if (compositionBefore)
    await db.query(
      "UPDATE products SET assortment_composition=$1::jsonb,sell_options=$2::jsonb WHERE slug='dattes-farcies-variees'",
      [
        JSON.stringify(compositionBefore.assortment_composition),
        JSON.stringify(compositionBefore.sell_options),
      ],
    );
  await db.query("DELETE FROM admin_users WHERE email=$1", [adminEmail]);
  await db.end();
  await browser.close();
  writeFileSync(
    `${output}/browser-results.json`,
    JSON.stringify({ base, results, errors, restored: true }, null, 2),
  );
  console.log(JSON.stringify({ results, errors, restored: true }, null, 2));
}
process.exitCode = results.some((result) => result.status === "FAIL") || errors.length ? 1 : 0;
