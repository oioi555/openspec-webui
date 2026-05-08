import {
  ApiError,
  type ApiErrorCode,
  type BrowseResult,
  type Change,
  type ChangeSummary,
  type CommandAvailability,
  type Project,
  type ProjectListResponse,
  type ProjectSelectionResponse,
  type RemoveProjectResponse,
  type SearchResult,
  type Spec,
  type SpecSummary,
  type Stats,
  type StructuredApiError,
  type ValidationResult,
  type VersionStatusResponse,
} from './types/api';
const API_BASE = '/api';
let activeProjectContextId: string | null = null;

export { ApiError };
export type {
  ApiErrorCode,
  BrowseDirEntry,
  BrowseResult,
  Change,
  ChangeFile,
  ChangeSummary,
  CommandAvailability,
  FileGroup,
  Project,
  ProjectEntry,
  ProjectListResponse,
  ProjectSelectionResponse,
  RemoveProjectResponse,
  SearchResult,
  Spec,
  SpecDelta,
  SpecSummary,
  Stats,
  StructuredApiError,
  Task,
  TaskProgress,
  ValidationErrorContext,
  ValidationIssue,
  ValidationItem,
  ValidationItemSeverity,
  ValidationItemType,
  ValidationResult,
  ValidationSummary,
  VersionStatusResponse,
} from './types/api';

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

  if (shouldAttachProjectHeader(path) && activeProjectContextId && !headers.has('X-Project-Id')) {
    headers.set('X-Project-Id', activeProjectContextId);
  }

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

function shouldAttachProjectHeader(path: string): boolean {
  return (
    path === '/project' ||
    path.startsWith('/specs') ||
    path.startsWith('/changes') ||
    path === '/stats' ||
    path.startsWith('/search') ||
    path === '/validate' ||
    path === '/commands/availability'
  );
}

export function setActiveProjectContext(projectId: string | null): void {
  activeProjectContextId = projectId;
}

export function getActiveProjectContext(): string | null {
  return activeProjectContextId;
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

export async function getVersionStatus(): Promise<VersionStatusResponse> {
  return fetchApi<VersionStatusResponse>('/version-status');
}

export interface RunValidationOptions {
  strict: boolean;
  concurrency: number | null;
}

export async function runValidation(options?: RunValidationOptions): Promise<ValidationResult> {
  const body = options ? { strict: options.strict, concurrency: options.concurrency } : undefined;
  return fetchApi<ValidationResult>('/validate', {
    method: 'POST',
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
}

export async function browseDirectory(dirPath?: string): Promise<BrowseResult> {
  const query = dirPath ? `?path=${encodeURIComponent(dirPath)}` : '';
  return fetchApi<BrowseResult>(`/fs/browse${query}`);
}
