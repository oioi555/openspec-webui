import { PROJECT_INIT_COMMAND } from './state/projectVersionStatusCore';
import type {
  DetectedIntegration,
  OpenSpecToolDefinition,
  ToolScopeKind,
  ToolScopeSupportData,
} from './types/api';

/**
 * Pure helpers behind the Settings Tools section (OpenSpec 2.x model): the
 * machine / repository grouping, per-row scope support and labels, and the
 * predicates that decide which `openspec init` commands are offered.
 */

export interface ToolGroups {
  /** Global integrations (this machine, shared by every project). */
  machine: DetectedIntegration[];
  /** Project integrations (kept in this repository). */
  repository: DetectedIntegration[];
}

export function groupIntegrationsByScope(integrations: readonly DetectedIntegration[]): ToolGroups {
  return {
    machine: integrations.filter((integration) => integration.scope === 'global'),
    repository: integrations.filter((integration) => integration.scope !== 'global'),
  };
}

/** Rows of the shared `.agents/skills` tree (not a single tool's own folder). */
const SHARED_AGENTS_TARGETS = new Set(['agents', 'codex', 'multi', 'legacy']);

function invertToolNames(toolNames: Readonly<Record<string, string>>): Map<string, string> {
  const byName = new Map<string, string>();
  for (const [id, name] of Object.entries(toolNames)) {
    if (!byName.has(name)) byName.set(name, id);
  }
  return byName;
}

/**
 * The OpenSpec tool ids an integration row stands for: the marker targets of
 * a multi-target shared tree, `agents` for any other shared `.agents` row, or
 * the id whose served display name matches the row's tool name.
 */
export function resolveIntegrationToolIds(
  integration: DetectedIntegration,
  toolNames: Readonly<Record<string, string>>,
): string[] {
  if (integration.sharedSkillTargets && integration.sharedSkillTargets.length > 0) {
    return [...integration.sharedSkillTargets];
  }
  if (integration.sharedSkillTarget && SHARED_AGENTS_TARGETS.has(integration.sharedSkillTarget)) {
    return ['agents'];
  }
  if (integration.sharedSkillTarget && integration.sharedSkillTarget in toolNames) {
    return [integration.sharedSkillTarget];
  }
  if (integration.tool in toolNames) return [integration.tool];
  const id = invertToolNames(toolNames).get(integration.tool);
  return id ? [id] : [];
}

const SCOPE_KIND_RANK: Record<ToolScopeKind, number> = { universal: 0, linked: 1, 'project-only': 2 };

/**
 * A row's skill scope support from the served tool reference. A row that
 * stands for several tools reports the most restrictive kind. Null when the
 * reference is not loaded or the tool is unknown.
 */
export function integrationScopeKind(
  integration: DetectedIntegration,
  toolNames: Readonly<Record<string, string>>,
  scopeSupport: ToolScopeSupportData | null | undefined,
): ToolScopeKind | null {
  if (!scopeSupport) return null;
  let kind: ToolScopeKind | null = null;
  for (const id of resolveIntegrationToolIds(integration, toolNames)) {
    const entry = scopeSupport.tools[id];
    if (entry && (kind === null || SCOPE_KIND_RANK[entry.kind] > SCOPE_KIND_RANK[kind])) {
      kind = entry.kind;
    }
  }
  return kind;
}

/** 1.x legacy: the only evidence is command files (Commands were retired in 2.0). */
export function isLegacyCommandOnly(integration: DetectedIntegration): boolean {
  return integration.commands !== null && integration.skills === null;
}

/** Display names of a multi-target shared tree's marker targets; null for other rows. */
export function sharedTargetNames(
  integration: DetectedIntegration,
  toolNames: Readonly<Record<string, string>>,
): string[] | null {
  const targets = integration.sharedSkillTargets;
  if (!targets || targets.length < 2) return null;
  return targets.map((id) => toolNames[id] ?? id);
}

export interface MoveToGlobalState {
  /** Whether `openspec init --scope global` is offered. */
  offered: boolean;
  /** Display names of project rows whose tool has no global folder. */
  blockingTools: string[];
  /** OpenSpec refuses the move while Copilot cloud files are set up. */
  copilotCloud: boolean;
}

/**
 * Where `openspec init --tools <id>` adds a tool. OpenSpec 2.1.1 keeps a
 * repository that already has its own skills in project scope, so the same
 * command adds to the repository there and to the machine otherwise.
 */
export type ToolAddTarget = 'machine' | 'repository';

export interface ToolCommandState {
  /** `openspec init --tools <id>`: always offered while a project is active. */
  toolAdd: ToolAddTarget;
  /** `openspec init --scope project`: offered when the repository has no project evidence. */
  keepInRepository: boolean;
  /** `openspec init --scope global`: only shown when the repository has project evidence. */
  moveToGlobal: MoveToGlobalState | null;
  /** `openspec init`: offered when nothing is detected. */
  init: boolean;
}

export function resolveToolCommandState(input: {
  integrations: readonly DetectedIntegration[];
  copilotCloud: boolean;
  toolNames: Readonly<Record<string, string>>;
  scopeSupport: ToolScopeSupportData | null | undefined;
}): ToolCommandState {
  const { repository } = groupIntegrationsByScope(input.integrations);
  let moveToGlobal: MoveToGlobalState | null = null;
  if (repository.length > 0) {
    const blockingTools: string[] = [];
    for (const integration of repository) {
      for (const id of resolveIntegrationToolIds(integration, input.toolNames)) {
        if (input.scopeSupport?.tools[id]?.kind === 'project-only') {
          const name = input.toolNames[id] ?? id;
          if (!blockingTools.includes(name)) blockingTools.push(name);
        }
      }
    }
    moveToGlobal = {
      offered: blockingTools.length === 0 && !input.copilotCloud,
      blockingTools,
      copilotCloud: input.copilotCloud,
    };
  }
  return {
    toolAdd: repository.length > 0 ? 'repository' : 'machine',
    keepInRepository: repository.length === 0,
    moveToGlobal,
    init: input.integrations.length === 0,
  };
}

/**
 * Served tools for the add-tool picker. Adding to the machine excludes
 * project-only tools (picking one would turn the repository into a project
 * install); adding to a project-scope repository allows every tool.
 */
export function toolAddChoices(
  definitions: readonly OpenSpecToolDefinition[],
  scopeSupport: ToolScopeSupportData | null | undefined,
  target: ToolAddTarget,
): OpenSpecToolDefinition[] {
  if (target === 'repository') return [...definitions];
  return definitions.filter((definition) => scopeSupport?.tools[definition.id]?.kind !== 'project-only');
}

function quotePath(path: string): string {
  return /\s/.test(path) ? `'${path}'` : path;
}

/** `openspec init <flags> <path>`; command tokens stay in English. */
export function buildInitCommand(path: string, flags: readonly string[] = []): string {
  return [PROJECT_INIT_COMMAND, ...flags, quotePath(path)].join(' ');
}
