import assert from 'node:assert/strict';
import { test } from 'node:test';
import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import {
  inspectCommandAvailability,
  parseDelivery,
  type OpenSpecConfigReader,
} from './openspec-config.js';

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

// Cleanup temp dirs after all tests.
process.on('exit', () => {
  for (const dir of tempDirs.splice(0)) {
    void rm(dir, { recursive: true, force: true });
  }
});
