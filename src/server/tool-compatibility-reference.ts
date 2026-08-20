import type {
  OpenSpecToolDefinition,
  OpenSpecToolDefinitionSource,
  SharedSkillsAccessMode,
  SharedSkillsCompatibility,
  SharedSkillsEvidenceKind,
  SharedSkillsScope,
  ToolCompatibilityReferenceResponse,
} from '../shared/types.js';

const OFFICIAL_DOCS_URL =
  'https://github.com/Fission-AI/OpenSpec/blob/v1.10.0/docs/supported-tools.md';
const SNAPSHOT_DATE = '2026-08-20';

const commands = (path: string, invocation: string): OpenSpecToolDefinition['commands'] => ({
  path,
  invocation,
});

const skills = (
  path: string,
  invocation: string | null = '/openspec-<skill>'
): OpenSpecToolDefinition['skills'] => ({ path, invocation });

export const OPEN_SPEC_TOOL_DEFINITION_SOURCE: OpenSpecToolDefinitionSource = {
  version: 'v1.10.0',
  url: OFFICIAL_DOCS_URL,
  verifiedAt: SNAPSHOT_DATE,
};

/**
 * Complete snapshot of the v1.10.0 Tool Directory Reference. This is reference
 * data, not evidence that a tool is installed in the active repository.
 */
export const OPEN_SPEC_TOOL_DEFINITIONS: OpenSpecToolDefinition[] = [
  { id: 'amazon-q', name: 'Amazon Q Developer', skills: skills('.amazonq/skills/openspec-*/SKILL.md'), commands: commands('.amazonq/prompts/opsx-<id>.md', '@opsx-<id>') },
  { id: 'antigravity', name: 'Antigravity', skills: skills('.agent/skills/openspec-*/SKILL.md'), commands: commands('.agent/workflows/opsx-<id>.md', '/opsx-<id>') },
  { id: 'auggie', name: 'Auggie', skills: skills('.augment/skills/openspec-*/SKILL.md'), commands: commands('.augment/commands/opsx-<id>.md', '/opsx-<id>') },
  { id: 'bob', name: 'IBM Bob Shell', skills: skills('.bob/skills/openspec-*/SKILL.md'), commands: commands('.bob/commands/opsx-<id>.md', '/opsx-<id>') },
  { id: 'claude', name: 'Claude Code', skills: skills('.claude/skills/openspec-*/SKILL.md'), commands: commands('.claude/commands/opsx/<id>.md', '/opsx:<id>') },
  { id: 'cline', name: 'Cline', skills: skills('.cline/skills/openspec-*/SKILL.md'), commands: commands('.clinerules/workflows/opsx-<id>.md', '/opsx-<id>') },
  { id: 'command-code', name: 'Command Code', skills: skills('.commandcode/skills/openspec-*/SKILL.md'), commands: commands('.commandcode/commands/opsx-<id>.md', '/opsx-<id>') },
  { id: 'codeartsagent', name: 'CodeArts', skills: skills('.codeartsdoer/skills/openspec-*/SKILL.md'), commands: null },
  { id: 'codebuddy', name: 'CodeBuddy', skills: skills('.codebuddy/skills/openspec-*/SKILL.md'), commands: commands('.codebuddy/commands/opsx/<id>.md', '/opsx:<id>') },
  { id: 'codex', name: 'Codex', skills: skills('.agents/skills/openspec-*/SKILL.md', '$openspec-<skill>'), commands: null },
  { id: 'devin', name: 'Devin Desktop, formerly Windsurf', skills: skills('.devin/skills/openspec-*/SKILL.md'), commands: commands('.devin/workflows/opsx-<id>.md', '/opsx-<id>') },
  { id: 'forgecode', name: 'ForgeCode', skills: skills('.forge/skills/openspec-*/SKILL.md'), commands: null },
  { id: 'continue', name: 'Continue', skills: skills('.continue/skills/openspec-*/SKILL.md'), commands: commands('.continue/prompts/opsx-<id>.prompt', '/opsx-<id>') },
  { id: 'costrict', name: 'CoStrict', skills: skills('.cospec/skills/openspec-*/SKILL.md'), commands: commands('.cospec/openspec/commands/opsx-<id>.md', '/opsx-<id>') },
  { id: 'crush', name: 'Crush', skills: skills('.crush/skills/openspec-*/SKILL.md'), commands: commands('.crush/commands/opsx/<id>.md', '/opsx:<id>') },
  { id: 'cursor', name: 'Cursor', skills: skills('.cursor/skills/openspec-*/SKILL.md'), commands: commands('.cursor/commands/opsx-<id>.md', '/opsx-<id>') },
  { id: 'factory', name: 'Factory Droid', skills: skills('.factory/skills/openspec-*/SKILL.md'), commands: commands('.factory/commands/opsx-<id>.md', '/opsx-<id>') },
  { id: 'gemini', name: 'Gemini CLI', skills: skills('.gemini/skills/openspec-*/SKILL.md'), commands: commands('.gemini/commands/opsx/<id>.toml', '/opsx:<id>') },
  { id: 'github-copilot', name: 'GitHub Copilot', skills: skills('.github/skills/openspec-*/SKILL.md'), commands: commands('.github/prompts/opsx-<id>.prompt.md', '/opsx-<id>') },
  { id: 'hermes', name: 'Hermes Agent', skills: skills('.hermes/skills/openspec-*/SKILL.md'), commands: null },
  { id: 'iflow', name: 'iFlow', skills: skills('.iflow/skills/openspec-*/SKILL.md'), commands: commands('.iflow/commands/opsx-<id>.md', '/opsx-<id>') },
  { id: 'junie', name: 'Junie', skills: skills('.junie/skills/openspec-*/SKILL.md'), commands: commands('.junie/commands/opsx-<id>.md', '/opsx-<id>') },
  { id: 'kilocode', name: 'Kilo Code', skills: skills('.kilocode/skills/openspec-*/SKILL.md'), commands: commands('.kilocode/workflows/opsx-<id>.md', '/opsx-<id>') },
  { id: 'kimi', name: 'Kimi Code', skills: skills('.kimi-code/skills/openspec-*/SKILL.md', '/skill:openspec-<skill>'), commands: null },
  { id: 'kiro', name: 'Kiro', skills: skills('.kiro/skills/openspec-*/SKILL.md'), commands: commands('.kiro/prompts/opsx-<id>.prompt.md', '/opsx-<id>') },
  { id: 'lingma', name: 'Lingma', skills: skills('.lingma/skills/openspec-*/SKILL.md'), commands: commands('.lingma/commands/opsx/<id>.md', '/opsx:<id>') },
  { id: 'minimax-code', name: 'MiniMax Code', skills: skills('~/.minimax/skills/openspec-*/SKILL.md', null), commands: null },
  { id: 'vibe', name: 'Mistral Vibe', skills: skills('.vibe/skills/openspec-*/SKILL.md'), commands: null },
  { id: 'oh-my-pi', name: 'Oh My Pi', skills: skills('.omp/skills/openspec-*/SKILL.md'), commands: commands('.omp/commands/opsx-<id>.md', '/opsx-<id>') },
  { id: 'opencode', name: 'OpenCode', skills: skills('.opencode/skills/openspec-*/SKILL.md'), commands: commands('.opencode/commands/opsx-<id>.md', '/opsx-<id>') },
  { id: 'pi', name: 'Pi', skills: skills('.pi/skills/openspec-*/SKILL.md'), commands: commands('.pi/prompts/opsx-<id>.md', '/opsx-<id>') },
  { id: 'qoder', name: 'Qoder', skills: skills('.qoder/skills/openspec-*/SKILL.md'), commands: commands('.qoder/commands/opsx/<id>.md', '/opsx:<id>') },
  { id: 'qwen', name: 'Qwen Code', skills: skills('.qwen/skills/openspec-*/SKILL.md'), commands: commands('.qwen/commands/opsx-<id>.md', '/opsx-<id>') },
  { id: 'rovodev', name: 'Rovo Dev CLI', skills: skills('.rovodev/skills/openspec-*/SKILL.md', 'use the openspec-<skill> skill'), commands: null },
  { id: 'roocode', name: 'Zoo Code', skills: skills('.roo/skills/openspec-*/SKILL.md'), commands: commands('.roo/commands/opsx-<id>.md', '/opsx-<id>') },
  { id: 'trae', name: 'Trae', skills: skills('.trae/skills/openspec-*/SKILL.md'), commands: commands('.trae/commands/opsx-<id>.md', '/opsx-<id>') },
  { id: 'zed', name: 'Zed Agent', skills: skills('.agents/skills/openspec-*/SKILL.md', '/openspec-<skill> or @openspec-<skill>'), commands: null },
  { id: 'zcode', name: 'ZCode', skills: skills('.zcode/skills/openspec-*/SKILL.md'), commands: commands('.zcode/commands/opsx/<id>.md', '/opsx:<id>') },
  { id: 'agents', name: 'Shared .agents skills', skills: skills('.agents/skills/openspec-*/SKILL.md'), commands: null },
];

const RESEARCH_SUMMARY = 'user-supplied:chatgpt-research-2026-08-20';

function officialCandidate(
  id: string,
  accessMode: SharedSkillsAccessMode,
  scopes: SharedSkillsScope[],
  evidenceKind: SharedSkillsEvidenceKind = 'research-summary',
  source = RESEARCH_SUMMARY,
  minVersion?: string
): SharedSkillsCompatibility {
  const definition = OPEN_SPEC_TOOL_DEFINITIONS.find((candidate) => candidate.id === id);
  if (!definition) throw new Error(`Missing official tool definition for compatibility candidate ${id}`);
  return {
    clientId: id,
    name: definition.name,
    openSpecToolId: id,
    accessMode,
    scopes,
    evidenceKind,
    source,
    researchedAt: SNAPSHOT_DATE,
    ...(minVersion ? { minVersion } : {}),
  };
}

function externalCandidate(clientId: string, name: string): SharedSkillsCompatibility {
  return {
    clientId,
    name,
    accessMode: 'native-project',
    scopes: ['project'],
    evidenceKind: 'research-summary',
    source: RESEARCH_SUMMARY,
    researchedAt: SNAPSHOT_DATE,
  };
}

/**
 * Non-exhaustive snapshot of clients for which the current research found a
 * useful `.agents/skills` signal. Missing rows intentionally mean no conclusion.
 */
export const SHARED_SKILLS_COMPATIBILITY: SharedSkillsCompatibility[] = [
  officialCandidate('antigravity', 'native-project', ['project'], 'vendor-docs', 'https://antigravity.google/docs/skills'),
  officialCandidate('auggie', 'native-project', ['project']),
  officialCandidate('cline', 'unverified', ['project']),
  officialCandidate('command-code', 'native-project', ['project', 'global']),
  officialCandidate('codex', 'native-project', ['project', 'global'], 'vendor-docs', 'https://developers.openai.com/codex/build-skills'),
  officialCandidate('devin', 'native-project', ['project']),
  officialCandidate('forgecode', 'native-global', ['global']),
  officialCandidate('crush', 'native-project', ['project']),
  officialCandidate('cursor', 'native-project', ['project', 'global'], 'vendor-docs', 'https://cursor.com/docs/skills'),
  officialCandidate('factory', 'native-project', ['project']),
  officialCandidate('gemini', 'native-project', ['project', 'global']),
  officialCandidate('github-copilot', 'native-project', ['project', 'global']),
  officialCandidate('hermes', 'configurable', ['project']),
  officialCandidate('kilocode', 'native-project', ['project']),
  officialCandidate('kimi', 'native-project', ['project', 'global']),
  officialCandidate('vibe', 'native-project', ['project', 'global']),
  officialCandidate('opencode', 'native-project', ['project', 'global'], 'vendor-docs', 'https://opencode.ai/docs/skills'),
  officialCandidate('pi', 'native-project', ['project', 'global']),
  officialCandidate('qoder', 'native-project', ['project']),
  officialCandidate('qwen', 'native-project', ['project']),
  officialCandidate('rovodev', 'native-project', ['project', 'global']),
  officialCandidate('roocode', 'native-project', ['project']),
  officialCandidate('zed', 'native-project', ['project', 'global'], 'vendor-docs', 'https://zed.dev/docs/ai/skills', '1.4.2'),
  officialCandidate('agents', 'native-project', ['project'], 'standard-listing', OFFICIAL_DOCS_URL),
  {
    clientId: 'grok-build',
    name: 'Grok Build',
    accessMode: 'native-project',
    scopes: ['project'],
    evidenceKind: 'runtime-observed',
    source: 'runtime:openspec-webui-maintainer',
    researchedAt: SNAPSHOT_DATE,
  },
  externalCandidate('amp', 'Amp'),
  externalCandidate('replit', 'Replit'),
  externalCandidate('antigravity-cli', 'Antigravity CLI'),
  externalCandidate('dexto', 'Dexto'),
  externalCandidate('deep-agents', 'Deep Agents'),
  externalCandidate('firebender', 'Firebender'),
  externalCandidate('warp', 'Warp'),
  externalCandidate('loaf', 'Loaf'),
  externalCandidate('promptscript', 'PromptScript'),
];

const ACCESS_MODES = new Set<SharedSkillsAccessMode>([
  'native-project',
  'native-global',
  'configurable',
  'import',
  'format-only',
  'unverified',
]);
const SCOPES = new Set<SharedSkillsScope>(['project', 'global']);
const EVIDENCE_KINDS = new Set<SharedSkillsEvidenceKind>([
  'vendor-docs',
  'standard-listing',
  'research-summary',
  'runtime-observed',
]);

function assertIsoDate(value: string, field: string): void {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value) || Number.isNaN(Date.parse(`${value}T00:00:00Z`))) {
    throw new Error(`${field} must be an ISO date (YYYY-MM-DD)`);
  }
}

export function validateToolCompatibilityReference(
  reference: ToolCompatibilityReferenceResponse
): ToolCompatibilityReferenceResponse {
  if (!reference.officialSource.version.trim() || !reference.officialSource.url.trim()) {
    throw new Error('Official tool source metadata requires version and URL');
  }
  assertIsoDate(reference.officialSource.verifiedAt, 'officialSource.verifiedAt');

  const officialIds = new Set<string>();
  for (const definition of reference.officialDefinitions) {
    if (!definition.id.trim() || !definition.name.trim()) {
      throw new Error('Official tool definitions require non-empty id and name');
    }
    if (officialIds.has(definition.id)) {
      throw new Error(`Duplicate official tool id: ${definition.id}`);
    }
    officialIds.add(definition.id);
    if (!definition.commands && !definition.skills) {
      throw new Error(`Official tool ${definition.id} has no Commands or Skills delivery`);
    }
    for (const [deliveryName, delivery] of [
      ['commands', definition.commands],
      ['skills', definition.skills],
    ] as const) {
      if (delivery && !delivery.path.trim()) {
        throw new Error(`Official tool ${definition.id} has an empty ${deliveryName} path`);
      }
    }
  }

  const clientIds = new Set<string>();
  for (const record of reference.sharedCompatibility) {
    if (!record.clientId.trim() || !record.name.trim()) {
      throw new Error('Compatibility records require non-empty clientId and name');
    }
    if (clientIds.has(record.clientId)) {
      throw new Error(`Duplicate compatibility client id: ${record.clientId}`);
    }
    clientIds.add(record.clientId);
    if (!ACCESS_MODES.has(record.accessMode)) {
      throw new Error(`Invalid access mode for ${record.clientId}: ${record.accessMode}`);
    }
    if (!EVIDENCE_KINDS.has(record.evidenceKind)) {
      throw new Error(`Invalid evidence kind for ${record.clientId}: ${record.evidenceKind}`);
    }
    if (!record.source.trim()) {
      throw new Error(`Compatibility record ${record.clientId} requires a source or reference`);
    }
    assertIsoDate(record.researchedAt, `${record.clientId}.researchedAt`);
    if (record.minVersion !== undefined && record.minVersion.trim() === '') {
      throw new Error(`Compatibility record ${record.clientId} has an empty minimum version`);
    }
    const uniqueScopes = new Set(record.scopes);
    if (uniqueScopes.size !== record.scopes.length || record.scopes.some((scope) => !SCOPES.has(scope))) {
      throw new Error(`Invalid or duplicate scope for ${record.clientId}`);
    }
    if (record.accessMode === 'native-project' && !record.scopes.includes('project')) {
      throw new Error(`Project-native record ${record.clientId} must include project scope`);
    }
    if (record.accessMode === 'native-global' && !record.scopes.includes('global')) {
      throw new Error(`Global-native record ${record.clientId} requires global scope`);
    }
    if (record.openSpecToolId) {
      if (!officialIds.has(record.openSpecToolId)) {
        throw new Error(`Compatibility record ${record.clientId} references unknown OpenSpec tool ${record.openSpecToolId}`);
      }
    }
  }

  return reference;
}

export const TOOL_COMPATIBILITY_REFERENCE = validateToolCompatibilityReference({
  officialDefinitions: OPEN_SPEC_TOOL_DEFINITIONS,
  officialSource: OPEN_SPEC_TOOL_DEFINITION_SOURCE,
  sharedCompatibility: SHARED_SKILLS_COMPATIBILITY,
});
