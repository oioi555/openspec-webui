import type {
  OpenSpecToolDefinition,
  SharedSkillsCompatibility,
} from './types/api';

function includesQuery(values: Array<string | null | undefined>, query: string): boolean {
  const normalized = query.trim().toLocaleLowerCase();
  return normalized.length === 0
    || values.some((value) => value?.toLocaleLowerCase().includes(normalized));
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
