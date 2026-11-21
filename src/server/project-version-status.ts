import { execOpenSpec } from './openspec-cli.js';
import { createProjectRegistry, type ProjectEntry } from './project-registry.js';
import { detectProjectGenerationVersion } from './skill-scanner.js';
import { compareVersions, normalizeVersion } from './version-compare.js';
import { createVersionSnapshotService, type VersionSnapshotService } from './version-status.js';

export type ProjectVersionUpdateStatus = 'up-to-date' | 'update-available' | 'legacy-cleanup' | 'unknown';
export type MachineSkillsStatus = 'up-to-date' | 'update-available' | 'unknown';

export interface ProjectVersionStatusEntry {
  path: string;
  generationVersion: string | null;
  currentVersion: string | null;
  status: ProjectVersionUpdateStatus;
  /** 2.x only: number of project files the dry run would change. */
  changedFiles?: number;
}

export interface ProjectVersionStatusSnapshot {
  currentCliVersion: string | null;
  checkedAt: string | null;
  projects: ProjectVersionStatusEntry[];
  machineSkills: { status: MachineSkillsStatus };
}

/** Parsed `openspec update --dry-run --json` result, or null when the run failed. */
export interface UpdateDryRunResult {
  changedFiles: number;
  notes: string[];
}

export interface ProjectVersionStatusService {
  getSnapshot(): ProjectVersionStatusSnapshot;
  refresh(): Promise<ProjectVersionStatusSnapshot>;
}

export interface ProjectVersionStatusDependencies {
  listProjects: () => readonly ProjectEntry[];
  detectGenerationVersion: (projectRoot: string) => Promise<string | null>;
  runUpdateDryRun: (projectRoot: string) => Promise<UpdateDryRunResult | null>;
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

const UPDATE_DRY_RUN_TIMEOUT_MS = 10_000;
const UPDATE_DRY_RUN_CONCURRENCY = 3;

/**
 * Parse the stdout of `openspec update --dry-run --json`. stderr is never
 * consulted; leading non-JSON stdout lines are skipped. Returns null for unparseable
 * output or a run that reports failures.
 */
export function parseUpdateDryRunOutput(stdout: string): UpdateDryRunResult | null {
  // The CLI can print warnings (e.g. `.codex` "Unable to check if directory
  // exists") on stdout before the JSON; skip leading non-JSON lines.
  const lines = stdout.split('\n');
  const start = lines.findIndex((line) => line.trimStart().startsWith('{'));
  if (start < 0) return null;
  let parsed: unknown;
  try {
    parsed = JSON.parse(lines.slice(start).join('\n'));
  } catch {
    return null;
  }
  if (!parsed || typeof parsed !== 'object') return null;
  const { changes, notes, failures } = parsed as Record<string, unknown>;
  if (!Array.isArray(changes)) return null;
  if (Array.isArray(failures) && failures.length > 0) return null;
  const codes = Array.isArray(notes)
    ? notes
        .map((note) => (note && typeof note === 'object' ? (note as { code?: unknown }).code : undefined))
        .filter((code): code is string => typeof code === 'string')
    : [];
  return { changedFiles: changes.length, notes: codes };
}

function runUpdateDryRunWithCli(projectRoot: string): Promise<UpdateDryRunResult | null> {
  return new Promise((resolvePromise) => {
    execOpenSpec(
      ['update', '--dry-run', '--json'],
      { cwd: projectRoot, timeout: UPDATE_DRY_RUN_TIMEOUT_MS },
      (error, stdout) => {
        if (error) {
          resolvePromise(null);
          return;
        }
        resolvePromise(parseUpdateDryRunOutput(stdout ?? ''));
      }
    );
  });
}

async function mapWithConcurrency<T, R>(
  items: readonly T[],
  limit: number,
  fn: (item: T) => Promise<R>
): Promise<R[]> {
  const results = new Array<R>(items.length);
  let next = 0;
  async function worker(): Promise<void> {
    while (next < items.length) {
      const index = next++;
      results[index] = await fn(items[index]);
    }
  }
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, worker));
  return results;
}

function cliMajor(version: string | null): number | null {
  if (version === null) return null;
  const major = Number.parseInt(version.split('.')[0] ?? '', 10);
  return Number.isFinite(major) ? major : null;
}

function resolveDryRunStatus(result: UpdateDryRunResult | null): ProjectVersionUpdateStatus {
  if (result === null) return 'unknown';
  if (result.changedFiles > 0) return 'update-available';
  if (result.notes.includes('legacy-artifacts')) return 'legacy-cleanup';
  return 'up-to-date';
}

function resolveMachineSkillsStatus(results: readonly (UpdateDryRunResult | null)[]): MachineSkillsStatus {
  const succeeded = results.filter((result): result is UpdateDryRunResult => result !== null);
  if (succeeded.some((result) => result.notes.includes('global-skills'))) return 'update-available';
  return succeeded.length > 0 ? 'up-to-date' : 'unknown';
}

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
    machineSkills: { ...snapshot.machineSkills },
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
    runUpdateDryRun: options.deps?.runUpdateDryRun ?? runUpdateDryRunWithCli,
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
    machineSkills: { status: 'unknown' },
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

    const major = cliMajor(currentCliVersion);
    if (major !== null && major >= 2) {
      const results = await mapWithConcurrency(projects, UPDATE_DRY_RUN_CONCURRENCY, async (project) => {
        try {
          return await deps.runUpdateDryRun(project.path);
        } catch {
          return null;
        }
      });
      snapshot = {
        currentCliVersion,
        checkedAt,
        projects: projects.map((project, index) => {
          const result = results[index];
          const entry: ProjectVersionStatusEntry = {
            path: project.path,
            generationVersion: null,
            currentVersion: currentCliVersion,
            status: resolveDryRunStatus(result),
          };
          if (result) entry.changedFiles = result.changedFiles;
          return entry;
        }),
        machineSkills: { status: resolveMachineSkillsStatus(results) },
      };
      return cloneSnapshot(snapshot);
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
      machineSkills: { status: 'unknown' },
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
