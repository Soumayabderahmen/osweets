export function parseFrenchNumber(value: string | number | null | undefined): number | null {
  if (typeof value === "number") return Number.isFinite(value) ? value : null;
  const raw = String(value ?? "")
    .trim()
    .replace(/\s+/g, "")
    .replace(",", ".");
  if (!raw) return null;
  const n = Number(raw);
  return Number.isFinite(n) ? n : null;
}

export function parseFrenchPrice(value: string | number | null | undefined): number | null {
  const n = parseFrenchNumber(value);
  return n === null ? null : Math.round(n * 100) / 100;
}

export function isStrictlyPositivePrice(value: string | number | null | undefined): boolean {
  const n = parseFrenchPrice(value);
  return n !== null && n > 0;
}
