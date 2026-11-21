import type { BrowseDirEntry } from './types/api';

export const DIRECTORY_LIST_LIMIT = 200;

export interface VisibleDirectories {
  /** Entries to render (sorted, filtered, limited). */
  visible: BrowseDirEntry[];
  /** All entries matching the filter, before the limit. */
  matchCount: number;
  /** Matching entries hidden by the limit. */
  hiddenCount: number;
}

/**
 * OpenSpec-first stable sort, then case-insensitive name filter, then limit.
 */
export function deriveVisibleDirectories(
  dirs: readonly BrowseDirEntry[],
  filter: string,
  limit: number = DIRECTORY_LIST_LIMIT,
): VisibleDirectories {
  const ordered = [
    ...dirs.filter((dir) => dir.hasOpenSpec),
    ...dirs.filter((dir) => !dir.hasOpenSpec),
  ];
  const needle = filter.trim().toLowerCase();
  const matches = needle ? ordered.filter((dir) => dir.name.toLowerCase().includes(needle)) : ordered;
  const visible = matches.slice(0, limit);
  return { visible, matchCount: matches.length, hiddenCount: matches.length - visible.length };
}
