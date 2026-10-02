import assert from 'node:assert/strict';
import { test } from 'node:test';

import { readFile } from 'node:fs/promises';

import type { OpenSpecToolDefinition, SharedSkillsCompatibility } from './types/api';
import {
  filterOfficialToolDefinitions,
  filterSharedSkillsCompatibility,
  groupSharedAgentsSkillInstallers,
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

  assert.deepEqual(groupSharedAgentsSkillInstallers(catalog.tools), [
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
