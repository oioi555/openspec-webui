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
      commands: {
        form: 'opsx-colon',
        items: [{ workflowId: 'propose', source: '.claude/commands/opsx/propose.md' }],
      },
      skills: null,
    },
  ]);
});

test('enumerates every folder-namespaced command file into workflow ids', async () => {
  const root = await makeProjectRoot();
  await write(root, '.claude/commands/opsx/propose.md');
  await write(root, '.claude/commands/opsx/sync.md');
  await write(root, '.claude/commands/opsx/apply.md');

  const integrations = await detectToolIntegrations(root);
  assert.equal(integrations.length, 1);
  assert.deepEqual(integrations[0]?.commands, {
    form: 'opsx-colon',
    items: [
      { workflowId: 'apply', source: '.claude/commands/opsx/apply.md' },
      { workflowId: 'propose', source: '.claude/commands/opsx/propose.md' },
      { workflowId: 'sync', source: '.claude/commands/opsx/sync.md' },
    ],
  });
});

test('derives normalized workflow ids for filename-shaped command files', async () => {
  const root = await makeProjectRoot();
  await write(root, '.cursor/commands/opsx-propose.md');
  await write(root, '.cursor/commands/opsx-verify.md');
  // Non-opsx files and dotfiles must be ignored.
  await write(root, '.cursor/commands/README.md');
  await write(root, '.cursor/commands/.hidden.md');

  const integrations = await detectToolIntegrations(root);
  assert.equal(integrations.length, 1);
  assert.deepEqual(integrations[0]?.commands, {
    form: 'opsx-dash',
    items: [
      { workflowId: 'propose', source: '.cursor/commands/opsx-propose.md' },
      { workflowId: 'verify', source: '.cursor/commands/opsx-verify.md' },
    ],
  });
});

test('detects Command Code commands and skills with their documented forms', async () => {
  const root = await makeProjectRoot();
  await write(root, '.commandcode/commands/opsx-propose.md');
  await write(root, '.commandcode/commands/opsx-verify.md');
  await write(root, '.commandcode/skills/openspec-apply-change/SKILL.md', '# openspec-apply-change');

  const integrations = await detectToolIntegrations(root);
  assert.deepEqual(integrations, [
    {
      tool: 'Command Code',
      delivery: 'both',
      form: 'opsx-dash',
      example: '/opsx-propose',
      source: '.commandcode/commands/opsx-propose.md',
      commands: {
        form: 'opsx-dash',
        items: [
          { workflowId: 'propose', source: '.commandcode/commands/opsx-propose.md' },
          { workflowId: 'verify', source: '.commandcode/commands/opsx-verify.md' },
        ],
      },
      skills: {
        form: 'skill-slash',
        items: [
          {
            skillName: 'openspec-apply-change',
            source: '.commandcode/skills/openspec-apply-change/SKILL.md',
          },
        ],
      },
    },
  ]);
});

test('detects prompts and workflows directory variants with the dash form', async () => {
  const root = await makeProjectRoot();
  await write(root, '.github/prompts/opsx-propose.md');
  await write(root, '.agent/workflows/opsx-sync.md');

  const byTool = new Map(
    (await detectToolIntegrations(root)).map((i) => [i.tool, i])
  );

  assert.deepEqual(byTool.get('GitHub Copilot')?.commands, {
    form: 'opsx-dash',
    items: [{ workflowId: 'propose', source: '.github/prompts/opsx-propose.md' }],
  });
  assert.deepEqual(byTool.get('Antigravity')?.commands, {
    form: 'opsx-dash',
    items: [{ workflowId: 'sync', source: '.agent/workflows/opsx-sync.md' }],
  });
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
  assert.deepEqual(byTool.get('Amazon Q Developer')?.commands, {
    form: 'opsx-at',
    items: [{ workflowId: 'propose', source: '.amazonq/prompts/opsx-propose.md' }],
  });
});

test('partial workflow sets keep only the artifacts that exist', async () => {
  const root = await makeProjectRoot();
  // apply present, sync absent — detection must not invent sync evidence.
  await write(root, '.opencode/commands/opsx-apply.md');

  const integrations = await detectToolIntegrations(root);
  assert.equal(integrations.length, 1);
  assert.deepEqual(integrations[0]?.commands, {
    form: 'opsx-dash',
    items: [{ workflowId: 'apply', source: '.opencode/commands/opsx-apply.md' }],
  });
  assert.equal(
    integrations[0]?.commands?.items.some((item) => item.workflowId === 'sync'),
    false
  );
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
      commands: null,
      skills: {
        form: 'skill-slash',
        items: [{ skillName: 'openspec-propose', source: '.forge/skills/openspec-propose/SKILL.md' }],
      },
    },
  ]);
});

test('enumerates every openspec-* skill directory with a SKILL.md', async () => {
  const root = await makeProjectRoot();
  await write(root, '.forge/skills/openspec-propose/SKILL.md', '# openspec-propose');
  await write(root, '.forge/skills/openspec-sync-specs/SKILL.md', '# openspec-sync-specs');
  // A non-openspec skill dir and an empty openspec-* dir are not evidence.
  await write(root, '.forge/skills/my-custom-skill/SKILL.md', '# custom');
  await mkdir(join(root, '.forge/skills/openspec-empty'), { recursive: true });

  const integrations = await detectToolIntegrations(root);
  assert.equal(integrations.length, 1);
  assert.deepEqual(integrations[0]?.skills, {
    form: 'skill-slash',
    items: [
      { skillName: 'openspec-propose', source: '.forge/skills/openspec-propose/SKILL.md' },
      { skillName: 'openspec-sync-specs', source: '.forge/skills/openspec-sync-specs/SKILL.md' },
    ],
  });
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
      commands: null,
      skills: {
        form: 'skill-colon',
        items: [{ skillName: 'openspec-apply-change', source: '.kimi-code/skills/openspec-apply-change/SKILL.md' }],
      },
    },
  ]);
});

test('maps the shared .agents root to a non-committal integration with both forms', async () => {
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
      commands: null,
      skills: {
        form: 'skill-slash',
        alternateForms: ['skill-dollar'],
        items: [{ skillName: 'openspec-propose', source: '.agents/skills/openspec-propose/SKILL.md' }],
      },
      sharedSkillTarget: 'legacy',
    },
  ]);
});

test('resolves every valid shared target and trims marker whitespace', async () => {
  const cases = [
    { marker: ' agents\n', target: 'agents', alternateForms: undefined },
    { marker: '\tcodex  ', target: 'codex', alternateForms: ['skill-dollar'] },
    { marker: '\nzed\n', target: 'zed', alternateForms: undefined },
  ] as const;

  for (const { marker, target, alternateForms } of cases) {
    const root = await makeProjectRoot();
    await write(root, '.agents/skills/openspec-propose/SKILL.md', '# openspec-propose');
    await write(root, '.agents/skills/.openspec-target', marker);

    const integration = (await detectToolIntegrations(root))[0];
    assert.equal(integration?.sharedSkillTarget, target);
    assert.deepEqual(integration?.skills?.alternateForms, alternateForms);
  }
});

test('invalid shared target preserves the legacy ambiguous fallback', async () => {
  const root = await makeProjectRoot();
  await write(root, '.agents/skills/openspec-propose/SKILL.md', '# openspec-propose');
  await write(root, '.agents/skills/.openspec-target', 'unknown');

  const integration = (await detectToolIntegrations(root))[0];
  assert.equal(integration?.sharedSkillTarget, 'legacy');
  assert.deepEqual(integration?.skills?.alternateForms, ['skill-dollar']);
});

test('ignores a shared target marker when no matching skill exists', async () => {
  const root = await makeProjectRoot();
  await write(root, '.agents/skills/.openspec-target', 'zed');

  assert.deepEqual(await detectToolIntegrations(root), []);
});

test('unreadable shared target marker preserves the legacy fallback', async () => {
  const root = await makeProjectRoot();
  await write(root, '.agents/skills/openspec-propose/SKILL.md', '# openspec-propose');
  await write(root, '.agents/skills/.openspec-target', 'zed');
  const marker = join(root, '.agents', 'skills', '.openspec-target');

  let requestedPath: string | null = null;
  const integration = (await detectToolIntegrations(root, {
    readTargetMarker: async (path) => {
      requestedPath = path;
      throw Object.assign(new Error('permission denied'), { code: 'EACCES' });
    },
  }))[0];

  assert.equal(requestedPath, marker);
  assert.equal(integration?.sharedSkillTarget, 'legacy');
  assert.deepEqual(integration?.skills?.alternateForms, ['skill-dollar']);
});

test('agents-only detection yields both candidate forms so the frontend opens a menu', async () => {
  const root = await makeProjectRoot();
  await write(root, '.agents/skills/openspec-propose/SKILL.md', '# openspec-propose');

  const integrations = await detectToolIntegrations(root);
  assert.deepEqual(deriveDistinctForms(integrations), ['skill-slash', 'skill-dollar']);
  // The skill inventory explicitly exposes both documented interpretations.
  assert.deepEqual(integrations[0]?.skills?.alternateForms, ['skill-dollar']);
  // Two distinct forms: the copy-time selector must never treat this as a
  // single-direct candidate.
  assert.ok(deriveDistinctForms(integrations).length > 1);
});

test('preserves both deliveries with full inventories per tool', async () => {
  const root = await makeProjectRoot();
  await write(root, '.claude/commands/opsx/propose.md');
  await write(root, '.claude/commands/opsx/sync.md');
  await write(root, '.claude/skills/openspec-apply-change/SKILL.md', '# openspec-apply-change');

  const integrations = await detectToolIntegrations(root);
  assert.equal(integrations.length, 1);
  const claude = integrations[0]!;

  // Legacy aggregate fields keep the command-first presentation contract.
  assert.equal(claude.tool, 'Claude Code');
  assert.equal(claude.delivery, 'both');
  assert.equal(claude.form, 'opsx-colon');
  assert.equal(claude.example, '/opsx:propose');
  assert.equal(claude.source, '.claude/commands/opsx/propose.md');

  // Authoritative inventories retain every artifact for both deliveries.
  assert.deepEqual(claude.commands, {
    form: 'opsx-colon',
    items: [
      { workflowId: 'propose', source: '.claude/commands/opsx/propose.md' },
      { workflowId: 'sync', source: '.claude/commands/opsx/sync.md' },
    ],
  });
  assert.deepEqual(claude.skills, {
    form: 'skill-slash',
    items: [{ skillName: 'openspec-apply-change', source: '.claude/skills/openspec-apply-change/SKILL.md' }],
  });
});

test('derives distinct forms in canonical order', () => {
  const integrations: DetectedIntegration[] = [
    {
      tool: 'Cursor',
      delivery: 'commands',
      form: 'opsx-dash',
      example: '/opsx-propose',
      source: '.cursor/commands/opsx-propose.md',
      commands: {
        form: 'opsx-dash',
        items: [{ workflowId: 'propose', source: '.cursor/commands/opsx-propose.md' }],
      },
      skills: null,
    },
    {
      tool: 'Claude Code',
      delivery: 'commands',
      form: 'opsx-colon',
      example: '/opsx:propose',
      source: '.claude/commands/opsx/propose.md',
      commands: {
        form: 'opsx-colon',
        items: [{ workflowId: 'propose', source: '.claude/commands/opsx/propose.md' }],
      },
      skills: null,
    },
    {
      tool: 'Kimi Code',
      delivery: 'skills',
      form: 'skill-colon',
      example: '/skill:openspec-propose',
      source: '.kimi-code/skills/openspec-propose/SKILL.md',
      commands: null,
      skills: {
        form: 'skill-colon',
        items: [{ skillName: 'openspec-propose', source: '.kimi-code/skills/openspec-propose/SKILL.md' }],
      },
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
      commands: {
        form: 'opsx-dash',
        items: [{ workflowId: 'propose', source: '.cursor/commands/opsx-propose.md' }],
      },
      skills: null,
    },
    {
      tool: 'Trae',
      delivery: 'commands',
      form: 'opsx-dash',
      example: '/opsx-propose',
      source: '.trae/commands/opsx-propose.md',
      commands: {
        form: 'opsx-dash',
        items: [{ workflowId: 'propose', source: '.trae/commands/opsx-propose.md' }],
      },
      skills: null,
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

test('degrades safely when a configured path is unreadable', async () => {
  const root = await makeProjectRoot();
  // A path that exists but cannot be read yields no evidence instead of error.
  await write(root, '.claude/commands/opsx/propose.md');
  const opsxDir = join(root, '.claude', 'commands', 'opsx');

  let unreadable = false;
  try {
    await import('node:fs/promises').then(({ chmod }) => chmod(opsxDir, 0o000));
    await import('node:fs/promises').then(({ readdir }) => readdir(opsxDir));
  } catch {
    // chmod succeeded and the directory is now unreadable.
    unreadable = true;
  }

  const integrations = await detectToolIntegrations(root);
  if (unreadable) {
    assert.equal(integrations.some((i) => i.tool === 'Claude Code'), false);
  } else {
    // Running as root (or a platform that ignores the mode): nothing to prove.
    assert.ok(true);
  }
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
    'Command Code',
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
