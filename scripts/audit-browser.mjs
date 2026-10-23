import assert from "node:assert/strict";
import { mkdirSync, writeFileSync } from "node:fs";
import { pathToFileURL } from "node:url";

// Use an installed Playwright without adding it to the production bundle.
const { chromium } = await import(pathToFileURL(process.env.PLAYWRIGHT_MODULE).href);
const base = process.argv[process.argv.indexOf("--url") + 1];
assert.match(base, /^http:\/\/127\.0\.0\.1:\d+\/?$/);
const output = "artifacts/audit-2026-09-06";
mkdirSync(output, { recursive: true });
const browser = await chromium.launch({
  executablePath: process.env.CHROME_PATH,
  headless: true,
  args: ["--disable-gpu", "--no-sandbox"],
});
const results = [];
const context = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
await context.addInitScript(() => {
  // Test-only React inspection: controlled fixtures never touch PostgreSQL.
  window.__REACT_DEVTOOLS_GLOBAL_HOOK__ = {
    supportsFiber: true,
    renderers: new Map(),
    inject(renderer) {
      this.renderers.set(1, renderer);
      return 1;
    },
    onCommitFiberRoot: (_, root) => {
      const walk = (fiber) => {
        if (!fiber) return;
        if (fiber.memoizedProps?.client?.getQueryCache)
          window.auditQueryClient = fiber.memoizedProps.client;
        walk(fiber.child);
        walk(fiber.sibling);
      };
      walk(root.current);
    },
    onCommitFiberUnmount() {},
  };
});
const page = await context.newPage();
const errors = [];
page.on("pageerror", (e) => errors.push(e.message));
async function check(name, run) {
  try {
    const evidence = await run();
    results.push({ name, status: "OK", evidence });
  } catch (e) {
    results.push({ name, status: "ECHEC", message: e.message });
  }
}
async function menuEvidence(locator) {
  return locator.evaluate((el) => {
    const rect = (node) => {
      const r = node.getBoundingClientRect();
      return { x: r.x, y: r.y, width: r.width, height: r.height };
    };
    const groups = [...el.querySelectorAll("[data-menu-group]")].map((group) => ({
      group: group.dataset.menuGroup,
      text: group.innerText,
      rect: rect(group),
      links: [...group.querySelectorAll("a")].map((a) => ({
        label: a.textContent.trim(),
        href: a.getAttribute("href"),
      })),
    }));
    const img = el.querySelector("[data-menu-image] img");
    return {
      rect: rect(el),
      grid: getComputedStyle(el).gridTemplateColumns,
      groups,
      image: img
        ? {
            src: img.getAttribute("src"),
            alt: img.alt,
            fit: getComputedStyle(img).objectFit,
            loaded: img.complete && img.naturalWidth > 0,
            rect: rect(img),
          }
        : null,
    };
  });
}
try {
  const response = await page.goto(base + "patisserie", { waitUntil: "networkidle" });
  assert.equal(response.status(), 200);
  await page.waitForFunction(() => Boolean(window.auditQueryClient));
  await check(
    "Desktop: grille, quatre collections, occasions, image et hrefs PostgreSQL",
    async () => {
      await page.locator('header nav a[href="/patisserie"]').hover();
      const menu = page.getByTestId("patisserie-mega-menu");
      await menu.waitFor({ state: "visible" });
      await page.waitForTimeout(400);
      const evidence = await menuEvidence(menu);
      assert.equal(evidence.groups.length, 2);
      assert.equal(evidence.groups[0].links.length, 5);
      assert.equal(evidence.groups[0].links.at(-1).href, "/patisserie");
      assert.equal(evidence.groups[0].links.at(-1).label, "Toutes les collections");
      assert.deepEqual(
        evidence.groups[1].links.map((l) => l.label),
        ["Ramadan", "Aïd"],
      );
      assert.equal(evidence.image.fit, "cover");
      assert.equal(evidence.image.loaded, true);
      assert.ok(evidence.image.rect.width > 325);
      assert.ok(Math.abs(evidence.image.rect.height - evidence.groups[0].rect.height) < 1);
      await page.screenshot({ path: `${output}/mega-desktop.png` });
      return evidence;
    },
  );
  await check("Image absente: deux colonnes sans emplacement blanc réservé", async () => {
    await page.evaluate(() => {
      const q = window.auditQueryClient;
      window.auditBanners = q.getQueryData(["page-banners"]);
      q.setQueryData(
        ["page-banners"],
        window.auditBanners.map((r) =>
          r.key === "patisserie-mega-menu-occasions" ? { ...r, image_url: "", image_key: "" } : r,
        ),
      );
    });
    await page.waitForTimeout(200);
    const evidence = await menuEvidence(page.getByTestId("patisserie-mega-menu"));
    assert.equal(evidence.image, null);
    assert.equal(evidence.grid.split(" ").length, 2);
    assert.ok(evidence.rect.width < 400);
    await page.screenshot({ path: `${output}/mega-no-image.png` });
    await page.evaluate(() =>
      window.auditQueryClient.setQueryData(["page-banners"], window.auditBanners),
    );
    return { ...evidence, source: "Fixture navigateur uniquement, aucune écriture PostgreSQL" };
  });
  await check(
    "Collections/occasions: masquage, remplacement, renommage, slug et nouvelle occasion",
    async () => {
      const result = await page.evaluate(() => {
        const q = window.auditQueryClient;
        window.auditCollections = q.getQueryData(["collections"]);
        window.auditSeasons = q.getQueryData(["seasons"]);
        q.setQueryData(
          ["collections"],
          window.auditCollections
            .map((c) =>
              c.slug === "amandes" || c.slug === "ramadan"
                ? { ...c, hidden: true }
                : c.slug === "aid"
                  ? { ...c, label: "Fête renommée", slug: "fete-renommee" }
                  : c,
            )
            .concat(
              {
                ...window.auditCollections[0],
                id: "fixture",
                slug: "occasion-fixture",
                product_key: "occasion-fixture",
                label: "Nouvelle occasion",
                sort_order: 100,
                empty_behavior: "soon",
              },
              {
                ...window.auditCollections[0],
                id: "fixture-next",
                slug: "collection-suivante",
                product_key: "collection-suivante",
                label: "Collection suivante",
                sort_order: 110,
                empty_behavior: "soon",
              },
            ),
        );
        q.setQueryData(
          ["seasons"],
          window.auditSeasons.concat({
            ...window.auditSeasons[0],
            id: "fixture",
            season_key: "occasion-fixture",
            active: false,
          }),
        );
        return "Fixture navigateur uniquement";
      });
      await page.waitForTimeout(200);
      const evidence = await menuEvidence(page.getByTestId("patisserie-mega-menu"));
      assert.equal(evidence.groups[0].links.length, 5);
      assert.ok(evidence.groups[0].links.some((l) => l.href.endsWith("tradition")));
      assert.ok(!evidence.groups[1].links.some((l) => l.href.endsWith("ramadan")));
      assert.ok(
        evidence.groups[1].links.some(
          (l) => l.label === "Fête renommée" && l.href.endsWith("fete-renommee"),
        ),
      );
      assert.ok(evidence.groups[1].links.some((l) => l.label === "Nouvelle occasion"));
      await page.evaluate(() => {
        window.auditQueryClient.setQueryData(["collections"], window.auditCollections);
        window.auditQueryClient.setQueryData(["seasons"], window.auditSeasons);
      });
      return { ...evidence, source: result };
    },
  );
  await check("Mobile: groupes et destinations accessibles", async () => {
    await page.reload({ waitUntil: "networkidle" });
    await page.setViewportSize({ width: 390, height: 844 });
    await page.getByRole("button", { name: "Ouvrir le menu", exact: true }).click();
    const dialog = page.getByRole("dialog", { name: "Menu principal" });
    await dialog.getByRole("button", { name: "Pâtisserie Tunisienne", exact: true }).click();
    await page.waitForTimeout(400);
    const evidence = await menuEvidence(dialog);
    assert.equal(evidence.groups.length, 2);
    assert.equal(evidence.groups[0].links.length, 5);
    assert.equal(evidence.groups[1].links.length, 2);
    for (const link of evidence.groups.flatMap((g) => g.links)) {
      assert.ok(await dialog.getByRole("link", { name: link.label, exact: true }).isVisible());
      const r = await context.request.get(base.replace(/\/$/, "") + link.href);
      assert.equal(r.status(), 200, link.href);
    }
    await page.screenshot({ path: `${output}/mega-mobile.png` });
    await dialog.getByRole("link", { name: "Toutes les collections", exact: true }).focus();
    await page.keyboard.press("Enter");
    await page.waitForTimeout(300);
    assert.equal(new URL(page.url()).pathname, "/patisserie");
    return evidence;
  });
  await check(
    "B-01: vrais produits PostgreSQL au poids, 500 g et 1 kg acceptés par validateCart",
    async () => {
      return page.evaluate(async () => {
        const { validateCart } = await import("/src/api/cart-validation.ts");
        const rows = window.auditQueryClient.getQueryData(["catalogue"]).rows;
        const product = rows.find((p) => p.slug === "baklawa-pistache");
        if (!product || product.sell_options?.length) throw new Error("Témoin au poids absent");
        const evidence = [];
        for (const [id, multiple] of [
          ["w-500", 1],
          ["w-1000", 2],
        ]) {
          const result = await validateCart({
            data: {
              lines: [
                {
                  slug: product.slug,
                  name: product.name,
                  price: 0,
                  quantity: 1,
                  variantId: id,
                  lineKey: `${product.slug}|${id}`,
                },
              ],
            },
          });
          if (
            !result.ok ||
            result.blocking ||
            result.patches[0].unitPriceSnapshot !== Number(product.price) * multiple
          )
            throw new Error(JSON.stringify(result));
          evidence.push({
            slug: product.slug,
            variant: id,
            expected: Number(product.price) * multiple,
            observed: result.patches[0].unitPriceSnapshot,
            status: result.patches[0].validationStatus,
          });
        }
        return evidence;
      });
    },
  );
  await check("B-04: fonction de décrément non exportée par le module navigateur", async () => {
    const exports = await page.evaluate(async () =>
      Object.keys(await import("/src/api/catalog.ts")),
    );
    assert.ok(!exports.includes("takeStock"));
    assert.ok(!exports.includes("takeStockInternal"));
    return { publicExports: exports };
  });
  await check("Kaak Warka: navigation, format 1 kg, ajout, quantité et rechargement", async () => {
    await page.setViewportSize({ width: 1440, height: 1000 });
    await page.goto(base + "patisserie/amandes", { waitUntil: "networkidle" });
    await page.locator('a[href^="/produits/kaak-warka"]').first().click();
    await page.getByRole("heading", { name: "Kaak Warka", exact: true }).waitFor();
    const option = page.locator("select option").filter({ hasText: /^1 kg/ });
    await page.locator("select").selectOption(await option.getAttribute("value"));
    await page.getByRole("button", { name: "Ajouter au panier", exact: true }).click();
    await page.goto(base + "panier", { waitUntil: "networkidle" });
    const read = () => page.evaluate(() => JSON.parse(localStorage.getItem("osweets-cart-v1")));
    let cart = await read();
    assert.equal(cart.length, 1);
    assert.equal(cart[0].quantity, 1);
    assert.equal(cart[0].unitPriceSnapshot, 32);
    assert.match(cart[0].variantLabel, /1 kg/);
    const lockedAt = cart[0].priceLockedAt;
    await page
      .getByRole("button", { name: "Augmenter la quantité de Kaak Warka", exact: true })
      .click();
    await page.reload({ waitUntil: "networkidle" });
    cart = await read();
    assert.equal(cart[0].quantity, 2);
    assert.equal(cart[0].priceLockedAt, lockedAt);
    await page
      .getByRole("button", { name: "Diminuer la quantité de Kaak Warka", exact: true })
      .click();
    await page.waitForFunction(() => {
      const line = JSON.parse(localStorage.getItem("osweets-cart-v1"))[0];
      return line?.lastValidatedAt && line.validationStatus?.blocking !== true;
    });
    cart = await read();
    await page.screenshot({ path: `${output}/kaak-panier.png` });
    return {
      slug: cart[0].slug,
      quantity: cart[0].quantity,
      format: cart[0].variantLabel,
      price: cart[0].unitPriceSnapshot,
      lockedAt: cart[0].priceLockedAt,
    };
  });
  await check(
    "I-20: coordonnées conservées en session après aller-retour et rechargement",
    async () => {
      await page.goto(base + "checkout", { waitUntil: "networkidle" });
      await page.getByPlaceholder("Prénom", { exact: true }).fill("Cliente Test");
      await page.getByPlaceholder("Nom", { exact: true }).fill("Kaak Warka");
      await page
        .getByPlaceholder("Email", { exact: true })
        .fill("client-test-kaak-warka@example.com");
      await page.getByPlaceholder("Téléphone", { exact: true }).fill("0600000000");
      await page.goto(base + "panier", { waitUntil: "networkidle" });
      await page.goto(base + "checkout", { waitUntil: "networkidle" });
      assert.equal(
        await page.getByPlaceholder("Prénom", { exact: true }).inputValue(),
        "Cliente Test",
      );
      assert.equal(
        await page.getByPlaceholder("Téléphone", { exact: true }).inputValue(),
        "0600000000",
      );
      assert.equal(
        await page.evaluate(() => localStorage.getItem("osweets-checkout-draft-v1")),
        null,
      );
      return { sessionPersisted: true, localStorageRemoved: true, payment: "Non soumis" };
    },
  );
  await check("I-21: ancienne ligne inconnue identifiée et supprimable au checkout", async () => {
    await page.evaluate(() => {
      const cart = JSON.parse(localStorage.getItem("osweets-cart-v1"));
      cart.push({
        slug: "audit-produit-disparu",
        name: "Témoin indisponible",
        price: 10,
        quantity: 1,
        image: "",
        category: "traditionnelle",
      });
      localStorage.setItem("osweets-cart-v1", JSON.stringify(cart));
    });
    await page.reload({ waitUntil: "networkidle" });
    const remove = page.getByRole("button", { name: "Retirer", exact: true }).last();
    await remove.click();
    const cart = await page.evaluate(() => JSON.parse(localStorage.getItem("osweets-cart-v1")));
    assert.equal(cart.length, 1);
    assert.equal(cart[0].slug, "kaak-warka");
    return { missingLineRemoved: true, otherLinePreserved: true };
  });
} finally {
  writeFileSync(
    `${output}/browser-results.json`,
    JSON.stringify({ base, results, pageErrors: errors }, null, 2),
  );
  console.log(JSON.stringify({ results, pageErrors: errors }, null, 2));
  await browser.close();
}
process.exitCode = results.some((r) => r.status !== "OK") || errors.length ? 1 : 0;
