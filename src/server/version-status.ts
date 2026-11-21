import { createRequire } from 'node:module';

import { execOpenSpec } from './openspec-cli.js';
import { compareVersions, normalizeVersion } from './version-compare.js';

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
  /** Install manager reported by `openspec version --json` (e.g. `npm`), else null. */
  installManager: string | null;
  /** Install scope reported by `openspec version --json` (e.g. `global`), else null. */
  installScope: string | null;
  /** CLI-suggested update command from `openspec version --check --json`, else null. */
  updateCommand: string | null;
}

/** Parsed `openspec version --check --json` output. */
export interface OpenSpecInstallInfo {
  version: string;
  installManager: string | null;
  installScope: string | null;
  latestVersion: string | null;
  updateCommand: string | null;
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
  /** Resolves null when the CLI does not support `version --check --json`. */
  readOpenSpecInstallInfo: () => Promise<OpenSpecInstallInfo | null>;
}

interface CreateVersionSnapshotServiceOptions {
  autoStart?: boolean;
  deps?: Partial<VersionSnapshotDependencies>;
}

const WEBUI_PACKAGE_NAME = 'openspec-webui';
const OPENSPEC_PACKAGE_NAME = '@fission-ai/openspec';
const LOOKUP_TIMEOUT_MS = 3000;
const INSTALL_CHECK_TIMEOUT_MS = 5000;

function createDefaultToolVersionSnapshot(currentVersion: string | null = null): ToolVersionSnapshot {
  return {
    currentVersion,
    latestVersion: null,
    updateAvailable: false,
    status: currentVersion ? 'unknown' : 'unavailable',
    error: null,
    notInstalled: false,
    installManager: null,
    installScope: null,
    updateCommand: null,
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
      installManager: null,
      installScope: null,
      updateCommand: null,
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
      installManager: null,
      installScope: null,
      updateCommand: null,
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
    installManager: null,
    installScope: null,
    updateCommand: null,
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
    execOpenSpec(['--version'], { timeout: LOOKUP_TIMEOUT_MS }, (error, stdout) => {
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

function withInstallInfo(
  snapshot: ToolVersionSnapshot,
  installInfo: OpenSpecInstallInfo | null,
): ToolVersionSnapshot {
  if (!installInfo) return snapshot;
  return {
    ...snapshot,
    installManager: installInfo.installManager,
    installScope: installInfo.installScope,
    updateCommand: installInfo.updateCommand,
  };
}

function optionalString(value: unknown): string | null {
  return typeof value === 'string' && value.trim() ? value.trim() : null;
}

/**
 * Parse `openspec version --check --json`. Leading non-JSON lines are
 * skipped; any unrecognised shape yields null so callers fall back to the
 * `--version` + npm registry path. Manager and scope strings are kept
 * verbatim, never mapped to a guessed command.
 */
export function parseOpenSpecVersionCheckOutput(stdout: string): OpenSpecInstallInfo | null {
  const lines = stdout.split('\n');
  const start = lines.findIndex((line) => line.trimStart().startsWith('{'));
  if (start < 0) return null;
  let parsed: unknown;
  try {
    parsed = JSON.parse(lines.slice(start).join('\n'));
  } catch {
    return null;
  }
  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return null;
  const body = parsed as Record<string, unknown>;
  const version = normalizeVersion(typeof body.version === 'string' ? body.version : null);
  if (!version) return null;
  const install = body.install && typeof body.install === 'object'
    ? body.install as Record<string, unknown>
    : null;
  if (!install) return null;
  const update = body.update && typeof body.update === 'object'
    ? body.update as Record<string, unknown>
    : null;
  return {
    version,
    installManager: optionalString(install.packageManager),
    installScope: optionalString(install.scope),
    latestVersion: normalizeVersion(typeof update?.latest === 'string' ? update.latest : null),
    updateCommand: optionalString(update?.command),
  };
}

async function readOpenSpecInstallInfo(): Promise<OpenSpecInstallInfo | null> {
  return new Promise((resolve) => {
    execOpenSpec(['version', '--check', '--json'], { timeout: INSTALL_CHECK_TIMEOUT_MS }, (error, stdout) => {
      if (error) {
        resolve(null);
        return;
      }
      resolve(parseOpenSpecVersionCheckOutput(stdout ?? ''));
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
    // An injected `readOpenSpecVersion` without an install reader means the
    // caller stubs the CLI; do not spawn the real one for the install check.
    readOpenSpecInstallInfo: options.deps?.readOpenSpecInstallInfo
      ?? (options.deps?.readOpenSpecVersion ? async () => null : readOpenSpecInstallInfo),
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

      const openSpecLookup = (async () => {
        const installInfo = await deps.readOpenSpecInstallInfo().catch(() => null);
        const [versionResult, latestResult] = await Promise.allSettled([
          installInfo ? Promise.resolve(installInfo.version) : deps.readOpenSpecVersion(),
          installInfo?.latestVersion
            ? Promise.resolve(installInfo.latestVersion)
            : deps.fetchLatestPackageVersion(OPENSPEC_PACKAGE_NAME),
        ]);
        return { installInfo, versionResult, latestResult };
      })();

      const [webUiLatestResult] = await Promise.allSettled([
        deps.fetchLatestPackageVersion(WEBUI_PACKAGE_NAME),
      ]);
      const {
        installInfo,
        versionResult: openSpecVersionResult,
        latestResult: openSpecLatestResult,
      } = await openSpecLookup;

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
          openspec: withInstallInfo(resolveToolVersionSnapshot({
            currentVersion: openSpecCurrentVersion,
            latestVersion: openSpecLatestVersion,
            error: openSpecCurrentError ?? openSpecLatestError,
            notInstalled: openSpecNotInstalled,
          }), installInfo),
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
