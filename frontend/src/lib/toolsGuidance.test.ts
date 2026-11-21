import assert from 'node:assert/strict';
import { test } from 'node:test';

import {
  buildInitCommand,
  groupIntegrationsByScope,
  integrationScopeKind,
  isLegacyCommandOnly,
  toolAddChoices,
  resolveToolCommandState,
  sharedTargetNames,
} from './toolsGuidance';
import type { DetectedIntegration, ToolScopeSupportData } from './types/api';

const toolNames: Record<string, string> = {
  claude: 'Claude Code',
  codex: 'Codex',
  cursor: 'Cursor',
  kimi: 'Kimi Code',
  eve: 'Eve',
  agents: 'Universal (.agents)',
};

const scopeSupport: ToolScopeSupportData = {
  source: { openspecTag: 'v2.1.1', skillsVersion: '1.8.1' },
  tools: {
    claude: { kind: 'linked', globalDir: '.claude/skills' },
    codex: { kind: 'universal' },
    cursor: { kind: 'universal' },
    kimi: { kind: 'universal' },
    eve: { kind: 'project-only' },
    agents: { kind: 'universal' },
  },
};

const skills = { form: 'skill-slash', items: [] } as unknown as DetectedIntegration['skills'];
const commands = { form: 'opsx-colon', items: [] } as unknown as DetectedIntegration['commands'];

function row(tool: string, scope: 'global' | 'project', extra: Partial<DetectedIntegration> = {}): DetectedIntegration {
  return {
    tool,
    delivery: 'skills',
    form: 'skill-slash',
    example: '/openspec-propose',
    source: `${tool}/SKILL.md`,
    commands: null,
    skills,
    scope,
    ...extra,
  };
}

const sharedMulti = row('Shared .agents / Codex', 'project', {
  sharedSkillTarget: 'multi',
  sharedSkillTargets: ['codex', 'cursor', 'kimi'],
});

function commandState(integrations: DetectedIntegration[], copilotCloud = false) {
  return resolveToolCommandState({ integrations, copilotCloud, toolNames, scopeSupport });
}

test('groups split global and project rows', () => {
  const global = row('Claude Code', 'global');
  const project = row('Codex', 'project');
  assert.deepEqual(groupIntegrationsByScope([global, project]), { machine: [global], repository: [project] });
  assert.deepEqual(groupIntegrationsByScope([global]), { machine: [global], repository: [] });
  assert.deepEqual(groupIntegrationsByScope([project]), { machine: [], repository: [project] });
  assert.deepEqual(groupIntegrationsByScope([]), { machine: [], repository: [] });
});

test('global-only: machine add and keep-in-repository are offered, no move or init', () => {
  const state = commandState([row('Claude Code', 'global')]);
  assert.equal(state.toolAdd, 'machine');
  assert.equal(state.keepInRepository, true);
  assert.equal(state.moveToGlobal, null);
  assert.equal(state.init, false);
});

test('nothing detected: init is offered beside machine add and keep-in-repository', () => {
  const state = commandState([]);
  assert.equal(state.toolAdd, 'machine');
  assert.equal(state.init, true);
  assert.equal(state.keepInRepository, true);
  assert.equal(state.moveToGlobal, null);
});

test('project scope with Claude Code and Codex only offers the move to machine-wide skills', () => {
  const state = commandState([row('Claude Code', 'project'), row('Codex', 'project'), row('Claude Code', 'global')]);
  assert.equal(state.keepInRepository, false);
  assert.equal(state.toolAdd, 'repository');
  assert.deepEqual(state.moveToGlobal, { offered: true, blockingTools: [], copilotCloud: false });
});

test('a project-only tool blocks the move and is named as the reason', () => {
  const state = commandState([row('Claude Code', 'project'), row('Eve', 'project')]);
  assert.deepEqual(state.moveToGlobal, { offered: false, blockingTools: ['Eve'], copilotCloud: false });
});

test('Copilot cloud files block the move', () => {
  const state = commandState([row('Codex', 'project')], true);
  assert.deepEqual(state.moveToGlobal, { offered: false, blockingTools: [], copilotCloud: true });
});

test('project-only tools and Copilot cloud files are both reported when both block the move', () => {
  const state = commandState([row('Eve', 'project')], true);
  assert.deepEqual(state.moveToGlobal, { offered: false, blockingTools: ['Eve'], copilotCloud: true });
});

test('multi-target shared tree: move allowed when every target supports global skills', () => {
  assert.equal(commandState([sharedMulti]).moveToGlobal?.offered, true);
});

test('per-row scope support comes from the served reference', () => {
  assert.equal(integrationScopeKind(row('Claude Code', 'global'), toolNames, scopeSupport), 'linked');
  assert.equal(integrationScopeKind(row('Codex', 'project'), toolNames, scopeSupport), 'universal');
  assert.equal(integrationScopeKind(row('Eve', 'project'), toolNames, scopeSupport), 'project-only');
  assert.equal(integrationScopeKind(sharedMulti, toolNames, scopeSupport), 'universal');
  assert.equal(
    integrationScopeKind(row('Shared .agents / Codex', 'global', { sharedSkillTarget: 'legacy' }), toolNames, scopeSupport),
    'universal',
  );
  assert.equal(integrationScopeKind(row('Unknown', 'project'), toolNames, scopeSupport), null);
  assert.equal(integrationScopeKind(row('Codex', 'project'), toolNames, null), null);
});

test('command-only evidence is 1.x legacy', () => {
  assert.equal(isLegacyCommandOnly(row('Claude Code', 'project', { commands, skills: null, delivery: 'commands' })), true);
  assert.equal(isLegacyCommandOnly(row('Claude Code', 'project', { commands, delivery: 'both' })), false);
  assert.equal(isLegacyCommandOnly(row('Claude Code', 'project')), false);
});

test('the 2.1.1 multi marker is labelled with the target display names', () => {
  assert.deepEqual(sharedTargetNames(sharedMulti, toolNames), ['Codex', 'Cursor', 'Kimi Code']);
  assert.equal(sharedTargetNames(row('Codex', 'project'), toolNames), null);
  assert.equal(sharedTargetNames(row('S', 'project', { sharedSkillTargets: ['codex'] }), toolNames), null);
});

test('add-tool picker excludes project-only tools only for a machine add', () => {
  const definitions = Object.entries(toolNames).map(([id, name]) => ({ id, name, commands: null, skills: null }));
  const machine = toolAddChoices(definitions, scopeSupport, 'machine').map((definition) => definition.id);
  assert.equal(machine.includes('eve'), false);
  assert.equal(machine.includes('claude'), true);
  const repository = toolAddChoices(definitions, scopeSupport, 'repository').map((definition) => definition.id);
  assert.equal(repository.includes('eve'), true);
  assert.equal(repository.length, definitions.length);
});

test('project skills without a recorded skillsScope still add tools to the repository', () => {
  // skillsScope: project is written by openspec update, not init; its absence is not global.
  assert.equal(commandState([row('Claude Code', 'project'), row('Claude Code', 'global')]).toolAdd, 'repository');
});

test('init commands keep English tokens and quote paths with spaces', () => {
  assert.equal(buildInitCommand('/repo', ['--tools', 'claude']), 'openspec init --tools claude /repo');
  assert.equal(buildInitCommand('/my repo', ['--scope', 'global']), "openspec init --scope global '/my repo'");
  assert.equal(buildInitCommand('/repo'), 'openspec init /repo');
});
