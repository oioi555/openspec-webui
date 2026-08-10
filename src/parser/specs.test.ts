import assert from 'node:assert/strict';
import { afterEach, test } from 'node:test';
import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { parseSpecs } from './specs.js';

const tempDirs: string[] = [];

afterEach(async () => {
  await Promise.all(tempDirs.splice(0).map((dir) => rm(dir, { recursive: true, force: true })));
});

async function createTempDir(prefix: string): Promise<string> {
  const dir = await mkdtemp(join(tmpdir(), prefix));
  tempDirs.push(dir);
  return dir;
}

async function createSpecsFixture(files: Record<string, string>): Promise<string> {
  const sandbox = await createTempDir('openspec-webui-parser-specs-');
  const openspecPath = join(sandbox, 'project', 'openspec');
  await mkdir(join(openspecPath, 'specs'), { recursive: true });

  for (const [relativePath, content] of Object.entries(files)) {
    const fullPath = join(openspecPath, 'specs', relativePath);
    await mkdir(join(fullPath, '..'), { recursive: true });
    await writeFile(fullPath, content, 'utf8');
  }

  return openspecPath;
}

test('parseSpecs discovers nested capability specs at any depth', async () => {
  const openspecPath = await createSpecsFixture({
    'auth/spec.md': '## Purpose\n\nAuth spec.',
    'network/auth/spec.md': '## Purpose\n\nNested network auth spec.',
    'network/dns/spec.md': '## Purpose\n\nDNS spec.',
    'top-level/spec.md': '## Purpose\n\nTop-level spec.',
  });

  const result = await parseSpecs(openspecPath);

  assert.deepEqual(result.errors, []);
  const names = (result.data ?? []).map((spec) => spec.name).sort();
  assert.deepEqual(names, ['auth', 'network/auth', 'network/dns', 'top-level']);
});

test('parseSpecs skips empty parent directories without direct spec.md', async () => {
  const openspecPath = await createSpecsFixture({
    'network/auth/spec.md': '## Purpose\n\nNested auth spec.',
  });

  const result = await parseSpecs(openspecPath);

  assert.deepEqual(result.errors, []);
  const names = (result.data ?? []).map((spec) => spec.name);
  // `network` has no direct spec.md, so it must not appear as a capability.
  assert.deepEqual(names, ['network/auth']);
});

test('parseSpecs tolerates deleted retired spec files by omitting them', async () => {
  const openspecPath = await createSpecsFixture({
    'auth/spec.md': '## Purpose\n\nAuth spec.',
    'retired/spec.md': '## Purpose\n\nRetired spec.',
  });

  // Simulate a deleted retired spec file: remove it after the initial write.
  await rm(join(openspecPath, 'specs', 'retired', 'spec.md'), { force: true });

  const result = await parseSpecs(openspecPath);

  assert.deepEqual(result.errors, []);
  const names = (result.data ?? []).map((spec) => spec.name);
  assert.deepEqual(names, ['auth']);
});

test('parseSpecs sorts specs alphabetically by relative name', async () => {
  const openspecPath = await createSpecsFixture({
    'zeta/spec.md': '## Purpose\n\nZeta.',
    'alpha/spec.md': '## Purpose\n\nAlpha.',
    'network/beta/spec.md': '## Purpose\n\nBeta.',
  });

  const result = await parseSpecs(openspecPath);

  const names = (result.data ?? []).map((spec) => spec.name);
  assert.deepEqual(names, ['alpha', 'network/beta', 'zeta']);
});

test('parseSpecs skips dot-directories like the CLI', async () => {
  const openspecPath = await createSpecsFixture({
    'auth/spec.md': '## Purpose\n\nAuth spec.',
    '.hidden/spec.md': '## Purpose\n\nHidden spec.',
    'network/.git/spec.md': '## Purpose\n\nGit dir spec.',
  });

  const result = await parseSpecs(openspecPath);

  assert.deepEqual(result.errors, []);
  const names = (result.data ?? []).map((spec) => spec.name);
  assert.deepEqual(names, ['auth']);
});
