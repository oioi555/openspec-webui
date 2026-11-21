import assert from 'node:assert/strict';
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { test } from 'node:test';

import { readFileSync } from 'node:fs';
import { validateOfficialToolDataset, validateResearchDataset } from '../src/server/tool-compatibility-reference.ts';
import {
  buildOfficialDatasetV2,
  buildToolScopeSupport,
  diffToolScopeSupport,
  installerAgent,
  legacySkillInvocations,
  openSpecToolIds,
  readBundledSkillsVersion,
  readOpenSpecInstallerConfig,
  readSkillsAgentTable,
  readSupportedToolsTable,
  supportedToolsPage,
} from './tool-reference-sources.mjs';
import { analyzeToolReferenceUpdate, runCli, validateToolScopeSupport } from './update-tool-reference.mjs';

const jsonFixture = (name) => JSON.parse(readFileSync(new URL(`./fixtures/tool-reference/${name}`, import.meta.url), 'utf8'));
// The previously pinned 1.x snapshot, frozen so the re-pin diff stays testable.
const OFFICIAL_TOOL_DATASET = validateOfficialToolDataset(jsonFixture('openspec-tools-v1.14.0.json'));
const SHARED_AGENTS_RESEARCH_DATASET = validateResearchDataset(jsonFixture('shared-agents-research-v1.14.0.json'), OFFICIAL_TOOL_DATASET);
const fixture = (name) => readFile(new URL(`./fixtures/tool-reference/${name}`, import.meta.url), 'utf8');

// Captured shape of vercel-labs/skills src/agents.ts (trimmed): a universal
// agent, a linked agent with an env override, a project-only agent, a
// universal-project agent with its own global folder, and the universal target.
function capturedAgentsTs({ crushGlobal = "join(home, '.config/crush/skills')" } = {}) {
  return `import { homedir } from 'os';
const home = homedir();
const configHome = xdgConfig ?? join(home, '.config');
const claudeHome = process.env.CLAUDE_CONFIG_DIR?.trim() || join(home, '.claude');

export const agents: Record<AgentType, AgentConfig> = {
  amp: {
    name: 'amp',
    displayName: 'Amp',
    skillsDir: '.agents/skills',
    globalSkillsDir: join(configHome, 'agents/skills'),
    detectInstalled: async () => {
      return existsSync(join(configHome, 'amp'));
    },
  },
  antigravity: {
    name: 'antigravity',
    displayName: 'Antigravity',
    skillsDir: '.agents/skills',
    globalSkillsDir: join(home, '.gemini/config/skills'),
    globalReadsCanonical: false,
  },
  'claude-code': {
    name: 'claude-code',
    displayName: 'Claude Code',
    skillsDir: '.claude/skills',
    globalSkillsDir: join(claudeHome, 'skills'),
  },
  crush: {
    name: 'crush',
    displayName: 'Crush',
    skillsDir: '.crush/skills',
    globalSkillsDir: ${crushGlobal},
  },
  eve: {
    name: 'eve',
    displayName: 'Eve',
    skillsDir: 'agent/skills',
    globalSkillsDir: undefined,
  },
  universal: {
    name: 'universal',
    displayName: 'Universal',
    skillsDir: '.agents/skills',
    globalSkillsDir: join(configHome, 'agents/skills'),
    showInUniversalList: false,
  },
};

export function isUniversalAgent(type: AgentType): boolean {
  return agents[type].skillsDir === '.agents/skills';
}
`;
}

// Captured shape of OpenSpec src/core/config.ts (trimmed).
const CAPTURED_CONFIG_TS = `
const existingTools: AIToolOption[] = [
  { name: 'Amp', value: 'amp', available: true, skillsDir: '.agents' },
  { name: 'Antigravity', value: 'antigravity', available: true, skillsDir: '.agents' },
  { name: 'Claude Code', value: 'claude', available: true, skillsDir: '.claude' },
  { name: 'Crush', value: 'crush', available: true, skillsDir: '.crush' },
  { name: 'Cline', value: 'cline', available: true, skillsDir: '.cline' },
  { name: 'Other / Universal (shared .agents skills)', value: 'agents', available: true, skillsDir: '.agents' }
];

const installerAliases: Record<string, string> = {
  agents: 'universal', claude: 'claude-code',
};
const agents = getSupportedAgents();
const agentsById = new Map(agents.map(agent => [agent.id, agent]));
export function installerAgent(toolId: string) {
  return agentsById.get(installerAliases[toolId] ?? toolId) ?? agentsById.get('universal')!;
}
export const AI_TOOLS: AIToolOption[] = [
  ...existingTools,
  ...agents.filter(agent => !existingIds.has(agent.id) && agent.id !== 'windsurf').map(agent => ({})),
];
`;

test('supported-tools page is selected by release line', () => {
  assert.deepEqual(supportedToolsPage('v2.1.1'), {
    path: 'docs-lab/reference/supported-tools.md',
    layout: 'skills-matrix',
    url: 'https://github.com/Fission-AI/OpenSpec/blob/v2.1.1/docs-lab/reference/supported-tools.md',
    rawUrl: 'https://raw.githubusercontent.com/Fission-AI/OpenSpec/v2.1.1/docs-lab/reference/supported-tools.md',
  });
  assert.equal(supportedToolsPage('v2.0.0').path, 'docs-lab/reference/supported-tools.md');
  assert.equal(supportedToolsPage('v1.14.0').path, 'docs/supported-tools.md');
  assert.equal(supportedToolsPage('v1.14.0').url, 'https://github.com/Fission-AI/OpenSpec/blob/v1.14.0/docs/supported-tools.md');
  assert.throws(() => supportedToolsPage('latest'), /vMAJOR\.MINOR\.PATCH/);
});

test('captured 2.x skills matrix is read with the second table reader', async () => {
  const rows = readSupportedToolsTable(await fixture('docs-lab-supported-tools-v2.1.1.md'), 'v2.1.1');
  assert.equal(rows.length, 46);
  const byId = new Map(rows.map((row) => [row.id, row]));
  assert.deepEqual(byId.get('claude'), {
    id: 'claude', name: 'Claude Code', sharedSkillsDir: '.agents/skills', ownSkillsDir: '.claude/skills', invocation: '/openspec-<skill>',
  });
  assert.equal(byId.get('cursor').ownSkillsDir, null);
  assert.equal(byId.get('codex').invocation, '$openspec-<skill>');
  assert.equal(byId.get('kimi').invocation, '/skill:openspec-<skill>');
  assert.equal(byId.get('gsd').invocation, 'use the openspec-<skill> skill');
  assert.equal(byId.get('veai').name, 'Veai');
  assert.equal(byId.has('amazon-q'), false);
});

test('captured 1.x tool directory is read with the first table reader', async () => {
  const rows = readSupportedToolsTable(await fixture('docs-supported-tools-v1.14.0.md'), 'v1.14.0');
  const claude = rows.find((row) => row.id === 'claude');
  assert.deepEqual(claude, {
    id: 'claude', name: 'Claude Code', skillsPath: '.claude/skills/openspec-*/SKILL.md', commandsPath: '.claude/commands/opsx/<id>.md',
  });
  assert.equal(rows.find((row) => row.id === 'codex').commandsPath, null);
  assert.ok(rows.some((row) => row.id === 'amazon-q'));
});

test('unknown supported-tools layouts fail closed', async () => {
  const v1Page = await fixture('docs-supported-tools-v1.14.0.md');
  const v2Page = await fixture('docs-lab-supported-tools-v2.1.1.md');
  assert.throws(() => readSupportedToolsTable(v1Page, 'v2.1.1'), /known skills-matrix table layout/);
  assert.throws(() => readSupportedToolsTable(v2Page, 'v1.14.0'), /known tool-directory table layout/);
  const renamed = v2Page.replace('| Tool | `--tools` id | Skills | Skill invocation |', '| Tool | id | Skills | Invocation |');
  assert.throws(() => readSupportedToolsTable(renamed, 'v2.1.1'), /known skills-matrix/);
  const newCell = v2Page.replace('| `.agents/skills/` | `/openspec-apply-change` |\n| Antigravity', '| `.agents/skills/` | `/apply` |\n| Antigravity');
  assert.throws(() => readSupportedToolsTable(newCell, 'v2.1.1'), /Unrecognized skill invocation for amp/);
});

test('captured skills agent table yields universal, linked with env, and project-only scopes', () => {
  const agents = readSkillsAgentTable(capturedAgentsTs());
  const config = readOpenSpecInstallerConfig(CAPTURED_CONFIG_TS);
  assert.deepEqual(config.installerAliases, { agents: 'universal', claude: 'claude-code' });
  assert.deepEqual(config.excludedAgentIds, ['windsurf']);
  assert.equal(installerAgent('cline', agents, config.installerAliases).id, 'universal');
  const toolIds = openSpecToolIds(config, agents);
  assert.deepEqual(toolIds.map((tool) => tool.id), ['amp', 'antigravity', 'claude', 'crush', 'cline', 'agents', 'eve']);
  const scope = buildToolScopeSupport({
    openspecTag: 'v2.1.1', skillsVersion: '1.8.1', toolIds: toolIds.map((tool) => tool.id), agents, installerAliases: config.installerAliases,
  });
  assert.deepEqual(scope, {
    source: { openspecTag: 'v2.1.1', skillsVersion: '1.8.1' },
    tools: {
      agents: { kind: 'universal' },
      amp: { kind: 'universal' },
      antigravity: { kind: 'linked', globalDir: '.gemini/config/skills' },
      claude: { kind: 'linked', globalDir: '.claude/skills', env: { name: 'CLAUDE_CONFIG_DIR', path: 'skills' } },
      cline: { kind: 'universal' },
      crush: { kind: 'linked', globalDir: '.config/crush/skills' },
      eve: { kind: 'project-only' },
    },
  });
});

test('a changed global folder in a later skills version is reported by tool id', () => {
  const config = readOpenSpecInstallerConfig(CAPTURED_CONFIG_TS);
  const build = (agentsTs, skillsVersion) => {
    const agents = readSkillsAgentTable(agentsTs);
    return buildToolScopeSupport({
      openspecTag: 'v2.2.0', skillsVersion, toolIds: openSpecToolIds(config, agents).map((tool) => tool.id), agents, installerAliases: config.installerAliases,
    });
  };
  const before = build(capturedAgentsTs(), '1.8.1');
  const after = build(capturedAgentsTs({ crushGlobal: "join(home, '.crush/skills')" }), '1.9.0');
  const diff = diffToolScopeSupport(before, after);
  assert.equal(diff.sourceChanged, true);
  assert.deepEqual(diff.added, []);
  assert.deepEqual(diff.removed, []);
  assert.deepEqual(diff.changed, [{
    id: 'crush',
    from: { kind: 'linked', globalDir: '.config/crush/skills' },
    to: { kind: 'linked', globalDir: '.crush/skills' },
  }]);
});

test('unreadable upstream semantics fail closed', () => {
  assert.throws(() => readSkillsAgentTable(capturedAgentsTs({ crushGlobal: 'resolveCrushDir()' })), /Unsupported globalSkillsDir expression for crush/);
  assert.throws(() => readSkillsAgentTable(capturedAgentsTs().replace("=== '.agents/skills';", "=== UNIVERSAL;")), /isUniversalAgent semantics changed/);
  assert.throws(
    () => readOpenSpecInstallerConfig(CAPTURED_CONFIG_TS.replace("?? agentsById.get('universal')!", '')),
    /installerAgent semantics changed/
  );
  assert.equal(readBundledSkillsVersion({ dependencies: { skills: '1.8.1' } }), '1.8.1');
  assert.throws(() => readBundledSkillsVersion({ dependencies: { skills: '^1.8.1' } }), /exact skills version/);
  assert.throws(() => readBundledSkillsVersion({ dependencies: {} }), /exact skills version/);
});

async function v2Input({ scopeAvailable = true } = {}) {
  const agents = readSkillsAgentTable(capturedAgentsTs());
  const config = readOpenSpecInstallerConfig(CAPTURED_CONFIG_TS);
  const rows = readSupportedToolsTable(await fixture('docs-lab-supported-tools-v2.1.1.md'), 'v2.1.1')
    .filter((row) => ['amp', 'antigravity', 'claude', 'crush', 'cline', 'agents'].includes(row.id));
  const { dataset } = buildOfficialDatasetV2({
    tag: 'v2.1.1', revision: 'rev-2.1.1', checkedAt: '2026-11-21', rows, toolIds: openSpecToolIds(config, agents),
  });
  return {
    targetRelease: 'v2.1.1',
    checkedAt: '2026-11-21',
    openspec: { available: true, url: dataset.source.url, revision: 'rev-2.1.1', dataset },
    releaseNotes: { available: true, url: 'https://github.com/Fission-AI/OpenSpec/releases/tag/v2.1.1', revision: 'rev-2.1.1', conflicts: [] },
    vercelSkills: { available: true, url: 'https://github.com/vercel-labs/skills', revision: 'skills-rev', candidates: [{ id: 'amp', name: 'Amp' }] },
    skillScope: scopeAvailable
      ? { available: true, openspecTag: 'v2.1.1', skillsVersion: '1.8.1', agents, installerAliases: config.installerAliases }
      : { available: false, openspecTag: 'v2.1.1' },
  };
}

test('2.x analysis reads the docs-lab page and proposes scope data from the bundled skills version', async () => {
  const input = await v2Input();
  const dataset = input.openspec.dataset;
  assert.equal(dataset.source.url, 'https://github.com/Fission-AI/OpenSpec/blob/v2.1.1/docs-lab/reference/supported-tools.md');
  assert.ok(dataset.tools.every((tool) => tool.commands === null));
  assert.equal(dataset.tools.find((tool) => tool.id === 'claude').skills.path, '.claude/skills/openspec-*/SKILL.md');
  assert.equal(dataset.tools.find((tool) => tool.id === 'eve').skills.path, 'agent/skills/openspec-*/SKILL.md');

  const result = analyzeToolReferenceUpdate(input, OFFICIAL_TOOL_DATASET, SHARED_AGENTS_RESEARCH_DATASET, null);
  assert.equal(result.report.writeAllowed, true);
  assert.equal(result.report.scopeSupport.skillsVersion, '1.8.1');
  assert.ok(result.report.officialTools.removed.includes('amazon-q'));
  assert.deepEqual(result.report.officialTools.added, ['eve']);
  assert.deepEqual(result.report.officialTools.withCommands, []);
  assert.equal(result.proposedScope.tools.eve.kind, 'project-only');
  assert.doesNotThrow(() => validateToolScopeSupport(result.proposedScope, result.proposedOfficial));

  const wrongPage = structuredClone(input);
  wrongPage.openspec.url = 'https://github.com/Fission-AI/OpenSpec/blob/v2.1.1/docs/supported-tools.md';
  wrongPage.openspec.dataset.source.url = wrongPage.openspec.url;
  const wrongResult = analyzeToolReferenceUpdate(wrongPage, OFFICIAL_TOOL_DATASET, SHARED_AGENTS_RESEARCH_DATASET, null);
  assert.equal(wrongResult.report.writeAllowed, false);
  assert.ok(wrongResult.report.unavailableSources.includes('openspec-supported-tools'));
});

test('unavailable bundled skills source fails closed and keeps the previous scope data', async () => {
  const previousScope = { source: { openspecTag: 'v2.0.0', skillsVersion: '1.8.0' }, tools: { amp: { kind: 'universal' } } };
  const result = analyzeToolReferenceUpdate(
    await v2Input({ scopeAvailable: false }), OFFICIAL_TOOL_DATASET, SHARED_AGENTS_RESEARCH_DATASET, previousScope
  );
  assert.equal(result.report.writeAllowed, false);
  assert.ok(result.report.unavailableSources.includes('skills-scope-support'));
  assert.deepEqual(result.proposedScope, previousScope);
  assert.deepEqual(result.report.scopeSupport.changed, []);
});

test('approved 2.x write also writes the scope data file', async () => {
  const root = await mkdtemp(join(tmpdir(), 'tool-reference-scope-'));
  try {
    const paths = {
      official: join(root, 'openspec-tools.json'),
      research: join(root, 'shared-agents-research.json'),
      scope: join(root, 'tool-scope-support.json'),
      input: join(root, 'input.json'),
    };
    await writeFile(paths.official, JSON.stringify(OFFICIAL_TOOL_DATASET));
    await writeFile(paths.research, JSON.stringify(SHARED_AGENTS_RESEARCH_DATASET));
    const input = await v2Input();
    await writeFile(paths.input, JSON.stringify(input));
    const args = ['--input', paths.input, '--official-path', paths.official, '--research-path', paths.research, '--scope-path', paths.scope];
    const dry = await runCli(args);
    await assert.rejects(readFile(paths.scope, 'utf8'), { code: 'ENOENT' });
    await runCli([...args, '--write', '--review-hash', dry.reviewHash]);
    const scope = JSON.parse(await readFile(paths.scope, 'utf8'));
    assert.deepEqual(scope.source, { openspecTag: 'v2.1.1', skillsVersion: '1.8.1' });
    assert.equal(scope.tools.claude.env.name, 'CLAUDE_CONFIG_DIR');
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test('tools missing from the 2.x page keep their v1.14.0 invocation; new tools use the default', async () => {
  const legacy = JSON.parse(await readFile(new URL('../src/server/data/tool-reference/openspec-legacy-v1.json', import.meta.url), 'utf8'));
  const { dataset, notListedOnPage } = buildOfficialDatasetV2({
    tag: 'v2.1.1', revision: 'r', checkedAt: '2026-11-21', rows: [],
    toolIds: [{ id: 'codeassistant', name: 'SourceCraft Code Assistant' }, { id: 'eve', name: 'Eve', projectSkillsDir: 'agent/skills' }],
    legacyInvocations: legacySkillInvocations(legacy),
  });
  assert.equal(dataset.tools[0].skills.invocation, 'use the openspec-<skill> skill');
  assert.equal(dataset.tools[1].skills.invocation, '/openspec-<skill>');
  assert.deepEqual(notListedOnPage, ['codeassistant', 'eve']);
});
