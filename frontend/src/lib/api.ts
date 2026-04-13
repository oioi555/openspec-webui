import type { ExpandedCommand } from './commandTypes';

const API_BASE = '/api';

export type ApiErrorCode =
  | 'ACTIVATION_FAILED'
  | 'INVALID_PROJECT_PATH'
  | 'NO_ACTIVE_PROJECT'
  | 'PROJECT_NOT_FOUND';

export interface StructuredApiError {
  code?: ApiErrorCode | string;
  error?: string;
  metadata?: Record<string, unknown>;
}

export class ApiError extends Error {
  readonly status: number;
  readonly code: ApiErrorCode | string | null;
  readonly metadata?: Record<string, unknown>;
  readonly body?: unknown;

  constructor(options: {
    status: number;
    message: string;
    code?: ApiErrorCode | string | null;
    metadata?: Record<string, unknown>;
    body?: unknown;
  }) {
    super(options.message);
    this.name = 'ApiError';
    this.status = options.status;
    this.code = options.code ?? null;
    this.metadata = options.metadata;
    this.body = options.body;
  }
}

export interface Project {
  name: string;
  description: string;
  path: string;
  content: string;
}

export interface ProjectEntry {
  id: string;
  path: string;
  label: string;
  addedAt: number;
  lastOpenedAt: number;
}

export interface ProjectListResponse {
  projects: ProjectEntry[];
  activeProjectId: string | null;
}

export interface ProjectSelectionResponse {
  project: ProjectEntry;
  activeProjectId: string | null;
}

export interface RemoveProjectResponse {
  removedProjectId: string;
  activeProjectId: string | null;
}

export interface Spec {
  name: string;
  path: string;
  specContent: string;
  designContent: string | null;
  lastModified: string | null;
}

export interface SpecSummary {
  name: string;
  path: string;
  hasDesign: boolean;
  lastModified: string | null;
}

export interface TaskProgress {
  done: number;
  total: number;
  percentage: number;
}

export interface ChangeFile {
  name: string;
  path: string;
  absolutePath: string;
  type: 'markdown';
  folder: string;
  content?: string;
}

export interface FileGroup {
  name: string;
  folder: string;
  files: ChangeFile[];
  isCore: boolean;
}

export interface ChangeSummary {
  name: string;
  path: string;
  isArchived: boolean;
  archivedDate: string | null;
  lastModified: string | null;
  taskProgress: TaskProgress;
  specDeltaCount: number;
  hasProposal: boolean;
  hasDesign: boolean;
  fileCount: number;
  groupCount: number;
}

export interface Task {
  text: string;
  completed: boolean;
  line: number;
  subtasks: Task[];
}

export interface SpecDelta {
  capability: string;
  content: string;
  operations: {
    type: 'added' | 'modified' | 'removed' | 'renamed';
    name: string;
    content: string;
    startLine: number;
    endLine: number;
  }[];
}

export interface Change {
  name: string;
  path: string;
  isArchived: boolean;
  archivedDate: string | null;
  lastModified: string | null;
  proposal: string | null;
  tasks: Task[];
  tasksRaw: string | null;
  taskProgress: TaskProgress;
  design: string | null;
  specDeltas: SpecDelta[];
  files: ChangeFile[];
  fileGroups: FileGroup[];
}

export interface Stats {
  totalSpecs: number;
  activeChanges: number;
  archivedChanges: number;
  overallTaskProgress: TaskProgress;
}

export interface SearchResult {
  type: 'spec' | 'change' | 'project';
  name: string;
  path: string;
  excerpt: string;
  matchLine: number;
}

export interface CommandAvailability {
  status: 'ready' | 'unavailable';
  profile: string | null;
  workflows: string[];
  availableExpandedCommands: ExpandedCommand[];
  error: string | null;
}

function isStructuredApiError(value: unknown): value is StructuredApiError {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const candidate = value as Record<string, unknown>;
  return typeof candidate.error === 'string' || typeof candidate.code === 'string';
}

async function parseApiError(response: Response): Promise<ApiError> {
  let body: unknown = null;

  try {
    body = await response.json();
  } catch {
    try {
      body = await response.text();
    } catch {
      body = null;
    }
  }

  if (isStructuredApiError(body)) {
    return new ApiError({
      status: response.status,
      message: body.error || `API error: ${response.status}`,
      code: body.code ?? null,
      metadata: body.metadata,
      body,
    });
  }

  if (typeof body === 'string' && body.trim()) {
    return new ApiError({
      status: response.status,
      message: body.trim(),
      body,
    });
  }

  return new ApiError({
    status: response.status,
    message: `API error: ${response.status}`,
    body,
  });
}

async function fetchApi<T>(path: string, init: RequestInit = {}): Promise<T> {
  const headers = new Headers(init.headers);

  if (init.body !== undefined && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  const response = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers,
  });

  if (!response.ok) {
    throw await parseApiError(response);
  }

  return response.json();
}

export function isApiError(error: unknown): error is ApiError {
  return error instanceof ApiError;
}

export function isApiErrorCode(error: unknown, code: ApiErrorCode | string): error is ApiError {
  return isApiError(error) && error.code === code;
}

export function isNoActiveProjectError(error: unknown): error is ApiError {
  return isApiErrorCode(error, 'NO_ACTIVE_PROJECT');
}

export function isActivationFailedError(error: unknown): error is ApiError {
  return isApiErrorCode(error, 'ACTIVATION_FAILED');
}

export function getApiErrorMessage(error: unknown, fallbackMessage = 'Request failed'): string {
  if (error instanceof Error && error.message) {
    return error.message;
  }

  return fallbackMessage;
}

export async function getProject(): Promise<Project> {
  const data = await fetchApi<{ project: Project }>('/project');
  return data.project;
}

export async function getProjects(): Promise<ProjectListResponse> {
  return fetchApi<ProjectListResponse>('/projects');
}

export async function addProject(path: string): Promise<ProjectSelectionResponse> {
  return fetchApi<ProjectSelectionResponse>('/projects', {
    method: 'POST',
    body: JSON.stringify({ path }),
  });
}

export async function removeProject(id: string): Promise<RemoveProjectResponse> {
  return fetchApi<RemoveProjectResponse>(`/projects/${encodeURIComponent(id)}`, {
    method: 'DELETE',
  });
}

export async function activateProject(id: string): Promise<ProjectSelectionResponse> {
  return fetchApi<ProjectSelectionResponse>(`/projects/${encodeURIComponent(id)}/activate`, {
    method: 'POST',
  });
}

export async function getSpecs(): Promise<SpecSummary[]> {
  const data = await fetchApi<{ specs: SpecSummary[] }>('/specs');
  return data.specs;
}

export async function getSpec(name: string): Promise<Spec> {
  const data = await fetchApi<{ spec: Spec }>(`/specs/${encodeURIComponent(name)}`);
  return data.spec;
}

export async function getChanges(): Promise<{ active: ChangeSummary[]; archived: ChangeSummary[] }> {
  return fetchApi('/changes');
}

export async function getChange(name: string): Promise<Change> {
  const data = await fetchApi<{ change: Change }>(`/changes/${encodeURIComponent(name)}`);
  return data.change;
}

export async function getStats(): Promise<Stats> {
  const data = await fetchApi<{ stats: Stats }>('/stats');
  return data.stats;
}

export async function search(query: string): Promise<SearchResult[]> {
  const data = await fetchApi<{ results: SearchResult[] }>(`/search?q=${encodeURIComponent(query)}`);
  return data.results;
}

export async function getCommandAvailability(): Promise<CommandAvailability> {
  const data = await fetchApi<{ availability: CommandAvailability }>('/commands/availability');
  return data.availability;
}
