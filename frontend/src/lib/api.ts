import type { ExpandedCommand } from './commandTypes';

const API_BASE = '/api';

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
  type: 'markdown' | 'html';
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
  hasHtmlFiles: boolean;
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

async function fetchApi<T>(path: string): Promise<T> {
  const response = await fetch(`${API_BASE}${path}`);
  if (!response.ok) {
    throw new Error(`API error: ${response.status}`);
  }
  return response.json();
}

export async function getProject(): Promise<Project> {
  const data = await fetchApi<{ project: Project }>('/project');
  return data.project;
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

export function getChangeFileUrl(changeName: string, filePath: string): string {
  return `${API_BASE}/changes/${encodeURIComponent(changeName)}/files/${filePath}`;
}
