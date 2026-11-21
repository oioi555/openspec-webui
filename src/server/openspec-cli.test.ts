import assert from 'node:assert/strict';
import { test } from 'node:test';
import type { ExecFileException, ExecFileOptions } from 'node:child_process';

import { execOpenSpec, execOpenSpecFile, type OpenSpecExecFile } from './openspec-cli.js';

type ExecCallback = (error: ExecFileException | null, stdout: string, stderr: string) => void;

interface CapturedCall {
  file: string;
  args: readonly string[];
  options: ExecFileOptions;
}

function createExec(handler?: (callback: ExecCallback) => void): {
  exec: OpenSpecExecFile;
  calls: CapturedCall[];
} {
  const calls: CapturedCall[] = [];
  const exec: OpenSpecExecFile = (file, args, options, callback) => {
    calls.push({ file, args: [...args], options });
    if (handler) {
      handler(callback);
      return;
    }
    callback(null, 'ok\n', '');
  };
  return { exec, calls };
}

function run(
  args: readonly string[],
  options: Parameters<typeof execOpenSpec>[1],
): Promise<{ error: ExecFileException | null; stdout: string; stderr: string }> {
  return new Promise((resolve) => {
    execOpenSpec(args, options, (error, stdout, stderr) => {
      resolve({ error, stdout, stderr });
    });
  });
}

test('POSIX launches openspec with a structured argv and no shell', async () => {
  const { exec, calls } = createExec();
  const result = await run(['--version'], {
    platform: 'linux',
    exec,
    cwd: '/tmp/project',
    timeout: 3000,
  });

  assert.equal(calls.length, 1);
  assert.equal(calls[0]?.file, 'openspec');
  assert.deepEqual(calls[0]?.args, ['--version']);
  assert.equal(calls[0]?.options.cwd, '/tmp/project');
  assert.equal(calls[0]?.options.timeout, 3000);
  assert.equal(calls[0]?.options.shell, undefined);
  assert.equal(result.error, null);
  assert.equal(result.stdout, 'ok\n');
});

function enoent(): ExecFileException {
  const error = new Error('spawn openspec ENOENT') as ExecFileException;
  error.code = 'ENOENT';
  return error;
}

/** Simulates a Windows PATH that only has npm's `openspec.cmd` shim. */
function createShimOnlyExec(): { exec: OpenSpecExecFile; calls: CapturedCall[] } {
  const calls: CapturedCall[] = [];
  const exec: OpenSpecExecFile = (file, args, options, callback) => {
    calls.push({ file, args: [...args], options });
    if (file === 'openspec.cmd') {
      callback(null, 'ok\n', '');
      return;
    }
    callback(enoent(), '', '');
  };
  return { exec, calls };
}

test('Windows launches a standalone openspec directly without a shell', async () => {
  const { exec, calls } = createExec();
  const result = await run(['store', 'list', '--json'], {
    platform: 'win32',
    exec,
    cwd: 'C:\\Users\\test',
    timeout: 10_000,
  });
  await run(['--version'], { platform: 'win32', exec });

  assert.equal(calls.length, 2);
  assert.equal(calls[0]?.file, 'openspec');
  assert.deepEqual(calls[0]?.args, ['store', 'list', '--json']);
  assert.equal(calls[0]?.options.shell, undefined);
  assert.equal(calls[0]?.options.cwd, 'C:\\Users\\test');
  assert.equal(calls[0]?.options.timeout, 10_000);
  assert.equal(calls[1]?.file, 'openspec');
  assert.equal(result.error, null);
  assert.equal(result.stdout, 'ok\n');
});

test('Windows direct launch does not apply the shim argument rule', async () => {
  const { exec, calls } = createExec();
  const result = await run(['config', 'get', 'pre%PATH%'], { platform: 'win32', exec });

  assert.equal(calls.length, 1);
  assert.deepEqual(calls[0]?.args, ['config', 'get', 'pre%PATH%']);
  assert.equal(result.error, null);
});

test('Windows falls back to the openspec.cmd shim on ENOENT and caches it', async () => {
  const { exec, calls } = createShimOnlyExec();
  const first = await run(['store', 'list', '--json'], {
    platform: 'win32',
    exec,
    cwd: 'C:\\Users\\test',
    timeout: 10_000,
  });

  assert.equal(calls.length, 2);
  assert.equal(calls[0]?.file, 'openspec');
  assert.equal(calls[1]?.file, 'openspec.cmd');
  assert.deepEqual(calls[1]?.args, ['"store"', '"list"', '"--json"']);
  assert.equal(calls[1]?.options.shell, true);
  assert.equal(calls[1]?.options.cwd, 'C:\\Users\\test');
  assert.equal(calls[1]?.options.timeout, 10_000);
  assert.equal(first.error, null);

  await run(['validate', '--all', '--strict', '--concurrency', '8', '--json'], {
    platform: 'win32',
    exec,
  });
  await run(['config', 'get', 'profile'], { platform: 'win32', exec });

  assert.equal(calls.length, 4);
  assert.equal(calls[2]?.file, 'openspec.cmd');
  assert.deepEqual(calls[2]?.args, [
    '"validate"',
    '"--all"',
    '"--strict"',
    '"--concurrency"',
    '"8"',
    '"--json"',
  ]);
  assert.deepEqual(calls[3]?.args, ['"config"', '"get"', '"profile"']);
});

test('Windows does not fall back for errors other than ENOENT', async () => {
  const { exec, calls } = createExec((callback) => {
    const error = new Error('exit 1') as ExecFileException;
    error.code = 1;
    callback(error, '', 'boom');
  });
  const result = await run(['--version'], { platform: 'win32', exec });

  assert.equal(calls.length, 1);
  assert.equal(calls[0]?.file, 'openspec');
  assert.equal(result.error?.code, 1);
});

test('Windows shim path rejects quote, percent, or control characters before calling the shim', async () => {
  const unsafeArgs = ['foo"bar', 'pre%PATH%', 'line\nbreak', 'bell\u0007'];

  for (const unsafe of unsafeArgs) {
    const { exec, calls } = createShimOnlyExec();
    await run(['--version'], { platform: 'win32', exec });
    const result = await run(['config', 'get', unsafe], { platform: 'win32', exec });

    assert.equal(calls.length, 2, `shim should not run for ${JSON.stringify(unsafe)}`);
    assert.ok(result.error);
    assert.notEqual(result.error?.code, 'ENOENT');
    assert.match(result.error?.message ?? '', /Windows-unsafe character/);
  }
});

test('Windows shim path still accepts cmd metacharacters that quoting makes literal', async () => {
  const { exec, calls } = createShimOnlyExec();
  const result = await run(['config', 'get', 'a&b|c<d>e^f(g)'], {
    platform: 'win32',
    exec,
  });

  assert.equal(calls.length, 2);
  assert.deepEqual(calls[1]?.args, ['"config"', '"get"', '"a&b|c<d>e^f(g)"']);
  assert.equal(result.error, null);
});

test('execOpenSpecFile ignores the command name and forwards argv through the helper', async () => {
  const { exec, calls } = createExec();
  const result = await new Promise<{ error: ExecFileException | null; stdout: string }>((resolve) => {
    execOpenSpecFile(
      'ignored',
      ['--version'],
      { timeout: 1000, platform: 'linux', exec },
      (error, stdout) => {
        resolve({ error, stdout });
      },
    );
  });

  assert.equal(calls.length, 1);
  assert.equal(calls[0]?.file, 'openspec');
  assert.deepEqual(calls[0]?.args, ['--version']);
  assert.equal(calls[0]?.options.timeout, 1000);
  assert.equal(result.error, null);
  assert.equal(result.stdout, 'ok\n');
});
