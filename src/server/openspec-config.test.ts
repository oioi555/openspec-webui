import assert from 'node:assert/strict';
import { test } from 'node:test';
import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import {
  inspectCommandAvailability,
  createMemoizedVersionReader,
  parseCliMajorVersion,
  parseDelivery,
  type OpenSpecConfigReader,
} from './openspec-config.js';

// Never scan the developer's real home folder for global skills: point the
// default seams at an empty temporary home.
process.env.HOME = await mkdtemp(join(tmpdir(), 'openspec-webui-empty-home-'));
delete process.env.CLAUDE_CONFIG_DIR;

const tempDirs: string[] = [];

async function makeCwd(): Promise<string> {
  const dir = await mkdtemp(join(tmpdir(), 'openspec-webui-config-test-'));
  tempDirs.push(dir);
  return dir;
}

/**
 * Deterministic reader seam: returns canned per-key outputs (already trimmed,
 * mirroring the production CLI runner) or throws when a key is configured to
 * fail.
 */
function createReader(options: {
  profile?: string | null;
  delivery?: string | null;
  workflows?: string | null;
  failProfile?: boolean;
  failDelivery?: boolean;
  failWorkflows?: boolean;
}): OpenSpecConfigReader {
  const { profile = 'core', delivery = 'both', workflows = '["propose","verify"]' } = options;
  return async (_cwd: string, key: string) => {
    if (key === 'profile') {
      if (options.failProfile) {
        throw new Error('profile command failed');
      }
      if (profile === null) {
        throw new Error('no profile configured');
      }
      return profile;
    }
    if (key === 'delivery') {
      if (options.failDelivery) {
        throw new Error('delivery command failed');
      }
      if (delivery === null) {
        throw new Error('no delivery configured');
      }
      return delivery;
    }
    if (key === 'workflows') {
      if (options.failWorkflows) {
        throw new Error('workflows command failed');
      }
      if (workflows === null) {
        throw new Error('no workflows configured');
      }
      return workflows;
    }
    throw new Error(`unsupported key: ${key}`);
  };
}

// --- parseDelivery pure unit tests ---

test('parseDelivery accepts the three valid delivery values', () => {
  assert.equal(parseDelivery('commands'), 'commands');
  assert.equal(parseDelivery('skills'), 'skills');
  assert.equal(parseDelivery('both'), 'both');
});

test('parseDelivery rejects empty, whitespace-only, and unknown values', () => {
  assert.equal(parseDelivery(''), null);
  assert.equal(parseDelivery('   '), null);
  assert.equal(parseDelivery('  both  '), null);
  assert.equal(parseDelivery('unknown'), null);
  assert.equal(parseDelivery('BOTH'), null);
  assert.equal(parseDelivery('Commands'), null);
});

test('parseDelivery rejects malformed JSON-like and non-string values', () => {
  assert.equal(parseDelivery('{"delivery":"both"}'), null);
  assert.equal(parseDelivery('both,commands'), null);
  assert.equal(parseDelivery('["both"]'), null);
  assert.equal(parseDelivery(null), null);
});

// --- inspectCommandAvailability graceful degradation ---

test('inspectCommandAvailability returns ready with parsed delivery when all config is healthy', async () => {
  const cwd = await makeCwd();
  const availability = await inspectCommandAvailability(cwd, createReader({}));

  assert.equal(availability.status, 'ready');
  assert.equal(availability.delivery, 'both');
  assert.equal(availability.profile, 'core');
  assert.deepEqual(availability.workflows, ['propose', 'verify']);
  assert.equal(availability.error, null);
  // `verify` is an expanded workflow, so it appears in the transition field.
  assert.deepEqual(availability.availableExpandedCommands, ['verify']);
  assert.deepEqual(availability.integrations, []);
  assert.deepEqual(availability.forms, []);
  assert.ok(Array.isArray(availability.toolOptions) && availability.toolOptions.length > 0);
});

test('inspectCommandAvailability exposes SourceCraft inventories and preferred command option', async () => {
  const cwd = await makeCwd();
  await mkdir(join(cwd, '.codeassistant/commands'), { recursive: true });
  await mkdir(join(cwd, '.codeassistant/skills/openspec-apply-change'), { recursive: true });
  await writeFile(join(cwd, '.codeassistant/commands/opsx-propose.md'), '', 'utf8');
  await writeFile(join(cwd, '.codeassistant/skills/openspec-apply-change/SKILL.md'), '', 'utf8');

  const availability = await inspectCommandAvailability(cwd, createReader({}));
  const sourceCraft = availability.integrations.find(
    (integration) => integration.tool === 'SourceCraft Code Assistant',
  );

  assert.equal(sourceCraft?.delivery, 'both');
  assert.equal(sourceCraft?.commands?.items[0]?.workflowId, 'propose');
  assert.equal(sourceCraft?.skills?.form, 'skill-prompt');
  assert.ok(availability.toolOptions.some(
    (option) => option.tool === 'SourceCraft Code Assistant' && option.form === 'opsx-dash',
  ));
});

test('inspectCommandAvailability keeps status ready when only delivery is unknown', async () => {
  // `workflows` is the single source of truth; a broken `delivery` config is an
  // additive hint that degrades to null without failing availability.
  const cwd = await makeCwd();
  const availability = await inspectCommandAvailability(
    cwd,
    createReader({ delivery: 'bogus' })
  );

  assert.equal(availability.status, 'ready');
  assert.equal(availability.delivery, null);
  assert.equal(availability.profile, 'core');
  assert.deepEqual(availability.workflows, ['propose', 'verify']);
  assert.equal(availability.error, null);
});

test('inspectCommandAvailability keeps status ready when the delivery command fails', async () => {
  const cwd = await makeCwd();
  const availability = await inspectCommandAvailability(
    cwd,
    createReader({ failDelivery: true })
  );

  assert.equal(availability.status, 'ready');
  assert.equal(availability.delivery, null);
  assert.deepEqual(availability.workflows, ['propose', 'verify']);
});

test('inspectCommandAvailability degrades to unavailable when workflows are malformed', async () => {
  const cwd = await makeCwd();
  const availability = await inspectCommandAvailability(
    cwd,
    createReader({ workflows: 'this is not json' })
  );

  assert.equal(availability.status, 'unavailable');
  assert.equal(availability.delivery, 'both');
  assert.equal(availability.profile, 'core');
  assert.deepEqual(availability.workflows, []);
  assert.ok(availability.error !== null);
  // Detection/static catalog results are still returned alongside the error.
  assert.deepEqual(availability.integrations, []);
  assert.deepEqual(availability.forms, []);
  assert.ok(Array.isArray(availability.toolOptions) && availability.toolOptions.length > 0);
});

test('inspectCommandAvailability degrades to unavailable on malformed workflows shape', async () => {
  const cwd = await makeCwd();
  const availability = await inspectCommandAvailability(
    cwd,
    createReader({ workflows: '{"workflows":["propose"]}' })
  );

  assert.equal(availability.status, 'unavailable');
  assert.deepEqual(availability.workflows, []);
  assert.ok(availability.error !== null);
});

test('inspectCommandAvailability degrades to unavailable when the workflows command fails', async () => {
  const cwd = await makeCwd();
  const availability = await inspectCommandAvailability(
    cwd,
    createReader({ failWorkflows: true })
  );

  assert.equal(availability.status, 'unavailable');
  assert.equal(availability.delivery, 'both');
  assert.equal(availability.profile, 'core');
  assert.deepEqual(availability.workflows, []);
  assert.ok(availability.error !== null);
});

test('inspectCommandAvailability degrades gracefully when the profile command fails', async () => {
  // profile is defensive metadata: a failure nulls it without failing the run.
  const cwd = await makeCwd();
  const availability = await inspectCommandAvailability(
    cwd,
    createReader({ failProfile: true })
  );

  assert.equal(availability.status, 'ready');
  assert.equal(availability.profile, null);
  assert.equal(availability.delivery, 'both');
  assert.deepEqual(availability.workflows, ['propose', 'verify']);
});

test('inspectCommandAvailability filters onboard from reported workflows', async () => {
  const cwd = await makeCwd();
  const availability = await inspectCommandAvailability(
    cwd,
    createReader({ workflows: '["propose","onboard","verify","new"]' })
  );

  assert.equal(availability.status, 'ready');
  assert.deepEqual(availability.workflows, ['propose', 'verify', 'new']);
  assert.ok(!availability.workflows.includes('onboard'));
  // Deprecated transition field derives only from non-blocked workflows.
  assert.deepEqual(availability.availableExpandedCommands, ['verify', 'new']);
});

test('inspectCommandAvailability exposes workflow-specific inventories alongside legacy fields', async () => {
  const cwd = await makeCwd();
  // Folder command + skill artifacts for the same tool plus a partial filename
  // command set on another tool.
  await mkdir(join(cwd, '.claude', 'commands', 'opsx'), { recursive: true });
  await writeFile(join(cwd, '.claude', 'commands', 'opsx', 'propose.md'), 'propose', 'utf8');
  await writeFile(join(cwd, '.claude', 'commands', 'opsx', 'sync.md'), 'sync', 'utf8');
  await mkdir(join(cwd, '.claude', 'skills', 'openspec-apply-change'), { recursive: true });
  await writeFile(
    join(cwd, '.claude', 'skills', 'openspec-apply-change', 'SKILL.md'),
    '# openspec-apply-change',
    'utf8'
  );
  await mkdir(join(cwd, '.opencode', 'commands'), { recursive: true });
  await writeFile(join(cwd, '.opencode', 'commands', 'opsx-apply.md'), 'apply', 'utf8');

  const availability = await inspectCommandAvailability(cwd, createReader({}));

  assert.equal(availability.status, 'ready');
  const claude = availability.integrations.find((i) => i.tool === 'Claude Code');
  const opencode = availability.integrations.find((i) => i.tool === 'OpenCode');

  // Legacy aggregate presentation fields remain for compatibility.
  assert.equal(claude?.delivery, 'both');
  assert.equal(claude?.form, 'opsx-colon');
  assert.equal(claude?.source, '.claude/commands/opsx/propose.md');

  // Authoritative inventories preserve every artifact and both deliveries.
  assert.deepEqual(claude?.commands, {
    form: 'opsx-colon',
    items: [
      { workflowId: 'propose', source: '.claude/commands/opsx/propose.md' },
      { workflowId: 'sync', source: '.claude/commands/opsx/sync.md' },
    ],
  });
  assert.deepEqual(claude?.skills, {
    form: 'skill-slash',
    items: [{ skillName: 'openspec-apply-change', source: '.claude/skills/openspec-apply-change/SKILL.md' }],
  });

  // Partial workflow sets appear exactly as scanned.
  assert.deepEqual(opencode?.commands, {
    form: 'opsx-dash',
    items: [{ workflowId: 'apply', source: '.opencode/commands/opsx-apply.md' }],
  });
  assert.equal(opencode?.skills, null);
});

test('inspectCommandAvailability exposes Zed shared-target metadata with skill evidence', async () => {
  const cwd = await makeCwd();
  await mkdir(join(cwd, '.agents', 'skills', 'openspec-propose'), { recursive: true });
  await writeFile(
    join(cwd, '.agents', 'skills', 'openspec-propose', 'SKILL.md'),
    '# openspec-propose',
    'utf8'
  );
  await writeFile(join(cwd, '.agents', 'skills', '.openspec-target'), 'zed\n', 'utf8');

  const availability = await inspectCommandAvailability(cwd, createReader({}));
  const shared = availability.integrations.find((integration) => integration.tool === 'Shared .agents / Codex');

  assert.equal(shared?.sharedSkillTarget, 'zed');
  assert.deepEqual(shared?.skills?.alternateForms, undefined);
  assert.deepEqual(availability.forms, ['skill-slash']);
});

test('inspectCommandAvailability exposes Antigravity shared-target metadata and inventories', async () => {
  const cwd = await makeCwd();
  await mkdir(join(cwd, '.agents', 'skills', 'openspec-propose'), { recursive: true });
  await mkdir(join(cwd, '.agents', 'workflows'), { recursive: true });
  await writeFile(
    join(cwd, '.agents', 'skills', 'openspec-propose', 'SKILL.md'),
    '# openspec-propose',
    'utf8'
  );
  await writeFile(join(cwd, '.agents', 'skills', '.openspec-target'), 'antigravity\n', 'utf8');
  await writeFile(join(cwd, '.agents', 'workflows', 'opsx-propose.md'), '# propose', 'utf8');

  const availability = await inspectCommandAvailability(cwd, createReader({}));
  const antigravity = availability.integrations.find((integration) => integration.tool === 'Antigravity');

  assert.equal(antigravity?.sharedSkillTarget, 'antigravity');
  assert.equal(antigravity?.delivery, 'both');
  assert.deepEqual(antigravity?.commands?.items, [
    { workflowId: 'propose', source: '.agents/workflows/opsx-propose.md' },
  ]);
  assert.deepEqual(antigravity?.skills?.items, [
    { skillName: 'openspec-propose', source: '.agents/skills/openspec-propose/SKILL.md' },
  ]);
});

test('inspectCommandAvailability exposes Amp shared-target metadata with slash-only skills', async () => {
  const cwd = await makeCwd();
  await mkdir(join(cwd, '.agents', 'skills', 'openspec-propose'), { recursive: true });
  await writeFile(
    join(cwd, '.agents', 'skills', 'openspec-propose', 'SKILL.md'),
    '# openspec-propose',
    'utf8'
  );
  await writeFile(join(cwd, '.agents', 'skills', '.openspec-target'), 'amp\n', 'utf8');

  const availability = await inspectCommandAvailability(cwd, createReader({}));
  const amp = availability.integrations.find((integration) => integration.tool === 'Amp');

  assert.equal(amp?.sharedSkillTarget, 'amp');
  assert.deepEqual(amp?.skills?.alternateForms, undefined);
  assert.equal(availability.integrations.some((integration) => integration.tool === 'Shared .agents / Codex'), false);
  assert.deepEqual(availability.forms, ['skill-slash']);
});

test('inspectCommandAvailability exposes GSD shared-target metadata with slash-only skills', async () => {
  const cwd = await makeCwd();
  await mkdir(join(cwd, '.agents', 'skills', 'openspec-propose'), { recursive: true });
  await writeFile(
    join(cwd, '.agents', 'skills', 'openspec-propose', 'SKILL.md'),
    '# openspec-propose',
    'utf8'
  );
  await writeFile(join(cwd, '.agents', 'skills', '.openspec-target'), 'gsd\n', 'utf8');

  const availability = await inspectCommandAvailability(cwd, createReader({}));
  const gsd = availability.integrations.find((integration) => integration.tool === 'GSD');

  assert.equal(gsd?.sharedSkillTarget, 'gsd');
  assert.deepEqual(gsd?.skills?.alternateForms, undefined);
  assert.equal(availability.integrations.some((integration) => integration.tool === 'Shared .agents / Codex'), false);
  assert.deepEqual(availability.forms, ['skill-slash']);
});

test('inspectCommandAvailability includes unique-path Warp and EasyCode inventories', async () => {
  const cwd = await makeCwd();
  await mkdir(join(cwd, '.warp', 'skills', 'openspec-apply-change'), { recursive: true });
  await mkdir(join(cwd, '.easycode', 'commands', 'opsx'), { recursive: true });
  await writeFile(
    join(cwd, '.warp', 'skills', 'openspec-apply-change', 'SKILL.md'),
    '# openspec-apply-change',
    'utf8'
  );
  await writeFile(join(cwd, '.easycode', 'commands', 'opsx', 'propose.toml'), '# propose', 'utf8');

  const availability = await inspectCommandAvailability(cwd, createReader({}));
  const warp = availability.integrations.find((integration) => integration.tool === 'Warp');
  const easycode = availability.integrations.find((integration) => integration.tool === 'EasyCode');

  assert.deepEqual(warp?.skills?.items, [
    { skillName: 'openspec-apply-change', source: '.warp/skills/openspec-apply-change/SKILL.md' },
  ]);
  assert.deepEqual(easycode?.commands?.items, [
    { workflowId: 'propose', source: '.easycode/commands/opsx/propose.toml' },
  ]);
  assert.equal(easycode?.form, 'opsx-colon');
  assert.ok(availability.toolOptions.some((option) => option.tool === 'Warp'));
  assert.ok(availability.toolOptions.some((option) => option.tool === 'EasyCode'));
});

test('inspectCommandAvailability reports legacy ambiguity for markerless shared skills', async () => {
  const cwd = await makeCwd();
  await mkdir(join(cwd, '.agents', 'skills', 'openspec-propose'), { recursive: true });
  await writeFile(
    join(cwd, '.agents', 'skills', 'openspec-propose', 'SKILL.md'),
    '# openspec-propose',
    'utf8'
  );

  const availability = await inspectCommandAvailability(cwd, createReader({}));
  const shared = availability.integrations.find((integration) => integration.tool === 'Shared .agents / Codex');

  assert.equal(shared?.sharedSkillTarget, 'legacy');
  assert.deepEqual(shared?.skills?.alternateForms, ['skill-dollar']);
  assert.deepEqual(availability.forms, ['skill-slash', 'skill-dollar']);
});

test('inspectCommandAvailability keeps legacy fields present with zero detection', async () => {
  const cwd = await makeCwd();
  const availability = await inspectCommandAvailability(cwd, createReader({}));

  assert.deepEqual(availability.integrations, []);
  assert.deepEqual(availability.forms, []);
  assert.ok(Array.isArray(availability.toolOptions) && availability.toolOptions.length > 0);
});

// --- OpenSpec 2.x: retired delivery and recorded skillsScope ---

function trackingReader(keys: string[]): OpenSpecConfigReader {
  const inner = createReader({});
  return async (cwd, key) => {
    keys.push(key);
    return inner(cwd, key);
  };
}

test('parseCliMajorVersion reads the major version and rejects garbage', () => {
  assert.equal(parseCliMajorVersion('2.1.1'), 2);
  assert.equal(parseCliMajorVersion('v1.14.0'), 1);
  assert.equal(parseCliMajorVersion(''), null);
  assert.equal(parseCliMajorVersion(null), null);
  assert.equal(parseCliMajorVersion('unknown'), null);
});

test('inspectCommandAvailability skips the delivery read for a 2.x CLI and returns null', async () => {
  const cwd = await makeCwd();
  const keys: string[] = [];
  const availability = await inspectCommandAvailability(cwd, trackingReader(keys), {}, async () => '2.1.1');

  assert.equal(availability.delivery, null);
  assert.equal(keys.includes('delivery'), false);
  assert.equal(availability.status, 'ready');
  assert.deepEqual(availability.workflows, ['propose', 'verify']);
});

test('inspectCommandAvailability keeps reading delivery for a 1.x or unknown CLI', async () => {
  const cwd = await makeCwd();
  for (const version of ['1.14.0', null]) {
    const keys: string[] = [];
    const availability = await inspectCommandAvailability(cwd, trackingReader(keys), {}, async () => version);
    assert.equal(availability.delivery, 'both');
    assert.equal(keys.includes('delivery'), true);
  }
});

test('inspectCommandAvailability candidates are unchanged between 1.x and 2.x CLIs', async () => {
  const cwd = await makeCwd();
  await mkdir(join(cwd, '.claude', 'skills', 'openspec-propose'), { recursive: true });
  await writeFile(join(cwd, '.claude', 'skills', 'openspec-propose', 'SKILL.md'), '# propose', 'utf8');

  const v1 = await inspectCommandAvailability(cwd, createReader({}), {}, async () => '1.14.0');
  const v2 = await inspectCommandAvailability(cwd, createReader({}), {}, async () => '2.1.1');
  assert.deepEqual(v2.integrations, v1.integrations);
  assert.deepEqual(v2.forms, v1.forms);
  assert.deepEqual(v2.workflows, v1.workflows);
});

async function writeProjectConfig(cwd: string, content: string): Promise<void> {
  await mkdir(join(cwd, 'openspec'), { recursive: true });
  await writeFile(join(cwd, 'openspec', 'config.yaml'), content, 'utf8');
}

test('inspectCommandAvailability reports skillsScope project from openspec/config.yaml', async () => {
  const cwd = await makeCwd();
  await writeProjectConfig(cwd, 'schema: spec-driven\nskillsScope: project\n');
  const availability = await inspectCommandAvailability(cwd, createReader({}));
  assert.equal(availability.skillsScope, 'project');
});

test('inspectCommandAvailability reports null skillsScope when absent, global, invalid or malformed', async () => {
  const cases = [
    null,
    'schema: spec-driven\n',
    'schema: spec-driven\nskillsScope: global\n',
    'schema: spec-driven\nskillsScope: team\n',
    'skillsScope: [project\n',
  ];
  for (const content of cases) {
    const cwd = await makeCwd();
    if (content !== null) await writeProjectConfig(cwd, content);
    const availability = await inspectCommandAvailability(cwd, createReader({}));
    assert.equal(availability.skillsScope, null, `config: ${String(content)}`);
  }
});

test('inspectCommandAvailability reports Copilot cloud files', async () => {
  const cwd = await makeCwd();
  assert.equal((await inspectCommandAvailability(cwd, createReader({}))).copilotCloud, false);
  await mkdir(join(cwd, '.github', 'agents'), { recursive: true });
  await writeFile(join(cwd, '.github', 'agents', 'openspec.agent.md'), '# agent', 'utf8');
  assert.equal((await inspectCommandAvailability(cwd, createReader({}))).copilotCloud, true);
});

test('createMemoizedVersionReader spawns once per TTL window', async () => {
  let spawns = 0;
  let time = 0;
  const reader = createMemoizedVersionReader(async () => { spawns += 1; return '2.1.1'; }, () => time, 1000);
  assert.equal(await reader('/a'), '2.1.1');
  assert.equal(await reader('/b'), '2.1.1');
  assert.equal(spawns, 1);
  time = 1000;
  await reader('/a');
  assert.equal(spawns, 2);
});

// Cleanup temp dirs after all tests.
process.on('exit', () => {
  for (const dir of tempDirs.splice(0)) {
    void rm(dir, { recursive: true, force: true });
  }
});
