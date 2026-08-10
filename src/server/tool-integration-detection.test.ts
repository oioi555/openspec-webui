import assert from 'node:assert/strict';
import { test } from 'node:test';
import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import {
  AGENTS_SHARED_TOOL,
  detectToolIntegrations,
  deriveDistinctForms,
  getSupportedToolOptions,
  type DetectedIntegration,
} from './tool-integration-detection.js';

const tempDirs: string[] = [];

async function makeProjectRoot(): Promise<string> {
  const dir = await mkdtemp(join(tmpdir(), 'openspec-webui-detection-'));
  tempDirs.push(dir);
  return dir;
}

async function write(dir: string, relPath: string, content = ''): Promise<void> {
  const full = join(dir, relPath);
  await mkdir(join(full, '..'), { recursive: true });
  await writeFile(full, content, 'utf8');
}

test('detects a single folder-namespaced command integration (opsx-colon)', async () => {
  const root = await makeProjectRoot();
  await write(root, '.claude/commands/opsx/propose.md');

  const integrations = await detectToolIntegrations(root);
  assert.deepEqual(integrations, [
    {
      tool: 'Claude Code',
      delivery: 'commands',
      form: 'opsx-colon',
      example: '/opsx:propose',
      source: '.claude/commands/opsx/propose.md',
    },
  ]);
});

test('detects multiple integrations across command shapes', async () => {
  const root = await makeProjectRoot();
  await write(root, '.claude/commands/opsx/propose.md');
  await write(root, '.cursor/commands/opsx-propose.md');
  await write(root, '.amazonq/prompts/opsx-propose.md');

  const integrations = await detectToolIntegrations(root);
  const byTool = new Map(integrations.map((i) => [i.tool, i]));

  assert.equal(byTool.get('Claude Code')?.form, 'opsx-colon');
  assert.equal(byTool.get('Cursor')?.form, 'opsx-dash');
  assert.equal(byTool.get('Amazon Q Developer')?.form, 'opsx-at');
  assert.equal(byTool.get('Cursor')?.delivery, 'commands');
  assert.equal(byTool.get('Cursor')?.source, '.cursor/commands/opsx-propose.md');
});

test('returns zero integrations for a project with no OpenSpec artifacts', async () => {
  const root = await makeProjectRoot();
  await write(root, 'openspec/config.yaml', 'schema: spec-driven');

  assert.deepEqual(await detectToolIntegrations(root), []);
});

test('does not detect empty directories', async () => {
  const root = await makeProjectRoot();
  // Directory exists but holds no command files at all.
  await mkdir(join(root, '.claude/commands/opsx'), { recursive: true });
  // Skill directory exists but holds no SKILL.md.
  await mkdir(join(root, '.claude/skills/openspec-propose'), { recursive: true });

  assert.deepEqual(await detectToolIntegrations(root), []);
});

test('detects skill-only integrations with the general skill-slash form', async () => {
  const root = await makeProjectRoot();
  await write(root, '.forge/skills/openspec-propose/SKILL.md', '# openspec-propose');

  const integrations = await detectToolIntegrations(root);
  assert.deepEqual(integrations, [
    {
      tool: 'ForgeCode',
      delivery: 'skills',
      form: 'skill-slash',
      example: '/openspec-propose',
      source: '.forge/skills/openspec-propose/SKILL.md',
    },
  ]);
});

test('maps Kimi Code skill root to the skill-colon form', async () => {
  const root = await makeProjectRoot();
  await write(root, '.kimi-code/skills/openspec-apply-change/SKILL.md', '# openspec-apply-change');

  const integrations = await detectToolIntegrations(root);
  assert.deepEqual(integrations, [
    {
      tool: 'Kimi Code',
      delivery: 'skills',
      form: 'skill-colon',
      example: '/skill:openspec-propose',
      source: '.kimi-code/skills/openspec-apply-change/SKILL.md',
    },
  ]);
});

test('maps the shared .agents root to a non-committal integration', async () => {
  const root = await makeProjectRoot();
  await write(root, '.agents/skills/openspec-propose/SKILL.md', '# openspec-propose');

  const integrations = await detectToolIntegrations(root);
  assert.deepEqual(integrations, [
    {
      tool: AGENTS_SHARED_TOOL,
      delivery: 'skills',
      form: 'skill-slash',
      example: '/openspec-propose or $openspec-propose',
      source: '.agents/skills/openspec-propose/SKILL.md',
    },
  ]);
});

test('agents-only detection yields both candidate forms so the frontend opens a menu', async () => {
  const root = await makeProjectRoot();
  await write(root, '.agents/skills/openspec-propose/SKILL.md', '# openspec-propose');

  const integrations = await detectToolIntegrations(root);
  assert.deepEqual(deriveDistinctForms(integrations), ['skill-slash', 'skill-dollar']);
  // Two distinct forms: the copy-time selector must never treat this as a
  // single-direct candidate.
  assert.ok(deriveDistinctForms(integrations).length > 1);
});

test('merges command and skill evidence per tool into delivery both with command form', async () => {
  const root = await makeProjectRoot();
  await write(root, '.claude/commands/opsx/propose.md');
  await write(root, '.claude/skills/openspec-apply-change/SKILL.md', '# openspec-apply-change');

  const integrations = await detectToolIntegrations(root);
  assert.deepEqual(integrations, [
    {
      tool: 'Claude Code',
      delivery: 'both',
      form: 'opsx-colon',
      example: '/opsx:propose',
      source: '.claude/commands/opsx/propose.md',
    },
  ]);
});

test('derives distinct forms in canonical order', () => {
  const integrations: DetectedIntegration[] = [
    {
      tool: 'Cursor',
      delivery: 'commands',
      form: 'opsx-dash',
      example: '/opsx-propose',
      source: '.cursor/commands/opsx-propose.md',
    },
    {
      tool: 'Claude Code',
      delivery: 'commands',
      form: 'opsx-colon',
      example: '/opsx:propose',
      source: '.claude/commands/opsx/propose.md',
    },
    {
      tool: 'Kimi Code',
      delivery: 'skills',
      form: 'skill-colon',
      example: '/skill:openspec-propose',
      source: '.kimi-code/skills/openspec-propose/SKILL.md',
    },
  ];

  assert.deepEqual(deriveDistinctForms(integrations), [
    'opsx-colon',
    'opsx-dash',
    'skill-colon',
  ]);
});

test('collapses identical forms across tools into one form entry', () => {
  const integrations: DetectedIntegration[] = [
    {
      tool: 'Cursor',
      delivery: 'commands',
      form: 'opsx-dash',
      example: '/opsx-propose',
      source: '.cursor/commands/opsx-propose.md',
    },
    {
      tool: 'Trae',
      delivery: 'commands',
      form: 'opsx-dash',
      example: '/opsx-propose',
      source: '.trae/commands/opsx-propose.md',
    },
  ];

  assert.deepEqual(deriveDistinctForms(integrations), ['opsx-dash']);
});

test('ignores unknown roots and missing project roots defensively', async () => {
  const root = await makeProjectRoot();
  await write(root, '.unknown-tool/commands/opsx/propose.md');
  assert.deepEqual(await detectToolIntegrations(root), []);

  const missing = join(root, 'does-not-exist');
  assert.deepEqual(await detectToolIntegrations(missing), []);
});

test('ignores global MiniMax installs and never invents a .codex root', async () => {
  const root = await makeProjectRoot();
  await write(root, '.codex/skills/openspec-propose/SKILL.md', '# openspec-propose');

  const integrations = await detectToolIntegrations(root);
  const tools = integrations.map((i) => i.tool);
  assert.ok(!tools.includes('Codex'));
  assert.ok(!tools.includes('MiniMax Code'));
});

test('getSupportedToolOptions prefers the first command form per tool', () => {
  const options = getSupportedToolOptions();
  const byTool = new Map(options.map((option) => [option.tool, option.form]));

  // Command-form tools use their command form.
  assert.equal(byTool.get('Claude Code'), 'opsx-colon');
  assert.equal(byTool.get('Cursor'), 'opsx-dash');
  assert.equal(byTool.get('Amazon Q Developer'), 'opsx-at');
  // Skill-only tools use their skill form.
  assert.equal(byTool.get('ForgeCode'), 'skill-slash');
  assert.equal(byTool.get('Kimi Code'), 'skill-colon');
});

test('getSupportedToolOptions expands the shared .agents root into two targets', () => {
  const options = getSupportedToolOptions();

  assert.deepEqual(options.find((o) => o.tool === 'Shared .agents'), {
    tool: 'Shared .agents',
    form: 'skill-slash',
  });
  assert.deepEqual(options.find((o) => o.tool === 'Codex'), {
    tool: 'Codex',
    form: 'skill-dollar',
  });
});

test('getSupportedToolOptions preserves signature order and dedupes tool/form pairs', () => {
  const options = getSupportedToolOptions();
  const tools = options.map((o) => o.tool);

  // Signature order: Claude Code first, then the shared agents split last.
  assert.equal(tools[0], 'Claude Code');
  assert.equal(tools[tools.length - 2], 'Shared .agents');
  assert.equal(tools[tools.length - 1], 'Codex');

  // No duplicate (tool, form) pairs.
  const seen = new Set(options.map((o) => `${o.tool}\u0000${o.form}`));
  assert.equal(seen.size, options.length);
});

test('getSupportedToolOptions catalog includes representative official tools', () => {
  const options = getSupportedToolOptions();
  const tools = new Set(options.map((o) => o.tool));

  for (const expected of [
    'Claude Code',
    'CodeBuddy',
    'Crush',
    'Gemini CLI',
    'Lingma',
    'Qoder',
    'Auggie',
    'Bob Shell',
    'Cursor',
    'Factory Droid',
    'iFlow',
    'Junie',
    'Oh My Pi',
    'OpenCode',
    'Qwen Code',
    'Zoo Code',
    'Trae',
    'Antigravity',
    'Cline',
    'Devin',
    'Kilo Code',
    'Continue',
    'GitHub Copilot',
    'Kiro',
    'Pi',
    'CoStrict',
    'Amazon Q Developer',
    'CodeArts',
    'ForgeCode',
    'Hermes Agent',
    'Mistral Vibe',
    'Kimi Code',
    'Shared .agents',
    'Codex',
  ]) {
    assert.ok(tools.has(expected), `catalog missing ${expected}`);
  }
});

// Cleanup temp dirs after all tests.
process.on('exit', () => {
  for (const dir of tempDirs.splice(0)) {
    void rm(dir, { recursive: true, force: true });
  }
});
