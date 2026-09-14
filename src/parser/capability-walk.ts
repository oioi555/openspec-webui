import { readdir, stat } from 'fs/promises';
import { join, relative } from 'path';

export interface CapabilitySpecLocation {
  /** Posix-relative capability identity from the specs/ root (e.g. `network/auth`). */
  name: string;
  /** Absolute path of the capability directory. */
  path: string;
  /** Absolute path of that directory's direct `spec.md`. */
  specPath: string;
}

/**
 * Recursively discover directories that directly contain `spec.md` under a
 * `specs/` root. Empty parent directories and dot-directories are skipped;
 * missing `spec.md` files are omitted without error.
 */
export async function discoverCapabilitySpecs(
  specsPath: string
): Promise<CapabilitySpecLocation[]> {
  const locations: CapabilitySpecLocation[] = [];
  await walkCapabilitySpecs(specsPath, specsPath, locations);
  return locations;
}

async function walkCapabilitySpecs(
  specsPath: string,
  currentPath: string,
  locations: CapabilitySpecLocation[]
): Promise<void> {
  const entries = await readdir(currentPath, { withFileTypes: true });

  for (const entry of entries) {
    if (!entry.isDirectory()) {
      continue;
    }

    // Skip dot-directories (e.g. `.git`, `.hidden`) like the CLI does.
    if (entry.name.startsWith('.')) {
      continue;
    }

    const childPath = join(currentPath, entry.name);
    const specPath = join(childPath, 'spec.md');

    let hasDirectSpec = false;
    try {
      const specStat = await stat(specPath);
      hasDirectSpec = specStat.isFile();
    } catch {
      hasDirectSpec = false;
    }

    if (hasDirectSpec) {
      locations.push({
        name: relative(specsPath, childPath).split(/[\\/]/).join('/'),
        path: childPath,
        specPath,
      });
    }

    // Recurse into nested directories regardless of whether this directory
    // itself is a capability, so deeper `spec.md` files are still discovered.
    await walkCapabilitySpecs(specsPath, childPath, locations);
  }
}
