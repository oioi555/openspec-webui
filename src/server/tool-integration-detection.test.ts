import assert from 'node:assert/strict';
import { test } from 'node:test';
import { mkdir, mkdtemp, rm, symlink, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import {
  AGENTS_SHARED_TOOL,
  DETECTED_TOOL_ID_LIST,
  GLOBAL_SKILL_DIRS,
  deriveSharedSkillTarget,
  detectToolIntegrations,
  parseSharedSkillTargetMarker,
  deriveDistinctForms,
  getSupportedToolOptions,
  type DetectedIntegration,
} from './tool-integration-detection.js';

// Never scan the developer's real home folder for global skills: point the
// default seams at an empty temporary home.
process.env.HOME = await mkdtemp(join(tmpdir(), 'openspec-webui-empty-home-'));
delete process.env.CLAUDE_CONFIG_DIR;

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
      scope: 'project',
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
      scope: 'project',
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

test('detects SourceCraft commands and skills with Commands-first evidence', async () => {
  const root = await makeProjectRoot();
  await write(root, '.codeassistant/commands/opsx-propose.md');
  await write(root, '.codeassistant/commands/opsx-verify.md');
  await write(root, '.codeassistant/skills/openspec-apply-change/SKILL.md', '# openspec-apply-change');

  const integrations = await detectToolIntegrations(root);
  assert.deepEqual(integrations, [{
    tool: 'SourceCraft Code Assistant for VS Code',
    scope: 'project',
    delivery: 'both',
    form: 'opsx-dash',
    example: '/opsx-propose',
    source: '.codeassistant/commands/opsx-propose.md',
    commands: {
      form: 'opsx-dash',
      items: [
        { workflowId: 'propose', source: '.codeassistant/commands/opsx-propose.md' },
        { workflowId: 'verify', source: '.codeassistant/commands/opsx-verify.md' },
      ],
    },
    skills: {
      form: 'skill-prompt',
      items: [{
        skillName: 'openspec-apply-change',
        source: '.codeassistant/skills/openspec-apply-change/SKILL.md',
      }],
    },
  }]);
});

test('detects SourceCraft skill-only repositories and ignores empty directories', async () => {
  const root = await makeProjectRoot();
  await mkdir(join(root, '.codeassistant/commands'), { recursive: true });
  await write(root, '.codeassistant/skills/openspec-apply-change/SKILL.md', '# openspec-apply-change');

  const integrations = await detectToolIntegrations(root);
  assert.deepEqual(integrations, [{
    tool: 'SourceCraft Code Assistant for VS Code',
    scope: 'project',
    delivery: 'skills',
    form: 'skill-prompt',
    example: 'use the openspec-apply-change skill',
    source: '.codeassistant/skills/openspec-apply-change/SKILL.md',
    commands: null,
    skills: {
      form: 'skill-prompt',
      items: [{
        skillName: 'openspec-apply-change',
        source: '.codeassistant/skills/openspec-apply-change/SKILL.md',
      }],
    },
  }]);

  const emptyRoot = await makeProjectRoot();
  await mkdir(join(emptyRoot, '.codeassistant/commands'), { recursive: true });
  await mkdir(join(emptyRoot, '.codeassistant/skills/openspec-propose'), { recursive: true });
  assert.deepEqual(await detectToolIntegrations(emptyRoot), []);
});

test('detects current Kilo Code commands and skills with their documented forms', async () => {
  const root = await makeProjectRoot();
  await write(root, '.kilo/command/opsx-propose.md');
  await write(root, '.kilo/command/opsx-verify.md');
  await write(root, '.kilocode/skills/openspec-apply-change/SKILL.md', '# openspec-apply-change');

  const integrations = await detectToolIntegrations(root);
  assert.deepEqual(integrations, [{
    tool: 'Kilo Code',
    scope: 'project',
    delivery: 'both',
    form: 'opsx-dash',
    example: '/opsx-propose',
    source: '.kilo/command/opsx-propose.md',
    commands: {
      form: 'opsx-dash',
      items: [
        { workflowId: 'propose', source: '.kilo/command/opsx-propose.md' },
        { workflowId: 'verify', source: '.kilo/command/opsx-verify.md' },
      ],
    },
    skills: {
      form: 'skill-slash',
      items: [{
        skillName: 'openspec-apply-change',
        source: '.kilocode/skills/openspec-apply-change/SKILL.md',
      }],
    },
  }]);
});

test('preserves legacy Kilo Code workflows', async () => {
  const root = await makeProjectRoot();
  await write(root, '.kilocode/workflows/opsx-propose.md');

  const kilo = (await detectToolIntegrations(root)).find((integration) => integration.tool === 'Kilo Code');
  assert.deepEqual(kilo?.commands, {
    form: 'opsx-dash',
    items: [{ workflowId: 'propose', source: '.kilocode/workflows/opsx-propose.md' }],
  });
});

test('keeps legacy Kilo Code workflows while preferring current duplicate evidence', async () => {
  const root = await makeProjectRoot();
  await write(root, '.kilo/command/opsx-propose.md');
  await write(root, '.kilocode/workflows/opsx-propose.md');
  await write(root, '.kilocode/workflows/opsx-sync.md');

  const kilo = (await detectToolIntegrations(root)).find((integration) => integration.tool === 'Kilo Code');
  assert.deepEqual(kilo?.commands, {
    form: 'opsx-dash',
    items: [
      { workflowId: 'propose', source: '.kilo/command/opsx-propose.md' },
      { workflowId: 'sync', source: '.kilocode/workflows/opsx-sync.md' },
    ],
  });
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
      scope: 'project',
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
      scope: 'project',
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
      scope: 'project',
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
  assert.equal(integrations.some((integration) => integration.tool === 'Amp'), false);
  assert.equal(integrations.some((integration) => integration.tool === 'GSD'), false);
});

test('resolves every valid shared target and trims marker whitespace', async () => {
  const cases = [
    { marker: ' agents\n', target: 'agents', alternateForms: undefined, tool: AGENTS_SHARED_TOOL },
    { marker: ' antigravity\n', target: 'antigravity', alternateForms: undefined, tool: 'Antigravity' },
    { marker: '\tcodex  ', target: 'codex', alternateForms: ['skill-dollar'], tool: AGENTS_SHARED_TOOL },
    { marker: '\nzed\n', target: 'zed', alternateForms: undefined, tool: AGENTS_SHARED_TOOL },
    { marker: ' amp\n', target: 'amp', alternateForms: undefined, tool: 'Amp' },
    { marker: '\ngsd\n', target: 'gsd', alternateForms: undefined, tool: 'GSD' },
  ] as const;

  for (const { marker, target, alternateForms, tool } of cases) {
    const root = await makeProjectRoot();
    await write(root, '.agents/skills/openspec-propose/SKILL.md', '# openspec-propose');
    await write(root, '.agents/skills/.openspec-target', marker);

    const integration = (await detectToolIntegrations(root))[0];
    assert.equal(integration?.sharedSkillTarget, target);
    assert.equal(integration?.tool, tool);
    assert.deepEqual(integration?.skills?.alternateForms, alternateForms);
  }
});

test('merges current Antigravity commands and owned shared skills into one integration', async () => {
  const root = await makeProjectRoot();
  await write(root, '.agents/workflows/opsx-propose.md');
  await write(root, '.agents/skills/openspec-propose/SKILL.md', '# openspec-propose');
  await write(root, '.agents/skills/openspec-apply-change/SKILL.md', '# openspec-apply-change');
  await write(root, '.agents/skills/.openspec-target', 'antigravity\n');

  const integrations = await detectToolIntegrations(root);
  assert.equal(integrations.length, 1);
  assert.deepEqual(integrations[0], {
    tool: 'Antigravity',
    scope: 'project',
    delivery: 'both',
    form: 'opsx-dash',
    example: '/opsx-propose',
    source: '.agents/workflows/opsx-propose.md',
    commands: {
      form: 'opsx-dash',
      items: [{ workflowId: 'propose', source: '.agents/workflows/opsx-propose.md' }],
    },
    skills: {
      form: 'skill-slash',
      items: [
        { skillName: 'openspec-apply-change', source: '.agents/skills/openspec-apply-change/SKILL.md' },
        { skillName: 'openspec-propose', source: '.agents/skills/openspec-propose/SKILL.md' },
      ],
    },
    sharedSkillTarget: 'antigravity',
  });
});

test('detects current Antigravity skills without workflows when its marker owns the shared tree', async () => {
  const root = await makeProjectRoot();
  await write(root, '.agents/skills/openspec-propose/SKILL.md', '# openspec-propose');
  await write(root, '.agents/skills/.openspec-target', 'antigravity');

  assert.deepEqual(await detectToolIntegrations(root), [{
    tool: 'Antigravity',
    scope: 'project',
    delivery: 'skills',
    form: 'skill-slash',
    example: '/openspec-propose',
    source: '.agents/skills/openspec-propose/SKILL.md',
    commands: null,
    skills: {
      form: 'skill-slash',
      items: [{ skillName: 'openspec-propose', source: '.agents/skills/openspec-propose/SKILL.md' }],
    },
    sharedSkillTarget: 'antigravity',
  }]);
});

test('keeps legacy Antigravity workflows while preferring current duplicate evidence', async () => {
  const root = await makeProjectRoot();
  await write(root, '.agents/workflows/opsx-propose.md');
  await write(root, '.agent/workflows/opsx-propose.md');
  await write(root, '.agent/workflows/opsx-sync.md');

  const antigravity = (await detectToolIntegrations(root)).find((integration) => integration.tool === 'Antigravity');
  assert.deepEqual(antigravity?.commands, {
    form: 'opsx-dash',
    items: [
      { workflowId: 'propose', source: '.agents/workflows/opsx-propose.md' },
      { workflowId: 'sync', source: '.agent/workflows/opsx-sync.md' },
    ],
  });
});

test('does not claim markerless shared skills as Antigravity when only current workflows exist', async () => {
  const root = await makeProjectRoot();
  await write(root, '.agents/workflows/opsx-propose.md');
  await write(root, '.agents/skills/openspec-propose/SKILL.md', '# openspec-propose');

  const integrations = await detectToolIntegrations(root);
  assert.equal(integrations.some((integration) => integration.tool === 'Antigravity' && integration.skills), false);
  assert.equal(integrations.some((integration) => integration.tool === AGENTS_SHARED_TOOL), true);
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
      scope: 'project',
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
      scope: 'project',
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
      scope: 'project',
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
      scope: 'project',
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
      scope: 'project',
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
  assert.equal(byTool.get('SourceCraft Code Assistant for VS Code'), 'opsx-dash');
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
    'IBM Bob',
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
    'SourceCraft Code Assistant for VS Code',
    'AtomCode',
    'Code Studio',
    'DeepSeek Harness',
    'EasyCode',
    'GigaCode',
    'Grok Build',
    'Veai',
    'Warp',
    'Shared .agents',
    'Codex',
  ]) {
    assert.ok(tools.has(expected), `catalog missing ${expected}`);
  }
  assert.equal(tools.has('Amp'), false);
  assert.equal(tools.has('GSD'), false);
  assert.equal(tools.has('Bob Shell'), false);
});

test('detects AtomCode filename command evidence', async () => {
  const root = await makeProjectRoot();
  await write(root, '.atomcode/commands/opsx-propose.md');

  const atom = (await detectToolIntegrations(root)).find((integration) => integration.tool === 'AtomCode');
  assert.deepEqual(atom, {
    tool: 'AtomCode',
    scope: 'project',
    delivery: 'commands',
    form: 'opsx-dash',
    example: '/opsx-propose',
    source: '.atomcode/commands/opsx-propose.md',
    commands: {
      form: 'opsx-dash',
      items: [{ workflowId: 'propose', source: '.atomcode/commands/opsx-propose.md' }],
    },
    skills: null,
  });
});

test('preserves both AtomCode command and skill deliveries', async () => {
  const root = await makeProjectRoot();
  await write(root, '.atomcode/commands/opsx-propose.md');
  await write(root, '.atomcode/skills/openspec-propose/SKILL.md', '# openspec-propose');

  const atom = (await detectToolIntegrations(root)).find((integration) => integration.tool === 'AtomCode');
  assert.equal(atom?.delivery, 'both');
  assert.deepEqual(atom?.commands, {
    form: 'opsx-dash',
    items: [{ workflowId: 'propose', source: '.atomcode/commands/opsx-propose.md' }],
  });
  assert.deepEqual(atom?.skills, {
    form: 'skill-slash',
    items: [{ skillName: 'openspec-propose', source: '.atomcode/skills/openspec-propose/SKILL.md' }],
  });
});

test('detects Code Studio prompt.md command evidence', async () => {
  const root = await makeProjectRoot();
  await write(root, '.codestudio/prompts/opsx-propose.prompt.md');

  const studio = (await detectToolIntegrations(root)).find((integration) => integration.tool === 'Code Studio');
  assert.deepEqual(studio?.commands, {
    form: 'opsx-dash',
    items: [{ workflowId: 'propose', source: '.codestudio/prompts/opsx-propose.prompt.md' }],
  });
  assert.equal(studio?.example, '/opsx-propose');
});

test('strips .prompt.md as a single command-file suffix for Copilot and Kiro', async () => {
  const root = await makeProjectRoot();
  await write(root, '.github/prompts/opsx-propose.prompt.md');
  await write(root, '.kiro/prompts/opsx-propose.prompt.md');
  await write(root, '.cursor/commands/opsx-propose.md');

  const byTool = new Map((await detectToolIntegrations(root)).map((integration) => [integration.tool, integration]));
  assert.deepEqual(byTool.get('GitHub Copilot')?.commands, {
    form: 'opsx-dash',
    items: [{ workflowId: 'propose', source: '.github/prompts/opsx-propose.prompt.md' }],
  });
  assert.deepEqual(byTool.get('Kiro')?.commands, {
    form: 'opsx-dash',
    items: [{ workflowId: 'propose', source: '.kiro/prompts/opsx-propose.prompt.md' }],
  });
  assert.deepEqual(byTool.get('Cursor')?.commands, {
    form: 'opsx-dash',
    items: [{ workflowId: 'propose', source: '.cursor/commands/opsx-propose.md' }],
  });
});

test('detects EasyCode folder-namespaced TOML commands', async () => {
  const root = await makeProjectRoot();
  await write(root, '.easycode/commands/opsx/propose.toml');

  const easycode = (await detectToolIntegrations(root)).find((integration) => integration.tool === 'EasyCode');
  assert.deepEqual(easycode, {
    tool: 'EasyCode',
    scope: 'project',
    delivery: 'commands',
    form: 'opsx-colon',
    example: '/opsx:propose',
    source: '.easycode/commands/opsx/propose.toml',
    commands: {
      form: 'opsx-colon',
      items: [{ workflowId: 'propose', source: '.easycode/commands/opsx/propose.toml' }],
    },
    skills: null,
  });
});

test('detects GigaCode filename command evidence', async () => {
  const root = await makeProjectRoot();
  await write(root, '.gigacode/commands/opsx-propose.md');

  const giga = (await detectToolIntegrations(root)).find((integration) => integration.tool === 'GigaCode');
  assert.deepEqual(giga?.commands, {
    form: 'opsx-dash',
    items: [{ workflowId: 'propose', source: '.gigacode/commands/opsx-propose.md' }],
  });
  assert.equal(giga?.example, '/opsx-propose');
});

test('detects unique-path v1.14.0 skill-only tools', async () => {
  const cases = [
    { path: '.dsh/skills/openspec-apply-change/SKILL.md', tool: 'DeepSeek Harness' },
    { path: '.grok/skills/openspec-apply-change/SKILL.md', tool: 'Grok Build' },
    { path: '.veai/skills/openspec-apply-change/SKILL.md', tool: 'Veai' },
    { path: '.warp/skills/openspec-apply-change/SKILL.md', tool: 'Warp' },
  ] as const;

  for (const { path, tool } of cases) {
    const root = await makeProjectRoot();
    await write(root, path, '# openspec-apply-change');
    const integration = (await detectToolIntegrations(root)).find((candidate) => candidate.tool === tool);
    assert.deepEqual(integration, {
      tool,
      scope: 'project',
      delivery: 'skills',
      form: 'skill-slash',
      example: '/openspec-propose',
      source: path,
      commands: null,
      skills: {
        form: 'skill-slash',
        items: [{ skillName: 'openspec-apply-change', source: path }],
      },
    });
  }
});

test('does not detect empty unique-path v1.14.0 directories', async () => {
  const root = await makeProjectRoot();
  await mkdir(join(root, '.atomcode/commands'), { recursive: true });
  await mkdir(join(root, '.warp/skills'), { recursive: true });
  await mkdir(join(root, '.dsh/skills'), { recursive: true });

  assert.deepEqual(await detectToolIntegrations(root), []);
});

test('does not treat a bare WARP.md as Warp integration evidence', async () => {
  const root = await makeProjectRoot();
  await write(root, 'WARP.md', '# Warp');

  assert.deepEqual(await detectToolIntegrations(root), []);
});

test('reports IBM Bob using the official catalog name', async () => {
  const root = await makeProjectRoot();
  await write(root, '.bob/commands/opsx-propose.md');

  const bob = (await detectToolIntegrations(root)).find((integration) => integration.tool === 'IBM Bob');
  assert.equal(bob?.tool, 'IBM Bob');
  assert.deepEqual(bob?.commands, {
    form: 'opsx-dash',
    items: [{ workflowId: 'propose', source: '.bob/commands/opsx-propose.md' }],
  });
});

test('renames shared skills to Amp when its marker owns the tree', async () => {
  const root = await makeProjectRoot();
  await write(root, '.agents/skills/openspec-propose/SKILL.md', '# openspec-propose');
  await write(root, '.agents/skills/.openspec-target', 'amp');

  assert.deepEqual(await detectToolIntegrations(root), [{
    tool: 'Amp',
    scope: 'project',
    delivery: 'skills',
    form: 'skill-slash',
    example: '/openspec-propose',
    source: '.agents/skills/openspec-propose/SKILL.md',
    commands: null,
    skills: {
      form: 'skill-slash',
      items: [{ skillName: 'openspec-propose', source: '.agents/skills/openspec-propose/SKILL.md' }],
    },
    sharedSkillTarget: 'amp',
  }]);
});

test('renames shared skills to GSD when its marker owns the tree', async () => {
  const root = await makeProjectRoot();
  await write(root, '.agents/skills/openspec-propose/SKILL.md', '# openspec-propose');
  await write(root, '.agents/skills/.openspec-target', 'gsd');

  assert.deepEqual(await detectToolIntegrations(root), [{
    tool: 'GSD',
    scope: 'project',
    delivery: 'skills',
    form: 'skill-slash',
    example: '/openspec-propose',
    source: '.agents/skills/openspec-propose/SKILL.md',
    commands: null,
    skills: {
      form: 'skill-slash',
      items: [{ skillName: 'openspec-propose', source: '.agents/skills/openspec-propose/SKILL.md' }],
    },
    sharedSkillTarget: 'gsd',
  }]);
});

// Cleanup temp dirs after all tests.
process.on('exit', () => {
  for (const dir of tempDirs.splice(0)) {
    void rm(dir, { recursive: true, force: true });
  }
});


// --- OpenSpec 2.x project scope ---

async function makeHome(): Promise<string> {
  const dir = await mkdtemp(join(tmpdir(), 'openspec-webui-detection-home-'));
  tempDirs.push(dir);
  return dir;
}

async function linkSkill(root: string, fromDir: string, skill: string): Promise<void> {
  await mkdir(join(root, fromDir), { recursive: true });
  await symlink(join('..', '..', '.agents', 'skills', skill), join(root, fromDir, skill), 'dir');
}

test('detects symlinked .claude/skills folders with link-relative sources', async () => {
  const root = await makeProjectRoot();
  await write(root, '.agents/skills/openspec-propose/SKILL.md', '# propose');
  await linkSkill(root, '.claude/skills', 'openspec-propose');

  const claude = (await detectToolIntegrations(root)).find((i) => i.tool === 'Claude Code');
  assert.deepEqual(claude?.skills, {
    form: 'skill-slash',
    items: [{ skillName: 'openspec-propose', source: '.claude/skills/openspec-propose/SKILL.md' }],
  });
  assert.equal(claude?.scope, 'project');
});

test('ignores dangling skill links', async () => {
  const root = await makeProjectRoot();
  await linkSkill(root, '.claude/skills', 'openspec-propose');

  const integrations = await detectToolIntegrations(root);
  assert.equal(integrations.some((i) => i.tool === 'Claude Code'), false);
});

test('detects the OpenSpec 2.1.1 project-scope layout (claude,cursor,codex,kimi)', async () => {
  const root = await makeProjectRoot();
  const skills = ['openspec-apply-change', 'openspec-propose'];
  for (const skill of skills) {
    await write(root, `.agents/skills/${skill}/SKILL.md`, `# ${skill}`);
    await linkSkill(root, '.claude/skills', skill);
  }
  await write(root, '.agents/skills/.openspec-target', 'claude own-files\ncodex\ncursor\nkimi\n');

  const integrations = await detectToolIntegrations(root);
  assert.deepEqual(integrations.map((i) => i.tool), ['Claude Code', AGENTS_SHARED_TOOL]);
  assert.ok(integrations.every((i) => i.scope === 'project'));
  const claude = integrations[0]!;
  assert.deepEqual(claude.skills?.items.map((item) => item.source), [
    '.claude/skills/openspec-apply-change/SKILL.md',
    '.claude/skills/openspec-propose/SKILL.md',
  ]);
  const shared = integrations[1]!;
  assert.equal(shared.sharedSkillTarget, 'multi');
  assert.deepEqual(shared.sharedSkillTargets, ['codex', 'cursor', 'kimi']);
  assert.deepEqual(shared.skills?.items.map((item) => item.skillName), skills);
});

test('parses multi-line target markers', () => {
  assert.deepEqual(parseSharedSkillTargetMarker('claude own-files\ncodex\ncursor\nkimi\n'), {
    targets: ['codex', 'cursor', 'kimi'],
    ownFiles: ['claude'],
  });
  assert.deepEqual(parseSharedSkillTargetMarker('\n  codex  \r\n\nnot-a-tool\nzed extra\ncodex\n'), {
    targets: ['codex', 'zed'],
    ownFiles: [],
  });
  assert.deepEqual(parseSharedSkillTargetMarker('claude own-files\n'), { targets: [], ownFiles: ['claude'] });
  assert.deepEqual(parseSharedSkillTargetMarker(''), { targets: [], ownFiles: [] });

  assert.equal(deriveSharedSkillTarget([]), 'legacy');
  assert.equal(deriveSharedSkillTarget(['codex']), 'codex');
  assert.equal(deriveSharedSkillTarget(['cursor']), 'legacy');
  assert.equal(deriveSharedSkillTarget(['codex', 'kimi']), 'multi');
});

test('exposes sharedSkillTargets for a single non-legacy marker target', async () => {
  const root = await makeProjectRoot();
  await write(root, '.agents/skills/openspec-propose/SKILL.md');
  await write(root, '.agents/skills/.openspec-target', 'claude own-files\ncursor\n');
  const shared = (await detectToolIntegrations(root)).find((i) => i.tool === AGENTS_SHARED_TOOL);
  assert.equal(shared?.sharedSkillTarget, 'legacy');
  assert.deepEqual(shared?.sharedSkillTargets, ['cursor']);
});

test('own-files-only marker falls back to legacy without targets', async () => {
  const root = await makeProjectRoot();
  await write(root, '.agents/skills/openspec-propose/SKILL.md');
  await write(root, '.agents/skills/.openspec-target', 'claude own-files\n');
  const shared = (await detectToolIntegrations(root)).find((i) => i.tool === AGENTS_SHARED_TOOL);
  assert.equal(shared?.sharedSkillTarget, 'legacy');
  assert.equal(shared?.sharedSkillTargets, undefined);
  assert.deepEqual(shared?.skills?.alternateForms, ['skill-dollar']);
});

// --- Global skills ---

test('GLOBAL_SKILL_DIRS keys are all detected tool ids', () => {
  const keys = Object.keys(GLOBAL_SKILL_DIRS);
  assert.ok(keys.length > 0);
  for (const key of keys) {
    assert.ok(DETECTED_TOOL_ID_LIST.includes(key), `${key} is not a detected tool id`);
  }
});

test('detects global universal ~/.agents/skills as ambiguous shared evidence', async () => {
  const root = await makeProjectRoot();
  const home = await makeHome();
  await write(home, '.agents/skills/openspec-propose/SKILL.md');
  await write(home, '.agents/skills/.openspec-target', 'kimi\n');

  const integrations = await detectToolIntegrations(root, { homeDir: home, claudeConfigDir: undefined });
  assert.deepEqual(integrations, [
    {
      tool: AGENTS_SHARED_TOOL,
      delivery: 'skills',
      form: 'skill-slash',
      example: '/openspec-propose or $openspec-propose',
      source: '~/.agents/skills/openspec-propose/SKILL.md',
      commands: null,
      skills: {
        form: 'skill-slash',
        alternateForms: ['skill-dollar'],
        items: [{ skillName: 'openspec-propose', source: '~/.agents/skills/openspec-propose/SKILL.md' }],
      },
      sharedSkillTarget: 'legacy',
      scope: 'global',
    },
  ]);
});

test('detects global Claude skills via ~/.claude fallback and CLAUDE_CONFIG_DIR', async () => {
  const root = await makeProjectRoot();
  const home = await makeHome();
  await write(home, '.claude/skills/openspec-propose/SKILL.md');

  const fallback = await detectToolIntegrations(root, { homeDir: home, claudeConfigDir: undefined });
  assert.deepEqual(fallback, [
    {
      tool: 'Claude Code',
      delivery: 'skills',
      form: 'skill-slash',
      example: '/openspec-propose',
      source: '~/.claude/skills/openspec-propose/SKILL.md',
      commands: null,
      skills: {
        form: 'skill-slash',
        items: [{ skillName: 'openspec-propose', source: '~/.claude/skills/openspec-propose/SKILL.md' }],
      },
      scope: 'global',
    },
  ]);

  await write(home, 'custom-claude/skills/openspec-apply-change/SKILL.md');
  const configured = await detectToolIntegrations(root, {
    homeDir: home,
    claudeConfigDir: join(home, 'custom-claude'),
  });
  assert.deepEqual(configured.map((i) => [i.tool, i.scope, i.source]), [
    ['Claude Code', 'global', '~/custom-claude/skills/openspec-apply-change/SKILL.md'],
  ]);

  const outside = await makeHome();
  await write(outside, 'skills/openspec-propose/SKILL.md');
  const external = await detectToolIntegrations(root, { homeDir: home, claudeConfigDir: outside });
  assert.equal(external[0]?.source, join(outside, 'skills/openspec-propose/SKILL.md'));
});

test('detects other tool-specific global folders', async () => {
  const root = await makeProjectRoot();
  const home = await makeHome();
  await write(home, '.config/crush/skills/openspec-propose/SKILL.md');
  const integrations = await detectToolIntegrations(root, { homeDir: home, claudeConfigDir: undefined });
  assert.deepEqual(integrations.map((i) => [i.tool, i.scope, i.source]), [
    ['Crush', 'global', '~/.config/crush/skills/openspec-propose/SKILL.md'],
  ]);
});

test('skips the global pass when the project root is the home folder', async () => {
  const home = await makeHome();
  await write(home, '.claude/skills/openspec-propose/SKILL.md');
  const integrations = await detectToolIntegrations(home, { homeDir: home, claudeConfigDir: undefined });
  assert.deepEqual(integrations.map((i) => [i.tool, i.scope, i.source]), [
    ['Claude Code', 'project', '.claude/skills/openspec-propose/SKILL.md'],
  ]);
});

test('missing home folder degrades to no global evidence', async () => {
  const root = await makeProjectRoot();
  const integrations = await detectToolIntegrations(root, {
    homeDir: join(root, 'does-not-exist'),
    claudeConfigDir: undefined,
  });
  assert.deepEqual(integrations, []);
});

test('project and global rows coexist with project rows first', async () => {
  const root = await makeProjectRoot();
  const home = await makeHome();
  await write(root, '.github/skills/openspec-propose/SKILL.md');
  await write(home, '.claude/skills/openspec-propose/SKILL.md');
  await write(home, '.agents/skills/openspec-propose/SKILL.md');

  const integrations = await detectToolIntegrations(root, { homeDir: home, claudeConfigDir: undefined });
  assert.deepEqual(integrations.map((i) => [i.tool, i.scope]), [
    ['GitHub Copilot', 'project'],
    [AGENTS_SHARED_TOOL, 'global'],
    ['Claude Code', 'global'],
  ]);
  assert.deepEqual(deriveDistinctForms(integrations), ['skill-slash', 'skill-dollar']);
});
