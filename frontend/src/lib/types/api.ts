import type { ExpandedCommand } from './commandTypes';

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
