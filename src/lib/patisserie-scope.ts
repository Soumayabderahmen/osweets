const OTHER_UNIVERSES = new Set(["cake", "coffret", "sale", "pack-fiancailles", "anniversaire"]);

export function isPatisserieCategory(category?: string): boolean {
  return Boolean(category) && !OTHER_UNIVERSES.has(category!);
}

export function filterPatisserieRows<T extends { category: string }>(rows: readonly T[]): T[] {
  return rows.filter((row) => isPatisserieCategory(row.category));
}
