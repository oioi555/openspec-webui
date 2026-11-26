import { createSpecTreeExpansionStore } from './specTreeExpansionCore';

export { SPEC_TREE_STORAGE_KEY } from './specTreeExpansionCore';

/** Reactive wrapper around the Specs panel folder expansion core store. */
function createReactiveSpecTreeExpansionStore() {
  const core = createSpecTreeExpansionStore();
  let version = $state(0);

  function bump() {
    version += 1;
  }

  return {
    /** Expanded folder paths for a project; reading it tracks changes. */
    expandedFor(projectId: string): Set<string> {
      void version;
      return core.getExpanded(projectId);
    },
    toggle(projectId: string, path: string) {
      core.toggle(projectId, path);
      bump();
    },
    expand(projectId: string, path: string) {
      if (core.isExpanded(projectId, path)) return;
      core.expandMany(projectId, [path]);
      bump();
    },
    collapse(projectId: string, path: string) {
      if (!core.isExpanded(projectId, path)) return;
      core.toggle(projectId, path);
      bump();
    },
    expandMany(projectId: string, paths: Iterable<string>) {
      const before = core.getExpanded(projectId).size;
      core.expandMany(projectId, paths);
      if (core.getExpanded(projectId).size !== before) bump();
    },
    prune(projectId: string, existingFolderPaths: Iterable<string>) {
      const before = core.getExpanded(projectId).size;
      core.prune(projectId, existingFolderPaths);
      if (core.getExpanded(projectId).size !== before) bump();
    },
  };
}

export const specTreeExpansionStore = createReactiveSpecTreeExpansionStore();
