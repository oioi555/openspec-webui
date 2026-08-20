import assert from 'node:assert/strict';
import { test } from 'node:test';

import type { OpenSpecToolDefinition, SharedSkillsCompatibility } from './types/api';
import {
  filterOfficialToolDefinitions,
  filterSharedSkillsCompatibility,
} from './toolCompatibilityReference';

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
