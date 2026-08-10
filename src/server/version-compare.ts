/**
 * Shared semantic-version helpers extracted from version-status.ts.
 *
 * `compareVersions` preserves the exact prerelease semantics that the global
 * version snapshot service used: a release build sorts after any prerelease of
 * the same core version, numeric prerelease identifiers sort numerically, and
 * numeric identifiers sort before alphanumeric ones.
 */

export function normalizeVersion(rawVersion: string | null | undefined): string | null {
  if (!rawVersion) {
    return null;
  }

  const trimmed = rawVersion.trim();
  if (!trimmed) {
    return null;
  }

  return trimmed.replace(/^v/i, '');
}

export function splitVersion(version: string): { segments: number[]; prerelease: string[] } {
  const normalized = normalizeVersion(version) ?? '0.0.0';
  const [core, prerelease = ''] = normalized.split('-', 2);
  const segments = core
    .split('.')
    .map((segment) => Number.parseInt(segment, 10))
    .map((segment) => Number.isFinite(segment) ? segment : 0);

  while (segments.length < 3) {
    segments.push(0);
  }

  return {
    segments,
    prerelease: prerelease ? prerelease.split('.') : [],
  };
}

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

    if (leftIsNumber !== rightIsNumber) {
      return leftIsNumber ? -1 : 1;
    }

    if (leftPart !== rightPart) {
      return leftPart > rightPart ? 1 : -1;
    }
  }

  return 0;
}
