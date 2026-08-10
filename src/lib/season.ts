// Seasonal availability logic for Ramadan / Aïd products.
// Windows include a small pre-order lead time before the season starts.
import type { Product, ProductCollection } from "@/data/products";

type Window = { start: string; end: string }; // YYYY-MM-DD inclusive

// Approximate Hijri calendar mapped to Gregorian dates for the next few years.
// Ramadan window + Aïd al-Fitr and Aïd al-Adha combined into an "aid" window.
const RAMADAN: Window[] = [
  { start: "2026-02-10", end: "2026-03-19" },
  { start: "2027-01-31", end: "2027-03-09" },
  { start: "2028-01-20", end: "2028-02-26" },
];

const AID: Window[] = [
  // Aïd al-Fitr (pre-order lead time -7j → +3j)
  { start: "2026-03-13", end: "2026-03-23" },
  { start: "2027-03-02", end: "2027-03-12" },
  { start: "2028-02-19", end: "2028-03-01" },
  // Aïd al-Adha
  { start: "2026-05-20", end: "2026-05-30" },
  { start: "2027-05-09", end: "2027-05-19" },
  { start: "2028-04-27", end: "2028-05-07" },
];

function inWindow(now: Date, windows: Window[]): boolean {
  const t = now.getTime();
  return windows.some(
    (w) => t >= new Date(w.start).getTime() && t <= new Date(w.end + "T23:59:59").getTime(),
  );
}

/** Manual override via localStorage (dev/marketing preview): `os_season=ramadan|aid|none`. */
function readOverride(): "ramadan" | "aid" | "none" | null {
  if (typeof window === "undefined") return null;
  try {
    const v = window.localStorage.getItem("os_season");
    if (v === "ramadan" || v === "aid" || v === "none") return v;
  } catch {}
  return null;
}

export function isRamadanActive(now: Date = new Date()): boolean {
  const ov = readOverride();
  if (ov) return ov === "ramadan";
  return inWindow(now, RAMADAN);
}

export function isAidActive(now: Date = new Date()): boolean {
  const ov = readOverride();
  if (ov) return ov === "aid";
  return inWindow(now, AID);
}

/** True if the product should be publicly listed right now. */
export function isProductAvailableNow(p: Product, now: Date = new Date()): boolean {
  if (!p.seasonalOnly) return true;
  const cols = (p.collections ?? []) as ProductCollection[];
  if (cols.includes("ramadan") && isRamadanActive(now)) return true;
  if (cols.includes("aid") && isAidActive(now)) return true;
  return false;
}

/** Filter a list of products to hide seasonal items outside their period. */
export function filterAvailable(list: Product[], now: Date = new Date()): Product[] {
  return list.filter((p) => isProductAvailableNow(p, now));
}

/** Human-readable notice for a seasonal product currently unavailable. */
export function seasonalNotice(p: Product): string | null {
  if (!p.seasonalOnly) return null;
  if (isProductAvailableNow(p)) return null;
  const cols = (p.collections ?? []) as ProductCollection[];
  if (cols.includes("ramadan") && cols.includes("aid")) {
    return "Édition saisonnière — disponible uniquement pendant Ramadan et l'Aïd.";
  }
  if (cols.includes("ramadan")) {
    return "Édition Ramadan — de retour à l'approche du mois sacré.";
  }
  if (cols.includes("aid")) {
    return "Édition Aïd — de retour à l'approche de l'Aïd.";
  }
  return "Édition saisonnière — actuellement hors saison.";
}
