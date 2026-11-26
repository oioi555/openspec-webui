/**
 * Browser-side cache of local path existence, batched into path-status requests.
 * See openspec change `refine-markdown-link-targets` (design decision 2).
 */

export const PATH_STATUS_CHUNK_SIZE = 200;

/** `true`/`false` = checked, `null` = server did not check (outside the project). */
export type PathStatus = boolean | null;

export interface PathStatusState {
  statuses: Record<string, PathStatus>;
}

export interface PathStatusControllerDeps {
  state: PathStatusState;
  fetchStatuses(paths: string[]): Promise<Record<string, PathStatus>>;
  /** Defer a flush; defaults to queueMicrotask. */
  schedule?(callback: () => void): void;
}

export function createPathStatusController(deps: PathStatusControllerDeps) {
  const schedule = deps.schedule ?? ((callback: () => void) => queueMicrotask(callback));
  let queued = new Set<string>();
  const pending = new Set<string>();
  let flushScheduled = false;
  let generation = 0;

  async function flush() {
    flushScheduled = false;
    const batch = [...queued];
    queued = new Set();
    const requestGeneration = generation;

    for (let index = 0; index < batch.length; index += PATH_STATUS_CHUNK_SIZE) {
      const chunk = batch.slice(index, index + PATH_STATUS_CHUNK_SIZE);
      let statuses: Record<string, PathStatus>;
      try {
        statuses = await deps.fetchStatuses(chunk);
      } catch {
        // Older servers or transient errors: treat as unknown so links behave as before.
        statuses = Object.fromEntries(chunk.map((path) => [path, null]));
      }

      for (const path of chunk) {
        pending.delete(path);
      }

      if (requestGeneration !== generation) {
        return;
      }

      const next = { ...deps.state.statuses };
      for (const path of chunk) {
        next[path] = statuses[path] ?? null;
      }
      deps.state.statuses = next;
    }
  }

  return {
    get(path: string): PathStatus | undefined {
      return deps.state.statuses[path];
    },

    request(paths: Iterable<string>) {
      for (const path of paths) {
        if (path in deps.state.statuses || pending.has(path)) {
          continue;
        }
        pending.add(path);
        queued.add(path);
      }

      if (queued.size > 0 && !flushScheduled) {
        flushScheduled = true;
        schedule(() => {
          void flush();
        });
      }
    },

    clear() {
      generation += 1;
      pending.clear();
      queued = new Set();
      deps.state.statuses = {};
    },
  };
}
