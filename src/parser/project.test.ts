import assert from 'node:assert/strict';
import { afterEach, test } from 'node:test';
import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { parseProject } from './project.js';

const tempDirs: string[] = [];

afterEach(async () => {
  await Promise.all(tempDirs.splice(0).map((dir) => rm(dir, { recursive: true, force: true })));
});

async function createTempDir(prefix: string): Promise<string> {
  const dir = await mkdtemp(join(tmpdir(), prefix));
  tempDirs.push(dir);
  return dir;
}

function createConfigYaml(options: {
  schema?: string;
  context?: string;
  guidance?: string;
} = {}): string {
  const schema = options.schema ?? 'default-workflow';
  const context = options.context ?? 'Primary project context.';
  const guidance = options.guidance ?? 'Follow the project workflow.';
  const indent = (value: string) =>
    value
      .split('\n')
      .map((line) => `  ${line}`)
      .join('\n');

  return `schema: |\n${indent(schema)}\ncontext: |\n${indent(context)}\nrules:\n  tasks:\n    guidance: ${guidance}\n`;
}

async function createProjectFixture(name: string, options: { configYaml?: string; projectMd?: string } = {}) {
  const sandbox = await createTempDir('openspec-webui-parser-project-');
  const openspecPath = join(sandbox, name, 'openspec');
  await mkdir(openspecPath, { recursive: true });

  await writeFile(join(openspecPath, 'config.yaml'), options.configYaml ?? createConfigYaml(), 'utf8');

  if (options.projectMd !== undefined) {
    await writeFile(join(openspecPath, 'project.md'), options.projectMd, 'utf8');
  }

  return openspecPath;
}

test('parseProject reads config.yaml planning context', async () => {
  const openspecPath = await createProjectFixture('alpha-project', {
    configYaml: createConfigYaml({
      schema: 'review-workflow',
      context: 'Alpha planning context.\nSecond line.',
      guidance: 'Keep alpha tasks in sync.',
    }),
  });

  const result = await parseProject(openspecPath);

  assert.deepEqual(result.errors, []);
  assert.deepEqual(result.warnings, ['project.md not found']);
  assert.equal(result.data?.name, 'Alpha Project');
  assert.equal(result.data?.description, 'Alpha planning context.');
  assert.equal(result.data?.path, join(openspecPath, 'config.yaml'));
  assert.deepEqual(result.data?.planningContext, {
    source: {
      path: join(openspecPath, 'config.yaml'),
      type: 'config',
    },
    status: 'parsed',
    aiContext: 'Alpha planning context.\nSecond line.',
    artifactRules: [
      {
        artifactId: 'tasks',
        title: 'Tasks',
        content: 'guidance:\nKeep alpha tasks in sync.',
        items: [{ label: 'guidance', value: 'Keep alpha tasks in sync.' }],
      },
    ],
    workflowSchema: 'review-workflow',
  });
  assert.equal(result.data?.legacyProjectDoc, null);
  assert.equal(result.data?.migrationState, 'config-only');
  assert.match(result.data?.content ?? '', /Source: .*config\.yaml/);
});

test('parseProject preserves legacy project.md alongside config.yaml', async () => {
  const openspecPath = await createProjectFixture('legacy-present-project', {
    configYaml: createConfigYaml({
      context: 'Structured context for migrated project.',
    }),
    projectMd: '# Legacy Present Project\n\nLegacy summary paragraph.\n\n## Notes\n\nOlder details.\n',
  });

  const result = await parseProject(openspecPath);

  assert.deepEqual(result.errors, []);
  assert.deepEqual(result.warnings, []);
  assert.equal(result.data?.migrationState, 'legacy-present');
  assert.equal(result.data?.legacyProjectDoc?.path, join(openspecPath, 'project.md'));
  assert.equal(
    result.data?.legacyProjectDoc?.content,
    '# Legacy Present Project\n\nLegacy summary paragraph.\n\n## Notes\n\nOlder details.\n'
  );
  assert.match(result.data?.content ?? '', /## Legacy project\.md \(Deprecated\)/);
});

test('parseProject marks migration-needed when only legacy project.md contains context', async () => {
  const openspecPath = await createProjectFixture('migration-needed-project', {
    configYaml: createConfigYaml({
      context: '',
      guidance: 'Migrate legacy documentation.',
    }),
    projectMd: '# Migration Needed Project\n\nLegacy context still lives here.\n',
  });

  const result = await parseProject(openspecPath);

  assert.deepEqual(result.errors, []);
  assert.deepEqual(result.warnings, []);
  assert.equal(result.data?.description, '');
  assert.equal(result.data?.migrationState, 'migration-needed');
  assert.equal(result.data?.planningContext.status, 'parsed');
  assert.equal(result.data?.planningContext.aiContext, '');
  assert.equal(result.data?.legacyProjectDoc?.description, 'Legacy context still lives here.');
});

test('parseProject returns degraded invalid planning context for malformed config.yaml', async () => {
  const openspecPath = await createProjectFixture('invalid-config-project', {
    configYaml: `schema: default-workflow\ncontext: "Broken "quote" content"\n`,
    projectMd: '# Invalid Config Project\n\nLegacy context is still available.\n',
  });

  const result = await parseProject(openspecPath);

  assert.ok(result.data);
  assert.ok(result.errors.length > 0);
  assert.deepEqual(result.warnings, []);
  assert.equal(result.data?.name, 'Invalid Config Project');
  assert.equal(result.data?.description, '');
  assert.equal(result.data?.migrationState, 'migration-needed');
  assert.equal(result.data?.planningContext.status, 'invalid');
  assert.equal(
    result.data?.planningContext.rawConfig,
    `schema: default-workflow\ncontext: "Broken "quote" content"\n`
  );
  assert.equal(result.data?.planningContext.parseErrors.length, result.errors.length);
  assert.match(result.data?.content ?? '', /## Parse Errors/);
  assert.match(result.data?.content ?? '', /## Raw config\.yaml/);
  assert.equal(result.data?.legacyProjectDoc?.description, 'Legacy context is still available.');
});

test('parseProject returns null data when config.yaml is missing', async () => {
  const sandbox = await createTempDir('openspec-webui-parser-project-');
  const openspecPath = join(sandbox, 'no-config', 'openspec');
  await mkdir(openspecPath, { recursive: true });

  const result = await parseProject(openspecPath);

  assert.equal(result.data, null);
  assert.deepEqual(result.errors, ['config.yaml not found']);
});
