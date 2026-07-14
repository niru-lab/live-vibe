/**
 * Central client-side block filter helpers (Phase 0).
 * NOTE: This is a UX/client filter only. Real enforcement requires
 * Phase 1 (triggers) and Phase 2 (RLS) on the backend.
 */

export type BlockedSet = Set<string> | null | undefined;

export const isAuthorBlocked = (authorId: string | null | undefined, blocked: BlockedSet): boolean => {
  if (!authorId || !blocked) return false;
  return blocked.has(authorId);
};

export const filterByAuthor = <T>(
  items: T[] | undefined | null,
  blocked: BlockedSet,
  getAuthorId: (item: T) => string | null | undefined,
): T[] => {
  if (!items) return [];
  if (!blocked || blocked.size === 0) return items;
  return items.filter((it) => {
    const id = getAuthorId(it);
    return !id || !blocked.has(id);
  });
};
