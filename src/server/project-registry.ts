import { randomUUID } from 'node:crypto';
import { type PathLike } from 'node:fs';
import { mkdir, readFile, rename, stat, writeFile } from 'node:fs/promises';
import { homedir } from 'node:os';
import { basename, dirname, join, resolve } from 'node:path';

import { parseOpenSpec, type OpenSpecData } from '../parser/index.js';
import { createFileWatcher, type FileChangeEvent } from '../watcher/file-watcher.js';
import type { CommandAvailability } from './openspec-config.js';

export const PROJECT_REGISTRY_VERSION = 1;
export const PROJECT_REGISTRY_FILE_NAME = 'projects.json';

export type ProjectRegistryErrorCode =
  | 'ACTIVATION_FAILED'
  | 'INVALID_PROJECT_PATH'
  | 'NO_ACTIVE_PROJECT'
  | 'PROJECT_NOT_FOUND';

export interface ProjectEntry {
  id: string;
  path: string;
  label: string;
  addedAt: number;
  lastOpenedAt: number;
}

export interface ProjectRegistryFile {
  version: number;
  projects: ProjectEntry[];
  activeProjectId: string | null;
}

export interface StructuredApiError {
  code: ProjectRegistryErrorCode;
  error: string;
  metadata?: Record<string, unknown>;
}

export interface AddProjectResult {
  entry: ProjectEntry;
  status: 'created' | 'reactivated';
  activeChanged: boolean;
}

export interface RemoveProjectResult {
  removed: ProjectEntry;
  activeChanged: boolean;
  activeProjectId: string | null;
}

export interface ActivateProjectResult {
  entry: ProjectEntry;
  activeChanged: boolean;
  alreadyActive: boolean;
}

export interface ClearActiveProjectResult {
  activeChanged: boolean;
  previousProjectId: string | null;
}

export interface RegistryPaths {
  configHome: string;
  configDir: string;
  registryFilePath: string;
}

export interface ActiveProjectSession {
  project: ProjectEntry;
  projectRoot: string;
  openspecPath: string;
  data: OpenSpecData;
  watcher: ClosableWatcher;
  refCount: number;
}

export interface ClosableWatcher {
  close(): Promise<unknown>;
}

interface LoggerLike {
  warn: (...args: unknown[]) => void;
  error: (...args: unknown[]) => void;
}

interface StatLike {
  isDirectory(): boolean;
}

interface FileSystemAdapter {
  mkdir(path: PathLike, options?: { recursive?: boolean }): Promise<unknown>;
  readFile(path: PathLike, encoding: BufferEncoding): Promise<string>;
  rename(oldPath: PathLike, newPath: PathLike): Promise<void>;
  stat(path: PathLike): Promise<StatLike>;
  writeFile(path: PathLike, data: string, encoding: BufferEncoding): Promise<void>;
}

interface ProjectRegistryDependencies {
  env: NodeJS.ProcessEnv;
  createWatcher: typeof createFileWatcher;
  fileSystem: FileSystemAdapter;
  getHomeDir: () => string;
  logger: LoggerLike;
  now: () => number;
  onActiveFileChange?: (
    projectId: string,
    event: FileChangeEvent,
    data: OpenSpecData | null
  ) => Promise<void> | void;
  parse: typeof parseOpenSpec;
  randomId: () => string;
}

export interface ProjectRegistryOptions {
  env?: NodeJS.ProcessEnv;
  createWatcher?: typeof createFileWatcher;
  fileSystem?: Partial<FileSystemAdapter>;
  getHomeDir?: () => string;
  logger?: LoggerLike;
  now?: () => number;
  onActiveFileChange?: (
    projectId: string,
    event: FileChangeEvent,
    data: OpenSpecData | null
  ) => Promise<void> | void;
  parse?: typeof parseOpenSpec;
  randomId?: () => string;
}

interface PreparedActivation {
  entry: ProjectEntry;
  session: ActiveProjectSession;
  reused: boolean;
}

interface CachedCommandAvailability {
  projectRoot: string;
  availability: CommandAvailability;
}

function cloneProjectEntry(entry: ProjectEntry): ProjectEntry {
  return { ...entry };
}

const defaultFileSystem: FileSystemAdapter = {
  mkdir,
  readFile,
  rename,
  stat,
  writeFile,
};

export class ProjectRegistryError extends Error {
  readonly code: ProjectRegistryErrorCode;
  readonly metadata?: Record<string, unknown>;
  readonly statusCode: number;

  constructor(
    code: ProjectRegistryErrorCode,
    message: string,
    options: { metadata?: Record<string, unknown>; statusCode?: number } = {}
  ) {
    super(message);
    this.name = 'ProjectRegistryError';
    this.code = code;
    this.metadata = options.metadata;
    this.statusCode = options.statusCode ?? defaultStatusCodeForError(code);
  }

  toResponseBody(): StructuredApiError {
    return toStructuredApiError(this);
  }
}

export function createProjectRegistry(options: ProjectRegistryOptions = {}) {
  return new ProjectRegistry(options);
}

export function createStructuredApiError(
  code: ProjectRegistryErrorCode,
  error: string,
  metadata?: Record<string, unknown>
): StructuredApiError {
  return { code, error, ...(metadata ? { metadata } : {}) };
}

export function createInvalidProjectPathError(
  projectPath: string,
  openspecPath?: string
): ProjectRegistryError {
  return new ProjectRegistryError(
    'INVALID_PROJECT_PATH',
    `OpenSpec project not found at ${projectPath}`,
    { metadata: { path: projectPath, ...(openspecPath ? { openspecPath } : {}) } }
  );
}

export function createProjectNotFoundError(projectId: string): ProjectRegistryError {
  return new ProjectRegistryError('PROJECT_NOT_FOUND', `Project not found: ${projectId}`, {
    metadata: { projectId },
  });
}

export function createNoActiveProjectError(): ProjectRegistryError {
  return new ProjectRegistryError('NO_ACTIVE_PROJECT', 'No active project selected');
}

export function createActivationFailedError(
  message: string,
  metadata?: Record<string, unknown>
): ProjectRegistryError {
  return new ProjectRegistryError('ACTIVATION_FAILED', message, { metadata });
}

export function toStructuredApiError(error: unknown): StructuredApiError {
  if (error instanceof ProjectRegistryError) {
    return createStructuredApiError(error.code, error.message, error.metadata);
  }

  return createStructuredApiError(
    'ACTIVATION_FAILED',
    error instanceof Error ? error.message : 'Unknown project registry error'
  );
}

export function resolveProjectRegistryPaths(
  env: NodeJS.ProcessEnv = process.env,
  getHomeDir: () => string = homedir
): RegistryPaths {
  const configHome = env.XDG_CONFIG_HOME?.trim()
    ? resolve(env.XDG_CONFIG_HOME)
    : resolve(getHomeDir(), '.config');

  const configDir = join(configHome, 'openspec-webui');
  return {
    configHome,
    configDir,
    registryFilePath: join(configDir, PROJECT_REGISTRY_FILE_NAME),
  };
}

export function normalizeProjectRootPath(projectPath: string): string {
  const normalized = resolve(projectPath);
  if (basename(normalized) === 'openspec') {
    return dirname(normalized);
  }
  return normalized;
}

export function getOpenSpecPath(projectRoot: string): string {
  return join(projectRoot, 'openspec');
}

export function createEmptyRegistryFile(): ProjectRegistryFile {
  return {
    version: PROJECT_REGISTRY_VERSION,
    projects: [],
    activeProjectId: null,
  };
}

export function deriveProjectLabel(projectRoot: string): string {
  const name = basename(projectRoot).trim();
  const source = name || projectRoot;

  return source
    .replace(/[-_]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .split(' ')
    .filter(Boolean)
    .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
    .join(' ');
}

export class ProjectRegistry {
  private readonly deps: ProjectRegistryDependencies;
  private readonly paths: RegistryPaths;

  private activeSessions = new Map<string, ActiveProjectSession>();
  private commandAvailabilityCache = new Map<string, CachedCommandAvailability>();
  private initializationPromise: Promise<void> | null = null;
  private initialized = false;
  private mutationLock: Promise<unknown> = Promise.resolve();
  private persistenceEnabled = true;
  private registry: ProjectRegistryFile = createEmptyRegistryFile();

  constructor(options: ProjectRegistryOptions = {}) {
    this.deps = {
      env: options.env ?? process.env,
      createWatcher: options.createWatcher ?? createFileWatcher,
      fileSystem: {
        ...defaultFileSystem,
        ...options.fileSystem,
      },
      getHomeDir: options.getHomeDir ?? homedir,
      logger: options.logger ?? console,
      now: options.now ?? Date.now,
      onActiveFileChange: options.onActiveFileChange,
      parse: options.parse ?? parseOpenSpec,
      randomId: options.randomId ?? randomUUID,
    };

    this.paths = resolveProjectRegistryPaths(this.deps.env, this.deps.getHomeDir);
  }

  async initialize(): Promise<void> {
    if (this.initialized) {
      return;
    }

    if (!this.initializationPromise) {
      this.initializationPromise = this.performInitialize().finally(() => {
        this.initialized = true;
      });
    }

    return this.initializationPromise;
  }

  getRegistryFilePath(): string {
    return this.paths.registryFilePath;
  }

  listProjects(): ProjectEntry[] {
    return this.registry.projects.map((entry) => cloneProjectEntry(entry));
  }

  getActiveProject(): ProjectEntry | null {
    return this.getProjectEntry(this.registry.activeProjectId);
  }

  getActiveProjectRoot(): string | null {
    return this.getProjectRoot(this.registry.activeProjectId);
  }

  getActiveOpenSpecPath(): string | null {
    return this.getOpenSpecPath(this.registry.activeProjectId);
  }

  getActiveData(): OpenSpecData | null {
    return this.getData(this.registry.activeProjectId);
  }

  getProjectRoot(projectId: string | null): string | null {
    if (!projectId) {
      return null;
    }

    return this.activeSessions.get(projectId)?.projectRoot ?? this.findProjectEntry(projectId)?.path ?? null;
  }

  getOpenSpecPath(projectId: string | null): string | null {
    if (!projectId) {
      return null;
    }

    return this.activeSessions.get(projectId)?.openspecPath ??
      (this.findProjectEntry(projectId) ? getOpenSpecPath(this.findProjectEntry(projectId)!.path) : null);
  }

  getData(projectId: string | null): OpenSpecData | null {
    if (!projectId) {
      return null;
    }

    return this.activeSessions.get(projectId)?.data ?? null;
  }

  getSession(projectId: string): ActiveProjectSession | null {
    return this.activeSessions.get(projectId) ?? null;
  }

  getCommandAvailabilityCache(
    projectId: string | null = this.registry.activeProjectId
  ): CommandAvailability | null {
    if (!projectId) {
      return null;
    }

    return this.commandAvailabilityCache.get(projectId)?.availability ?? null;
  }

  setCommandAvailabilityCache(
    availability: CommandAvailability | null,
    projectId: string | null = this.registry.activeProjectId
  ): void {
    if (!projectId) {
      if (!availability) {
        this.commandAvailabilityCache.clear();
      }
      return;
    }

    if (!availability) {
      this.commandAvailabilityCache.delete(projectId);
      return;
    }

    const projectRoot = this.getProjectRoot(projectId);
    if (!projectRoot) {
      this.commandAvailabilityCache.delete(projectId);
      return;
    }

    this.commandAvailabilityCache.set(projectId, {
      projectRoot,
      availability,
    });
  }

  async ensureSession(projectId: string): Promise<ActiveProjectSession> {
    await this.initialize();
    return this.runExclusive(async () => this.ensureSessionLocked(projectId));
  }

  async incrementRef(projectId: string): Promise<ActiveProjectSession> {
    await this.initialize();

    return this.runExclusive(async () => {
      const session = await this.ensureSessionLocked(projectId);
      session.refCount += 1;
      return session;
    });
  }

  async decrementRef(projectId: string): Promise<number> {
    await this.initialize();

    return this.runExclusive(async () => {
      const session = this.activeSessions.get(projectId);
      if (!session) {
        return 0;
      }

      if (session.refCount <= 0) {
        return session.refCount;
      }

      session.refCount -= 1;
      const nextRefCount = session.refCount;

      if (nextRefCount === 0) {
        await this.releaseSessionLocked(projectId);
      }

      return nextRefCount;
    });
  }

  async addProject(projectPath: string): Promise<AddProjectResult> {
    await this.initialize();

    return this.runExclusive(async () => {
      const normalizedProjectRoot = await this.validateProjectRoot(projectPath);
      const existing = this.registry.projects.find((entry) => entry.path === normalizedProjectRoot);

      if (existing) {
        const activation = await this.activateEntryLocked(existing.id, this.registry, true);
        return {
          entry: activation.entry,
          status: 'reactivated',
          activeChanged: activation.activeChanged,
        };
      }

      const timestamp = this.deps.now();
      const entry: ProjectEntry = {
        id: this.deps.randomId(),
        path: normalizedProjectRoot,
        label: deriveProjectLabel(normalizedProjectRoot),
        addedAt: timestamp,
        lastOpenedAt: timestamp,
      };

      const draftRegistry: ProjectRegistryFile = {
        version: PROJECT_REGISTRY_VERSION,
        projects: [...this.registry.projects, entry],
        activeProjectId: this.registry.activeProjectId,
      };

      const activation = await this.activateEntryLocked(entry.id, draftRegistry, false);

      return {
        entry: activation.entry,
        status: 'created',
        activeChanged: activation.activeChanged,
      };
    });
  }

  async removeProject(id: string): Promise<RemoveProjectResult> {
    await this.initialize();

    return this.runExclusive(async () => {
      const removed = this.registry.projects.find((entry) => entry.id === id);
      if (!removed) {
        throw createProjectNotFoundError(id);
      }

      const remainingProjects = this.registry.projects.filter((entry) => entry.id !== id);
      const removingActive = this.registry.activeProjectId === id;
      const fallback = removingActive ? remainingProjects[0] ?? null : null;
      let preparedFallback: PreparedActivation | null = null;

      if (fallback) {
        preparedFallback = await this.prepareActivation(fallback, true);
      }

      const nextRegistry = preparedFallback
        ? this.withActiveProject(
            {
              version: PROJECT_REGISTRY_VERSION,
              projects: remainingProjects,
              activeProjectId: null,
            },
            preparedFallback.entry
          )
        : {
            version: PROJECT_REGISTRY_VERSION,
            projects: remainingProjects,
            activeProjectId: removingActive ? null : this.registry.activeProjectId,
          };

      try {
        await this.persistRegistry(nextRegistry);
      } catch (error) {
        if (preparedFallback && !preparedFallback.reused) {
          await this.closeWatcherIfNeeded(preparedFallback.session);
        }
        throw error;
      }

      this.registry = nextRegistry;

      if (preparedFallback) {
        this.adoptPreparedSession(preparedFallback);
      }

      await this.releaseSessionLocked(id);

      return {
        removed: cloneProjectEntry(removed),
        activeChanged: removingActive,
        activeProjectId: nextRegistry.activeProjectId,
      };
    });
  }

  async activateProject(id: string): Promise<ActivateProjectResult> {
    await this.initialize();
    return this.runExclusive(async () => this.activateEntryLocked(id, this.registry, true));
  }

  async clearActiveProject(): Promise<ClearActiveProjectResult> {
    await this.initialize();

    return this.runExclusive(async () => {
      const previousProjectId = this.registry.activeProjectId;
      if (!previousProjectId) {
        return {
          activeChanged: false,
          previousProjectId: null,
        };
      }

      const nextRegistry: ProjectRegistryFile = {
        version: PROJECT_REGISTRY_VERSION,
        projects: this.registry.projects.map((entry) => cloneProjectEntry(entry)),
        activeProjectId: null,
      };

      await this.persistRegistry(nextRegistry);
      this.registry = nextRegistry;

      const previousSession = this.activeSessions.get(previousProjectId);
      if (previousSession?.refCount === 0) {
        await this.releaseSessionLocked(previousProjectId);
      }

      return {
        activeChanged: true,
        previousProjectId,
      };
    });
  }

  async close(): Promise<void> {
    await this.initialize();

    await this.runExclusive(async () => {
      const sessions = [...this.activeSessions.values()];
      this.activeSessions.clear();
      this.commandAvailabilityCache.clear();

      for (const session of sessions) {
        await this.closeWatcherIfNeeded(session);
      }
    });
  }

  private async performInitialize(): Promise<void> {
    try {
      await this.deps.fileSystem.mkdir(this.paths.configDir, { recursive: true });
    } catch (error) {
      this.disablePersistence('Failed to prepare project registry config directory', error);
      this.registry = createEmptyRegistryFile();
      return;
    }

    let rawRegistry = createEmptyRegistryFile();
    let shouldPersist = false;

    try {
      const loaded = await this.loadRegistryFromDisk();
      rawRegistry = loaded.registry;
      shouldPersist ||= loaded.changed;
    } catch (error) {
      this.deps.logger.warn('Failed to load project registry, using empty state', error);
      rawRegistry = createEmptyRegistryFile();
      shouldPersist = true;
    }

    const sanitized = await this.sanitizeLoadedRegistry(rawRegistry);
    this.registry = sanitized.registry;
    shouldPersist ||= sanitized.changed;

    if (this.registry.activeProjectId) {
      const activeEntry = this.registry.projects.find(
        (entry) => entry.id === this.registry.activeProjectId
      );

      if (activeEntry) {
        try {
          const prepared = await this.prepareActivation(activeEntry, false);
          this.adoptPreparedSession(prepared);
          this.registry = this.withActiveProject(this.registry, prepared.entry);
          shouldPersist ||= prepared.entry.lastOpenedAt !== activeEntry.lastOpenedAt;
        } catch (error) {
          this.deps.logger.warn('Failed to restore active project session, clearing active project', error);
          this.registry = {
            ...this.registry,
            projects: this.registry.projects.map((entry) => cloneProjectEntry(entry)),
            activeProjectId: null,
          };
          shouldPersist = true;
        }
      }
    }

    if (shouldPersist) {
      try {
        await this.persistRegistry(this.registry);
      } catch {
        // Persistence is already disabled and warned inside persistRegistry.
      }
    }
  }

  private async loadRegistryFromDisk(): Promise<{ registry: ProjectRegistryFile; changed: boolean }> {
    try {
      const raw = await this.deps.fileSystem.readFile(this.paths.registryFilePath, 'utf8');
      const parsed = JSON.parse(raw) as unknown;
      return this.parseRegistryFile(parsed);
    } catch (error) {
      if (isNotFoundError(error)) {
        const emptyRegistry = createEmptyRegistryFile();
        await this.persistRegistry(emptyRegistry);
        return { registry: emptyRegistry, changed: false };
      }

      throw error;
    }
  }

  private parseRegistryFile(value: unknown): { registry: ProjectRegistryFile; changed: boolean } {
    if (!value || typeof value !== 'object') {
      throw new Error('Invalid project registry format');
    }

    const record = value as Record<string, unknown>;
    if (record.version !== PROJECT_REGISTRY_VERSION) {
      throw new Error(`Unsupported project registry version: ${String(record.version)}`);
    }

    if (!Array.isArray(record.projects)) {
      throw new Error('Invalid project registry projects array');
    }

    if (record.activeProjectId !== null && typeof record.activeProjectId !== 'string') {
      throw new Error('Invalid project registry activeProjectId');
    }

    const parsedProjects = record.projects.map((entry) => this.parseProjectEntry(entry));

    return {
      registry: {
        version: PROJECT_REGISTRY_VERSION,
        activeProjectId: record.activeProjectId as string | null,
        projects: parsedProjects.map(({ entry }) => entry),
      },
      changed: parsedProjects.some(({ changed }) => changed),
    };
  }

  private parseProjectEntry(value: unknown): { entry: ProjectEntry; changed: boolean } {
    if (!value || typeof value !== 'object') {
      throw new Error('Invalid project registry entry');
    }

    const record = value as Record<string, unknown>;
    if (
      typeof record.id !== 'string' ||
      typeof record.path !== 'string' ||
      typeof record.label !== 'string' ||
      typeof record.addedAt !== 'number' ||
      typeof record.lastOpenedAt !== 'number'
    ) {
      throw new Error('Invalid project registry entry fields');
    }

    return {
      entry: {
        id: record.id,
        path: record.path,
        label: record.label,
        addedAt: record.addedAt,
        lastOpenedAt: record.lastOpenedAt,
      },
      changed: 'appearance' in record,
    };
  }

  private async sanitizeLoadedRegistry(
    rawRegistry: ProjectRegistryFile
  ): Promise<{ registry: ProjectRegistryFile; changed: boolean }> {
    const projects: ProjectEntry[] = [];
    const seenPaths = new Set<string>();
    let changed = false;

    for (const entry of rawRegistry.projects) {
      const normalizedPath = normalizeProjectRootPath(entry.path);

      try {
        await this.validateProjectRoot(normalizedPath);
      } catch (error) {
        this.deps.logger.warn('Ignoring invalid persisted project path', entry.path, error);
        changed = true;
        continue;
      }

      if (seenPaths.has(normalizedPath)) {
        this.deps.logger.warn('Ignoring duplicate persisted project path', normalizedPath);
        changed = true;
        continue;
      }

      seenPaths.add(normalizedPath);

      const sanitizedEntry: ProjectEntry = {
        ...entry,
        path: normalizedPath,
        label: entry.label || deriveProjectLabel(normalizedPath),
      };

      if (sanitizedEntry.path !== entry.path || sanitizedEntry.label !== entry.label) {
        changed = true;
      }

      projects.push(sanitizedEntry);
    }

    const activeProjectId = projects.some((entry) => entry.id === rawRegistry.activeProjectId)
      ? rawRegistry.activeProjectId
      : null;

    if (activeProjectId !== rawRegistry.activeProjectId) {
      changed = true;
    }

    return {
      registry: {
        version: PROJECT_REGISTRY_VERSION,
        projects,
        activeProjectId,
      },
      changed,
    };
  }

  private async validateProjectRoot(projectPath: string): Promise<string> {
    const normalizedProjectRoot = normalizeProjectRootPath(projectPath);

    const rootStats = await this.safeStat(normalizedProjectRoot);
    if (!rootStats?.isDirectory()) {
      throw new ProjectRegistryError(
        'INVALID_PROJECT_PATH',
        `Project root does not exist or is not a directory: ${normalizedProjectRoot}`,
        { metadata: { path: normalizedProjectRoot } }
      );
    }

    const openspecPath = getOpenSpecPath(normalizedProjectRoot);
    const openspecStats = await this.safeStat(openspecPath);
    if (!openspecStats?.isDirectory()) {
      throw new ProjectRegistryError(
        'INVALID_PROJECT_PATH',
        `OpenSpec project not found at ${normalizedProjectRoot}`,
        { metadata: { path: normalizedProjectRoot, openspecPath } }
      );
    }

    return normalizedProjectRoot;
  }

  private async activateEntryLocked(
    id: string,
    baseRegistry: ProjectRegistryFile,
    allowNoop: boolean
  ): Promise<ActivateProjectResult> {
    const target = baseRegistry.projects.find((entry) => entry.id === id);
    if (!target) {
      throw createProjectNotFoundError(id);
    }

    if (allowNoop && this.registry.activeProjectId === id && this.activeSessions.has(id)) {
      const existing = this.activeSessions.get(id)!;
      return {
        entry: cloneProjectEntry(existing.project),
        activeChanged: false,
        alreadyActive: true,
      };
    }

    const previousActiveProjectId = this.registry.activeProjectId;
    const prepared = await this.prepareActivation(target, true);
    const nextRegistry = this.withActiveProject(baseRegistry, prepared.entry);

    try {
      await this.persistRegistry(nextRegistry);
    } catch (error) {
      if (!prepared.reused) {
        await this.closeWatcherIfNeeded(prepared.session);
      }
      throw error;
    }

    this.registry = nextRegistry;
    this.adoptPreparedSession(prepared);

    return {
      entry: cloneProjectEntry(prepared.entry),
      activeChanged: previousActiveProjectId !== id,
      alreadyActive: false,
    };
  }

  private async ensureSessionLocked(projectId: string): Promise<ActiveProjectSession> {
    const existing = this.activeSessions.get(projectId);
    if (existing) {
      return existing;
    }

    const entry = this.findProjectEntry(projectId);
    if (!entry) {
      throw createProjectNotFoundError(projectId);
    }

    const prepared = await this.prepareActivation(entry, false);
    this.adoptPreparedSession(prepared);
    return prepared.session;
  }

  private async prepareActivation(
    entry: ProjectEntry,
    updateLastOpenedAt: boolean
  ): Promise<PreparedActivation> {
    const preparedEntry: ProjectEntry = {
      ...entry,
      lastOpenedAt: updateLastOpenedAt ? this.deps.now() : entry.lastOpenedAt,
    };

    const existing = this.activeSessions.get(entry.id);
    if (existing) {
      return {
        entry: preparedEntry,
        session: existing,
        reused: true,
      };
    }

    const openspecPath = getOpenSpecPath(entry.path);
    const parseResult = await this.deps.parse(openspecPath);

    if (!parseResult.data) {
      throw createActivationFailedError(
        parseResult.errors[0] || `Failed to parse active project: ${entry.path}`,
        { projectId: entry.id, path: entry.path, openspecPath }
      );
    }

    let watcher: ClosableWatcher | null = null;

    try {
      watcher = this.deps.createWatcher(openspecPath, (event) => {
        void this.handleActiveFileChange(entry.id, event);
      });
    } catch (error) {
      throw createActivationFailedError(
        error instanceof Error ? error.message : `Failed to watch active project: ${entry.path}`,
        { projectId: entry.id, path: entry.path, openspecPath }
      );
    }

    return {
      entry: preparedEntry,
      session: {
        project: preparedEntry,
        projectRoot: preparedEntry.path,
        openspecPath,
        data: parseResult.data,
        watcher,
        refCount: 0,
      },
      reused: false,
    };
  }

  private adoptPreparedSession(prepared: PreparedActivation): ActiveProjectSession {
    prepared.session.project = prepared.entry;
    prepared.session.projectRoot = prepared.entry.path;
    prepared.session.openspecPath = getOpenSpecPath(prepared.entry.path);
    this.activeSessions.set(prepared.entry.id, prepared.session);
    return prepared.session;
  }

  private withActiveProject(
    registry: ProjectRegistryFile,
    entry: ProjectEntry
  ): ProjectRegistryFile {
    return {
      version: PROJECT_REGISTRY_VERSION,
      activeProjectId: entry.id,
      projects: registry.projects.map((project) =>
        project.id === entry.id ? cloneProjectEntry(entry) : cloneProjectEntry(project)
      ),
    };
  }

  private async handleActiveFileChange(projectId: string, event: FileChangeEvent): Promise<void> {
    const currentSession = this.activeSessions.get(projectId);
    if (!currentSession) {
      return;
    }

    const parseResult = await this.deps.parse(currentSession.openspecPath);
    const latestSession = this.activeSessions.get(projectId);
    if (!latestSession) {
      return;
    }

    if (parseResult.data) {
      latestSession.data = parseResult.data;
    }

    await this.deps.onActiveFileChange?.(projectId, event, parseResult.data);
  }

  private async persistRegistry(registry: ProjectRegistryFile): Promise<void> {
    if (!this.persistenceEnabled) {
      return;
    }

    try {
      await this.deps.fileSystem.mkdir(this.paths.configDir, { recursive: true });
      const tempPath = join(
        this.paths.configDir,
        `${PROJECT_REGISTRY_FILE_NAME}.${process.pid}.${this.deps.randomId()}.tmp`
      );

      await this.deps.fileSystem.writeFile(tempPath, `${JSON.stringify(registry, null, 2)}\n`, 'utf8');
      await this.deps.fileSystem.rename(tempPath, this.paths.registryFilePath);
    } catch (error) {
      this.disablePersistence('Failed to persist project registry', error);
      throw error;
    }
  }

  private async safeStat(targetPath: string): Promise<StatLike | null> {
    try {
      return await this.deps.fileSystem.stat(targetPath);
    } catch {
      return null;
    }
  }

  private findProjectEntry(projectId: string | null): ProjectEntry | null {
    if (!projectId) {
      return null;
    }

    return this.registry.projects.find((entry) => entry.id === projectId) ?? null;
  }

  private getProjectEntry(projectId: string | null): ProjectEntry | null {
    if (!projectId) {
      return null;
    }

    const session = this.activeSessions.get(projectId);
    if (session) {
      return cloneProjectEntry(session.project);
    }

    const entry = this.findProjectEntry(projectId);
    return entry ? cloneProjectEntry(entry) : null;
  }

  private clearProjectScopedCaches(projectId?: string): void {
    if (projectId) {
      this.commandAvailabilityCache.delete(projectId);
      return;
    }

    this.commandAvailabilityCache.clear();
  }

  private disablePersistence(message: string, error: unknown): void {
    this.persistenceEnabled = false;
    this.deps.logger.warn(message, error);
  }

  private async closeWatcherIfNeeded(session: ActiveProjectSession | null | undefined): Promise<void> {
    if (!session) {
      return;
    }

    try {
      await session.watcher.close();
    } catch (error) {
      this.deps.logger.warn('Failed to close project watcher', error);
    }
  }

  private async releaseSessionLocked(projectId: string): Promise<void> {
    const session = this.activeSessions.get(projectId);
    if (!session) {
      this.clearProjectScopedCaches(projectId);
      return;
    }

    this.activeSessions.delete(projectId);
    this.clearProjectScopedCaches(projectId);
    await this.closeWatcherIfNeeded(session);
  }

  private runExclusive<T>(operation: () => Promise<T>): Promise<T> {
    const nextOperation = this.mutationLock.then(operation, operation);
    this.mutationLock = nextOperation.catch(() => undefined);
    return nextOperation;
  }
}

function defaultStatusCodeForError(code: ProjectRegistryErrorCode): number {
  switch (code) {
    case 'INVALID_PROJECT_PATH':
      return 400;
    case 'PROJECT_NOT_FOUND':
      return 404;
    case 'NO_ACTIVE_PROJECT':
      return 503;
    case 'ACTIVATION_FAILED':
      return 500;
    default:
      return 500;
  }
}

function isNotFoundError(error: unknown): error is NodeJS.ErrnoException {
  return error instanceof Error && 'code' in error && error.code === 'ENOENT';
}
