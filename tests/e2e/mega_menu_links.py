"""E2E: vérifie que chaque lien du méga-menu ouvre le bon catalogue/filtre
sans erreur de route (404 root ou route non résolue).

Lancement local : python3 tests/e2e/mega_menu_links.py
Requiert : dev server sur http://localhost:8080 et Playwright Python (déjà installé).
"""

import asyncio
import os
import sys

from playwright.async_api import async_playwright

BASE = os.environ.get("BASE_URL", "http://localhost:8080")

LINKS = [
    # Pâtisserie Tunisienne
    "/patisserie",
    "/patisserie?cat=amandes",
    "/patisserie?cat=pistache-machmoum-pignon",
    "/patisserie?cat=tradition",
    "/patisserie?cat=fekia",
    "/patisserie?cat=perles",
    "/patisserie?cat=mignardises",
    "/patisserie?cat=plateaux-mixtes",
    "/patisserie?cat=assortiments",
    # Gâteaux
    "/gateaux",
    "/gateaux/cakes",
    "/gateaux/cheesecake",
    "/gateaux/tiramisu",
    "/gateaux/tartes",
    "/gateaux/fraisier",
    "/gateaux/verrines",
    "/gateaux/cupcakes",
    "/gateaux/cookies",
    "/gateaux/anniversaire",
    "/gateaux/anniversaire/personnaliser",
    "/gateaux/mariage-piece-montee",
    # Coffrets
    "/composer",
    '/composer?size="6"',
    '/composer?size="12"',
    '/composer?size="18"',
    '/composer?size="24"',
    '/composer?size="36"',
    '/composer?size="48"',
    # Épicerie
    "/epicerie-salee",
    "/epicerie-salee?cat=tartinables",
    "/epicerie-salee?cat=huiles",
    "/epicerie-salee?cat=vinaigres",
    "/epicerie-salee?cat=epices",
    "/epicerie-salee?cat=antipasti",
    # Cadeaux
    "/cadeaux",
    "/cadeaux/anniversaire",
    "/cadeaux/naissance",
    "/cadeaux/remerciement",
    "/cadeaux/maitre-maitresse",
    "/cadeaux/fete-des-meres",
    "/cadeaux/fete-des-peres",
    # Événements
    "/evenements",
    "/evenements/mariage",
    "/evenements/fiancailles",
    "/evenements/anniversaire",
    "/evenements/baby-shower",
    "/evenements/gender-reveal",
    "/evenements/entreprise",
    "/evenements/ramadan",
    "/evenements/aid",
    # La Maison
    "/la-maison",
    "/contact",
    "/devis",
]


async def main() -> int:
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        ctx = await browser.new_context(viewport={"width": 1280, "height": 900})
        page = await ctx.new_page()

        failures = []
        for path in LINKS:
            url = BASE + path
            ok, reason = True, ""
            try:
                resp = await page.goto(url, wait_until="domcontentloaded", timeout=15000)
                status = resp.status if resp else 0
                if status >= 400:
                    ok, reason = False, f"HTTP {status}"
                else:
                    # 404 SPA : root notFoundComponent affiche un <h1>404</h1>.
                    is_404 = await page.locator("h1", has_text="404").first.is_visible()
                    if is_404:
                        ok, reason = False, "Rendered 404"
            except Exception as e:  # noqa: BLE001
                ok, reason = False, str(e).splitlines()[0]

            tag = "OK  " if ok else "FAIL"
            suffix = f"  — {reason}" if reason else ""
            print(f"{tag}  {path}{suffix}")
            if not ok:
                failures.append((path, reason))

        await browser.close()

        print(f"\n{len(LINKS) - len(failures)}/{len(LINKS)} liens OK")
        if failures:
            print("\nÉchecs :")
            for path, reason in failures:
                print(f"  - {path} → {reason}")
            return 1
        return 0


if __name__ == "__main__":
    sys.exit(asyncio.run(main()))
