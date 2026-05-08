import type { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import { execFile } from 'child_process';
import type { OpenSpecData } from '../../parser/index.js';
import { parseSpec, parseChangeByName, searchOpenSpec } from '../../parser/index.js';
import {
  inspectCommandAvailability,
  type CommandAvailability,
} from '../openspec-config.js';
import {
  ProjectRegistryError,
  createNoActiveProjectError,
  createStructuredApiError,
  type ProjectRegistry,
} from '../project-registry.js';
import type { VersionSnapshotService } from '../version-status.js';
import type {
  ValidationItem,
  ValidationItemSeverity,
  ValidationItemType,
  ValidationResult,
  ValidationErrorContext,
} from '../../shared/types.js';
import { readdirSync, statSync, existsSync } from 'fs';
import { join, resolve, dirname } from 'path';
import { homedir } from 'os';

interface RegisterApiRoutesOptions {
  registry: Pick<
    ProjectRegistry,
    | 'addProject'
    | 'activateProject'
    | 'ensureSession'
    | 'getData'
    | 'getActiveData'
    | 'getActiveOpenSpecPath'
    | 'getActiveProject'
    | 'getActiveProjectRoot'
    | 'getCommandAvailabilityCache'
    | 'getOpenSpecPath'
    | 'getProjectRoot'
    | 'listProjects'
    | 'removeProject'
    | 'setCommandAvailabilityCache'
  >;
  versionSnapshotService: Pick<VersionSnapshotService, 'getSnapshot'>;
  onProjectRemoved?: (removedProjectId: string, nextProjectId: string | null) => Promise<void> | void;
}

interface AddProjectRequestBody {
  path?: string;
}

export interface ValidationOptions {
  strict?: boolean;
  concurrency?: number | null;
}

export interface NormalizedValidationOptions {
  strict: boolean;
  concurrency: number | null;
}

export function normalizeValidationOptions(value: unknown): NormalizedValidationOptions {
  const defaults: NormalizedValidationOptions = { strict: true, concurrency: null };

  if (!value || typeof value !== 'object') {
    return defaults;
  }

  const candidate = value as Partial<ValidationOptions>;

  return {
    strict: typeof candidate.strict === 'boolean' ? candidate.strict : defaults.strict,
    concurrency:
      typeof candidate.concurrency === 'number' && Number.isInteger(candidate.concurrency) && candidate.concurrency > 0
        ? candidate.concurrency
        : defaults.concurrency,
  };
}

export function buildValidationArgs(options: NormalizedValidationOptions): string[] {
  const args = ['validate', '--all'];

  if (options.strict) {
    args.push('--strict');
  }

  if (options.concurrency !== null) {
    args.push('--concurrency', String(options.concurrency));
  }

  args.push('--json');

  return args;
}

export function buildValidationCommandString(args: string[]): string {
  return `openspec ${args.join(' ')}`;
}

/**
 * Register API routes
 */
export async function registerApiRoutes(
  fastify: FastifyInstance,
  options: RegisterApiRoutesOptions
) {
  const { registry, versionSnapshotService, onProjectRemoved } = options;

  function readProjectIdHeader(request: FastifyRequest): string | null {
    const rawValue = request.headers['x-project-id'];

    if (Array.isArray(rawValue)) {
      const first = rawValue.find((value) => typeof value === 'string' && value.trim().length > 0);
      return first?.trim() ?? null;
    }

    if (typeof rawValue === 'string' && rawValue.trim()) {
      return rawValue.trim();
    }

    return null;
  }

  async function getCommandAvailability(projectId: string | null) {
    const resolvedProjectId = projectId ?? registry.getActiveProject()?.id ?? null;
    const projectRoot = resolvedProjectId ? registry.getProjectRoot(resolvedProjectId) : registry.getActiveProjectRoot();
    if (!projectRoot) {
      return {
        status: 'unavailable',
        profile: null,
        workflows: [],
        availableExpandedCommands: [],
        error: 'No active project selected',
      } satisfies CommandAvailability;
    }

    const availability = await inspectCommandAvailability(projectRoot);

    if (availability.status === 'ready') {
      registry.setCommandAvailabilityCache(availability, resolvedProjectId);
      return availability;
    }

    return registry.getCommandAvailabilityCache(resolvedProjectId) ?? availability;
  }

  function sendProjectRegistryError(reply: FastifyReply, error: unknown, fallbackMessage: string) {
    if (error instanceof ProjectRegistryError) {
      return reply.status(error.statusCode).send(error.toResponseBody());
    }

    const message = error instanceof Error ? error.message : fallbackMessage;
    return reply
      .status(500)
      .send(createStructuredApiError('ACTIVATION_FAILED', message));
  }

  async function resolveProjectContext(request: FastifyRequest, reply: FastifyReply): Promise<{
    projectId: string;
    data: OpenSpecData;
    openspecPath: string;
    projectRoot: string;
  } | null> {
    const headerProjectId = readProjectIdHeader(request);
    const projectId = headerProjectId ?? registry.getActiveProject()?.id ?? null;

    if (!projectId) {
      void reply.status(503).send(createNoActiveProjectError().toResponseBody());
      return null;
    }

    try {
      const session = await registry.ensureSession(projectId);
      return {
        projectId,
        data: session.data,
        openspecPath: session.openspecPath,
        projectRoot: session.projectRoot,
      };
    } catch (error) {
      sendProjectRegistryError(reply, error, 'Failed to resolve project context');
      return null;
    }
  }

  // List projects
  fastify.get('/api/projects', async () => ({
    projects: registry.listProjects(),
    activeProjectId: registry.getActiveProject()?.id ?? null,
  }));

  // Add or reactivate a project
  fastify.post<{ Body: AddProjectRequestBody }>('/api/projects', async (request, reply) => {
    const projectPath = request.body?.path?.trim();
    if (!projectPath) {
      return reply.status(400).send(createStructuredApiError('INVALID_PROJECT_PATH', 'Project path is required'));
    }

    try {
      const result = await registry.addProject(projectPath);

      return reply.status(result.status === 'created' ? 201 : 200).send({
        project: result.entry,
        activeProjectId: result.entry.id,
      });
    } catch (error) {
      return sendProjectRegistryError(reply, error, 'Failed to add project');
    }
  });

  // Remove a project
  fastify.delete<{ Params: { id: string } }>('/api/projects/:id', async (request, reply) => {
    try {
      const result = await registry.removeProject(request.params.id);

      await onProjectRemoved?.(result.removed.id, result.activeProjectId);

      return {
        removedProjectId: result.removed.id,
        activeProjectId: result.activeProjectId,
      };
    } catch (error) {
      return sendProjectRegistryError(reply, error, 'Failed to remove project');
    }
  });

  // Activate a project
  fastify.post<{ Params: { id: string } }>(
    '/api/projects/:id/activate',
    async (request, reply) => {
      try {
        const result = await registry.activateProject(request.params.id);

        return {
          project: result.entry,
          activeProjectId: result.entry.id,
        };
      } catch (error) {
        return sendProjectRegistryError(reply, error, 'Failed to activate project');
      }
    }
  );

  // Get project info
  fastify.get('/api/project', async (request, reply) => {
    const context = await resolveProjectContext(request, reply);
    if (!context) {
      return reply;
    }

    return { project: context.data.project };
  });

  // Get all specs
  fastify.get('/api/specs', async (request, reply) => {
    const context = await resolveProjectContext(request, reply);
    if (!context) {
      return reply;
    }

    return {
      specs: context.data.specs.map((s) => ({
        name: s.name,
        path: s.path,
        lastModified: s.lastModified,
      })),
    };
  });

  // Get single spec
  fastify.get<{ Params: { name: string } }>('/api/specs/:name', async (request, reply) => {
    const { name } = request.params;
    const context = await resolveProjectContext(request, reply);
    if (!context) {
      return reply;
    }

    const result = await parseSpec(context.openspecPath, name);

    if (!result.data) {
      return reply.status(404).send({ error: result.errors[0] || 'Spec not found' });
    }

    return { spec: result.data };
  });

  // Get all changes
  fastify.get('/api/changes', async (request, reply) => {
    const context = await resolveProjectContext(request, reply);
    if (!context) {
      return reply;
    }

    return {
      active: context.data.changes.active.map(summarizeChange),
      archived: context.data.changes.archived.map(summarizeChange),
    };
  });

  // Get single change
  fastify.get<{ Params: { name: string } }>('/api/changes/:name', async (request, reply) => {
    const { name } = request.params;
    const context = await resolveProjectContext(request, reply);
    if (!context) {
      return reply;
    }

    const result = await parseChangeByName(context.openspecPath, name);

    if (!result.data) {
      return reply.status(404).send({ error: result.errors[0] || 'Change not found' });
    }

    return { change: result.data };
  });

  // Get stats
  fastify.get('/api/stats', async (request, reply) => {
    const context = await resolveProjectContext(request, reply);
    if (!context) {
      return reply;
    }

    return { stats: context.data.stats };
  });

  // Get local OpenSpec command availability
  fastify.get('/api/commands/availability', async (request, reply) => {
    const projectId = readProjectIdHeader(request) ?? registry.getActiveProject()?.id ?? null;
    if (projectId) {
      try {
        await registry.ensureSession(projectId);
      } catch (error) {
        return sendProjectRegistryError(reply, error, 'Failed to inspect command availability');
      }
    }

    const availability = await getCommandAvailability(projectId);
    return { availability };
  });

  fastify.get('/api/version-status', async () => versionSnapshotService.getSnapshot());

  // Search
  fastify.get<{ Querystring: { q: string } }>('/api/search', async (request, reply) => {
    const { q } = request.query;

    if (!q || q.length < 2) {
      return { results: [] };
    }

    const context = await resolveProjectContext(request, reply);
    if (!context) {
      return reply;
    }

    const results = searchOpenSpec(context.data, q);
    return { results };
  });

  // Run validation for the active project
  fastify.post('/api/validate', async (request, reply) => {
    const context = await resolveProjectContext(request, reply);
    if (!context) {
      return reply;
    }

    const options = normalizeValidationOptions(request.body);
    const result = await runValidation(context.projectRoot, options);
    return result;
  });

  // Browse filesystem directories
  fastify.get<{ Querystring: { path?: string } }>('/api/fs/browse', async (request) => {
    const requestedPath = request.query.path?.trim() || homedir();
    const absolutePath = resolve(requestedPath);

    if (!existsSync(absolutePath)) {
      return { path: absolutePath, parent: null, dirs: [], error: 'Directory not found' };
    }

    try {
      const stat = statSync(absolutePath);
      if (!stat.isDirectory()) {
        return { path: absolutePath, parent: null, dirs: [], error: 'Not a directory' };
      }

      const entries = readdirSync(absolutePath, { withFileTypes: true });
      const dirs = entries
        .filter((e) => e.isDirectory() && !e.name.startsWith('.'))
        .sort((a, b) => a.name.localeCompare(b.name))
        .map((e) => ({
          name: e.name,
          path: join(absolutePath, e.name),
          hasOpenSpec: existsSync(join(absolutePath, e.name, 'openspec')),
        }));

      const parentPath = dirname(absolutePath);
      const isRoot = parentPath === absolutePath;

      return { path: absolutePath, parent: isRoot ? null : parentPath, dirs };
    } catch {
      return { path: absolutePath, parent: null, dirs: [], error: 'Permission denied' };
    }
  });
}

/**
 * Execute `openspec validate --all [--strict] [--concurrency n] --json` in the
 * project root and normalize the output into a ValidationResult.
 *
 * Three outcome paths:
 * 1. CLI exits 0 with valid JSON → status 'passed' or 'failed' (from JSON)
 * 2. CLI exits non-0 with valid JSON → status 'passed' or 'failed' (from JSON)
 * 3. CLI exits non-0 with unparseable output → structured API error thrown
 */
async function runValidation(
  projectRoot: string,
  options: NormalizedValidationOptions = { strict: true, concurrency: null }
): Promise<ValidationResult> {
  const args = buildValidationArgs(options);
  const commandString = buildValidationCommandString(args);
  const { stdout, stderr, exitCode } = await execValidate(projectRoot, args);

  const parsed = tryParseValidationJson(stdout);

  if (parsed) {
    return normalizeValidationResult(parsed, stderr, exitCode);
  }

  // True execution failure — cannot normalize CLI output
  throw createStructuredApiError(
    'ACTIVATION_FAILED',
    `Validation command failed with exit code ${exitCode ?? 'null'}: ${stderr || stdout || 'unknown error'}`,
    {
      command: commandString,
      exitCode: exitCode ?? null,
      stderr,
    } satisfies ValidationErrorContext as Record<string, unknown>,
  );
}

function execValidate(
  projectRoot: string,
  args: string[] = ['validate', '--all', '--strict', '--json']
): Promise<{ stdout: string; stderr: string; exitCode: number | null }> {
  return new Promise((resolve) => {
    execFile(
      'openspec',
      args,
      { cwd: projectRoot, timeout: 120_000 },
      (error, stdout, stderr) => {
        if (error && error.code === 'ENOENT') {
          resolve({ stdout: '', stderr: 'openspec command not found', exitCode: null });
          return;
        }
        resolve({
          stdout: stdout ?? '',
          stderr: (stderr ?? '').trim(),
          exitCode: error ? (typeof error.code === 'number' ? error.code : 1) : 0,
        });
      }
    );
  });
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function tryParseValidationJson(stdout: string): any | null {
  try {
    return JSON.parse(stdout);
  } catch {
    return null;
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function normalizeValidationResult(
  raw: any,
  stderr: string,
  exitCode: number | null
): ValidationResult {
  const rawItems = Array.isArray(raw.items) ? raw.items : [];
  const items: ValidationItem[] = rawItems.map(normalizeValidationItem);

  const failedItems = items.filter((item) => !item.valid);
  const summary = {
    totalItems: items.length,
    passed: items.length - failedItems.length,
    failed: failedItems.length,
  };

  return {
    status: failedItems.length > 0 ? 'failed' : 'passed',
    items,
    failedItems,
    summary,
    runAt: new Date().toISOString(),
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function normalizeValidationItem(raw: any): ValidationItem {
  const rawIssues = Array.isArray(raw.issues) ? raw.issues : [];
  const issues = rawIssues.map(normalizeValidationIssue);

  return {
    id: typeof raw.id === 'string' ? raw.id : 'unknown',
    name: typeof raw.id === 'string' && raw.id.length > 0 ? raw.id : 'unknown',
    type: normalizeValidationItemType(raw.type),
    valid: raw.valid === true,
    issueCount: issues.length,
    issues,
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function normalizeValidationIssue(raw: any) {
  return {
    level: normalizeValidationSeverity(raw.level),
    path: typeof raw.path === 'string' ? raw.path : '',
    message: typeof raw.message === 'string' ? raw.message : '',
  };
}

function normalizeValidationSeverity(value: unknown): ValidationItemSeverity {
  if (typeof value === 'string') {
    const upper = value.toUpperCase();
    if (upper === 'ERROR' || upper === 'WARNING' || upper === 'INFO') {
      return upper;
    }
  }
  return 'ERROR';
}

function normalizeValidationItemType(value: unknown): ValidationItemType {
  if (value === 'spec' || value === 'change') return value;
  if (value === 'project') return 'project';
  return 'unknown';
}

/**
 * Create a summary of a change for list views
 */
function summarizeChange(change: OpenSpecData['changes']['active'][0]) {
  return {
    name: change.name,
    path: change.path,
    isArchived: change.isArchived,
    archivedDate: change.archivedDate,
    lastModified: change.lastModified,
    taskProgress: change.taskProgress,
    specDeltaCount: change.specDeltas.length,
    hasProposal: change.proposal !== null,
    hasDesign: change.design !== null,
    fileCount: change.files.length,
    groupCount: change.fileGroups.length,
  };
}
