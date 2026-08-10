import { readdir, readFile, stat } from 'fs/promises';
import { join, relative } from 'path';
import type { Spec, ParseResult } from '../shared/types.js';

/**
 * Parse all specs from the specs/ directory, discovering capability specs
 * recursively over `specs/**&#47;spec.md` at any depth in addition to top-level
 * `specs/<capability>/spec.md` files.
 *
 * A directory that directly contains a `spec.md` counts as a capability; a
 * parent directory that contains only nested directories and no direct
 * `spec.md` is not rendered as a capability. Deleted retired spec files are
 * omitted without errors.
 */
export async function parseSpecs(openspecPath: string): Promise<ParseResult<Spec[]>> {
  const errors: string[] = [];
  const warnings: string[] = [];
  const specs: Spec[] = [];

  const specsPath = join(openspecPath, 'specs');

  try {
    await walkSpecsDirectory(specsPath, specsPath, specs, errors, warnings);

    // Sort specs alphabetically by relative capability name
    specs.sort((a, b) => a.name.localeCompare(b.name));

    return { data: specs, errors, warnings };
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
      warnings.push('specs/ directory not found');
      return { data: [], errors, warnings };
    }
    errors.push(`Failed to read specs directory: ${error}`);
    return { data: null, errors, warnings };
  }
}

/**
 * Recursively walk a specs directory. For each directory that directly
 * contains a `spec.md`, parse it as a capability. Directories containing only
 * nested directories (no direct `spec.md`) are skipped as capabilities but
 * still traversed.
 */
async function walkSpecsDirectory(
  specsPath: string,
  currentPath: string,
  specs: Spec[],
  errors: string[],
  warnings: string[]
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
      const relativeName = relative(specsPath, childPath).split(/[\\/]/).join('/');
      const spec = await parseCapability(relativeName, childPath);

      if (spec.data) {
        specs.push(spec.data);
      }
      errors.push(...spec.errors);
      warnings.push(...spec.warnings);
    }

    // Recurse into nested directories regardless of whether this directory
    // itself is a capability, so deeper `spec.md` files are still discovered.
    await walkSpecsDirectory(specsPath, childPath, specs, errors, warnings);
  }
}

/**
 * Parse a single capability directory
 */
async function parseCapability(
  name: string,
  capabilityPath: string
): Promise<ParseResult<Spec>> {
  const errors: string[] = [];
  const warnings: string[] = [];

  const specPath = join(capabilityPath, 'spec.md');
  let specContent = '';

  try {
    specContent = await readFile(specPath, 'utf-8');
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
      warnings.push(`${name}: spec.md not found`);
    } else {
      errors.push(`${name}: Failed to read spec.md: ${error}`);
    }
  }

  // Get the modification time from spec.md
  let lastModified: string | null = null;
  try {
    const specStat = await stat(specPath);
    lastModified = specStat.mtime.toISOString();
  } catch {
    // spec.md doesn't exist
  }

  return {
    data: {
      name,
      path: capabilityPath,
      specContent,
      lastModified,
    },
    errors,
    warnings,
  };
}

/**
 * Parse a single spec by name
 */
export async function parseSpec(
  openspecPath: string,
  specName: string
): Promise<ParseResult<Spec>> {
  const capabilityPath = join(openspecPath, 'specs', specName);

  try {
    const stats = await stat(capabilityPath);
    if (!stats.isDirectory()) {
      return {
        data: null,
        errors: [`${specName} is not a directory`],
        warnings: [],
      };
    }
  } catch (error) {
    return {
      data: null,
      errors: [`Spec ${specName} not found`],
      warnings: [],
    };
  }

  return parseCapability(specName, capabilityPath);
}
