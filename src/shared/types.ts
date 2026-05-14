// OpenSpec Data Types

export interface Project {
  name: string;
  description: string;
  path: string;
  content: string;
  planningContext: PlanningContext;
  legacyProjectDoc: LegacyProjectDoc | null;
  migrationState: ProjectMigrationState;
}

export interface PlanningContextSource {
  path: string;
  type: 'config';
}

export interface PlanningContextRule {
  label: string;
  value: string;
}

export interface PlanningContextSection {
  artifactId: string;
  title: string;
  content: string;
  items: PlanningContextRule[];
}

export interface ParsedPlanningContext {
  source: PlanningContextSource;
  status: 'parsed';
  aiContext: string;
  artifactRules: PlanningContextSection[];
  workflowSchema: string;
}

export interface InvalidPlanningContext {
  source: PlanningContextSource;
  status: 'invalid';
  rawConfig: string;
  parseErrors: string[];
}

export type PlanningContext = ParsedPlanningContext | InvalidPlanningContext;

export interface LegacyProjectDoc {
  path: string;
  content: string;
  description: string;
}

export type ProjectMigrationState = 'config-only' | 'legacy-present' | 'migration-needed';

export interface Spec {
  name: string;
  path: string;
  specContent: string;
  lastModified: string | null;
}

export interface Task {
  text: string;
  completed: boolean;
  line: number;
  subtasks: Task[];
}

export interface TaskProgress {
  done: number;
  total: number;
  percentage: number;
}

export interface ChangeFile {
  name: string;              // Display name (filename without extension)
  path: string;              // Relative path from change root
  absolutePath: string;      // Full filesystem path
  type: 'markdown';
  folder: string;            // Folder name ("root" for top-level)
  content?: string;          // Markdown content
}

export interface FileGroup {
  name: string;              // Display name (e.g., "Core", "Mockups")
  folder: string;            // Folder path
  files: ChangeFile[];
  isCore: boolean;           // True for proposal/tasks/design group
}

export interface Change {
  name: string;
  path: string;
  isArchived: boolean;
  archivedDate: string | null;
  proposal: string | null;
  tasks: Task[];
  tasksRaw: string | null;
  taskProgress: TaskProgress;
  design: string | null;
  specDeltas: SpecDelta[];
  lastModified: string | null;
  // Generic files collection
  files: ChangeFile[];
  fileGroups: FileGroup[];
}

export interface SpecDelta {
  capability: string;
  content: string;
  operations: DeltaOperation[];
}

export interface DeltaOperation {
  type: 'added' | 'modified' | 'removed' | 'renamed';
  name: string;
  content: string;
  startLine: number;
  endLine: number;
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

// API Response Types

export interface ProjectResponse {
  project: Project;
}

export interface SpecsResponse {
  specs: Spec[];
}

export interface SpecResponse {
  spec: Spec;
}

export interface ChangesResponse {
  active: Change[];
  archived: Change[];
}

export interface ChangeResponse {
  change: Change;
}

export interface StatsResponse {
  stats: Stats;
}

export interface SearchResponse {
  results: SearchResult[];
}

// WebSocket Event Types

export type WSEntity = 'project' | 'specs' | 'changes' | 'all';

/**
 * Cause metadata from a filesystem watcher event that triggered a refresh.
 */
export interface WSRefreshCause {
  type: 'add' | 'change' | 'unlink' | 'addDir' | 'unlinkDir';
  path?: string;
}

export interface WSDataRefreshMessage {
  type: 'data:refresh';
  entity: WSEntity;
  entityId?: string;
  data?: unknown;
  /** Set when the refresh was triggered by a watcher file change event. */
  cause?: WSRefreshCause;
}

export interface WSFileChangedMessage {
  type: 'file:changed';
  entity?: WSEntity;
  entityId?: string;
  data?: unknown;
}

export interface WSErrorMessage {
  type: 'error';
  message: string;
  data?: unknown;
}

export interface WSProjectBindMessage {
  type: 'project:bind';
  projectId: string | null;
}

export interface WSProjectBoundMessage {
  type: 'project:bound';
  activeProjectId: string | null;
  data?: unknown;
}

export interface WSConnectionInitMessage {
  type: 'connection:init';
  activeProjectId: string | null;
}

export type WSIncomingMessage = WSProjectBindMessage;

export type WSOutgoingMessage =
  | WSDataRefreshMessage
  | WSFileChangedMessage
  | WSErrorMessage
  | WSProjectBoundMessage
  | WSConnectionInitMessage;

export type WSMessage =
  | WSIncomingMessage
  | WSOutgoingMessage;

// Parser result types

export interface ParseResult<T> {
  data: T | null;
  errors: string[];
  warnings: string[];
}

// Validation types

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
