import assert from 'node:assert/strict';
import { test } from 'node:test';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { createStoreDiscoveryService } from './store-discovery.js';

type ExecCallback = (error: unknown, stdout: string, stderr: string) => void;

function createService(exec: unknown) {
  return createStoreDiscoveryService({
    deps: {
      exec: exec as typeof import('node:child_process').execFile,
      getHomeDir: () => '/home/test-user',
      now: () => new Date('2026-08-10T00:00:00.000Z'),
    },
  });
}

function makeExec(handler: (callback: ExecCallback) => void) {
  return ((_command: string, _args: string[], _options: unknown, callback: ExecCallback) => {
    handler(callback);
  }) as unknown as typeof import('node:child_process').execFile;
}

test('store list invokes only `openspec store list --json` with a stable cwd', async () => {
  const captured: { command: string; args: string[]; options: { cwd: string; timeout: number } }[] = [];
  const exec = ((command: string, args: string[], options: { cwd: string; timeout: number }, callback: ExecCallback) => {
    captured.push({ command, args, options });
    callback(null, JSON.stringify({ stores: [{ id: 's1', root: '/store/one' }], status: [] }), '');
  }) as unknown as typeof import('node:child_process').execFile;
  const svc = createService(exec);
  const result = await svc.listStores();

  // Exactly one subprocess invocation, nothing else.
  assert.equal(captured.length, 1);
  assert.equal(captured[0]?.command, 'openspec');
  assert.deepEqual(captured[0]?.args, ['store', 'list', '--json']);
  assert.equal(captured[0]?.options.cwd, '/home/test-user');
  assert.equal(typeof captured[0]?.options.timeout, 'number');

  assert.equal(result.status, 'stores');
  assert.deepEqual(result.stores, [{ id: 's1', root: '/store/one' }]);
  assert.equal(result.reason, null);
  assert.equal(result.checkedAt, '2026-08-10T00:00:00.000Z');
});

test('store list returns empty when the CLI reports no stores', async () => {
  const svc = createService(
    makeExec((callback) => callback(null, JSON.stringify({ stores: [], status: [] }), ''))
  );

  const result = await svc.listStores();
  assert.equal(result.status, 'empty');
  assert.deepEqual(result.stores, []);
  assert.equal(result.reason, null);
});

test('store list returns unavailable with structured diagnostic on malformed JSON', async () => {
  const svc = createService(makeExec((callback) => callback(null, 'this is not json', '')));

  const result = await svc.listStores();
  assert.equal(result.status, 'unavailable');
  assert.deepEqual(result.stores, []);
  assert.equal(result.reason?.code, 'MALFORMED_OUTPUT');
});

test('store list returns unavailable with structured diagnostic on invalid shape', async () => {
  const svc = createService(
    makeExec((callback) => callback(null, JSON.stringify({ stores: 'not-an-array' }), ''))
  );

  const result = await svc.listStores();
  assert.equal(result.status, 'unavailable');
  assert.equal(result.reason?.code, 'INVALID_SHAPE');
});

test('store list returns unavailable when the CLI is missing (ENOENT)', async () => {
  const error = Object.assign(new Error('spawn openspec ENOENT'), { code: 'ENOENT' });
  const svc = createService(makeExec((callback) => callback(error, '', '')));

  const result = await svc.listStores();
  assert.equal(result.status, 'unavailable');
  assert.equal(result.reason?.code, 'CLI_MISSING');
});

test('store list returns unavailable on nonzero exit', async () => {
  const error = Object.assign(new Error('command failed'), { code: 1 });
  const svc = createService(makeExec((callback) => callback(error, '', 'boom')));

  const result = await svc.listStores();
  assert.equal(result.status, 'unavailable');
  assert.equal(result.reason?.code, 'CLI_ERROR');
  assert.equal(result.reason?.exitCode, 1);
  assert.equal(result.reason?.stderr, 'boom');
});

test('store list returns unavailable on timeout', async () => {
  const error = Object.assign(new Error('timed out'), { code: 'ETIMEDOUT' });
  const svc = createService(makeExec((callback) => callback(error, '', '')));

  const result = await svc.listStores();
  assert.equal(result.status, 'unavailable');
  assert.equal(result.reason?.code, 'TIMEOUT');
});

test('store list classifies killed/SIGTERM execFile timeout as TIMEOUT', async () => {
  const error = Object.assign(new Error('Command failed: openspec store list --json'), {
    killed: true,
    signal: 'SIGTERM',
    code: null,
  });
  const svc = createService(makeExec((callback) => callback(error, '', '')));

  const result = await svc.listStores();
  assert.equal(result.status, 'unavailable');
  assert.equal(result.reason?.code, 'TIMEOUT');
});

test('store list classifies killed-only timeout shape as TIMEOUT', async () => {
  const error = Object.assign(new Error('Command failed'), { killed: true });
  const svc = createService(makeExec((callback) => callback(error, '', '')));

  const result = await svc.listStores();
  assert.equal(result.status, 'unavailable');
  assert.equal(result.reason?.code, 'TIMEOUT');
});

test('store list ignores unknown fields and normalizes roots', async () => {
  const svc = createService(
    makeExec((callback) =>
      callback(
        null,
        JSON.stringify({
          stores: [
            { id: 's1', root: '/store/one', extra: 'ignored' },
            { id: 's2', root: '/store/two' },
          ],
          status: [{ name: 'ok' }],
          unknownField: true,
        }),
        ''
      )
    )
  );

  const result = await svc.listStores();
  assert.equal(result.status, 'stores');
  assert.deepEqual(result.stores, [
    { id: 's1', root: '/store/one' },
    { id: 's2', root: '/store/two' },
  ]);
});

/**
 * Structural guard against the production module silently growing write
 * capabilities. Reads the actual production source (not a mock) and asserts:
 *  - it never imports node:fs (or any fs write API),
 *  - it never references CLI registry files or lifecycle commands,
 *  - the only `openspec` subcommand array is exactly ['store', 'list', '--json'].
 */
test('store discovery module structurally uses no filesystem writes or registry access', () => {
  const modulePath = join(dirname(fileURLToPath(import.meta.url)), 'store-discovery.ts');
  const source = readFileSync(modulePath, 'utf8');

  // Whitelist of allowed imports — crucially excludes node:fs entirely.
  const imports = [...source.matchAll(/from\s+'([^']+)'/g)].map((match) => match[1]);
  const allowedImports = new Set([
    'node:child_process',
    'node:os',
    'node:path',
    './openspec-cli.js',
    '../shared/types.js',
  ]);
  for (const imported of imports) {
    assert.ok(allowedImports.has(imported), `unexpected import in store-discovery: ${imported}`);
  }

  // No filesystem write APIs.
  const writeApis = [
    'writeFile',
    'appendFile',
    'mkdir',
    'unlink',
    'rename',
    'copyFile',
    'truncate',
    'createWriteStream',
    'openSync',
    'writeFileSync',
    'appendFileSync',
    'mkdirSync',
    'unlinkSync',
    'rmSync',
    'renameSync',
  ];
  for (const api of writeApis) {
    assert.ok(!source.includes(api), `store-discovery uses filesystem write API: ${api}`);
  }

  // No CLI registry-file access or lifecycle commands.
  const forbiddenFragments = [
    'registry.yaml',
    'registry.yml',
    'registry.json',
    'projects.json',
    'store register',
    'store unregister',
    'store remove',
    'store setup',
    'store doctor',
  ];
  for (const fragment of forbiddenFragments) {
    assert.ok(
      !source.includes(fragment),
      `store-discovery references forbidden fragment: ${fragment}`
    );
  }

  // The only `openspec` subcommand array is exactly ['store', 'list', '--json'].
  const storeListCalls =
    source.match(/\[['"]store['"],\s*['"]list['"],\s*['"]--json['"]\]/g) ?? [];
  assert.equal(storeListCalls.length, 1);

  // No lifecycle verbs anywhere in the module.
  for (const verb of ['register', 'unregister', 'remove', 'doctor', 'setup']) {
    assert.ok(!source.includes(verb), `store-discovery references lifecycle verb: ${verb}`);
  }
});

