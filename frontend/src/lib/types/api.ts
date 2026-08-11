import type { InvocationFormId } from './commandTypes';

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
  planningContext:
    | {
        source: {
          path: string;
          type: 'config';
        };
        status: 'parsed';
        aiContext: string;
        artifactRules: Array<{
          artifactId: string;
          title: string;
          content: string;
          items: Array<{
            label: string;
            value: string;
          }>;
        }>;
        workflowSchema: string;
      }
    | {
        source: {
          path: string;
          type: 'config';
        };
        status: 'invalid';
        rawConfig: string;
        parseErrors: string[];
      };
  legacyProjectDoc: {
    path: string;
    content: string;
    description: string;
  } | null;
  migrationState: 'config-only' | 'legacy-present' | 'migration-needed';
  pointerStoreId: string | null;
  referenceStoreIds: string[];
}

export interface ProjectEntry {
  id: string;
  path: string;
  label: string;
  addedAt: number;
  lastOpenedAt: number;
  pointerStoreId: string | null;
  referenceStoreIds: string[];
}

// Store Discovery Types (mirrors src/shared/types.ts)

export interface StoreRecord {
  id: string;
  root: string;
}

export type StoreDiscoveryStatus = 'stores' | 'empty' | 'unavailable';

export interface StoreDiscoveryDiagnostic {
  code: 'CLI_MISSING' | 'CLI_ERROR' | 'TIMEOUT' | 'MALFORMED_OUTPUT' | 'INVALID_SHAPE';
  message: string;
  exitCode?: number | null;
  stderr?: string;
}

export interface StoreDiscoveryResult {
  status: StoreDiscoveryStatus;
  stores: StoreRecord[];
  reason: StoreDiscoveryDiagnostic | null;
  checkedAt: string | null;
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
  lastModified: string | null;
}

export interface SpecSummary {
  name: string;
  path: string;
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

export interface OtherFile {
  name: string;
  path: string;
  absolutePath: string;
  type: 'markdown' | 'json' | 'yaml' | 'text';
  content: string;
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
  otherFileCount: number;
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
  otherFiles: OtherFile[];
  otherFileCount: number;
}

export interface Stats {
  totalSpecs: number;
  activeChanges: number;
  archivedChanges: number;
  overallTaskProgress: TaskProgress;
}

export type SearchMatchSource = 'content' | 'name' | 'path';

export interface SearchMatchLocation {
  fileGroupName?: string;
  fileName?: string;
  specDeltaCapability?: string;
  otherFilePath?: string;
}

export interface SearchResult {
  type: 'spec' | 'change' | 'project';
  name: string;
  path: string;
  excerpt: string;
  matchLine: number;
  matchSource: SearchMatchSource;
  matchLocation?: SearchMatchLocation;
}

export type CommandDelivery = 'commands' | 'skills' | 'both' | null;

/** One detected OpenSpec command artifact: the workflow id and its repo-relative source path. */
export interface CommandInventoryItem {
  workflowId: string;
  /** Posix-normalized path relative to the project root. */
  source: string;
}

/**
 * The complete Commands inventory for one detected tool. `form` is the
 * invocation form those command files produce. Authoritative, workflow-specific
 * evidence — unlike the legacy singular `form`/`source` fields.
 */
export interface CommandInventory {
  form: InvocationFormId;
  items: CommandInventoryItem[];
}

/** One detected OpenSpec skill artifact: the canonical skill name and its SKILL.md source path. */
export interface SkillInventoryItem {
  skillName: string;
  /** Posix-normalized path relative to the project root. */
  source: string;
}

/**
 * The complete Skills inventory for one detected tool. `form` is the primary
 * invocation form; `alternateForms` carries additional documented invocation
 * forms that consume the same artifact tree (only the shared `.agents` root,
 * which is used by both Shared `.agents` and Codex).
 */
export interface SkillInventory {
  form: InvocationFormId;
  alternateForms?: InvocationFormId[];
  items: SkillInventoryItem[];
}

/**
 * A detected repo-local OpenSpec integration. `commands` and `skills` are the
 * authoritative per-workflow inventories. The remaining fields (`delivery`,
 * `form`, `example`, `source`) are legacy aggregate presentation data that MUST
 * NOT be used for candidate eligibility because they discard dual-delivery and
 * per-workflow evidence.
 */
export interface DetectedIntegration {
  tool: string;
  /** @deprecated Legacy aggregate presentation data. */
  delivery: 'commands' | 'skills' | 'both';
  /** @deprecated Legacy representative form. */
  form: InvocationFormId;
  /** @deprecated Legacy example invocation for the representative form. */
  example: string;
  /** @deprecated Legacy representative source path. */
  source: string;
  /** Authoritative Commands evidence, or null when no command artifact matched. */
  commands: CommandInventory | null;
  /** Authoritative Skills evidence, or null when no skill artifact matched. */
  skills: SkillInventory | null;
}

export interface ToolInvocationOption {
  tool: string;
  form: InvocationFormId;
}

export interface CommandAvailability {
  status: 'ready' | 'unavailable';
  profile: string | null;
  workflows: string[];
  /** Delivery mode from `openspec config get delivery` (defensively parsed). */
  delivery: CommandDelivery;
  /** Detected OpenSpec tool integrations for the active repository (hints only). */
  integrations: DetectedIntegration[];
  /** Deduplicated distinct invocation-form candidates from detection. */
  forms: InvocationFormId[];
  /**
   * Static catalog of supported tool-to-form options for the copy-time
   * selector. Always present — even when the server detects nothing or the CLI
   * config is unavailable — so the UI can offer official tool choices with
   * zero detections.
   */
  toolOptions: ToolInvocationOption[];
  error: string | null;
}

export type VersionToolStatus = 'up-to-date' | 'update-available' | 'unavailable' | 'unknown';

export interface ToolVersionStatus {
  currentVersion: string | null;
  latestVersion: string | null;
  updateAvailable: boolean;
  status: VersionToolStatus;
  error: string | null;
  notInstalled: boolean;
}

export interface VersionStatusResponse {
  loading: boolean;
  checkedAt: string | null;
  tools: {
    webui: ToolVersionStatus;
    openspec: ToolVersionStatus;
  };
}

export type ProjectVersionUpdateStatus = 'up-to-date' | 'update-available' | 'unknown';

export interface ProjectVersionStatusEntry {
  /** Registered project root path. */
  path: string;
  /** OpenSpec CLI version detected from the project's generated skill files, or null when unknown. */
  generationVersion: string | null;
  /** Current global OpenSpec CLI version used as the comparison baseline for this entry. */
  currentVersion: string | null;
  /** Derived update status for the project. */
  status: ProjectVersionUpdateStatus;
}

export interface ProjectVersionStatusResponse {
  /** Current global OpenSpec CLI version (comparison baseline for every entry). */
  currentCliVersion: string | null;
  checkedAt: string | null;
  projects: ProjectVersionStatusEntry[];
}

export interface BrowseDirEntry {
  name: string;
  path: string;
  hasOpenSpec: boolean;
}

export interface BrowseResult {
  path: string;
  parent: string | null;
  dirs: BrowseDirEntry[];
  error?: string;
}

export type ValidationItemSeverity = 'ERROR' | 'WARNING' | 'INFO';
export type ValidationItemStatus = 'passed' | 'info' | 'warning' | 'failed';

export interface ValidationIssue {
  level: ValidationItemSeverity;
  path: string;
  message: string;
}

export type ValidationItemType = 'spec' | 'change' | 'project' | 'unknown';

export interface ValidationItem {
  id: string;
  name: string;
  type: ValidationItemType;
  valid: boolean;
  status: ValidationItemStatus;
  issueCount: number;
  issues: ValidationIssue[];
}

export interface ValidationSummary {
  totalItems: number;
  passed: number;
  failed: number;
  issueItems: number;
  statusCounts: Record<ValidationItemStatus, number>;
  severityCounts: Record<ValidationItemSeverity, number>;
}

export interface ValidationResult {
  status: 'passed' | 'failed';
  items: ValidationItem[];
  failedItems: ValidationItem[];
  issueItems: ValidationItem[];
  summary: ValidationSummary;
  runAt: string;
}

export interface ValidationErrorContext {
  command: string;
  exitCode: number | null;
  stderr: string;
}
