import assert from 'node:assert/strict';
import { test } from 'node:test';

import { readFile } from 'node:fs/promises';

import type { OpenSpecToolDefinition, SharedSkillsCompatibility } from './types/api';
import {
  filterOfficialToolDefinitions,
  filterSharedSkillsCompatibility,
  globalFolderLabel,
  groupSharedAgentsSkillInstallers,
  isCommandsRetiredSnapshot,
  scopeSupportFor,
} from './toolCompatibilityReference';

function tool(
  id: string,
  skills: OpenSpecToolDefinition['skills'],
  commands: OpenSpecToolDefinition['commands'] = null,
): OpenSpecToolDefinition {
  return { id, name: id, commands, skills };
}

const definitions: OpenSpecToolDefinition[] = [
  {
    id: 'cursor',
    name: 'Cursor',
    commands: { path: '.cursor/commands/opsx-<id>.md', invocation: '/opsx-<id>' },
    skills: { path: '.cursor/skills/openspec-*/SKILL.md', invocation: '/openspec-<skill>' },
  },
  {
    id: 'zed',
    name: 'Zed Agent',
    commands: null,
    skills: { path: '.agents/skills/openspec-*/SKILL.md', invocation: '/openspec-<skill>' },
  },
];

const compatibility: SharedSkillsCompatibility[] = [
  {
    clientId: 'cursor',
    name: 'Cursor',
    openSpecToolId: 'cursor',
  },
  {
    clientId: 'external',
    name: 'External Client',
    note: 'global requires config',
  },
];

test('official definition search matches name, id, and path and resets when cleared', () => {
  assert.deepEqual(filterOfficialToolDefinitions(definitions, 'Zed').map((item) => item.id), ['zed']);
  assert.deepEqual(filterOfficialToolDefinitions(definitions, 'cursor').map((item) => item.id), ['cursor']);
  assert.deepEqual(filterOfficialToolDefinitions(definitions, '.agents/skills').map((item) => item.id), ['zed']);
  assert.equal(filterOfficialToolDefinitions(definitions, '').length, definitions.length);
});

test('shared compatibility search includes classifications and external clients', () => {
  assert.deepEqual(filterSharedSkillsCompatibility(compatibility, 'cursor').map((item) => item.clientId), ['cursor']);
  assert.deepEqual(filterSharedSkillsCompatibility(compatibility, 'External').map((item) => item.clientId), ['external']);
  assert.deepEqual(filterSharedSkillsCompatibility(compatibility, 'global').map((item) => item.clientId), ['external']);
  assert.equal(filterSharedSkillsCompatibility(compatibility, '').length, compatibility.length);
});

test('groups pin-shaped official .agents/skills installers by slash vs dollar', () => {
  const pinShaped: OpenSpecToolDefinition[] = [
    tool('amp', { path: '.agents/skills/openspec-*/SKILL.md', invocation: '/openspec-<skill>' }),
    tool('antigravity', {
      path: '.agents/skills/openspec-*/SKILL.md',
      invocation: '/openspec-<skill>',
    }, {
      path: '.agents/workflows/opsx-<id>.md',
      invocation: '/opsx-<id>',
    }),
    tool('codex', { path: '.agents/skills/openspec-*/SKILL.md', invocation: '$openspec-<skill>' }),
    tool('cursor', { path: '.cursor/skills/openspec-*/SKILL.md', invocation: '/openspec-<skill>' }),
    tool('gsd', { path: '.agents/skills/openspec-*/SKILL.md', invocation: '/openspec-<skill>' }),
    tool('zed', {
      path: '.agents/skills/openspec-*/SKILL.md',
      invocation: '/openspec-<skill> or @openspec-<skill>',
    }),
    tool('agents', { path: '.agents/skills/openspec-*/SKILL.md', invocation: '/openspec-<skill>' }),
    tool('legacy-agent', { path: '.agent/skills/openspec-*/SKILL.md', invocation: '/openspec-<skill>' }),
    tool('empty-skills', null),
  ];

  assert.deepEqual(groupSharedAgentsSkillInstallers(pinShaped), [
    {
      style: 'slash',
      ids: ['agents', 'amp', 'antigravity', 'gsd', 'zed'],
      path: '.agents/skills',
      invocation: '/openspec-*',
    },
    {
      style: 'dollar',
      ids: ['codex'],
      path: '.agents/skills',
      invocation: '$openspec-*',
    },
  ]);
});

test('groups the pinned official catalog by shared .agents skills invocation', async () => {
  const catalogUrl = new URL(
    '../../../src/server/data/tool-reference/openspec-tools.json',
    import.meta.url,
  );
  const catalog = JSON.parse(await readFile(catalogUrl, 'utf8')) as {
    tools: OpenSpecToolDefinition[];
  };

  const groups = groupSharedAgentsSkillInstallers(catalog.tools);
  assert.deepEqual(groups.map((group) => group.style), ['slash', 'dollar']);
  assert.equal(groups[0]!.ids[0], 'agents');
  for (const id of ['amp', 'antigravity', 'gsd', 'zed', 'cursor', 'promptscript']) {
    assert.ok(groups[0]!.ids.includes(id), id);
  }
  assert.equal(groups[0]!.ids.includes('claude'), false);
  assert.deepEqual(groups[1], { style: 'dollar', ids: ['codex'], path: '.agents/skills', invocation: '$openspec-*' });
});

test('2.x snapshots retire Commands and scope labels come from the served data', () => {
  assert.equal(isCommandsRetiredSnapshot('v2.1.1'), true);
  assert.equal(isCommandsRetiredSnapshot('v2.0.0'), true);
  assert.equal(isCommandsRetiredSnapshot('v1.14.0'), false);
  assert.equal(isCommandsRetiredSnapshot(undefined), false);
  const scopeSupport = {
    source: { openspecTag: 'v2.1.1', skillsVersion: '1.8.1' },
    tools: {
      claude: { kind: 'linked' as const, globalDir: '.claude/skills', env: { name: 'CLAUDE_CONFIG_DIR', path: 'skills' } },
      eve: { kind: 'project-only' as const },
    },
  };
  assert.equal(globalFolderLabel(scopeSupportFor(scopeSupport, 'claude')!), '~/.claude/skills');
  assert.equal(scopeSupportFor(scopeSupport, 'eve')?.kind, 'project-only');
  assert.equal(scopeSupportFor(scopeSupport, 'unknown'), null);
  assert.equal(globalFolderLabel({ kind: 'universal' }), null);
});

test('shared-path grouping omits empty input and does not create a workflows group', () => {
  assert.deepEqual(groupSharedAgentsSkillInstallers([]), []);
  assert.deepEqual(
    groupSharedAgentsSkillInstallers([
      tool('antigravity', null, {
        path: '.agents/workflows/opsx-<id>.md',
        invocation: '/opsx-<id>',
      }),
    ]),
    [],
  );
});
