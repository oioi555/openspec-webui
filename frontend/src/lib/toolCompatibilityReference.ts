import type {
  OpenSpecToolDefinition,
  SharedSkillsCompatibility,
} from './types/api';

const SHARED_AGENTS_SKILLS_MARKER = '.agents/skills';

export type SharedAgentsInstallerStyle = 'slash' | 'dollar';

export interface SharedAgentsInstallerGroup {
  style: SharedAgentsInstallerStyle;
  ids: string[];
  path: typeof SHARED_AGENTS_SKILLS_MARKER;
  invocation: '/openspec-*' | '$openspec-*';
}

function includesQuery(values: Array<string | null | undefined>, query: string): boolean {
  const normalized = query.trim().toLocaleLowerCase();
  return normalized.length === 0
    || values.some((value) => value?.toLocaleLowerCase().includes(normalized));
}

function isSharedAgentsSkillsPath(path: string | null | undefined): boolean {
  return typeof path === 'string' && path.includes(SHARED_AGENTS_SKILLS_MARKER);
}

function isDollarInvocation(invocation: string | null | undefined): boolean {
  return (invocation ?? '').trim().startsWith('$');
}

function sortInstallerIds(ids: readonly string[]): string[] {
  const rest = ids.filter((id) => id !== 'agents').slice().sort((a, b) => a.localeCompare(b));
  return ids.includes('agents') ? ['agents', ...rest] : rest;
}

export function groupSharedAgentsSkillInstallers(
  definitions: readonly OpenSpecToolDefinition[],
): SharedAgentsInstallerGroup[] {
  const slash: string[] = [];
  const dollar: string[] = [];

  for (const definition of definitions) {
    if (!isSharedAgentsSkillsPath(definition.skills?.path)) {
      continue;
    }
    const bucket = isDollarInvocation(definition.skills?.invocation) ? dollar : slash;
    if (!bucket.includes(definition.id)) {
      bucket.push(definition.id);
    }
  }

  const groups: SharedAgentsInstallerGroup[] = [];
  const slashIds = sortInstallerIds(slash);
  const dollarIds = sortInstallerIds(dollar);
  if (slashIds.length > 0) {
    groups.push({
      style: 'slash',
      ids: slashIds,
      path: SHARED_AGENTS_SKILLS_MARKER,
      invocation: '/openspec-*',
    });
  }
  if (dollarIds.length > 0) {
    groups.push({
      style: 'dollar',
      ids: dollarIds,
      path: SHARED_AGENTS_SKILLS_MARKER,
      invocation: '$openspec-*',
    });
  }
  return groups;
}

export function filterOfficialToolDefinitions(
  definitions: readonly OpenSpecToolDefinition[],
  query: string
): OpenSpecToolDefinition[] {
  return definitions.filter((definition) => includesQuery([
    definition.name,
    definition.id,
    definition.commands?.path,
    definition.skills?.path,
  ], query));
}

export function filterSharedSkillsCompatibility(
  records: readonly SharedSkillsCompatibility[],
  query: string
): SharedSkillsCompatibility[] {
  return records.filter((record) => includesQuery([
    record.name,
    record.clientId,
    record.openSpecToolId,
    record.note,
  ], query));
}
