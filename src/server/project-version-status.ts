import { createProjectRegistry, type ProjectEntry } from './project-registry.js';
import { detectProjectGenerationVersion } from './skill-scanner.js';
import { compareVersions, normalizeVersion } from './version-compare.js';
import { createVersionSnapshotService, type VersionSnapshotService } from './version-status.js';

export type ProjectVersionUpdateStatus = 'up-to-date' | 'update-available' | 'unknown';

export interface ProjectVersionStatusEntry {
  path: string;
  generationVersion: string | null;
  currentVersion: string | null;
  status: ProjectVersionUpdateStatus;
}

export interface ProjectVersionStatusSnapshot {
  currentCliVersion: string | null;
  checkedAt: string | null;
  projects: ProjectVersionStatusEntry[];
}

export interface ProjectVersionStatusService {
  getSnapshot(): ProjectVersionStatusSnapshot;
  refresh(): Promise<ProjectVersionStatusSnapshot>;
}

export interface ProjectVersionStatusDependencies {
  listProjects: () => readonly ProjectEntry[];
  detectGenerationVersion: (projectRoot: string) => Promise<string | null>;
  versionSnapshotService: Pick<VersionSnapshotService, 'getSnapshot' | 'refresh'>;
  now: () => Date;
}

export interface CreateProjectVersionStatusServiceOptions {
  autoStart?: boolean;
  deps?: Partial<ProjectVersionStatusDependencies>;
}

type VersionSnapshotSource = Pick<VersionSnapshotService, 'getSnapshot' | 'refresh'>;

let defaultProjectRegistry: ReturnType<typeof createProjectRegistry> | null = null;
let defaultVersionSnapshotService: VersionSnapshotService | null = null;

function readCurrentCliVersion(versionSnapshotService: VersionSnapshotSource): string | null {
  return normalizeVersion(versionSnapshotService.getSnapshot().tools.openspec.currentVersion);
}

/**
 * Derive the per-project update status from the detected generation version
 * and the current global CLI version. Mirrors the frontend foundation:
 * generation >= current is up-to-date, generation < current is update-available,
 * and a missing generation version (or missing baseline) is unknown.
 */
function resolveProjectStatus(
  generationVersion: string | null,
  currentCliVersion: string | null
): ProjectVersionUpdateStatus {
  if (generationVersion === null || currentCliVersion === null) {
    return 'unknown';
  }

  return compareVersions(generationVersion, currentCliVersion) >= 0 ? 'up-to-date' : 'update-available';
}

function cloneSnapshot(snapshot: ProjectVersionStatusSnapshot): ProjectVersionStatusSnapshot {
  return {
    currentCliVersion: snapshot.currentCliVersion,
    checkedAt: snapshot.checkedAt,
    projects: snapshot.projects.map((entry) => ({ ...entry })),
  };
}

/**
 * Create the per-project version status service. It consumes the read-only
 * skill scanner, the registered-project listing, and the existing
 * VersionSnapshotService's OpenSpec current CLI version.
 *
 * To avoid the startup race (the global snapshot's CLI version may still be
 * loading), refresh() first reads the cached version snapshot; when the CLI
 * version is not yet available it awaits `versionSnapshotService.refresh()`
 * (already in-flight-deduped upstream) before deriving statuses. A still-missing
 * CLI version keeps every entry's `status` at `unknown` (and `currentVersion`
 * null) while preserving any detectable `generationVersion`.
 */
export function createProjectVersionStatusService(
  options: CreateProjectVersionStatusServiceOptions = {}
): ProjectVersionStatusService {
  const deps: ProjectVersionStatusDependencies = {
    listProjects:
      options.deps?.listProjects ??
      (() => {
        defaultProjectRegistry ??= createProjectRegistry();
        return defaultProjectRegistry.listProjects();
      }),
    detectGenerationVersion: options.deps?.detectGenerationVersion ?? detectProjectGenerationVersion,
    versionSnapshotService:
      options.deps?.versionSnapshotService ??
      (() => {
        defaultVersionSnapshotService ??= createVersionSnapshotService();
        return defaultVersionSnapshotService;
      })(),
    now: options.deps?.now ?? (() => new Date()),
  };

  let snapshot: ProjectVersionStatusSnapshot = {
    currentCliVersion: null,
    checkedAt: null,
    projects: [],
  };
  let refreshPromise: Promise<ProjectVersionStatusSnapshot> | null = null;

  async function runRefresh(): Promise<ProjectVersionStatusSnapshot> {
    const checkedAt = deps.now().toISOString();

    let projects: readonly ProjectEntry[] = [];
    try {
      projects = deps.listProjects();
    } catch {
      projects = [];
    }

    let currentCliVersion: string | null = null;
    try {
      currentCliVersion = readCurrentCliVersion(deps.versionSnapshotService);
      if (currentCliVersion === null) {
        await deps.versionSnapshotService.refresh();
        currentCliVersion = readCurrentCliVersion(deps.versionSnapshotService);
      }
    } catch {
      currentCliVersion = null;
    }

    const entries = await Promise.all(
      projects.map(async (project): Promise<ProjectVersionStatusEntry> => {
        let generationVersion: string | null = null;
        try {
          generationVersion = normalizeVersion(await deps.detectGenerationVersion(project.path));
        } catch {
          generationVersion = null;
        }

        return {
          path: project.path,
          generationVersion,
          currentVersion: currentCliVersion,
          status: resolveProjectStatus(generationVersion, currentCliVersion),
        };
      })
    );

    snapshot = {
      currentCliVersion,
      checkedAt,
      projects: entries,
    };
    return cloneSnapshot(snapshot);
  }

  function refresh(): Promise<ProjectVersionStatusSnapshot> {
    if (refreshPromise) {
      return refreshPromise;
    }

    refreshPromise = runRefresh().finally(() => {
      refreshPromise = null;
    });
    return refreshPromise;
  }

  if (options.autoStart !== false) {
    void refresh();
  }

  return {
    getSnapshot() {
      return cloneSnapshot(snapshot);
    },
    refresh,
  };
}
