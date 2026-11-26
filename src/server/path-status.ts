import { stat } from 'fs/promises';
import { isAbsolute, relative, resolve } from 'path';

/** Maximum number of paths accepted in one path-status request. */
export const PATH_STATUS_MAX_PATHS = 200;

export class PathStatusRequestError extends Error {}

function isInsideRoot(root: string, target: string): boolean {
  const rel = relative(resolve(root), target);
  return rel === '' || (!rel.startsWith('..') && !isAbsolute(rel));
}

async function defaultExists(path: string): Promise<boolean> {
  try {
    await stat(path);
    return true;
  } catch {
    return false;
  }
}

/** Validate a request body and return its paths. Throws PathStatusRequestError on invalid input. */
export function parsePathStatusBody(body: unknown): string[] {
  const paths = (body as { paths?: unknown } | null | undefined)?.paths;
  if (!Array.isArray(paths) || !paths.every((value) => typeof value === 'string')) {
    throw new PathStatusRequestError('paths must be an array of strings');
  }

  if (paths.length > PATH_STATUS_MAX_PATHS) {
    throw new PathStatusRequestError(`At most ${PATH_STATUS_MAX_PATHS} paths are allowed per request`);
  }

  return paths;
}

/**
 * Report whether each path exists. Only absolute paths inside one of `roots`
 * are checked; every other path is reported as `null` (unknown).
 * Returns existence only, never file contents or metadata.
 */
export async function checkPathStatuses(
  paths: readonly string[],
  roots: readonly string[],
  exists: (path: string) => Promise<boolean> = defaultExists,
): Promise<Record<string, boolean | null>> {
  const statuses: Record<string, boolean | null> = {};

  await Promise.all(
    paths.map(async (path) => {
      if (!path || !isAbsolute(path)) {
        statuses[path] = null;
        return;
      }

      const resolved = resolve(path);
      statuses[path] = roots.some((root) => isInsideRoot(root, resolved)) ? await exists(resolved) : null;
    }),
  );

  return statuses;
}
