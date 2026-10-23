/**
 * Dix vérifications, sur le site qui tourne et sur la vraie base.
 *
 * Une seule question, posée dix fois : ce que je change au back-office,
 * la cliente le voit-elle — sans qu'on touche au code ?
 *
 * Chaque contrôle modifie réellement PostgreSQL, relit la page servie,
 * puis remet la base exactement dans l'état où il l'a trouvée. Le
 * rétablissement passe par un `finally` : même une vérification qui casse
 * en cours de route ne laisse pas la boutique de travers.
 *
 *   npm run dev            (dans un autre terminal)
 *   npm run validation
 *   npm run validation -- --url http://127.0.0.1:8081   (autre port)
 *
 * Sortie 0 = tout est piloté depuis le back-office.
 * Sortie 1 = au moins une décision est encore écrite dans le code.
 */
import pg from "pg";
import { guardTestData } from "./test-data-guard.mjs";
import { dbConfig, describe, loadEnv } from "./db-env.mjs";

loadEnv();

/*
 * L'adresse de la boutique. Trois façons de la donner, de la plus
 * explicite à la moins : `--url`, la variable SITE_URL, puis le port
 * habituel. `recette` accepte déjà `--url` ; les deux scripts se disent
 * maintenant de la même façon.
 */
const B = (() => {
  const i = process.argv.indexOf("--url");
  const donne = i >= 0 ? process.argv[i + 1] : process.env.SITE_URL;
  return (donne || "http://127.0.0.1:8080").replace(/\/$/, "");
})();
const client = new pg.Client(dbConfig());

let total = 0;
const echecs = [];
let titreCourant = "";
let verifyRestored;

function verifier(libelle, ok) {
  total++;
  if (!ok) echecs.push(`${titreCourant} — ${libelle}`);
  console.log(`  ${ok ? "✓" : "✗"} ${libelle}`);
}

/** Le HTML servi, débarrassé de ce que React et l'échappement y ajoutent. */
async function page(chemin) {
  const r = await fetch(B + chemin);
  const t = await r.text();
  return t
    .replace(/<!--[^>]*-->/g, "")
    .replace(/ /g, " ")
    .replace(/&#x27;/g, "'")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"');
}

const q = (sql, params) => client.query(sql, params);
const une = async (sql, params) => (await q(sql, params)).rows[0];

/** Un contrôle : son titre, ce qu'il fait, ce qu'il remet en place. */
async function controle(titre, fn) {
  titreCourant = titre;
  console.log(`\n${titre}`);
  await fn();
}

/**
 * Avant toute chose : qui répond, et sert-il le code d'aujourd'hui ?
 *
 * Un serveur laissé ouvert depuis une session précédente répond
 * parfaitement — avec l'ancienne version. Les contrôles échouaient alors
 * en bloc, et le rapport accusait le code neuf de fautes qu'il ne
 * commettait plus. On refuse maintenant de commencer dans ce cas, et on
 * dit lequel des trois problèmes on a rencontré.
 */
async function preflight() {
  let r;
  try {
    r = await fetch(B + "/");
  } catch {
    console.log(
      `Rien ne répond sur ${B}.\n` +
        "Lancez « npm run dev » dans un autre terminal, puis relancez ce contrôle.",
    );
    process.exit(1);
  }
  if (!r.ok) {
    console.log(
      `${B} répond ${r.status}, ce n'est pas la boutique.\n` +
        "Un autre programme occupe peut-être ce port. Arrêtez-le et lancez « npm run dev ».",
    );
    process.exit(1);
  }

  // Une fiche réelle, pour lire ce que le serveur en cours produit vraiment.
  const p = await une(
    `SELECT slug, name FROM public.products
      WHERE archived = false AND published = true
        AND array_length(ingredients, 1) > 0
      ORDER BY slug LIMIT 1`,
  );
  if (!p) return; // rien à comparer : on laisse les contrôles parler
  const h = await page(`/produits/${p.slug}`);

  if (!h.includes(p.name)) {
    console.log(
      `${B} répond, mais ne sert pas la fiche « ${p.name} ».\n` +
        "Le serveur est peut-être en cours de démarrage, ou en erreur : regardez\n" +
        "le terminal où tourne « npm run dev », puis relancez ce contrôle.",
    );
    process.exit(1);
  }

  // « Ingrédients » était un bloc à part ; il a fusionné dans « Composition ».
  // Le voir encore signifie qu'un ancien serveur répond à la place du neuf.
  if (/>Ingrédients</.test(h)) {
    console.log(
      "Le serveur qui répond sert une ANCIENNE version du site.\n" +
        "  (la fiche affiche encore un bloc « Ingrédients » séparé)\n\n" +
        "Arrêtez-le — Ctrl+C dans le terminal où il tourne, et fermez toute\n" +
        "autre fenêtre qui aurait lancé le site — puis relancez :\n" +
        "  npm run dev\n" +
        "et rejouez ce contrôle. Sans cela, les vérifications jugeraient\n" +
        "l'ancien code et vous rendraient un rapport faux.",
    );
    process.exit(1);
  }
}

// ════════════════════════════════════════════════════════════════════

async function main() {
  console.log(`Base : ${describe(dbConfig())}`);
  console.log(`Site : ${B}\n`);
  await client.connect();
  verifyRestored = await guardTestData(client);

  await preflight();

  // ─────────────────────────────────────────── 1. archiver un produit
  await controle("1. Un produit archivé disparaît partout", async () => {
    const p = await une(
      `SELECT id, slug, archived FROM public.products
        WHERE archived = false AND published = true
          AND category IN ('traditionnelle','orientale','petits-fours')
        ORDER BY slug LIMIT 1`,
    );
    try {
      verifier(`${p.slug} est en boutique`, (await page(`/produits/${p.slug}`)).includes(p.slug));
      await q("UPDATE public.products SET archived = true WHERE id = $1", [p.id]);
      const r = await fetch(`${B}/produits/${p.slug}`);
      verifier("sa fiche ne répond plus", r.status === 404);
      verifier(
        "il quitte la page complète",
        !(await page("/patisserie?vue=%22tout%22")).includes(`/produits/${p.slug}"`),
      );
    } finally {
      await q("UPDATE public.products SET archived = $2 WHERE id = $1", [p.id, p.archived]);
    }
  });

  // ──────────────────────────────────── 2. tarifs de livraison
  await controle("2. Les tarifs de livraison viennent des Réglages", async () => {
    /*
     * Le récapitulatif de commande ne s'affiche qu'avec un panier, que ce
     * contrôle ne peut pas remplir sans navigateur. On vérifie donc les
     * deux bouts de la chaîne : le tarif au kilomètre tel qu'il s'écrit
     * sur une fiche livrée en local, et le prix du colis tel qu'il part
     * vers le navigateur — c'est la valeur que le panier additionnera.
     */
    const avant = Object.fromEntries(
      (await q("SELECT key, value FROM public.settings")).rows.map((r) => [r.key, r.value]),
    );
    const p = await une(
      `SELECT id, slug, local_only FROM public.products
        WHERE archived=false AND published=true
          AND category IN ('traditionnelle','orientale','petits-fours')
        ORDER BY slug LIMIT 1`,
    );
    const poser = async (k, v) =>
      q(
        `INSERT INTO public.settings (key, value) VALUES ($1, $2)
         ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value`,
        [k, v],
      );
    try {
      await poser("shipping_price", "14.90");
      await poser("delivery_per_km", "3.50");
      await q("UPDATE public.products SET local_only=true WHERE id=$1", [p.id]);
      const h = await page(`/produits/${p.slug}`);
      verifier("la fiche annonce 3,50 €/km", h.includes("3,50 €/km"));
      verifier(
        "le prix du colis servi à la boutique est 14,90 €",
        /shippingPrice\s*:\s*14\.9\b/.test(h),
      );
    } finally {
      await q("UPDATE public.products SET local_only=$2 WHERE id=$1", [p.id, p.local_only]);
      for (const k of ["shipping_price", "delivery_per_km"]) {
        if (avant[k] !== undefined) await poser(k, avant[k]);
      }
    }
  });

  // ──────────────────────────────────── 3. emballage cadeau
  await controle("3. L'emballage cadeau est facturé au prix réglé", async () => {
    const avant = (await une("SELECT value FROM public.settings WHERE key='gift_wrap_price'"))
      ?.value;
    const p = await une(
      `SELECT slug FROM public.products
        WHERE archived=false AND published=true
          AND category IN ('traditionnelle','orientale','petits-fours')
        ORDER BY slug LIMIT 1`,
    );
    try {
      await q("UPDATE public.settings SET value='7.50' WHERE key='gift_wrap_price'");
      const h = await page(`/produits/${p.slug}`);
      verifier("la fiche annonce 7,50 €", h.includes("7,50"));
      verifier("elle n'annonce plus 5,00 €", !/emballage premium \+5,00/i.test(h));
    } finally {
      if (avant !== undefined)
        await q("UPDATE public.settings SET value=$1 WHERE key='gift_wrap_price'", [avant]);
    }
  });

  // ──────────────────────────────────── 4. le menu suit les collections
  await controle("4. Une collection neuve entre au menu sans code", async () => {
    /*
     * Le menu déroulant de l'en-tête ne s'ouvre qu'au navigateur : il
     * n'est pas dans la page servie. Le pied de page, lui, y est — et il
     * lit exactement la même liste de collections. C'est donc lui qu'on
     * interroge ici, et il répond pour les deux.
     */
    try {
      await q(
        `INSERT INTO public.collections (product_key, slug, label, h1, title, description, published, sort_order)
         VALUES ('validation','validation','Validation','Validation','Validation','test',true, 990)
         ON CONFLICT (slug) DO UPDATE SET published = true`,
      );
      let h = await page("/");
      verifier("elle apparaît dans le pied de page", h.includes('href="/patisserie/validation"'));
      verifier("sous le nom saisi", h.includes(">Validation</a>"));
      await q("UPDATE public.collections SET label='Validation renommée' WHERE slug='validation'");
      h = await page("/");
      verifier("la renommer change le lien", h.includes(">Validation renommée</a>"));
      await q("UPDATE public.collections SET published=false WHERE slug='validation'");
      h = await page("/");
      verifier("dépubliée, elle disparaît", !h.includes('href="/patisserie/validation"'));
    } finally {
      await q("DELETE FROM public.collections WHERE slug='validation'");
    }
  });

  // ──────────────────────────────────── 5. le SEO d'une fiche
  await controle("5. Le SEO d'une fiche obéit au back-office", async () => {
    const p = await une(
      `SELECT slug, name, short_desc, seo_title, seo_description FROM public.products
        WHERE archived=false AND published=true ORDER BY slug LIMIT 1`,
    );
    const titre = (h) => (h.match(/<title[^>]*>([^<]*)<\/title>/) || [, ""])[1];
    try {
      await q("UPDATE public.products SET seo_title=NULL, seo_description=NULL WHERE slug=$1", [
        p.slug,
      ]);
      let h = await page(`/produits/${p.slug}`);
      verifier("sans titre saisi, le nom du produit sert", titre(h).includes(p.name));
      await q("UPDATE public.products SET seo_title='Titre du back-office' WHERE slug=$1", [
        p.slug,
      ]);
      h = await page(`/produits/${p.slug}`);
      verifier("le titre saisi prime", titre(h) === "Titre du back-office");
    } finally {
      await q("UPDATE public.products SET seo_title=$2, seo_description=$3 WHERE slug=$1", [
        p.slug,
        p.seo_title,
        p.seo_description,
      ]);
    }
  });

  // ──────────────────────────────────── 6. le calendrier des fêtes
  await controle("6. Une fête ajoutée ouvre sa collection", async () => {
    const p = await une(
      `SELECT id, slug, seasonal_only FROM public.products
        WHERE archived=false AND published=true AND 'ramadan' = ANY(collections)
        ORDER BY slug LIMIT 1`,
    );
    const visible = async () => (await page("/patisserie/ramadan")).includes(`/produits/${p.slug}`);
    const jour = (n) => {
      const d = new Date();
      d.setDate(d.getDate() + n);
      return d.toISOString().slice(0, 10);
    };
    try {
      await q("UPDATE public.products SET seasonal_only=true WHERE id=$1", [p.id]);
      verifier("hors fenêtre, le produit saisonnier est retiré", !(await visible()));
      await q(
        `INSERT INTO public.seasons (season_key, label, starts_on, ends_on)
         VALUES ('ramadan', 'Contrôle de validation', $1, $2)`,
        [jour(-1), jour(1)],
      );
      verifier("une fenêtre ouverte le remet en boutique", await visible());
      await q("UPDATE public.seasons SET active=false WHERE label='Contrôle de validation'");
      verifier("la fenêtre désactivée le retire", !(await visible()));
    } finally {
      await q("DELETE FROM public.seasons WHERE label='Contrôle de validation'");
      await q("UPDATE public.products SET seasonal_only=$2 WHERE id=$1", [p.id, p.seasonal_only]);
    }
  });

  // ──────────────────────────────────── 7. les familles
  await controle("7. Les familles viennent de la table families", async () => {
    const paire = (
      await q(
        `SELECT slug, family FROM public.products
        WHERE archived=false AND published=true
          AND category IN ('traditionnelle','orientale','petits-fours')
        ORDER BY slug LIMIT 2`,
      )
    ).rows;
    try {
      await q(
        `INSERT INTO public.families (key, label, description, sort_order)
         VALUES ('validation', 'Famille de contrôle', '', 990)
         ON CONFLICT (key) DO UPDATE SET label = EXCLUDED.label`,
      );
      await q("UPDATE public.products SET family='validation' WHERE slug = ANY($1)", [
        paire.map((x) => x.slug),
      ]);
      let h = await page(`/produits/${paire[0].slug}`);
      verifier("le nom de la famille est celui de la base", h.includes("Famille de contrôle"));
      await q("UPDATE public.families SET label='Famille renommée' WHERE key='validation'");
      h = await page(`/produits/${paire[0].slug}`);
      verifier("le renommer change la fiche", h.includes("Famille renommée"));
    } finally {
      await q("UPDATE public.products SET family=NULL WHERE family='validation'");
      for (const x of paire)
        await q("UPDATE public.products SET family=$2 WHERE slug=$1", [x.slug, x.family]);
      await q("DELETE FROM public.families WHERE key='validation'");
    }
  });

  // ──────────────────────────────────── 8. renommer une fiche
  await controle("8. Renommer une fiche ne casse pas son adresse", async () => {
    const p = await une(
      `SELECT id, slug FROM public.products
        WHERE archived=false AND published=true
          AND category IN ('traditionnelle','orientale','petits-fours')
        ORDER BY slug LIMIT 1`,
    );
    const neuf = `${p.slug}-controle`;
    const oldHistory = await une("SELECT * FROM public.product_slug_history WHERE old_slug=$1", [
      p.slug,
    ]);
    const conflict = await une("SELECT id FROM public.products WHERE slug=$1", [neuf]);
    if (conflict) throw new Error("Le slug de contrôle existe déjà.");
    try {
      await q("UPDATE public.products SET slug=$2 WHERE id=$1", [p.id, neuf]);
      const memoire = await une(
        "SELECT old_slug FROM public.product_slug_history WHERE old_slug=$1",
        [p.slug],
      );
      verifier("l'ancienne adresse est mémorisée toute seule", Boolean(memoire));
      const r = await fetch(`${B}/produits/${p.slug}`, { redirect: "manual" });
      verifier(
        "elle redirige en 301 vers la nouvelle",
        r.status === 301 && (r.headers.get("location") ?? "").endsWith(`/produits/${neuf}`),
      );
    } finally {
      await q("UPDATE public.products SET slug=$2 WHERE id=$1", [p.id, p.slug]);
      await q("DELETE FROM public.product_slug_history WHERE old_slug=$1", [neuf]);
      if (!oldHistory)
        await q("DELETE FROM public.product_slug_history WHERE old_slug=$1", [p.slug]);
    }
  });

  // ──────────────────────────────────── 9. la fiche produit
  await controle("9. La fiche ne dit plus que ce qui est vérifié", async () => {
    const p = await une(
      `SELECT slug, conservation FROM public.products
        WHERE archived=false AND published=true
          AND category IN ('traditionnelle','orientale','petits-fours')
        ORDER BY slug LIMIT 1`,
    );
    try {
      const h = await page(`/produits/${p.slug}`);
      verifier("un seul bloc Composition", (h.match(/>Composition</g) ?? []).length === 1);
      verifier("plus de bloc Ingrédients séparé", !/>Ingrédients</.test(h));
      verifier("plus d'allergènes affirmés", !h.includes("Aucun allergène déclaré"));
      verifier("plus de phrase réfrigérateur pour tous", !/réfrigérateur 1 heure avant/.test(h));
      verifier("plus de « Paiement sécurisé »", !h.includes("Paiement sécurisé"));
      await q("UPDATE public.products SET conservation='' WHERE slug=$1", [p.slug]);
      verifier(
        "sans conservation saisie, rien n'est inventé",
        !/Conseils de conservation/.test(await page(`/produits/${p.slug}`)),
      );
    } finally {
      await q("UPDATE public.products SET conservation=$2 WHERE slug=$1", [p.slug, p.conservation]);
    }
  });

  // ──────────────────────────────────── 10. le sitemap
  await controle("10. Le sitemap se construit depuis PostgreSQL", async () => {
    const { execSync } = await import("node:child_process");
    const { readFileSync } = await import("node:fs");
    const { root } = await import("./db-env.mjs");
    const chemins = () => {
      const xml = readFileSync(`${root}/public/sitemap.xml`, "utf8");
      return new Set([...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => new URL(m[1]).pathname));
    };
    const generer = () => {
      execSync("node scripts/generate-sitemap.mjs", { cwd: root, stdio: "pipe" });
      return chemins();
    };
    const p = await une(
      `SELECT slug, archived FROM public.products
        WHERE archived=false AND published=true
          AND category IN ('traditionnelle','orientale','petits-fours')
        ORDER BY slug LIMIT 1`,
    );
    try {
      let u = generer();
      verifier(`${p.slug} est au sitemap`, u.has(`/produits/${p.slug}`));
      await q("UPDATE public.products SET archived=true WHERE slug=$1", [p.slug]);
      await q(
        `INSERT INTO public.collections (product_key, slug, label, h1, title, description, published, sort_order)
         VALUES ('validation','validation','Validation','Validation','Validation','test',true, 990)
         ON CONFLICT (slug) DO UPDATE SET published = true`,
      );
      u = generer();
      verifier("archivé, il en sort", !u.has(`/produits/${p.slug}`));
      verifier("une collection neuve y entre", u.has("/patisserie/validation"));
    } finally {
      await q("UPDATE public.products SET archived=$2 WHERE slug=$1", [p.slug, p.archived]);
      await q("DELETE FROM public.collections WHERE slug='validation'");
      generer();
    }
  });

  // ════════════════════════════════════════════════════════════════
  console.log(`\n${total} vérification(s), ${echecs.length} échec(s).`);
  if (echecs.length === 0) {
    console.log("Tout ce qui a été changé en base s'est vu en boutique, sans toucher au code.");
  } else {
    console.log("\nÀ reprendre :");
    for (const e of echecs) console.log(`  · ${e}`);
  }
  return echecs.length === 0 ? 0 : 1;
}

main()
  .then(async (code) => {
    await verifyRestored?.();
    await client.end();
    process.exit(code);
  })
  .catch(async (e) => {
    console.error("\n" + String(e?.stack ?? e));
    console.error("\nLa base peut être restée modifiée : relancez le contrôle après correction.");
    await verifyRestored?.().catch((error) => console.error("RESTORATION FAILED:", error.message));
    await client.end().catch(() => {});
    process.exit(1);
  });
