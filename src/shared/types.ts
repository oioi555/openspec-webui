// OpenSpec Data Types

export interface Project {
  name: string;
  description: string;
  path: string;
  content: string;
}

export interface Spec {
  name: string;
  path: string;
  specContent: string;
  designContent: string | null;
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

export interface SearchResult {
  type: 'spec' | 'change' | 'project';
  name: string;
  path: string;
  excerpt: string;
  matchLine: number;
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

export interface WSDataRefreshMessage {
  type: 'data:refresh';
  entity: WSEntity;
  entityId?: string;
  data?: unknown;
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
