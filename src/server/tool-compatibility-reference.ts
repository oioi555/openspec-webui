import type {
  OpenSpecToolDefinition,
  OpenSpecToolDefinitionSource,
  SharedSkillsCompatibility,
  SharedSkillsSource,
  ToolCompatibilityReferenceResponse,
} from '../shared/types.js';
import officialDataJson from './data/tool-reference/openspec-tools.json' with { type: 'json' };
import researchDataJson from './data/tool-reference/shared-agents-research.json' with { type: 'json' };

export interface OfficialToolDataset {
  schemaVersion: 1;
  source: {
    version: string;
    revision: string;
    url: string;
    checkedAt: string;
  };
  tools: OpenSpecToolDefinition[];
}

export interface ResearchClient {
  id: string;
  name: string;
  openSpecToolId?: string;
  note?: string;
}

export interface SharedAgentsResearchDataset {
  schemaVersion: 1;
  updatedAt: string;
  source: SharedSkillsSource;
  clients: ResearchClient[];
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function requireRecord(value: unknown, field: string): Record<string, unknown> {
  if (!isRecord(value)) throw new Error(`${field} must be an object`);
  return value;
}

function requireString(value: unknown, field: string): string {
  if (typeof value !== 'string' || !value.trim()) throw new Error(`${field} must be a non-empty string`);
  return value;
}

function requireOptionalString(value: unknown, field: string): string | undefined {
  return value === undefined ? undefined : requireString(value, field);
}

function assertIsoDate(value: string, field: string): void {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value) || Number.isNaN(Date.parse(`${value}T00:00:00Z`))) {
    throw new Error(`${field} must be an ISO date (YYYY-MM-DD)`);
  }
}

function parseDelivery(value: unknown, field: string): OpenSpecToolDefinition['commands'] {
  if (value === null) return null;
  const delivery = requireRecord(value, field);
  const invocation = delivery.invocation;
  if (invocation !== null && typeof invocation !== 'string') {
    throw new Error(`${field}.invocation must be a string or null`);
  }
  return {
    path: requireString(delivery.path, `${field}.path`),
    invocation,
  };
}

export function validateOfficialToolDataset(value: unknown): OfficialToolDataset {
  const data = requireRecord(value, 'official dataset');
  if (data.schemaVersion !== 1) throw new Error('Official dataset has unsupported schemaVersion');
  const source = requireRecord(data.source, 'official source');
  const checkedAt = requireString(source.checkedAt, 'official source.checkedAt');
  assertIsoDate(checkedAt, 'official source.checkedAt');
  if (!Array.isArray(data.tools)) throw new Error('official tools must be an array');

  const ids = new Set<string>();
  const tools = data.tools.map((item, index): OpenSpecToolDefinition => {
    const tool = requireRecord(item, `official tools[${index}]`);
    const id = requireString(tool.id, `official tools[${index}].id`);
    if (ids.has(id)) throw new Error(`Duplicate official tool id: ${id}`);
    ids.add(id);
    const commands = parseDelivery(tool.commands, `official tool ${id}.commands`);
    const skills = parseDelivery(tool.skills, `official tool ${id}.skills`);
    if (!commands && !skills) throw new Error(`Official tool ${id} has no Commands or Skills delivery`);
    return { id, name: requireString(tool.name, `official tool ${id}.name`), commands, skills };
  });

  return {
    schemaVersion: 1,
    source: {
      version: requireString(source.version, 'official source.version'),
      revision: requireString(source.revision, 'official source.revision'),
      url: requireString(source.url, 'official source.url'),
      checkedAt,
    },
    tools,
  };
}

export function validateResearchDataset(
  value: unknown,
  official: OfficialToolDataset
): SharedAgentsResearchDataset {
  const data = requireRecord(value, 'research dataset');
  if (data.schemaVersion !== 1) throw new Error('Research dataset has unsupported schemaVersion');
  const updatedAt = requireString(data.updatedAt, 'research updatedAt');
  assertIsoDate(updatedAt, 'research updatedAt');
  const sourceRaw = requireRecord(data.source, 'research source');
  const source: SharedSkillsSource = {
    url: requireString(sourceRaw.url, 'research source.url'),
    revision: requireString(sourceRaw.revision, 'research source.revision'),
    updatedAt: requireString(sourceRaw.updatedAt ?? updatedAt, 'research source.updatedAt'),
  };
  // updatedAt already validated; validate source.updatedAt as well if different
  assertIsoDate(source.updatedAt, 'research source.updatedAt');
  if (!Array.isArray(data.clients)) throw new Error('research clients must be an array');

  const officialIds = new Set(official.tools.map((tool) => tool.id));
  const clientIds = new Set<string>();
  const clients = data.clients.map((item, index): ResearchClient => {
    const client = requireRecord(item, `research clients[${index}]`);
    const id = requireString(client.id, `research clients[${index}].id`);
    if (clientIds.has(id)) throw new Error(`Duplicate research client id: ${id}`);
    clientIds.add(id);
    const name = requireString(client.name, `research client ${id}.name`);
    const openSpecToolId = requireOptionalString(client.openSpecToolId, `research client ${id}.openSpecToolId`);
    if (openSpecToolId && !officialIds.has(openSpecToolId)) {
      throw new Error(`Research client ${id} references unknown OpenSpec tool ${openSpecToolId}`);
    }
    const note = requireOptionalString(client.note, `research client ${id}.note`);
    return {
      id,
      name,
      ...(openSpecToolId ? { openSpecToolId } : {}),
      ...(note ? { note } : {}),
    };
  });

  // Sort not required but keep stable order as given; validation ensures no duplicates
  return { schemaVersion: 1, updatedAt, source, clients };
}

export function projectToolCompatibilityReference(
  official: OfficialToolDataset,
  research: SharedAgentsResearchDataset
): ToolCompatibilityReferenceResponse {
  const sharedCompatibility: SharedSkillsCompatibility[] = research.clients.map((client) => ({
    clientId: client.id,
    name: client.name,
    ...(client.openSpecToolId ? { openSpecToolId: client.openSpecToolId } : {}),
    ...(client.note ? { note: client.note } : {}),
  }));

  return {
    officialDefinitions: official.tools,
    officialSource: {
      version: official.source.version,
      url: official.source.url,
      verifiedAt: official.source.checkedAt,
    },
    sharedSource: research.source,
    sharedCompatibility,
  };
}

export function validateToolCompatibilityReference(
  reference: ToolCompatibilityReferenceResponse
): ToolCompatibilityReferenceResponse {
  if (!reference.officialSource.version.trim() || !reference.officialSource.url.trim()) {
    throw new Error('Official tool source metadata requires version and URL');
  }
  assertIsoDate(reference.officialSource.verifiedAt, 'officialSource.verifiedAt');
  if (!reference.sharedSource.url.trim() || !reference.sharedSource.revision.trim()) {
    throw new Error('Shared source metadata requires url and revision');
  }
  assertIsoDate(reference.sharedSource.updatedAt, 'sharedSource.updatedAt');
  const officialIds = new Set<string>();
  for (const definition of reference.officialDefinitions) {
    if (!definition.id.trim() || !definition.name.trim()) throw new Error('Official tool definitions require non-empty id and name');
    if (officialIds.has(definition.id)) throw new Error(`Duplicate official tool id: ${definition.id}`);
    officialIds.add(definition.id);
    for (const delivery of [definition.commands, definition.skills]) {
      if (delivery && !delivery.path.trim()) throw new Error(`Official tool ${definition.id} has an empty delivery path`);
    }
    if (!definition.commands && !definition.skills) throw new Error(`Official tool ${definition.id} has no Commands or Skills delivery`);
  }
  const clientIds = new Set<string>();
  for (const record of reference.sharedCompatibility) {
    if (!record.clientId.trim() || !record.name.trim()) throw new Error('Compatibility records require non-empty clientId and name');
    if (clientIds.has(record.clientId)) throw new Error(`Duplicate compatibility client id: ${record.clientId}`);
    clientIds.add(record.clientId);
    if (record.openSpecToolId && !officialIds.has(record.openSpecToolId)) {
      throw new Error(`Compatibility record ${record.clientId} references unknown OpenSpec tool ${record.openSpecToolId}`);
    }
    if (record.note !== undefined && !record.note.trim()) throw new Error(`Compatibility record ${record.clientId} has an empty note`);
  }
  return reference;
}

export const OFFICIAL_TOOL_DATASET = validateOfficialToolDataset(officialDataJson);
export const SHARED_AGENTS_RESEARCH_DATASET = validateResearchDataset(researchDataJson, OFFICIAL_TOOL_DATASET);

export const OPEN_SPEC_TOOL_DEFINITION_SOURCE: OpenSpecToolDefinitionSource = {
  version: OFFICIAL_TOOL_DATASET.source.version,
  url: OFFICIAL_TOOL_DATASET.source.url,
  verifiedAt: OFFICIAL_TOOL_DATASET.source.checkedAt,
};
export const OPEN_SPEC_TOOL_DEFINITIONS = OFFICIAL_TOOL_DATASET.tools;
export const SHARED_SKILLS_COMPATIBILITY = projectToolCompatibilityReference(
  OFFICIAL_TOOL_DATASET,
  SHARED_AGENTS_RESEARCH_DATASET
).sharedCompatibility;
export const SHARED_SKILLS_SOURCE = SHARED_AGENTS_RESEARCH_DATASET.source;
export const TOOL_COMPATIBILITY_REFERENCE = validateToolCompatibilityReference(
  projectToolCompatibilityReference(OFFICIAL_TOOL_DATASET, SHARED_AGENTS_RESEARCH_DATASET)
);
