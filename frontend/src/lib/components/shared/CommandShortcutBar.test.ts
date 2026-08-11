/**
 * Tests for the copy-time selector UI behavior.
 *
 * Uses buildGroupedToolChoices — the installed-only grouped resolver.
 * Verifies the component contract via pure functions and source assertions.
 */
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { test } from 'node:test';

import type { DetectedIntegration, CommandInventory, SkillInventory } from '../../types/api';
import type { WorkflowCommand, InvocationFormId } from '../../types/commandTypes';
import {
  buildGroupedToolChoices,
  type ToolChoice,
} from '../../toolChoices';
import { getWorkflowLabel } from '../../workflowMetadata';

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

function commandInventory(form: InvocationFormId, ...workflowIds: WorkflowCommand[]): CommandInventory {
  return {
    form,
    items: workflowIds.map((workflowId) => ({
      workflowId,
      source: `commands/${workflowId}.md`,
    })),
  };
}

function skillInventory(form: InvocationFormId, ...skillNames: string[]): SkillInventory {
  return {
    form,
    alternateForms: form === 'skill-slash' ? ['skill-dollar'] : undefined,
    items: skillNames.map((skillName) => ({
      skillName,
      source: `skills/${skillName}/SKILL.md`,
    })),
  };
}

function integration(
  tool: string,
  form: InvocationFormId,
  source: string,
  overrides?: { commands?: CommandInventory | null; skills?: SkillInventory | null },
): DetectedIntegration {
  return {
    tool,
    delivery: 'commands',
    form,
    example: `${form}-example`,
    source,
    commands: overrides && 'commands' in overrides ? overrides.commands! : commandInventory(form, 'propose'),
    skills: overrides && 'skills' in overrides ? overrides.skills! : null,
  };
}

// ---------------------------------------------------------------------------
// 1. Single detected → direct copy (1 choice)
// ---------------------------------------------------------------------------

test('single detected tool yields exactly one choice for direct copy', () => {
  const integrations = [integration('Claude Code', 'opsx-colon', '.claude/')];

  const choices = buildGroupedToolChoices(integrations, 'propose');

  assert.equal(choices.length, 1);
  assert.equal(choices[0].tools.length, 1);
  assert.equal(choices[0].tools[0], 'Claude Code');
  assert.equal(choices[0].text, '/opsx:propose');
});

// ---------------------------------------------------------------------------
// 2. Multiple detected with different commands → menu (multiple groups)
// ---------------------------------------------------------------------------

test('multiple tools with distinct command texts yield multiple groups', () => {
  const integrations = [
    integration('Claude Code', 'opsx-colon', '.claude/'),
    integration('Cursor', 'opsx-dash', '.cursor/'),
    integration('Windsurf', 'skill-slash', '.windsurf/'),
  ];

  const choices = buildGroupedToolChoices(integrations, 'propose');

  assert.equal(choices.length, 3);
  assert.equal(choices[0].tools[0], 'Claude Code');
  assert.equal(choices[1].tools[0], 'Cursor');
  assert.equal(choices[2].tools[0], 'Windsurf');
});

// ---------------------------------------------------------------------------
// 3. Zero integrations → empty (chip hidden)
// ---------------------------------------------------------------------------

test('zero integrations yields empty choices (chip hidden)', () => {
  const choices = buildGroupedToolChoices([], 'propose');

  assert.equal(choices.length, 0);
});

// ---------------------------------------------------------------------------
// 4. Same command text from multiple tools → one group, direct copy
// ---------------------------------------------------------------------------

test('two tools with the same command text produce one grouped choice', () => {
  const integrations = [
    integration('Windsurf', 'skill-slash', '.windsurf/'),
    integration('OpenCode', 'skill-slash', '.opencode/'),
  ];

  const choices = buildGroupedToolChoices(integrations, 'propose');

  assert.equal(choices.length, 1, 'should be one group since both produce the same command text');
  assert.equal(choices[0].tools.length, 2);
  assert.equal(choices[0].tools[0], 'Windsurf');
  assert.equal(choices[0].tools[1], 'OpenCode');
});

// ---------------------------------------------------------------------------
// 5. .agents split — two documented interpretations
// ---------------------------------------------------------------------------

test('.agents integration with matching skill expands to two forms', () => {
  const integrations = [
    integration(
      'Shared .agents / Codex',
      'skill-slash',
      '.agents/',
      { commands: null, skills: skillInventory('skill-slash', 'openspec-propose') },
    ),
  ];

  const choices = buildGroupedToolChoices(integrations, 'propose');

  assert.equal(choices.length, 2, 'should have two groups: Shared .agents and Codex');
  assert.equal(choices[0].tools[0], 'Shared .agents');
  assert.equal(choices[1].tools[0], 'Codex');
});

// ---------------------------------------------------------------------------
// 6. Integration with no matching evidence → excluded
// ---------------------------------------------------------------------------

test('integration with no matching command or skill produces no choices', () => {
  const integrations = [
    integration('NoMatch', 'opsx-colon', '.nomatch/', { commands: null, skills: null }),
  ];

  const choices = buildGroupedToolChoices(integrations, 'propose');

  assert.equal(choices.length, 0);
});

// ---------------------------------------------------------------------------
// 7. No format ids as tool names
// ---------------------------------------------------------------------------

test('choices never contain format ids as tool names', () => {
  const integrations = [
    integration('Claude Code', 'opsx-colon', '.claude/'),
    integration('Cursor', 'opsx-dash', '.cursor/'),
  ];

  const choices = buildGroupedToolChoices(integrations, 'propose');

  const forbidden = [
    'opsx-colon', 'opsx-dash', 'opsx-at', 'skill-slash', 'skill-colon', 'skill-dollar',
    '/opsx:', '/opsx-', '@opsx-', '/openspec-', '/skill:openspec-', '$openspec-',
    'format', 'Format',
  ];

  for (const choice of choices) {
    for (const tool of choice.tools) {
      assert.ok(
        !forbidden.includes(tool),
        `tool name "${tool}" should not be a format label`,
      );
    }
  }
});

test('buildGroupedToolChoices is pure — same inputs produce same outputs', () => {
  const integrations = [integration('Claude Code', 'opsx-colon', '.claude/')];
  const a = buildGroupedToolChoices(integrations, 'propose');
  const b = buildGroupedToolChoices(integrations, 'propose');

  assert.deepEqual(a, b);
});

// ---------------------------------------------------------------------------
// 8. Change-name appending
// ---------------------------------------------------------------------------

test('change-scoped choices append change name', () => {
  const integrations = [
    integration('Claude Code', 'opsx-colon', '.claude/', {
      commands: commandInventory('opsx-colon', 'apply'),
    }),
  ];
  const choices = buildGroupedToolChoices(integrations, 'apply', { changeName: 'my-feature' });

  assert.equal(choices.length, 1);
  assert.equal(choices[0].text, '/opsx:apply my-feature');
});

test('workspace-scoped choices never append change name', () => {
  const integrations = [integration('Claude Code', 'opsx-colon', '.claude/')];
  const choices = buildGroupedToolChoices(integrations, 'propose', { changeName: 'should-not-appear' });

  assert.equal(choices.length, 1);
  assert.ok(!choices[0].text.includes('should-not-appear'));
});

// ---------------------------------------------------------------------------
// 9. CommandShortcutBar source: non-navigating, uses buildGroupedToolChoices
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

test('CommandShortcutBar uses buildGroupedToolChoices only', async () => {
  const source = await readFile(
    new URL('./CommandShortcutBar.svelte', import.meta.url),
    'utf8',
  );

  assert.match(source, /buildGroupedToolChoices/);

  // Old APIs must be absent
  assert.doesNotMatch(source, /buildDetectedToolChoices/);
  assert.doesNotMatch(source, /buildUndetectedToolChoices/);
  assert.doesNotMatch(source, /buildToolChoices/);
});

test('CommandShortcutBar has no fallback/custom controls', async () => {
  const source = await readFile(
    new URL('./CommandShortcutBar.svelte', import.meta.url),
    'utf8',
  );

  // No "Other tool" submenu
  assert.doesNotMatch(source, /Other tool/);
  assert.doesNotMatch(source, /otherToolOpenFor/);

  // No custom command input
  assert.doesNotMatch(source, /customText/);
  assert.doesNotMatch(source, /custom.command/i);
  assert.doesNotMatch(source, /Custom command/);
  assert.doesNotMatch(source, /my-tool/);

  // No undetected/fallback helpers
  assert.doesNotMatch(source, /getUndetectedChoices/);
  assert.doesNotMatch(source, /getAllChoices/);
  assert.doesNotMatch(source, /resolveChoices/);
});

test('CommandShortcutBar skips zero-candidate chips (conditional render)', async () => {
  const source = await readFile(
    new URL('./CommandShortcutBar.svelte', import.meta.url),
    'utf8',
  );

  // Should have a conditional check for empty choices
  assert.match(source, /choices\.length === 0/);
  // Should show dropdown only for the else branch (multiple groups)
  assert.match(source, /\{:else\}/);
});

test('CommandShortcutBar dropdown shows tools with accessible text', async () => {
  const source = await readFile(
    new URL('./CommandShortcutBar.svelte', import.meta.url),
    'utf8',
  );

  // Should join tool names
  assert.match(source, /choice\.tools\.join/);
  // Should use title for accessibility
  assert.match(source, /title=\{toolsLabel\}/);
  // Should use "Choose command" label (not "Choose tool")
  assert.match(source, /Choose command/);
});

test('CommandShortcutBar menu strips change name from preview but not from clipboard', async () => {
  const source = await readFile(
    new URL('./CommandShortcutBar.svelte', import.meta.url),
    'utf8',
  );

  // A local display-only helper keeps the component API unchanged.
  assert.match(source, /function stripChangeName/);

  // The menu display line uses stripChangeName (not raw choice.text)
  assert.match(source, /stripChangeName\(choice\.text\)/);

  // The clipboard copy line still uses the raw choice.text
  assert.match(source, /void copyText\(choice\.text\)/);

  // stripChangeName uses endsWith + slice (no regex, safe for special chars)
  assert.doesNotMatch(source, /new RegExp/, 'Must not use regex for change-name stripping');
  assert.match(source, /\.endsWith\(suffix\)/);
  assert.match(source, /\.slice\(0, -suffix\.length\)/);
});

test('change-scoped menu preview omits change name but clipboard text retains it', () => {
  // Simulate the exact stripChangeName algorithm from CommandShortcutBar
  function stripChangeName(text: string, changeName: string | null): string {
    if (!changeName) return text;
    const suffix = ` ${changeName}`;
    return text.endsWith(suffix) ? text.slice(0, -suffix.length) : text;
  }

  // 1. buildGroupedToolChoices produces choice.text WITH change name (clipboard text)
  const integrations = [
    integration('Claude Code', 'opsx-colon', '.claude/', {
      commands: commandInventory('opsx-colon', 'apply'),
    }),
  ];
  const choices = buildGroupedToolChoices(integrations, 'apply', { changeName: 'add-auth' });
  assert.equal(choices.length, 1);
  assert.equal(choices[0].text, '/opsx:apply add-auth', 'clipboard text must include change name');

  // 2. stripChangeName removes the trailing change name (menu preview)
  const menuPreview = stripChangeName(choices[0].text, 'add-auth');
  assert.equal(menuPreview, '/opsx:apply', 'menu preview must omit change name');

  // 3. Workspace-scoped choices are unaffected — no suffix to strip
  const wsIntegrations = [integration('Claude Code', 'opsx-colon', '.claude/')];
  const wsChoices = buildGroupedToolChoices(wsIntegrations, 'propose', { changeName: 'should-not-appear' });
  assert.equal(wsChoices.length, 1);
  assert.ok(!wsChoices[0].text.includes('should-not-appear'), 'workspace choice has no change name suffix');
  const wsPreview = stripChangeName(wsChoices[0].text, 'should-not-appear');
  assert.equal(wsPreview, wsChoices[0].text, 'workspace text passes through unchanged');

  // 4. Change name with spaces and special chars is handled safely (no regex)
  const complexText = '/opsx:apply my feature v2';
  const stripped = stripChangeName(complexText, 'my feature v2');
  assert.equal(stripped, '/opsx:apply', 'complex change name with spaces is stripped correctly');
});

test('CommandShortcutBar outer wrapper has no onpointerdown or onkeydown handlers', async () => {
  const source = await readFile(
    new URL('./CommandShortcutBar.svelte', import.meta.url),
    'utf8',
  );

  const outerWrapper = source.match(
    /<div\s+class="flex max-w-full flex-wrap items-center gap-1\.5"[^>]*>/,
  );
  assert.ok(outerWrapper, 'Should find the outer wrapper div');
  assert.doesNotMatch(
    outerWrapper[0],
    /onpointerdown/,
    'Outer wrapper must not have onpointerdown',
  );
  assert.doesNotMatch(
    outerWrapper[0],
    /onkeydown/,
    'Outer wrapper must not have onkeydown',
  );
});

// ---------------------------------------------------------------------------
// 10. Settings > Tools source: warning for active repo + 0 integrations
// ---------------------------------------------------------------------------

test('SettingsView shows warning variant when active repo has zero integrations', async () => {
  const source = await readFile(
    new URL('../layout/SettingsView.svelte', import.meta.url),
    'utf8',
  );

  // Should check for active repo in the empty-integrations branch
  assert.match(source, /activeRepositoryPath/);
  // Should use warning variant for the callout
  assert.match(source, /variant="warning"/);
  // Should still reference the no-integrations message
  assert.match(source, /settings_tools_no_integrations/);
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

test('every workflow produces zero choices when no integrations', () => {
  for (const workflow of ALL_WORKFLOWS) {
    const choices = buildGroupedToolChoices([], workflow);
    assert.equal(choices.length, 0, `${workflow}: expected 0 choices with no integrations`);
  }
});

test('every workflow produces at least one choice for matching integration', () => {
  for (const workflow of ALL_WORKFLOWS) {
    const integrations = [
      integration('Claude Code', 'opsx-colon', '.claude/', {
        commands: commandInventory('opsx-colon', workflow),
      }),
    ];
    const choices = buildGroupedToolChoices(integrations, workflow);
    assert.ok(choices.length >= 1, `${workflow}: expected at least 1 choice`);
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
