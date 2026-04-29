import { execFile } from 'node:child_process';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const packageJson = require('../../package.json') as {
  version: string;
};

export type VersionStatus = 'up-to-date' | 'update-available' | 'unavailable' | 'unknown';

export interface ToolVersionSnapshot {
  currentVersion: string | null;
  latestVersion: string | null;
  updateAvailable: boolean;
  status: VersionStatus;
  error: string | null;
  notInstalled: boolean;
}

export interface VersionSnapshot {
  loading: boolean;
  checkedAt: string | null;
  tools: {
    webui: ToolVersionSnapshot;
    openspec: ToolVersionSnapshot;
  };
}

export interface VersionSnapshotService {
  getSnapshot(): VersionSnapshot;
  refresh(): Promise<VersionSnapshot>;
}

interface VersionSnapshotDependencies {
  fetchLatestPackageVersion: (packageName: string) => Promise<string>;
  getWebUiCurrentVersion: () => string;
  now: () => Date;
  readOpenSpecVersion: () => Promise<string>;
}

interface CreateVersionSnapshotServiceOptions {
  autoStart?: boolean;
  deps?: Partial<VersionSnapshotDependencies>;
}

const WEBUI_PACKAGE_NAME = 'openspec-webui';
const OPENSPEC_PACKAGE_NAME = '@fission-ai/openspec';
const LOOKUP_TIMEOUT_MS = 3000;

function createDefaultToolVersionSnapshot(currentVersion: string | null = null): ToolVersionSnapshot {
  return {
    currentVersion,
    latestVersion: null,
    updateAvailable: false,
    status: currentVersion ? 'unknown' : 'unavailable',
    error: null,
    notInstalled: false,
  };
}

function cloneToolVersionSnapshot(snapshot: ToolVersionSnapshot): ToolVersionSnapshot {
  return { ...snapshot };
}

function cloneVersionSnapshot(snapshot: VersionSnapshot): VersionSnapshot {
  return {
    loading: snapshot.loading,
    checkedAt: snapshot.checkedAt,
    tools: {
      webui: cloneToolVersionSnapshot(snapshot.tools.webui),
      openspec: cloneToolVersionSnapshot(snapshot.tools.openspec),
    },
  };
}

function normalizeVersion(rawVersion: string | null | undefined): string | null {
  if (!rawVersion) {
    return null;
  }

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
    .map((segment) => Number.isFinite(segment) ? segment : 0);

  while (segments.length < 3) {
    segments.push(0);
  }

  return {
    segments,
    prerelease: prerelease ? prerelease.split('.') : [],
  };
}

function compareVersions(left: string, right: string): number {
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

function resolveToolVersionSnapshot(options: {
  currentVersion: string | null;
  latestVersion: string | null;
  error?: string | null;
  notInstalled?: boolean;
}): ToolVersionSnapshot {
  const { currentVersion, latestVersion, error = null, notInstalled = false } = options;

  if (!currentVersion) {
    return {
      currentVersion: null,
      latestVersion,
      updateAvailable: false,
      status: 'unavailable',
      error,
      notInstalled,
    };
  }

  if (!latestVersion) {
    return {
      currentVersion,
      latestVersion: null,
      updateAvailable: false,
      status: 'unknown',
      error,
      notInstalled,
    };
  }

  const updateAvailable = compareVersions(currentVersion, latestVersion) < 0;

  return {
    currentVersion,
    latestVersion,
    updateAvailable,
    status: updateAvailable ? 'update-available' : 'up-to-date',
    error,
    notInstalled,
  };
}

async function fetchLatestPackageVersion(packageName: string): Promise<string> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), LOOKUP_TIMEOUT_MS);

  try {
    const response = await fetch(`https://registry.npmjs.org/${encodeURIComponent(packageName)}`, {
      signal: controller.signal,
    });

    if (!response.ok) {
      throw new Error(`npm registry request failed with status ${response.status}`);
    }

    const body = await response.json() as {
      'dist-tags'?: {
        latest?: unknown;
      };
    };

    const latestVersion = normalizeVersion(typeof body['dist-tags']?.latest === 'string' ? body['dist-tags'].latest : null);
    if (!latestVersion) {
      throw new Error('npm registry response did not include dist-tags.latest');
    }

    return latestVersion;
  } finally {
    clearTimeout(timeoutId);
  }
}

async function readOpenSpecVersion(): Promise<string> {
  return new Promise((resolve, reject) => {
    execFile('openspec', ['--version'], { timeout: LOOKUP_TIMEOUT_MS }, (error, stdout) => {
      if (error) {
        reject(error);
        return;
      }

      const version = normalizeVersion(stdout);
      if (!version) {
        reject(new Error('OpenSpec CLI did not return a version string'));
        return;
      }

      resolve(version);
    });
  });
}

function isCommandNotFoundError(error: unknown): boolean {
  return Boolean(
    error &&
    typeof error === 'object' &&
    'code' in error &&
    (error as { code?: unknown }).code === 'ENOENT'
  );
}

function formatLookupError(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

export function createVersionSnapshotService(
  options: CreateVersionSnapshotServiceOptions = {}
): VersionSnapshotService {
  const deps: VersionSnapshotDependencies = {
    fetchLatestPackageVersion: options.deps?.fetchLatestPackageVersion ?? fetchLatestPackageVersion,
    getWebUiCurrentVersion: options.deps?.getWebUiCurrentVersion ?? (() => normalizeVersion(packageJson.version) ?? '0.0.0'),
    now: options.deps?.now ?? (() => new Date()),
    readOpenSpecVersion: options.deps?.readOpenSpecVersion ?? readOpenSpecVersion,
  };

  let refreshPromise: Promise<VersionSnapshot> | null = null;
  let snapshot: VersionSnapshot = {
    loading: false,
    checkedAt: null,
    tools: {
      webui: createDefaultToolVersionSnapshot(deps.getWebUiCurrentVersion()),
      openspec: createDefaultToolVersionSnapshot(),
    },
  };

  async function refresh(): Promise<VersionSnapshot> {
    if (refreshPromise) {
      return refreshPromise;
    }

    snapshot = {
      ...snapshot,
      loading: true,
      tools: {
        webui: {
          ...snapshot.tools.webui,
          currentVersion: deps.getWebUiCurrentVersion(),
          error: null,
        },
        openspec: {
          ...snapshot.tools.openspec,
          error: null,
          notInstalled: false,
        },
      },
    };

    refreshPromise = (async () => {
      const currentWebUiVersion = deps.getWebUiCurrentVersion();

      const [webUiLatestResult, openSpecVersionResult, openSpecLatestResult] = await Promise.allSettled([
        deps.fetchLatestPackageVersion(WEBUI_PACKAGE_NAME),
        deps.readOpenSpecVersion(),
        deps.fetchLatestPackageVersion(OPENSPEC_PACKAGE_NAME),
      ]);

      const webUiLatestVersion = webUiLatestResult.status === 'fulfilled'
        ? normalizeVersion(webUiLatestResult.value)
        : null;
      const webUiError = webUiLatestResult.status === 'rejected'
        ? formatLookupError(webUiLatestResult.reason)
        : null;

      const openSpecCurrentVersion = openSpecVersionResult.status === 'fulfilled'
        ? normalizeVersion(openSpecVersionResult.value)
        : null;
      const openSpecNotInstalled = openSpecVersionResult.status === 'rejected' && isCommandNotFoundError(openSpecVersionResult.reason);
      const openSpecCurrentError = openSpecVersionResult.status === 'rejected'
        ? openSpecNotInstalled
          ? 'OpenSpec CLI is not installed'
          : formatLookupError(openSpecVersionResult.reason)
        : null;

      const openSpecLatestVersion = openSpecLatestResult.status === 'fulfilled'
        ? normalizeVersion(openSpecLatestResult.value)
        : null;
      const openSpecLatestError = openSpecLatestResult.status === 'rejected'
        ? formatLookupError(openSpecLatestResult.reason)
        : null;

      snapshot = {
        loading: false,
        checkedAt: deps.now().toISOString(),
        tools: {
          webui: resolveToolVersionSnapshot({
            currentVersion: currentWebUiVersion,
            latestVersion: webUiLatestVersion,
            error: webUiError,
          }),
          openspec: resolveToolVersionSnapshot({
            currentVersion: openSpecCurrentVersion,
            latestVersion: openSpecLatestVersion,
            error: openSpecCurrentError ?? openSpecLatestError,
            notInstalled: openSpecNotInstalled,
          }),
        },
      };

      return cloneVersionSnapshot(snapshot);
    })().finally(() => {
      refreshPromise = null;
    });

    return refreshPromise;
  }

  if (options.autoStart !== false) {
    void refresh();
  }

  return {
    getSnapshot() {
      return cloneVersionSnapshot(snapshot);
    },
    refresh,
  };
}
