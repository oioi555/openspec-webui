/**
 * Unit tests for toolChoices.ts — the pure functions that build the
 * copy-time tool-choice list for the command selector.
 *
 * Uses the real API shape:
 *   toolOptions: already split
 *     {tool:'Shared .agents', form:'skill-slash'} and
 *     {tool:'Codex', form:'skill-dollar'}
 *   integrations: neutral
 *     {tool:'Shared .agents / Codex', form:'skill-slash', source:'.agents/...'}
 */
import assert from 'node:assert/strict';
import { test } from 'node:test';

import type { ToolInvocationOption, DetectedIntegration } from './types/api';
import type { WorkflowCommand, InvocationFormId } from './types/commandTypes';
import { INVOCATION_FORM_IDS } from './types/commandTypes';
import {
  buildToolChoices,
  buildDetectedToolChoices,
  buildUndetectedToolChoices,
  getEffectiveToolOptions,
  type ToolChoice,
} from './toolChoices';

// ---------------------------------------------------------------------------
// Fixtures (real API shape)
// ---------------------------------------------------------------------------

function option(tool: string, form: InvocationFormId): ToolInvocationOption {
  return { tool, form };
}

function integration(
  tool: string,
  form: InvocationFormId,
  source: string,
): DetectedIntegration {
  return { tool, delivery: 'commands', form, example: `${form}-example`, source };
}

/** toolOptions as the API returns them — already split, no neutral entry. */
const ALL_TOOL_OPTIONS: ToolInvocationOption[] = [
  option('Claude Code', 'opsx-colon'),
  option('Cursor', 'opsx-dash'),
  option('Amazon Q', 'opsx-at'),
  option('Windsurf', 'skill-slash'),
  option('Kimi Code', 'skill-colon'),
  option('Shared .agents', 'skill-slash'),
  option('Codex', 'skill-dollar'),
];

// ---------------------------------------------------------------------------
// 1. Detected 1 → single choice, direct copy
// ---------------------------------------------------------------------------

test('single detected integration yields one choice', () => {
  const integrations = [integration('Claude Code', 'opsx-colon', '.claude/')];
  const choices = buildDetectedToolChoices(integrations, ALL_TOOL_OPTIONS, 'propose');

  assert.equal(choices.length, 1);
  assert.equal(choices[0].tool, 'Claude Code');
  assert.equal(choices[0].form, 'opsx-colon');
  assert.equal(choices[0].text, '/opsx:propose');
});

test('single detected integration for change workflow appends change name', () => {
  const integrations = [integration('Cursor', 'opsx-dash', '.cursor/')];
  const choices = buildDetectedToolChoices(integrations, ALL_TOOL_OPTIONS, 'apply', 'my-change');

  assert.equal(choices.length, 1);
  assert.equal(choices[0].tool, 'Cursor');
  assert.equal(choices[0].form, 'opsx-dash');
  assert.equal(choices[0].text, '/opsx-apply my-change');
});

// ---------------------------------------------------------------------------
// 2. Same-form 2 tools retained (not deduped by command text)
// ---------------------------------------------------------------------------

test('two tools with the same form produce two separate choices', () => {
  const toolOptions = [
    option('Windsurf', 'skill-slash'),
    option('OpenCode', 'skill-slash'),
  ];
  const integrations = [
    integration('Windsurf', 'skill-slash', '.windsurf/'),
    integration('OpenCode', 'skill-slash', '.opencode/'),
  ];

  const choices = buildDetectedToolChoices(integrations, toolOptions, 'propose');

  assert.equal(choices.length, 2, 'two tools with same form should produce two choices');
  assert.equal(choices[0].tool, 'Windsurf');
  assert.equal(choices[1].tool, 'OpenCode');
  assert.equal(choices[0].text, choices[1].text);
});

test('same tool+form is deduplicated', () => {
  const toolOptions = [option('Cursor', 'opsx-dash')];
  const integrations = [
    integration('Cursor', 'opsx-dash', '.cursor/commands/'),
    integration('Cursor', 'opsx-dash', '.cursor/skills/'),
  ];

  const choices = buildDetectedToolChoices(integrations, toolOptions, 'propose');

  assert.equal(choices.length, 1, 'same tool+form should be deduplicated');
});

// ---------------------------------------------------------------------------
// 3. .agents neutral integration → exactly 2 detected choices (split)
// ---------------------------------------------------------------------------

test('neutral .agents integration produces exactly 2 detected choices: Shared .agents + Codex', () => {
  // integrations carries the neutral form; toolOptions already split
  const integrations = [
    integration('Shared .agents / Codex', 'skill-slash', '.agents/commands/opsx/'),
  ];

  const choices = buildDetectedToolChoices(integrations, ALL_TOOL_OPTIONS, 'propose');

  assert.equal(choices.length, 2, 'neutral .agents should produce exactly 2 choices');
  assert.equal(choices[0].tool, 'Shared .agents');
  assert.equal(choices[0].form, 'skill-slash');
  assert.equal(choices[0].text, '/openspec-propose');
  assert.equal(choices[1].tool, 'Codex');
  assert.equal(choices[1].form, 'skill-dollar');
  assert.equal(choices[1].text, '$openspec-propose');
});

test('.agents neutral integration does NOT fall back to all toolOptions', () => {
  const integrations = [
    integration('Shared .agents / Codex', 'skill-slash', '.agents/commands/opsx/'),
  ];

  const choices = buildDetectedToolChoices(integrations, ALL_TOOL_OPTIONS, 'propose');

  // Must be exactly 2, not 7 (all toolOptions)
  assert.equal(choices.length, 2);
});

test('.agents expansion with change name appends it to both choices', () => {
  const integrations = [
    integration('Shared .agents / Codex', 'skill-slash', '.agents/commands/opsx/'),
  ];

  const choices = buildDetectedToolChoices(integrations, ALL_TOOL_OPTIONS, 'apply', 'feat-x');

  assert.equal(choices.length, 2);
  assert.ok(choices[0].text.endsWith(' feat-x'), 'Shared .agents should append change name');
  assert.ok(choices[1].text.endsWith(' feat-x'), 'Codex should append change name');
});

// ---------------------------------------------------------------------------
// 4. Zero detected → all toolOptions (already split)
// ---------------------------------------------------------------------------

test('zero detected integrations returns all toolOptions', () => {
  const choices = buildToolChoices(ALL_TOOL_OPTIONS, [], 'propose');

  // ALL_TOOL_OPTIONS has 7 entries (already split, no neutral)
  assert.equal(choices.length, 7);

  const toolNames = choices.map((c) => c.tool);
  assert.ok(toolNames.includes('Claude Code'));
  assert.ok(toolNames.includes('Shared .agents'));
  assert.ok(toolNames.includes('Codex'));
});

test('zero detected for workspace workflow shows no change name', () => {
  const toolOptions = [option('Claude Code', 'opsx-colon'), option('Cursor', 'opsx-dash')];
  const choices = buildToolChoices(toolOptions, [], 'explore');

  assert.ok(choices.every((c) => !c.text.includes(' ')));
});

test('zero detected for change workflow appends change name', () => {
  const toolOptions = [option('Claude Code', 'opsx-colon')];
  const choices = buildToolChoices(toolOptions, [], 'apply', 'my-change');

  assert.equal(choices.length, 1);
  assert.ok(choices[0].text.endsWith(' my-change'));
});

// ---------------------------------------------------------------------------
// 5. Undetected excludes detected
// ---------------------------------------------------------------------------

test('undetected excludes normal detected integrations', () => {
  const integrations = [integration('Claude Code', 'opsx-colon', '.claude/')];
  const toolOptions = [
    option('Claude Code', 'opsx-colon'),
    option('Cursor', 'opsx-dash'),
    option('Windsurf', 'skill-slash'),
  ];

  const undetected = buildUndetectedToolChoices(integrations, toolOptions, 'propose');

  assert.equal(undetected.length, 2);
  assert.ok(undetected.every((c) => c.tool !== 'Claude Code'));
});

test('undetected empty when all tools detected', () => {
  const toolOptions = [option('Claude Code', 'opsx-colon')];
  const integrations = [integration('Claude Code', 'opsx-colon', '.claude/')];

  const undetected = buildUndetectedToolChoices(integrations, toolOptions, 'propose');

  assert.equal(undetected.length, 0);
});

test('undetected excludes both split .agents tools when neutral integration present', () => {
  const integrations = [
    integration('Shared .agents / Codex', 'skill-slash', '.agents/commands/opsx/'),
  ];

  const undetected = buildUndetectedToolChoices(integrations, ALL_TOOL_OPTIONS, 'propose');

  const tools = undetected.map((c) => c.tool);
  assert.ok(!tools.includes('Shared .agents'), 'Shared .agents should be excluded from undetected');
  assert.ok(!tools.includes('Codex'), 'Codex should be excluded from undetected');
  assert.ok(tools.includes('Claude Code'), 'non-agents tools should remain');
  assert.ok(tools.includes('Cursor'));
});

test('undetected does NOT fall back to all toolOptions when neutral .agents present', () => {
  const integrations = [
    integration('Shared .agents / Codex', 'skill-slash', '.agents/commands/opsx/'),
  ];

  const undetected = buildUndetectedToolChoices(integrations, ALL_TOOL_OPTIONS, 'propose');

  // ALL_TOOL_OPTIONS has 7 entries; 2 are .agents → undetected should be 5
  assert.equal(undetected.length, 5, `expected 5 undetected, got ${undetected.length}`);
});

// ---------------------------------------------------------------------------
// 6. No format labels / no last memory
// ---------------------------------------------------------------------------

test('choices never contain format ids or prefixes as tool names', () => {
  const choices = buildToolChoices(ALL_TOOL_OPTIONS, [], 'propose');

  const forbidden = [
    'opsx-colon', 'opsx-dash', 'opsx-at', 'skill-slash', 'skill-colon', 'skill-dollar',
    '/opsx:', '/opsx-', '@opsx-', '/openspec-', '/skill:openspec-', '$openspec-',
    'format', 'Format',
    'Shared .agents / Codex', // neutral name should never appear as a tool label
  ];

  for (const choice of choices) {
    assert.ok(
      !forbidden.includes(choice.tool),
      `tool name "${choice.tool}" should not be a format label or neutral name`,
    );
  }
});

test('buildToolChoices is pure — same inputs produce same outputs', () => {
  const a = buildToolChoices(ALL_TOOL_OPTIONS, [], 'propose');
  const b = buildToolChoices(ALL_TOOL_OPTIONS, [], 'propose');

  assert.deepEqual(a, b);
});

// ---------------------------------------------------------------------------
// 7. Key stability
// ---------------------------------------------------------------------------

test('choice key is tool + form composite', () => {
  const toolOptions = [option('Claude Code', 'opsx-colon')];
  const choices = buildToolChoices(toolOptions, [], 'propose');

  assert.equal(choices.length, 1);
  assert.equal(choices[0].key, 'Claude Code\u0000opsx-colon');
});

// ---------------------------------------------------------------------------
// 8. Mixed detected + undetected
// ---------------------------------------------------------------------------

test('buildToolChoices preserves order from toolOptions', () => {
  const toolOptions = [
    option('Cursor', 'opsx-dash'),
    option('Claude Code', 'opsx-colon'),
    option('Windsurf', 'skill-slash'),
  ];
  const integrations = [integration('Claude Code', 'opsx-colon', '.claude/')];

  const choices = buildToolChoices(toolOptions, integrations, 'propose');

  assert.equal(choices[0].tool, 'Cursor');
  assert.equal(choices[1].tool, 'Claude Code');
  assert.equal(choices[2].tool, 'Windsurf');
});

// ---------------------------------------------------------------------------
// 9. All workflows produce valid choices
// ---------------------------------------------------------------------------

const ALL_WORKFLOWS: WorkflowCommand[] = [
  'propose', 'explore', 'apply', 'archive', 'update',
  'new', 'continue', 'ff', 'verify', 'sync', 'bulk-archive',
];

test('every workflow produces choices for a single tool option', () => {
  const toolOptions = [option('Claude Code', 'opsx-colon')];

  for (const workflow of ALL_WORKFLOWS) {
    const choices = buildToolChoices(toolOptions, [], workflow);
    assert.equal(choices.length, 1, `${workflow}: expected 1 choice`);
    assert.ok(choices[0].text.length > 0, `${workflow}: text should not be empty`);
  }
});

// ---------------------------------------------------------------------------
// 10. Combined: neutral .agents + normal integrations
// ---------------------------------------------------------------------------

test('combined: neutral .agents + Claude Code detected → 3 choices', () => {
  const integrations = [
    integration('Claude Code', 'opsx-colon', '.claude/'),
    integration('Shared .agents / Codex', 'skill-slash', '.agents/commands/opsx/'),
  ];

  const choices = buildDetectedToolChoices(integrations, ALL_TOOL_OPTIONS, 'propose');

  assert.equal(choices.length, 3);
  assert.equal(choices[0].tool, 'Claude Code');
  assert.equal(choices[1].tool, 'Shared .agents');
  assert.equal(choices[2].tool, 'Codex');
});

test('combined: neutral .agents + Claude Code → undetected excludes all 3', () => {
  const integrations = [
    integration('Claude Code', 'opsx-colon', '.claude/'),
    integration('Shared .agents / Codex', 'skill-slash', '.agents/commands/opsx/'),
  ];

  const undetected = buildUndetectedToolChoices(integrations, ALL_TOOL_OPTIONS, 'propose');

  const tools = undetected.map((c) => c.tool);
  assert.ok(!tools.includes('Claude Code'));
  assert.ok(!tools.includes('Shared .agents'));
  assert.ok(!tools.includes('Codex'));
  assert.equal(undetected.length, ALL_TOOL_OPTIONS.length - 3);
});

// ---------------------------------------------------------------------------
// 11. Empty toolOptions fallback
// ---------------------------------------------------------------------------

test('empty toolOptions falls back to 6 tool-labeled choices', () => {
  const choices = buildToolChoices([], [], 'propose');

  assert.equal(choices.length, 6);

  const toolNames = choices.map((c) => c.tool);
  assert.ok(toolNames.includes('Claude Code'));
  assert.ok(toolNames.includes('Cursor / OpenCode'));
  assert.ok(toolNames.includes('Amazon Q Developer'));
  assert.ok(toolNames.includes('OpenSpec skill tools'));
  assert.ok(toolNames.includes('Kimi Code'));
  assert.ok(toolNames.includes('Codex'));
});

test('fallback choices use all 6 official forms', () => {
  const choices = buildToolChoices([], [], 'propose');

  const forms = choices.map((c) => c.form);
  for (const form of INVOCATION_FORM_IDS) {
    assert.ok(forms.includes(form), `fallback should include form ${form}`);
  }
});

test('fallback choices never use format ids as tool names', () => {
  const choices = buildToolChoices([], [], 'propose');

  const forbidden = [
    'opsx-colon', 'opsx-dash', 'opsx-at', 'skill-slash', 'skill-colon', 'skill-dollar',
    '/opsx:', '/opsx-', '@opsx-', '/openspec-', '/skill:openspec-', '$openspec-',
    'Shared .agents / Codex',
  ];

  for (const choice of choices) {
    assert.ok(
      !forbidden.includes(choice.tool),
      `fallback tool "${choice.tool}" should not be a format id or neutral name`,
    );
  }
});

test('fallback with change-scoped workflow appends change name', () => {
  const choices = buildToolChoices([], [], 'apply', 'feat-x');

  assert.equal(choices.length, 6);
  assert.ok(choices.every((c) => c.text.endsWith(' feat-x')));
});

test('fallback with workspace-scoped workflow never appends change name', () => {
  const choices = buildToolChoices([], [], 'propose', 'ignored');

  assert.equal(choices.length, 6);
  assert.ok(choices.every((c) => !c.text.includes('ignored')));
});

test('getEffectiveToolOptions returns fallback when input is empty', () => {
  const effective = getEffectiveToolOptions([]);

  assert.equal(effective.length, 6);
  assert.equal(effective[0].tool, 'Claude Code');
  assert.equal(effective[0].form, 'opsx-colon');
});

test('getEffectiveToolOptions returns input when non-empty', () => {
  const input = [option('Custom', 'opsx-colon')];
  const effective = getEffectiveToolOptions(input);

  assert.deepEqual(effective, input);
});

test('every workflow produces 6 fallback choices when toolOptions is empty', () => {
  for (const workflow of ALL_WORKFLOWS) {
    const choices = buildToolChoices([], [], workflow);
    assert.equal(choices.length, 6, `${workflow}: expected 6 fallback choices, got ${choices.length}`);
  }
});
