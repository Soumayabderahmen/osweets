export interface CollectionVisibilityInput {
  published?: boolean;
  hidden?: boolean;
  emptyBehavior?: "soon" | "hide" | string;
  empty_behavior?: "soon" | "hide" | string;
}

export function isCollectionPublic(input: CollectionVisibilityInput): boolean {
  return input.published !== false && input.hidden !== true;
}

export function collectionEmptyBehavior(input: CollectionVisibilityInput): "soon" | "hide" {
  return (input.emptyBehavior ?? input.empty_behavior) === "hide" ? "hide" : "soon";
}

export function shouldShowCollection(
  input: CollectionVisibilityInput,
  visibleProductCount: number,
) {
  if (!isCollectionPublic(input)) return false;
  if (collectionEmptyBehavior(input) === "hide" && visibleProductCount <= 0) return false;
  return true;
}

export function firstVisibleCollections<T extends CollectionVisibilityInput>(
  collections: T[],
  countFor: (collection: T) => number,
  limit = 4,
): T[] {
  return collections.filter((c) => shouldShowCollection(c, countFor(c))).slice(0, limit);
}
