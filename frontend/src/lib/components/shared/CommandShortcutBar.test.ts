/**
 * Tests for the copy-time selector UI behavior.
 *
 * The selector is tool-centric: each menu item is identified by its tool name,
 * not by its invocation form.  The logic lives in toolChoices.ts; these tests
 * verify the integration contract via the pure functions.
 *
 * Also verifies that CommandShortcutBar is non-navigating (no tabStore,
 * layoutStore imports) and does not use outer-wrapper propagation blockers
 * that would break the DropdownMenu's window-level event handlers.
 */
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { test } from 'node:test';

import type { ToolInvocationOption, DetectedIntegration } from '../../types/api';
import type { WorkflowCommand, InvocationFormId } from '../../types/commandTypes';
import { INVOCATION_FORM_IDS } from '../../types/commandTypes';
import {
  buildToolChoices,
  buildDetectedToolChoices,
  buildUndetectedToolChoices,
  getEffectiveToolOptions,
} from '../../toolChoices';
import { getWorkflowLabel } from '../../workflowMetadata';

// ---------------------------------------------------------------------------
// Fixtures
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

// ---------------------------------------------------------------------------
// 1. Single detected → direct copy (1 choice)
// ---------------------------------------------------------------------------

test('single detected tool yields exactly one choice for direct copy', () => {
  const toolOptions = [option('Claude Code', 'opsx-colon')];
  const integrations = [integration('Claude Code', 'opsx-colon', '.claude/')];

  const choices = buildDetectedToolChoices(integrations, toolOptions, 'propose');

  assert.equal(choices.length, 1);
  assert.equal(choices[0].tool, 'Claude Code');
  assert.equal(choices[0].text, '/opsx:propose');
});

// ---------------------------------------------------------------------------
// 2. Multiple detected → menu, no copy until explicit selection
// ---------------------------------------------------------------------------

test('multiple detected tools yield multiple choices (menu required)', () => {
  const toolOptions = [
    option('Claude Code', 'opsx-colon'),
    option('Cursor', 'opsx-dash'),
    option('Windsurf', 'skill-slash'),
  ];
  const integrations = [
    integration('Claude Code', 'opsx-colon', '.claude/'),
    integration('Cursor', 'opsx-dash', '.cursor/'),
    integration('Windsurf', 'skill-slash', '.windsurf/'),
  ];

  const choices = buildDetectedToolChoices(integrations, toolOptions, 'propose');

  assert.equal(choices.length, 3);
  assert.equal(choices[0].tool, 'Claude Code');
  assert.equal(choices[1].tool, 'Cursor');
  assert.equal(choices[2].tool, 'Windsurf');
});

// ---------------------------------------------------------------------------
// 3. Zero detected → all toolOptions
// ---------------------------------------------------------------------------

test('zero detected integrations uses all toolOptions', () => {
  const toolOptions = [
    option('Claude Code', 'opsx-colon'),
    option('Cursor', 'opsx-dash'),
    option('Windsurf', 'skill-slash'),
  ];

  const choices = buildToolChoices(toolOptions, [], 'propose');

  assert.equal(choices.length, 3);
});

// ---------------------------------------------------------------------------
// 4. Same-form tools retained (not deduped by command text)
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

  assert.equal(choices.length, 2);
  assert.equal(choices[0].tool, 'Windsurf');
  assert.equal(choices[1].tool, 'OpenCode');
  assert.equal(choices[0].text, choices[1].text);
});

// ---------------------------------------------------------------------------
// 5. .agents split
// ---------------------------------------------------------------------------

test('.agents neutral integration expands to Shared .agents + Codex from split toolOptions', () => {
  const toolOptions = [
    option('Shared .agents', 'skill-slash'),
    option('Codex', 'skill-dollar'),
  ];
  const integrations = [
    integration('Shared .agents / Codex', 'skill-slash', '.agents/'),
  ];

  const choices = buildDetectedToolChoices(integrations, toolOptions, 'propose');

  assert.equal(choices.length, 2);
  assert.equal(choices[0].tool, 'Shared .agents');
  assert.equal(choices[0].form, 'skill-slash');
  assert.equal(choices[1].tool, 'Codex');
  assert.equal(choices[1].form, 'skill-dollar');
});

// ---------------------------------------------------------------------------
// 6. Other excludes detected
// ---------------------------------------------------------------------------

test('undetected choices exclude detected integrations', () => {
  const toolOptions = [
    option('Claude Code', 'opsx-colon'),
    option('Cursor', 'opsx-dash'),
    option('Windsurf', 'skill-slash'),
  ];
  const integrations = [integration('Claude Code', 'opsx-colon', '.claude/')];

  const undetected = buildUndetectedToolChoices(integrations, toolOptions, 'propose');

  assert.equal(undetected.length, 2);
  assert.ok(undetected.every((c) => c.tool !== 'Claude Code'));
});

// ---------------------------------------------------------------------------
// 7. No format labels / no last memory
// ---------------------------------------------------------------------------

test('choices never contain format ids or prefixes as tool names', () => {
  const toolOptions = [
    option('Claude Code', 'opsx-colon'),
    option('Cursor', 'opsx-dash'),
    option('Windsurf', 'skill-slash'),
  ];

  const choices = buildToolChoices(toolOptions, [], 'propose');

  const forbidden = [
    'opsx-colon', 'opsx-dash', 'opsx-at', 'skill-slash', 'skill-colon', 'skill-dollar',
    '/opsx:', '/opsx-', '@opsx-', '/openspec-', '/skill:openspec-', '$openspec-',
    'format', 'Format',
  ];

  for (const choice of choices) {
    assert.ok(
      !forbidden.includes(choice.tool),
      `tool name "${choice.tool}" should not be a format label`,
    );
  }
});

test('buildToolChoices is pure — same inputs produce same outputs', () => {
  const toolOptions = [option('Claude Code', 'opsx-colon')];
  const a = buildToolChoices(toolOptions, [], 'propose');
  const b = buildToolChoices(toolOptions, [], 'propose');

  assert.deepEqual(a, b);
});

// ---------------------------------------------------------------------------
// 8. Change-name appending
// ---------------------------------------------------------------------------

test('change-scoped choices append change name', () => {
  const toolOptions = [option('Claude Code', 'opsx-colon')];
  const choices = buildToolChoices(toolOptions, [], 'apply', 'my-feature');

  assert.equal(choices.length, 1);
  assert.equal(choices[0].text, '/opsx:apply my-feature');
});

test('workspace-scoped choices never append change name', () => {
  const toolOptions = [option('Claude Code', 'opsx-colon')];
  const choices = buildToolChoices(toolOptions, [], 'propose', 'should-not-appear');

  assert.equal(choices.length, 1);
  assert.ok(!choices[0].text.includes('should-not-appear'));
});

// ---------------------------------------------------------------------------
// 9. CommandShortcutBar source: non-navigating, no outer propagation blockers
// ---------------------------------------------------------------------------

test('CommandShortcutBar does not import tabStore or layoutStore', async () => {
  const source = await readFile(
    new URL('./CommandShortcutBar.svelte', import.meta.url),
    'utf8',
  );

  assert.doesNotMatch(source, /tabStore/);
  assert.doesNotMatch(source, /layoutStore/);
  assert.match(source, /navigator\.clipboard\.writeText/);
});

test('CommandShortcutBar uses toolChoices functions', async () => {
  const source = await readFile(
    new URL('./CommandShortcutBar.svelte', import.meta.url),
    'utf8',
  );

  assert.match(source, /buildDetectedToolChoices/);
  assert.match(source, /buildUndetectedToolChoices/);
  assert.match(source, /buildToolChoices/);
  assert.match(source, /Choose tool/);
  assert.match(source, /Other tool/);
});

test('CommandShortcutBar outer wrapper has no onpointerdown or onkeydown handlers', async () => {
  const source = await readFile(
    new URL('./CommandShortcutBar.svelte', import.meta.url),
    'utf8',
  );

  // The outer wrapper div should NOT have onpointerdown or onkeydown.
  // These would block DropdownMenu.Content's <svelte:window> handlers
  // (handleWindowPointerdown, handleWindowKeydown) from closing the menu
  // on outside-click or Escape.
  const outerWrapper = source.match(
    /<div\s+class="flex max-w-full flex-wrap items-center gap-1\.5"[^>]*>/,
  );
  assert.ok(outerWrapper, 'Should find the outer wrapper div');
  assert.doesNotMatch(
    outerWrapper[0],
    /onpointerdown/,
    'Outer wrapper must not have onpointerdown — it blocks dropdown outside-click detection',
  );
  assert.doesNotMatch(
    outerWrapper[0],
    /onkeydown/,
    'Outer wrapper must not have onkeydown — it blocks dropdown Escape handling',
  );
});

test('CommandShortcutBar DropdownMenu.Content has no onpointerdown or onclick handlers', async () => {
  const source = await readFile(
    new URL('./CommandShortcutBar.svelte', import.meta.url),
    'utf8',
  );

  // The DropdownMenu.Content should NOT have onpointerdown or onclick.
  // These would prevent the menu from closing when clicking outside,
  // since the content's own click/pointerdown would be swallowed.
  const contentMatch = source.match(
    /<DropdownMenu\.Content[\s\S]*?(?=<DropdownMenu\.Label)/,
  );
  assert.ok(contentMatch, 'Should find DropdownMenu.Content opening tag');
  assert.doesNotMatch(
    contentMatch[0],
    /onpointerdown/,
    'DropdownMenu.Content must not have onpointerdown — it blocks outside-click close',
  );
  assert.doesNotMatch(
    contentMatch[0],
    /onclick/,
    'DropdownMenu.Content must not have onclick — it blocks outside-click close',
  );
});

test('CommandShortcutBar DropdownMenu.Trigger has no onclick prop override', async () => {
  const source = await readFile(
    new URL('./CommandShortcutBar.svelte', import.meta.url),
    'utf8',
  );

  // Trigger's own internal onclick handles open/close.
  // Passing an onclick prop is overridden by the component's explicit onclick
  // (spread then explicit), so it's dead code at best and confusing at worst.
  const triggerMatch = source.match(
    /<DropdownMenu\.Trigger[\s\S]*?>/,
  );
  assert.ok(triggerMatch, 'Should find DropdownMenu.Trigger opening tag');
  assert.doesNotMatch(
    triggerMatch[0],
    /onclick=/,
    'DropdownMenu.Trigger must not have onclick prop — Trigger handles its own click',
  );
});

// ---------------------------------------------------------------------------
// 10. Empty toolOptions fallback — never produces 0 choices
// ---------------------------------------------------------------------------

test('empty toolOptions with no integrations falls back to 6 tool-labeled choices', () => {
  const choices = buildToolChoices([], [], 'propose');

  assert.equal(choices.length, 6, `expected 6 fallback choices, got ${choices.length}`);

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
  ];

  for (const choice of choices) {
    assert.ok(
      !forbidden.includes(choice.tool),
      `fallback tool name "${choice.tool}" should not be a format id or prefix`,
    );
  }
});

test('fallback choices append change name for change-scoped workflows', () => {
  const choices = buildToolChoices([], [], 'apply', 'my-change');

  assert.equal(choices.length, 6);
  assert.ok(choices.every((c) => c.text.endsWith(' my-change')));
});

test('fallback choices never append change name for workspace-scoped workflows', () => {
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

// ---------------------------------------------------------------------------
// 11. All workflows produce valid choices
// ---------------------------------------------------------------------------

const ALL_WORKFLOWS: WorkflowCommand[] = [
  'propose', 'explore', 'apply', 'archive', 'update',
  'new', 'continue', 'ff', 'verify', 'sync', 'bulk-archive',
];

test('every workflow produces valid label from metadata', () => {
  for (const workflow of ALL_WORKFLOWS) {
    const label = getWorkflowLabel(workflow);
    assert.ok(label.length > 0, `${workflow}: label should not be empty`);
  }
});

test('every workflow produces choices for single tool option', () => {
  const toolOptions = [option('Claude Code', 'opsx-colon')];

  for (const workflow of ALL_WORKFLOWS) {
    const choices = buildToolChoices(toolOptions, [], workflow);
    assert.equal(choices.length, 1, `${workflow}: expected 1 choice`);
  }
});

test('every workflow produces 6 fallback choices when toolOptions is empty', () => {
  for (const workflow of ALL_WORKFLOWS) {
    const choices = buildToolChoices([], [], workflow);
    assert.equal(choices.length, 6, `${workflow}: expected 6 fallback choices, got ${choices.length}`);
  }
});

// ---------------------------------------------------------------------------
// 12. Dropdown-menu keyboard navigation source assertions
// ---------------------------------------------------------------------------

test('DropdownMenu.Content imports and calls menuNavigation helpers', async () => {
  const source = await readFile(
    new URL('../../components/ui/dropdown-menu/dropdown-menu-content.svelte', import.meta.url),
    'utf8',
  );

  assert.match(source, /getMenuItems/, 'Content should import getMenuItems');
  assert.match(source, /focusFirst/, 'Content should import focusFirst');
  assert.match(source, /handleMenuKeydown/, 'Content should import handleMenuKeydown');
  assert.match(source, /handleContentKeydown/, 'Content should have a keydown handler');
  assert.match(source, /closeAndReturnFocus/, 'Content should have closeAndReturnFocus helper');
  assert.match(source, /trigger\?\.focus\(\)/, 'Content should return focus to trigger on close');
});

test('DropdownMenu.Item handles Enter/Space with focus return', async () => {
  const source = await readFile(
    new URL('../../components/ui/dropdown-menu/dropdown-menu-item.svelte', import.meta.url),
    'utf8',
  );

  assert.match(source, /closeAndReturnFocus/, 'Item should have closeAndReturnFocus helper');
  assert.match(source, /trigger\?\.focus\(\)/, 'Item should return focus to trigger on close');
  assert.match(source, /onkeydown/, 'Item should have keydown handler');
  assert.match(source, /Enter.*\|.*'|'.*Enter/, 'Item should handle Enter key');
  assert.match(source, /role="menuitem"/, 'Item should have menuitem role');
});

test('DropdownMenu.Trigger handles ArrowDown/ArrowUp to open menu', async () => {
  const source = await readFile(
    new URL('../../components/ui/dropdown-menu/dropdown-menu-trigger.svelte', import.meta.url),
    'utf8',
  );

  assert.match(source, /onkeydown/, 'Trigger should have keydown handler');
  assert.match(source, /ArrowDown/, 'Trigger should handle ArrowDown');
  assert.match(source, /ArrowUp/, 'Trigger should handle ArrowUp');
  assert.match(source, /aria-haspopup="menu"/, 'Trigger should have aria-haspopup');
  assert.match(source, /aria-expanded/, 'Trigger should have aria-expanded');
});

test('menuNavigation module exports pure index functions', async () => {
  const source = await readFile(
    new URL('../../components/ui/dropdown-menu/menuNavigation.ts', import.meta.url),
    'utf8',
  );

  assert.match(source, /export function nextIndex/, 'Should export nextIndex');
  assert.match(source, /export function previousIndex/, 'Should export previousIndex');
  assert.match(source, /export function firstIndex/, 'Should export firstIndex');
  assert.match(source, /export function lastIndex/, 'Should export lastIndex');
  assert.match(source, /export function isTextInputTag/, 'Should export isTextInputTag');
  assert.match(source, /export function resolveNavigationAction/, 'Should export resolveNavigationAction');
  assert.match(source, /export function handleMenuKeydown/, 'Should export handleMenuKeydown');
});
