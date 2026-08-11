import {
  ApiError,
  type ApiErrorCode,
  type BrowseResult,
  type Change,
  type ChangeSummary,
  type CommandAvailability,
  type CommandInventory,
  type CommandInventoryItem,
  type DetectedIntegration,
  type SkillInventory,
  type SkillInventoryItem,
  type ToolInvocationOption,
  type Project,
  type ProjectListResponse,
  type ProjectSelectionResponse,
  type ProjectVersionStatusEntry,
  type ProjectVersionStatusResponse,
  type ProjectVersionUpdateStatus,
  type RemoveProjectResponse,
  type SearchResult,
  type Spec,
  type SpecSummary,
  type Stats,
  type StoreDiscoveryResult,
  type StructuredApiError,
  type ValidationResult,
  type VersionStatusResponse,
} from './types/api';
import { INVOCATION_FORM_IDS, type InvocationFormId } from './types/commandTypes';
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
  CommandDelivery,
  CommandInventory,
  CommandInventoryItem,
  DetectedIntegration,
  SkillInventory,
  SkillInventoryItem,
  ToolInvocationOption,
  FileGroup,
  Project,
  ProjectEntry,
  ProjectListResponse,
  ProjectSelectionResponse,
  ProjectVersionStatusEntry,
  ProjectVersionStatusResponse,
  ProjectVersionUpdateStatus,
  RemoveProjectResponse,
  SearchResult,
  Spec,
  SpecDelta,
  SpecSummary,
  Stats,
  StoreDiscoveryDiagnostic,
  StoreDiscoveryResult,
  StoreDiscoveryStatus,
  StoreRecord,
  StructuredApiError,
  Task,
  TaskProgress,
  ValidationErrorContext,
  ValidationIssue,
  ValidationItem,
  ValidationItemSeverity,
  ValidationItemStatus,
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

function isCommandDelivery(value: unknown): value is 'commands' | 'skills' | 'both' {
  return value === 'commands' || value === 'skills' || value === 'both';
}

function isInvocationFormId(value: unknown): value is InvocationFormId {
  return INVOCATION_FORM_IDS.includes(value as InvocationFormId);
}

function isCommandInventoryItem(value: unknown): value is CommandInventoryItem {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const candidate = value as Partial<CommandInventoryItem>;
  return typeof candidate.workflowId === 'string' && typeof candidate.source === 'string';
}

function isSkillInventoryItem(value: unknown): value is SkillInventoryItem {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const candidate = value as Partial<SkillInventoryItem>;
  return typeof candidate.skillName === 'string' && typeof candidate.source === 'string';
}

/**
 * Defensively parse a Commands inventory. Absent or malformed inventories
 * degrade to null (no evidence) rather than failing the payload.
 */
function normalizeCommandInventory(value: unknown): CommandInventory | null {
  if (!value || typeof value !== 'object') {
    return null;
  }

  const candidate = value as Partial<CommandInventory>;
  if (!isInvocationFormId(candidate.form) || !Array.isArray(candidate.items)) {
    return null;
  }

  const items = candidate.items.filter(isCommandInventoryItem);
  return items.length > 0 ? { form: candidate.form, items } : null;
}

/**
 * Defensively parse a Skills inventory, retaining the shared `.agents`
 * ambiguity via `alternateForms` when present. Absent or malformed inventories
 * degrade to null (no evidence).
 */
function normalizeSkillInventory(value: unknown): SkillInventory | null {
  if (!value || typeof value !== 'object') {
    return null;
  }

  const candidate = value as Partial<SkillInventory>;
  if (!isInvocationFormId(candidate.form) || !Array.isArray(candidate.items)) {
    return null;
  }

  const items = candidate.items.filter(isSkillInventoryItem);
  if (items.length === 0) {
    return null;
  }

  const alternateForms = Array.isArray(candidate.alternateForms)
    ? candidate.alternateForms.filter(isInvocationFormId)
    : [];
  return alternateForms.length > 0
    ? { form: candidate.form, alternateForms, items }
    : { form: candidate.form, items };
}

/**
 * Defensively parse one detected integration. The legacy aggregate fields are
 * validated for compatibility (a response predating the inventories still
 * passes through); the authoritative `commands`/`skills` inventories are
 * defaulted to null when absent or malformed. Malformed integrations are
 * dropped.
 */
function normalizeDetectedIntegration(value: unknown): DetectedIntegration | null {
  if (!value || typeof value !== 'object') {
    return null;
  }

  const candidate = value as Partial<DetectedIntegration>;
  if (
    typeof candidate.tool !== 'string'
    || !isCommandDelivery(candidate.delivery)
    || !isInvocationFormId(candidate.form)
    || typeof candidate.example !== 'string'
    || typeof candidate.source !== 'string'
  ) {
    return null;
  }

  return {
    tool: candidate.tool,
    delivery: candidate.delivery,
    form: candidate.form,
    example: candidate.example,
    source: candidate.source,
    commands: normalizeCommandInventory(candidate.commands),
    skills: normalizeSkillInventory(candidate.skills),
  };
}

function isToolInvocationOption(value: unknown): value is ToolInvocationOption {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const candidate = value as Partial<ToolInvocationOption>;
  return typeof candidate.tool === 'string' && isInvocationFormId(candidate.form);
}

function createUnavailableCommandAvailability(error: string | null): CommandAvailability {
  return {
    status: 'unavailable',
    profile: null,
    workflows: [],
    delivery: null,
    integrations: [],
    forms: [],
    toolOptions: [],
    error,
  };
}

/**
 * Defensive parse of the `/commands/availability` payload. The server contract
 * is additive (`delivery`, `integrations`, `forms`, per-integration `commands`
 * / `skills` inventories); during the staged migration a response may predate
 * them, so each new field is defaulted rather than trusted. Unknown extra
 * fields (e.g. the retired `availableExpandedCommands`) are intentionally
 * ignored. Malformed payloads degrade to `unavailable`, never an app error.
 */
export function normalizeCommandAvailability(value: unknown): CommandAvailability {
  if (!value || typeof value !== 'object') {
    return createUnavailableCommandAvailability(null);
  }

  const candidate = value as Partial<CommandAvailability>;

  return {
    status: candidate.status === 'ready' ? 'ready' : 'unavailable',
    profile: typeof candidate.profile === 'string' ? candidate.profile : null,
    workflows: Array.isArray(candidate.workflows)
      ? candidate.workflows.filter((workflow): workflow is string => typeof workflow === 'string')
      : [],
    delivery: isCommandDelivery(candidate.delivery) ? candidate.delivery : null,
    integrations: Array.isArray(candidate.integrations)
      ? candidate.integrations
          .map(normalizeDetectedIntegration)
          .filter((integration): integration is DetectedIntegration => integration !== null)
      : [],
    forms: Array.isArray(candidate.forms)
      ? candidate.forms.filter(isInvocationFormId)
      : [],
    toolOptions: Array.isArray(candidate.toolOptions)
      ? candidate.toolOptions.filter(isToolInvocationOption)
      : [],
    error: typeof candidate.error === 'string' ? candidate.error : null,
  };
}

export async function getCommandAvailability(): Promise<CommandAvailability> {
  const data = await fetchApi<{ availability: unknown }>('/commands/availability');
  return normalizeCommandAvailability(data.availability);
}

export async function getVersionStatus(): Promise<VersionStatusResponse> {
  return fetchApi<VersionStatusResponse>('/version-status');
}

export async function refreshVersionStatus(): Promise<VersionStatusResponse> {
  return fetchApi<VersionStatusResponse>('/version-status/refresh', { method: 'POST' });
}

export async function getProjectVersionStatus(): Promise<ProjectVersionStatusResponse> {
  return fetchApi<ProjectVersionStatusResponse>('/project-version-status');
}

export async function refreshProjectVersionStatus(): Promise<ProjectVersionStatusResponse> {
  return fetchApi<ProjectVersionStatusResponse>('/project-version-status/refresh', { method: 'POST' });
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

export async function getStores(): Promise<StoreDiscoveryResult> {
  return fetchApi<StoreDiscoveryResult>('/stores');
}
