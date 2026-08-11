/**
 * Unit tests for toolChoices.ts — the pure installed-only grouped candidate
 * resolver for the copy-time command selector.
 *
 * Candidates are derived exclusively from the detected integrations'
 * authoritative `commands` / `skills` inventories (the server contract). The
 * legacy aggregate fields (`delivery`, `form`, `example`, `source`) MUST NOT
 * influence candidate eligibility.
 */
import assert from 'node:assert/strict';
import { test } from 'node:test';

import type { DetectedIntegration } from './types/api';
import type { WorkflowCommand, InvocationFormId } from './types/commandTypes';
import { getWorkflowMetadata } from './workflowMetadata';
import {
  buildGroupedToolChoices,
  AGENTS_TOOL_NAME,
  type ToolChoice,
} from './toolChoices';

// ---------------------------------------------------------------------------
// Fixtures (real server inventory shape)
// ---------------------------------------------------------------------------

function commandsIntegration(
  tool: string,
  form: InvocationFormId,
  workflowIds: string[],
  dir = '.tool/',
): DetectedIntegration {
  return {
    tool,
    delivery: 'commands',
    form,
    example: '/legacy-example',
    source: `${dir}commands/`,
    commands: {
      form,
      items: workflowIds.map((workflowId) => ({
        workflowId,
        source: `${dir}commands/opsx-${workflowId}.md`,
      })),
    },
    skills: null,
  };
}

function skillsIntegration(
  tool: string,
  form: InvocationFormId,
  skillNames: string[],
  dir = '.tool/',
  alternateForms?: InvocationFormId[],
): DetectedIntegration {
  return {
    tool,
    delivery: 'skills',
    form,
    example: '/legacy-example',
    source: `${dir}skills/`,
    commands: null,
    skills: {
      form,
      ...(alternateForms ? { alternateForms } : {}),
      items: skillNames.map((skillName) => ({
        skillName,
        source: `${dir}skills/${skillName}/SKILL.md`,
      })),
    },
  };
}

const ALL_WORKFLOWS: WorkflowCommand[] = [
  'propose', 'explore', 'apply', 'archive', 'update',
  'new', 'continue', 'ff', 'verify', 'sync', 'bulk-archive',
];

// ---------------------------------------------------------------------------
// 1. Commands evidence matching by workflow id
// ---------------------------------------------------------------------------

test('single command integration yields one group with the command form', () => {
  const integrations = [commandsIntegration('Claude Code', 'opsx-colon', ['propose'], '.claude/')];
  const choices = buildGroupedToolChoices(integrations, 'propose');

  assert.deepEqual(choices, [
    { key: '/opsx:propose', text: '/opsx:propose', tools: ['Claude Code'] },
  ]);
});

test('opsx-dash and opsx-at command forms interpolate the workflow id', () => {
  const integrations = [
    commandsIntegration('Cursor', 'opsx-dash', ['propose'], '.cursor/'),
    commandsIntegration('Amazon Q Developer', 'opsx-at', ['propose'], '.amazonq/'),
  ];
  const choices = buildGroupedToolChoices(integrations, 'propose');

  assert.deepEqual(choices, [
    { key: '/opsx-propose', text: '/opsx-propose', tools: ['Cursor'] },
    { key: '@opsx-propose', text: '@opsx-propose', tools: ['Amazon Q Developer'] },
  ]);
});

test('change-scoped command candidates append the change name', () => {
  const integrations = [commandsIntegration('Cursor', 'opsx-dash', ['apply'], '.cursor/')];
  const choices = buildGroupedToolChoices(integrations, 'apply', { changeName: 'my-change' });

  assert.deepEqual(choices, [
    { key: '/opsx-apply my-change', text: '/opsx-apply my-change', tools: ['Cursor'] },
  ]);
});

test('workspace-scoped command candidates never append a change name', () => {
  const integrations = [commandsIntegration('Cursor', 'opsx-dash', ['propose'], '.cursor/')];
  const choices = buildGroupedToolChoices(integrations, 'propose', { changeName: 'ignored' });

  assert.deepEqual(choices, [
    { key: '/opsx-propose', text: '/opsx-propose', tools: ['Cursor'] },
  ]);
});

// ---------------------------------------------------------------------------
// 2. Partial workflow sets
// ---------------------------------------------------------------------------

test('partial command sets report only the workflows with matching artifacts', () => {
  const integrations = [commandsIntegration('OpenCode', 'opsx-dash', ['apply'], '.opencode/')];

  assert.equal(buildGroupedToolChoices(integrations, 'apply').length, 1);
  // `sync` has no command artifact for this tool → no candidate from commands.
  assert.deepEqual(buildGroupedToolChoices(integrations, 'sync'), []);
});

// ---------------------------------------------------------------------------
// 3. Skill evidence and Commands-first priority
// ---------------------------------------------------------------------------

test('skill evidence matches the canonical OpenSpec skill name', () => {
  const integrations = [skillsIntegration('ForgeCode', 'skill-slash', ['openspec-propose'], '.forge/')];

  assert.deepEqual(buildGroupedToolChoices(integrations, 'propose'), [
    { key: '/openspec-propose', text: '/openspec-propose', tools: ['ForgeCode'] },
  ]);
});

test('skill forms interpolate the resolved skill name (sync -> openspec-sync-specs)', () => {
  const integrations = [skillsIntegration('ForgeCode', 'skill-slash', ['openspec-sync-specs'], '.forge/')];

  assert.deepEqual(buildGroupedToolChoices(integrations, 'sync'), [
    { key: '/openspec-sync-specs', text: '/openspec-sync-specs', tools: ['ForgeCode'] },
  ]);
});

test('Kimi Code uses the skill-colon invocation form', () => {
  const integrations = [skillsIntegration('Kimi Code', 'skill-colon', ['openspec-apply-change'], '.kimi-code/')];

  assert.deepEqual(buildGroupedToolChoices(integrations, 'apply'), [
    { key: '/skill:openspec-apply-change', text: '/skill:openspec-apply-change', tools: ['Kimi Code'] },
  ]);
});

test('commands win when both deliveries match the same workflow', () => {
  const claude: DetectedIntegration = {
    tool: 'Claude Code',
    delivery: 'both',
    form: 'opsx-colon',
    example: '/opsx:apply',
    source: '.claude/commands/opsx/apply.md',
    commands: {
      form: 'opsx-colon',
      items: [{ workflowId: 'apply', source: '.claude/commands/opsx/apply.md' }],
    },
    skills: {
      form: 'skill-slash',
      items: [{ skillName: 'openspec-apply-change', source: '.claude/skills/openspec-apply-change/SKILL.md' }],
    },
  };

  const choices = buildGroupedToolChoices([claude], 'apply');

  // Command form only — no separate Skills choice for this tool/workflow.
  assert.deepEqual(choices, [
    { key: '/opsx:apply', text: '/opsx:apply', tools: ['Claude Code'] },
  ]);
});

test('available skill is used when the command artifact for that workflow is missing', () => {
  // The tool has a `propose` command file but no `apply` command file; the
  // `apply` workflow still works through the matching skill.
  const claude: DetectedIntegration = {
    tool: 'Claude Code',
    delivery: 'both',
    form: 'opsx-colon',
    example: '/opsx:propose',
    source: '.claude/commands/opsx/propose.md',
    commands: {
      form: 'opsx-colon',
      items: [{ workflowId: 'propose', source: '.claude/commands/opsx/propose.md' }],
    },
    skills: {
      form: 'skill-slash',
      items: [{ skillName: 'openspec-apply-change', source: '.claude/skills/openspec-apply-change/SKILL.md' }],
    },
  };

  const applyChoices = buildGroupedToolChoices([claude], 'apply');
  assert.deepEqual(applyChoices, [
    { key: '/openspec-apply-change', text: '/openspec-apply-change', tools: ['Claude Code'] },
  ]);

  // `propose` still resolves through its command file.
  const proposeChoices = buildGroupedToolChoices([claude], 'propose');
  assert.deepEqual(proposeChoices, [
    { key: '/opsx:propose', text: '/opsx:propose', tools: ['Claude Code'] },
  ]);
});

// ---------------------------------------------------------------------------
// 4. Grouping by final command text
// ---------------------------------------------------------------------------

test('two tools with identical command text form one group with both tool names', () => {
  const integrations = [
    commandsIntegration('Cursor', 'opsx-dash', ['propose'], '.cursor/'),
    commandsIntegration('Trae', 'opsx-dash', ['propose'], '.trae/'),
  ];

  const choices = buildGroupedToolChoices(integrations, 'propose');

  assert.deepEqual(choices, [
    { key: '/opsx-propose', text: '/opsx-propose', tools: ['Cursor', 'Trae'] },
  ]);
});

test('distinct command strings produce one group each in stable detector order', () => {
  const integrations = [
    commandsIntegration('Cursor', 'opsx-dash', ['propose'], '.cursor/'),
    commandsIntegration('Claude Code', 'opsx-colon', ['propose'], '.claude/'),
  ];

  const choices = buildGroupedToolChoices(integrations, 'propose');

  assert.deepEqual(choices, [
    { key: '/opsx-propose', text: '/opsx-propose', tools: ['Cursor'] },
    { key: '/opsx:propose', text: '/opsx:propose', tools: ['Claude Code'] },
  ]);
});

test('duplicate evidence for the same tool and text collapses into one tool name', () => {
  // The same tool appears twice (two roots) and both produce the same text.
  const cursorA = commandsIntegration('Cursor', 'opsx-dash', ['propose'], '.cursor/');
  const cursorB = commandsIntegration('Cursor', 'opsx-dash', ['propose'], '.cursor-copy/');

  const choices = buildGroupedToolChoices([cursorA, cursorB], 'propose');

  assert.deepEqual(choices, [
    { key: '/opsx-propose', text: '/opsx-propose', tools: ['Cursor'] },
  ]);
});

test('legacy aggregate fields never influence candidate eligibility', () => {
  // The legacy `form` claims opsx-at, but the authoritative commands inventory
  // says opsx-dash — the inventory must win.
  const integration: DetectedIntegration = {
    tool: 'Cursor',
    delivery: 'commands',
    form: 'opsx-at',
    example: '@opsx-propose',
    source: '.cursor/commands/opsx-propose.md',
    commands: {
      form: 'opsx-dash',
      items: [{ workflowId: 'propose', source: '.cursor/commands/opsx-propose.md' }],
    },
    skills: null,
  };

  const choices = buildGroupedToolChoices([integration], 'propose');
  assert.deepEqual(choices, [
    { key: '/opsx-propose', text: '/opsx-propose', tools: ['Cursor'] },
  ]);
});

// ---------------------------------------------------------------------------
// 5. Shared .agents ambiguity
// ---------------------------------------------------------------------------

test('shared .agents evidence yields both documented candidate forms', () => {
  const integrations = [
    skillsIntegration(
      AGENTS_TOOL_NAME,
      'skill-slash',
      ['openspec-propose'],
      '.agents/',
      ['skill-dollar'],
    ),
  ];

  const choices = buildGroupedToolChoices(integrations, 'propose');

  assert.deepEqual(choices, [
    { key: '/openspec-propose', text: '/openspec-propose', tools: ['Shared .agents'] },
    { key: '$openspec-propose', text: '$openspec-propose', tools: ['Codex'] },
  ]);
});

test('shared .agents candidates append the change name to both forms', () => {
  const integrations = [
    skillsIntegration(
      AGENTS_TOOL_NAME,
      'skill-slash',
      ['openspec-apply-change'],
      '.agents/',
      ['skill-dollar'],
    ),
  ];

  const choices = buildGroupedToolChoices(integrations, 'apply', { changeName: 'feat-x' });

  assert.equal(choices.length, 2);
  assert.ok(choices[0].text.endsWith(' feat-x'));
  assert.ok(choices[1].text.endsWith(' feat-x'));
});

test('shared .agents with a non-matching skill produces no candidate', () => {
  const integrations = [
    skillsIntegration(
      AGENTS_TOOL_NAME,
      'skill-slash',
      ['openspec-other'],
      '.agents/',
      ['skill-dollar'],
    ),
  ];

  assert.deepEqual(buildGroupedToolChoices(integrations, 'propose'), []);
});

test('shared .agents groups with identical text from other detected tools', () => {
  const agents = skillsIntegration(
    AGENTS_TOOL_NAME,
    'skill-slash',
    ['openspec-propose'],
    '.agents/',
    ['skill-dollar'],
  );
  const forge = skillsIntegration('ForgeCode', 'skill-slash', ['openspec-propose'], '.forge/');

  const choices = buildGroupedToolChoices([forge, agents], 'propose');

  // ForgeCode and Shared .agents share `/openspec-propose`; Codex stays alone.
  assert.deepEqual(choices, [
    { key: '/openspec-propose', text: '/openspec-propose', tools: ['ForgeCode', 'Shared .agents'] },
    { key: '$openspec-propose', text: '$openspec-propose', tools: ['Codex'] },
  ]);
});

// ---------------------------------------------------------------------------
// 6. Zero detection / no matching evidence
// ---------------------------------------------------------------------------

test('no matching artifact for a workflow yields zero choices', () => {
  const integrations = [commandsIntegration('Cursor', 'opsx-dash', ['apply'], '.cursor/')];

  assert.deepEqual(buildGroupedToolChoices(integrations, 'sync'), []);
});

test('empty integrations yield zero choices — no static fallback catalog', () => {
  for (const workflow of ALL_WORKFLOWS) {
    assert.deepEqual(
      buildGroupedToolChoices([], workflow),
      [],
      `${workflow}: zero detected integrations must never fall back to a catalog`,
    );
  }
});

test('a tool with a skill inventory only contributes for its matching workflow', () => {
  const integrations = [skillsIntegration('ForgeCode', 'skill-slash', ['openspec-propose'], '.forge/')];

  assert.equal(buildGroupedToolChoices(integrations, 'propose').length, 1);
  assert.deepEqual(buildGroupedToolChoices(integrations, 'sync'), []);
});

// ---------------------------------------------------------------------------
// 7. Stability and purity
// ---------------------------------------------------------------------------

test('resolver is pure — same inputs produce identical outputs', () => {
  const integrations = [
    commandsIntegration('Cursor', 'opsx-dash', ['propose'], '.cursor/'),
    commandsIntegration('Claude Code', 'opsx-colon', ['propose'], '.claude/'),
  ];

  assert.deepEqual(
    buildGroupedToolChoices(integrations, 'propose'),
    buildGroupedToolChoices(integrations, 'propose'),
  );
});

test('keys are unique across groups (distinct texts)', () => {
  const integrations = [
    commandsIntegration('Cursor', 'opsx-dash', ['propose'], '.cursor/'),
    commandsIntegration('Claude Code', 'opsx-colon', ['propose'], '.claude/'),
  ];

  const choices = buildGroupedToolChoices(integrations, 'propose');
  const keys = new Set(choices.map((choice) => choice.key));
  assert.equal(keys.size, choices.length);
});

test('every workflow resolves against a matching command artifact', () => {
  for (const workflow of ALL_WORKFLOWS) {
    const choices = buildGroupedToolChoices(
      [commandsIntegration('Cursor', 'opsx-dash', [workflow], '.cursor/')],
      workflow,
    );
    assert.equal(choices.length, 1, `${workflow}: expected one command group`);
    assert.equal(choices[0].tools[0], 'Cursor');
    assert.ok(choices[0].text.length > 0);
  }
});

test('every workflow resolves against a matching skill artifact', () => {
  for (const workflow of ALL_WORKFLOWS) {
    const skillName = getWorkflowMetadata(workflow).skillName;
    const choices = buildGroupedToolChoices(
      [skillsIntegration('ForgeCode', 'skill-slash', [skillName], '.forge/')],
      workflow,
    );
    assert.equal(choices.length, 1, `${workflow}: expected one skill group`);
  }
});

// ---------------------------------------------------------------------------
// 8. ToolChoice shape contract
// ---------------------------------------------------------------------------

test('ToolChoice carries text, stable key, and tools[]', () => {
  const choices = buildGroupedToolChoices(
    [commandsIntegration('Cursor', 'opsx-dash', ['propose'], '.cursor/')],
    'propose',
  );

  const choice: ToolChoice = choices[0]!;
  assert.equal(choice.key, choice.text);
  assert.deepEqual(choice.tools, ['Cursor']);
  assert.equal(choice.text, '/opsx-propose');
});
