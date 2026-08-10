"""
Visual regression screenshots at 375, 768, 1024, 1440 for key pages.
Run: python3 tests/e2e/visual_regression.py
Screenshots land in /tmp/browser/visual/<viewport>/<slug>.png
"""
import asyncio
from pathlib import Path
from playwright.async_api import async_playwright

BASE = "http://localhost:8080"
OUT = Path("/tmp/browser/visual")
OUT.mkdir(parents=True, exist_ok=True)

VIEWPORTS = [
    ("375", 375, 1800),
    ("768", 768, 1800),
    ("1024", 1024, 1800),
    ("1440", 1440, 1800),
]

# Pages that exercise ornaments, filter sidebar, product grid
PAGES = [
    ("home", "/"),
    ("patisserie-all", "/patisserie"),
    ("patisserie-amandes", "/patisserie?cat=amandes"),
    ("gateaux", "/gateaux"),
    ("gateaux-cakes", "/gateaux/cakes"),
    ("evenements", "/evenements"),
    ("composer", "/composer"),
]


async def snap(page, name, viewport):
    dest = OUT / viewport / f"{name}.png"
    dest.parent.mkdir(parents=True, exist_ok=True)
    await page.screenshot(path=str(dest))
    print(f"  ✓ {viewport}/{name}.png")


async def main():
    async with async_playwright() as pw:
        browser = await pw.chromium.launch(headless=True)
        results = []
        for label, w, h in VIEWPORTS:
            ctx = await browser.new_context(viewport={"width": w, "height": h})
            page = await ctx.new_page()
            errors = []
            page.on("pageerror", lambda e: errors.append(str(e)))
            print(f"\n[{label}px]")
            for name, path in PAGES:
                try:
                    await page.goto(f"{BASE}{path}", wait_until="networkidle", timeout=15000)
                    await page.wait_for_timeout(400)
                    await snap(page, name, label)
                except Exception as e:
                    print(f"  ✗ {name}: {e}")
                    results.append((label, name, str(e)))
            if errors:
                print(f"  page errors: {errors[:3]}")
                results.append((label, "pageerrors", errors))
            await ctx.close()
        await browser.close()
        print(f"\nDone. {len(results)} issues. Output: {OUT}")


if __name__ == "__main__":
    asyncio.run(main())
