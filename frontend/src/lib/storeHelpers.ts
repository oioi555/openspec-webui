import type { ProjectEntry, StoreRecord } from './types/api';

/**
 * Unified row in the flat project selector list.
 * Merges WebUI project and CLI Store metadata into one selectable entry.
 */
export interface UnifiedProjectRow {
  /** Canonical normalized root path used as dedup key */
  canonicalRoot: string;
  /** WebUI project id if registered, null for store-only rows */
  projectId: string | null;
  /** Display label — project label if available, otherwise derived from root */
  label: string;
  /** Absolute normalized root path */
  path: string;
  /** Store id if this root is a registered CLI Store */
  storeId: string | null;
  /** True if the store-only row has not yet been added as a WebUI project */
  isStoreOnly: boolean;
  /** Store id from active project's pointerStoreId if this store is the pointer target */
  pointsToStoreId: string | null;
  /** Number of references if the active project references this store */
  referenceCount: number;
}

/**
 * Normalize a path for canonical comparison.
 * Strips trailing separators and normalizes to lowercase on case-insensitive
 * systems. Since backend already normalizes, we just strip trailing / or \.
 */
export function normalizeCanonicalRoot(path: string): string {
  let normalized = path;
  while (normalized.length > 1 && (normalized.endsWith('/') || normalized.endsWith('\\'))) {
    normalized = normalized.slice(0, -1);
  }
  return normalized;
}

/**
 * Build a unified flat list of project rows from WebUI projects and CLI Store records.
 * Merges by canonical root path so shared roots appear as exactly one row.
 *
 * Relationship badges are derived from each ProjectEntry's own API fields:
 * - A project with `pointerStoreId` shows "Points to: <id>" on ITS row
 * - A project with `referenceStoreIds` shows "References: N" on ITS row
 * - Target Store rows and Store-only CLI rows do NOT inherit declaring project badges
 */
export function mergeUnifiedProjectList(
  projects: ProjectEntry[],
  stores: StoreRecord[],
): UnifiedProjectRow[] {
  const rowMap = new Map<string, UnifiedProjectRow>();

  // First pass: add all WebUI projects with their own relationship facts
  for (const project of projects) {
    const canonicalRoot = normalizeCanonicalRoot(project.path);
    const existing = rowMap.get(canonicalRoot);

    const pointsToStoreId = project.pointerStoreId ?? null;
    const referenceCount = project.referenceStoreIds?.length ?? 0;

    if (existing) {
      // Merge: prefer project metadata
      existing.projectId = project.id;
      existing.label = project.label;
      existing.isStoreOnly = false;
      // Apply this project's own relationship facts
      existing.pointsToStoreId = pointsToStoreId;
      existing.referenceCount = referenceCount;
    } else {
      rowMap.set(canonicalRoot, {
        canonicalRoot,
        projectId: project.id,
        label: project.label,
        path: project.path,
        storeId: null,
        isStoreOnly: false,
        pointsToStoreId,
        referenceCount,
      });
    }
  }

  // Second pass: add/merge CLI Store records
  for (const store of stores) {
    const canonicalRoot = normalizeCanonicalRoot(store.root);
    const existing = rowMap.get(canonicalRoot);

    if (existing) {
      // Merge: add store metadata to existing project row
      existing.storeId = store.id;
      existing.isStoreOnly = false; // has a project entry
    } else {
      // Store-only: no WebUI project entry — no relationship facts
      rowMap.set(canonicalRoot, {
        canonicalRoot,
        projectId: null,
        label: deriveLabelFromRoot(store.root),
        path: store.root,
        storeId: store.id,
        isStoreOnly: true,
        pointsToStoreId: null,
        referenceCount: 0,
      });
    }
  }

  return Array.from(rowMap.values());
}

/**
 * Derive a display label from a root path.
 * Uses the last directory segment.
 */
export function deriveLabelFromRoot(root: string): string {
  const normalized = normalizeCanonicalRoot(root);
  const segments = normalized.split(/[/\\]/);
  return segments[segments.length - 1] || normalized;
}

/**
 * Resolve a store id to its root path from the unified rows or store records.
 */
export function resolveStoreRoot(
  storeId: string,
  rows: UnifiedProjectRow[],
  stores: StoreRecord[],
): string | null {
  // Check unified rows first
  for (const row of rows) {
    if (row.storeId === storeId) {
      return row.canonicalRoot;
    }
  }
  // Fallback to raw store records
  for (const store of stores) {
    if (store.id === storeId) {
      return normalizeCanonicalRoot(store.root);
    }
  }
  return null;
}

/**
 * Check if a project is a Store root (its path matches any registered Store).
 */
export function isStoreRoot(
  projectPath: string,
  stores: StoreRecord[],
): boolean {
  const canonical = normalizeCanonicalRoot(projectPath);
  return stores.some((store) => normalizeCanonicalRoot(store.root) === canonical);
}

/**
 * Derive the store relationship for the active project.
 */
export function resolveStoreRelationship(
  project: { path: string; pointerStoreId: string | null; referenceStoreIds: string[] } | null,
  stores: StoreRecord[],
): {
  isStoreRoot: boolean;
  pointerStoreId: string | null;
  pointerStoreRoot: string | null;
  referenceStoreIds: string[];
  hasRelationship: boolean;
} {
  if (!project) {
    return {
      isStoreRoot: false,
      pointerStoreId: null,
      pointerStoreRoot: null,
      referenceStoreIds: [],
      hasRelationship: false,
    };
  }

  const storeRoot = isStoreRoot(project.path, stores);
  const pointerStoreId = project.pointerStoreId;
  const pointerStoreRoot = pointerStoreId ? resolveStoreRoot(pointerStoreId, [], stores) : null;
  const referenceStoreIds = project.referenceStoreIds;

  return {
    isStoreRoot: storeRoot,
    pointerStoreId,
    pointerStoreRoot,
    referenceStoreIds,
    hasRelationship: storeRoot || pointerStoreId !== null || referenceStoreIds.length > 0,
  };
}
