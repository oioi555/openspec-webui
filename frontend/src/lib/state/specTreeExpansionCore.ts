/**
 * Framework-free store for the Specs panel folder expansion state, saved per project in localStorage.
 */

export const SPEC_TREE_STORAGE_KEY = 'openspec-specs-tree';

type ExpansionMap = Record<string, string[]>;

type StorageLike = Pick<Storage, 'getItem' | 'setItem'>;

function defaultStorage(): StorageLike | null {
  return typeof localStorage === 'undefined' ? null : localStorage;
}

function normalize(value: unknown): ExpansionMap {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return {};
  const result: ExpansionMap = {};
  for (const [projectId, paths] of Object.entries(value as Record<string, unknown>)) {
    if (!Array.isArray(paths)) continue;
    result[projectId] = [...new Set(paths.filter((path): path is string => typeof path === 'string' && path.length > 0))];
  }
  return result;
}

export function loadSpecTreeExpansion(getStorage: () => StorageLike | null = defaultStorage): ExpansionMap {
  try {
    const stored = getStorage()?.getItem(SPEC_TREE_STORAGE_KEY);
    return stored ? normalize(JSON.parse(stored)) : {};
  } catch {
    return {};
  }
}

export function createSpecTreeExpansionStore(getStorage: () => StorageLike | null = defaultStorage) {
  let state: ExpansionMap = loadSpecTreeExpansion(getStorage);

  function save() {
    try {
      getStorage()?.setItem(SPEC_TREE_STORAGE_KEY, JSON.stringify(state));
    } catch {
      // Ignore storage errors.
    }
  }

  function getExpanded(projectId: string): Set<string> {
    return new Set(state[projectId] ?? []);
  }

  function setExpanded(projectId: string, paths: Iterable<string>) {
    const next = [...new Set(paths)].filter((path) => path.length > 0);
    if (next.length === 0) {
      const { [projectId]: _removed, ...rest } = state;
      state = rest;
    } else {
      state = { ...state, [projectId]: next };
    }
    save();
  }

  return {
    /** Reloads from storage (e.g. after initialization in the browser). */
    initialize() {
      state = loadSpecTreeExpansion(getStorage);
    },
    getExpanded,
    setExpanded,
    isExpanded(projectId: string, path: string): boolean {
      return state[projectId]?.includes(path) ?? false;
    },
    toggle(projectId: string, path: string) {
      const current = getExpanded(projectId);
      if (current.has(path)) current.delete(path);
      else current.add(path);
      setExpanded(projectId, current);
    },
    expandMany(projectId: string, paths: Iterable<string>) {
      const current = getExpanded(projectId);
      const before = current.size;
      for (const path of paths) current.add(path);
      if (current.size !== before) setExpanded(projectId, current);
    },
    /** Drops expanded paths that are not in `existingFolderPaths`. */
    prune(projectId: string, existingFolderPaths: Iterable<string>) {
      const existing = new Set(existingFolderPaths);
      const current = state[projectId] ?? [];
      const kept = current.filter((path) => existing.has(path));
      if (kept.length !== current.length) setExpanded(projectId, kept);
    },
  };
}

export type SpecTreeExpansionStore = ReturnType<typeof createSpecTreeExpansionStore>;
