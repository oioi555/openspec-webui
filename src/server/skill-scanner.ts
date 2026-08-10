import { readFile, readdir } from 'node:fs/promises';
import { join } from 'node:path';

import { parseDocument } from 'yaml';

/**
 * Standard skill roots that the OpenSpec CLI generates for representative AI
 * tools, in detection order. The first skill file whose frontmatter records
 * `metadata.generatedBy` wins for the project.
 *
 * `.github/skills` is the repository-standard GitHub Copilot skill root (the
 * same one catalogued in tool-integration-detection.ts); `.github/copilot/skills`
 * is retained as a compatibility fallback for tooling that uses the older path.
 */
export const SKILL_ROOTS: readonly string[] = [
  '.claude/skills',
  '.opencode/skills',
  '.github/skills',
  '.github/copilot/skills',
];

export const SKILL_FILE_NAME = 'SKILL.md';

/**
 * Read `metadata.generatedBy` from an already-parsed skill frontmatter object.
 * Returns null when the value is absent, not a string, or blank.
 */
export function extractGeneratedBy(value: unknown): string | null {
  if (!value || typeof value !== 'object') {
    return null;
  }

  const record = value as Record<string, unknown>;
  if (!record.metadata || typeof record.metadata !== 'object') {
    return null;
  }

  const generatedBy = (record.metadata as Record<string, unknown>).generatedBy;
  if (typeof generatedBy !== 'string') {
    return null;
  }

  const trimmed = generatedBy.trim();
  return trimmed || null;
}

/**
 * Detect the OpenSpec generation version of a project by scanning the
 * representative skill roots for a SKILL.md whose frontmatter records
 * `metadata.generatedBy`. Detection is read-only: it only lists directories
 * and reads files. The first readable `generatedBy` wins; absent, malformed,
 * or unreadable files are skipped, and a project with no detectable marker
 * yields null.
 */
export async function detectProjectGenerationVersion(projectRoot: string): Promise<string | null> {
  for (const skillRoot of SKILL_ROOTS) {
    const rootPath = join(projectRoot, skillRoot);
    const skillDirectories = await listSubdirectories(rootPath);
    if (!skillDirectories) {
      continue;
    }

    for (const skillDirectory of skillDirectories) {
      const skillFilePath = join(rootPath, skillDirectory, SKILL_FILE_NAME);
      const content = await readSkillFile(skillFilePath);
      if (content === null) {
        continue;
      }

      const generatedBy = readGeneratedBy(content);
      if (generatedBy !== null) {
        return generatedBy;
      }
    }
  }

  return null;
}

function readGeneratedBy(content: string): string | null {
  const frontmatter = extractFrontmatter(content);
  if (frontmatter === null) {
    return null;
  }

  try {
    const document = parseDocument(frontmatter);
    if (document.errors.length > 0) {
      return null;
    }

    return extractGeneratedBy(document.toJS());
  } catch {
    return null;
  }
}

function extractFrontmatter(content: string): string | null {
  const lines = content.split(/\r?\n/);
  if ((lines[0] ?? '').trim() !== '---') {
    return null;
  }

  for (let index = 1; index < lines.length; index += 1) {
    if ((lines[index] ?? '').trim() === '---') {
      return lines.slice(1, index).join('\n');
    }
  }

  return null;
}

async function listSubdirectories(dir: string): Promise<string[] | null> {
  try {
    const entries = await readdir(dir, { withFileTypes: true });
    return entries
      .filter((entry) => entry.isDirectory())
      .map((entry) => entry.name)
      .sort();
  } catch {
    return null;
  }
}

async function readSkillFile(filePath: string): Promise<string | null> {
  try {
    return await readFile(filePath, 'utf8');
  } catch {
    return null;
  }
}
