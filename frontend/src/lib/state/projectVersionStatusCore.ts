import type {
  ProjectVersionStatusEntry,
  ProjectVersionStatusResponse,
  ProjectVersionUpdateStatus,
} from '$lib/types/api';

export const PROJECT_UPDATE_COMMAND = 'openspec update';
export const PROJECT_INIT_COMMAND = 'openspec init';

export function isProjectVersionUpdateStatus(value: unknown): value is ProjectVersionUpdateStatus {
  return value === 'up-to-date' || value === 'update-available' || value === 'unknown';
}

/**
 * Defensive per-entry normalization. A well-formed entry is passed through as
 * is; entries without a string path are dropped, and missing versions or an
 * unrecognized status degrade to `null` / `unknown` instead of failing.
 */
export function normalizeProjectVersionStatusEntry(value: unknown): ProjectVersionStatusEntry | null {
  if (!value || typeof value !== 'object') {
    return null;
  }

  const candidate = value as Partial<ProjectVersionStatusEntry>;
  if (typeof candidate.path !== 'string') {
    return null;
  }

  return {
    path: candidate.path,
    generationVersion: typeof candidate.generationVersion === 'string' ? candidate.generationVersion : null,
    currentVersion: typeof candidate.currentVersion === 'string' ? candidate.currentVersion : null,
    status: isProjectVersionUpdateStatus(candidate.status) ? candidate.status : 'unknown',
  };
}

/**
 * Defensive whole-response normalization. `null`/`undefined`/non-object
 * payloads collapse to an empty snapshot so the UI never has to handle a
 * missing `projects` array.
 */
export function normalizeProjectVersionStatusResponse(value: unknown): ProjectVersionStatusResponse {
  if (!value || typeof value !== 'object') {
    return { currentCliVersion: null, checkedAt: null, projects: [] };
  }

  const candidate = value as Partial<ProjectVersionStatusResponse>;
  return {
    currentCliVersion: typeof candidate.currentCliVersion === 'string' ? candidate.currentCliVersion : null,
    checkedAt: typeof candidate.checkedAt === 'string' ? candidate.checkedAt : null,
    projects: Array.isArray(candidate.projects)
      ? candidate.projects
          .map(normalizeProjectVersionStatusEntry)
          .filter((entry): entry is ProjectVersionStatusEntry => entry !== null)
      : [],
  };
}

function normalizeVersion(rawVersion: string): string | null {
  const trimmed = rawVersion.trim();
  if (!trimmed) {
    return null;
  }

  return trimmed.replace(/^v/i, '');
}

function splitVersion(version: string): { segments: number[]; prerelease: string[] } {
  const normalized = normalizeVersion(version) ?? '0.0.0';
  const [core, prerelease = ''] = normalized.split('-', 2);
  const segments = core
    .split('.')
    .map((segment) => Number.parseInt(segment, 10))
    .map((segment) => (Number.isFinite(segment) ? segment : 0));

  while (segments.length < 3) {
    segments.push(0);
  }

  return {
    segments,
    prerelease: prerelease ? prerelease.split('.') : [],
  };
}

/**
 * Semver-style comparison mirroring the shared server helper
 * (`src/server/version-compare.ts`) so the frontend derives the same statuses.
 * Preserves its exact prerelease semantics: a release build sorts after any
 * prerelease of the same core version, numeric prerelease identifiers compare
 * numerically, and numeric identifiers sort before alphanumeric ones.
 */
export function compareVersions(left: string, right: string): number {
  const leftParts = splitVersion(left);
  const rightParts = splitVersion(right);

  for (let index = 0; index < Math.max(leftParts.segments.length, rightParts.segments.length); index += 1) {
    const diff = (leftParts.segments[index] ?? 0) - (rightParts.segments[index] ?? 0);
    if (diff !== 0) {
      return diff > 0 ? 1 : -1;
    }
  }

  if (leftParts.prerelease.length === 0 && rightParts.prerelease.length === 0) {
    return 0;
  }

  if (leftParts.prerelease.length === 0) {
    return 1;
  }

  if (rightParts.prerelease.length === 0) {
    return -1;
  }

  for (let index = 0; index < Math.max(leftParts.prerelease.length, rightParts.prerelease.length); index += 1) {
    const leftPart = leftParts.prerelease[index];
    const rightPart = rightParts.prerelease[index];

    if (leftPart === undefined) {
      return -1;
    }

    if (rightPart === undefined) {
      return 1;
    }

    const leftNumber = Number.parseInt(leftPart, 10);
    const rightNumber = Number.parseInt(rightPart, 10);
    const leftIsNumber = String(leftNumber) === leftPart;
    const rightIsNumber = String(rightNumber) === rightPart;

    if (leftIsNumber && rightIsNumber && leftNumber !== rightNumber) {
      return leftNumber > rightNumber ? 1 : -1;
    }

    // Numeric prerelease identifiers sort before alphanumeric ones.
    if (leftIsNumber !== rightIsNumber) {
      return leftIsNumber ? -1 : 1;
    }

    if (leftPart !== rightPart) {
      return leftPart > rightPart ? 1 : -1;
    }
  }

  return 0;
}

/**
 * Derives the per-project update status. `unknown` whenever either version is
 * missing (matching the "current CLI unavailable → all unknown" contract); the
 * project is `up-to-date` when its generation version is not older than the
 * current CLI version.
 */
export function deriveProjectUpdateStatus(
  generationVersion: string | null | undefined,
  currentCliVersion: string | null | undefined,
): ProjectVersionUpdateStatus {
  if (!generationVersion || !currentCliVersion) {
    return 'unknown';
  }

  return compareVersions(generationVersion, currentCliVersion) >= 0 ? 'up-to-date' : 'update-available';
}

/**
 * Builds `openspec update <path>`, quoting the path with single quotes only
 * when it contains whitespace so the command runs safely in a shell.
 */
export function buildProjectUpdateCommand(path: string): string {
  const quotedPath = /\s/.test(path) ? `'${path}'` : path;
  return `${PROJECT_UPDATE_COMMAND} ${quotedPath}`;
}

/**
 * Builds `openspec init <path>`, quoting the path with single quotes only
 * when it contains whitespace so the command runs safely in a shell.
 */
export function buildToolsInitCommand(path: string): string {
  const quotedPath = /\s/.test(path) ? `'${path}'` : path;
  return `${PROJECT_INIT_COMMAND} ${quotedPath}`;
}
