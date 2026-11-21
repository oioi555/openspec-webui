#!/usr/bin/env node
// Cross-platform smoke test: start openspec-webui, poll /api/version-status
// until the OpenSpec CLI probe finishes, assert the reported install, stop.
//
// Usage:
//   node scripts/ci-smoke.mjs [--bin <path-to-js>] [--expect-manager <name>] [--expect-shim]
//
//   --bin             run `node <path>` instead of the globally installed
//                     `openspec-webui` command (e.g. bin/openspec-webui.js)
//   --expect-manager  require tools.openspec.installManager to equal <name>
//   --expect-shim     (Windows) require that only npm's `openspec.cmd` shim is
//                     on PATH, so a successful probe proves the shim fallback

import { spawn, spawnSync } from 'node:child_process';
import { createServer } from 'node:net';
import { setTimeout as delay } from 'node:timers/promises';

const SEMVER = /^\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?(?:\+[0-9A-Za-z.-]+)?$/;
const isWindows = process.platform === 'win32';

function parseArgs(argv) {
  const options = { bin: null, expectManager: null, expectShim: false, timeoutMs: 90_000 };
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === '--bin') options.bin = argv[++i];
    else if (arg === '--expect-manager') options.expectManager = argv[++i];
    else if (arg === '--expect-shim') options.expectShim = true;
    else if (arg === '--timeout-ms') options.timeoutMs = Number(argv[++i]);
    else throw new Error(`Unknown argument: ${arg}`);
  }
  return options;
}

function freePort() {
  return new Promise((resolve, reject) => {
    const server = createServer();
    server.unref();
    server.on('error', reject);
    server.listen(0, '127.0.0.1', () => {
      const { port } = server.address();
      server.close(() => resolve(port));
    });
  });
}

function which(name) {
  const result = spawnSync(isWindows ? 'where' : 'which', [name], { encoding: 'utf8' });
  return result.status === 0 ? result.stdout.trim().split(/\r?\n/) : [];
}

function startServer(options, port) {
  const args = ['--port', String(port), '--no-open'];
  // The global command is a .cmd shim on Windows, which needs a shell.
  const child = options.bin
    ? spawn(process.execPath, [options.bin, ...args], { stdio: ['ignore', 'pipe', 'pipe'], detached: !isWindows })
    : spawn('openspec-webui', args, { stdio: ['ignore', 'pipe', 'pipe'], shell: isWindows, detached: !isWindows });
  child.stdout.on('data', (chunk) => process.stdout.write(`[server] ${chunk}`));
  child.stderr.on('data', (chunk) => process.stderr.write(`[server] ${chunk}`));
  return child;
}

function stopServer(child) {
  if (child.exitCode !== null || child.signalCode !== null) return;
  if (isWindows) {
    spawnSync('taskkill', ['/pid', String(child.pid), '/T', '/F'], { stdio: 'ignore' });
  } else {
    try {
      process.kill(-child.pid, 'SIGTERM');
    } catch {
      child.kill('SIGTERM');
    }
  }
}

async function pollVersionStatus(child, url, timeoutMs) {
  const deadline = Date.now() + timeoutMs;
  let lastError = null;
  while (Date.now() < deadline) {
    if (child.exitCode !== null) throw new Error(`server exited early with code ${child.exitCode}`);
    try {
      const response = await fetch(url);
      if (response.ok) {
        const body = await response.json();
        if (body.loading === false) return body;
        lastError = 'snapshot still loading';
      } else {
        lastError = `HTTP ${response.status}`;
      }
    } catch (error) {
      lastError = error instanceof Error ? error.message : String(error);
    }
    await delay(1000);
  }
  throw new Error(`timed out waiting for ${url} (${lastError})`);
}

function check(failures, condition, message) {
  console.log(`${condition ? 'ok  ' : 'FAIL'} ${message}`);
  if (!condition) failures.push(message);
}

async function main() {
  const options = parseArgs(process.argv.slice(2));
  const failures = [];

  if (options.expectShim) {
    if (!isWindows) throw new Error('--expect-shim is only meaningful on Windows');
    const exe = which('openspec.exe');
    const cmd = which('openspec.cmd');
    console.log(`openspec.exe on PATH: ${exe.join(', ') || '(none)'}`);
    console.log(`openspec.cmd on PATH: ${cmd.join(', ') || '(none)'}`);
    check(failures, exe.length === 0, 'no openspec.exe on PATH (direct launch must miss)');
    check(failures, cmd.length > 0, 'openspec.cmd shim is on PATH');
  }

  const port = await freePort();
  const url = `http://127.0.0.1:${port}/api/version-status`;
  console.log(`starting openspec-webui on port ${port}`);
  const child = startServer(options, port);

  try {
    const snapshot = await pollVersionStatus(child, url, options.timeoutMs);
    const openspec = snapshot.tools?.openspec ?? {};
    console.log(`tools.openspec = ${JSON.stringify(openspec)}`);
    check(failures, openspec.notInstalled === false, 'tools.openspec.notInstalled is false');
    check(failures, typeof openspec.currentVersion === 'string' && SEMVER.test(openspec.currentVersion),
      `tools.openspec.currentVersion is semver (${openspec.currentVersion})`);
    if (options.expectManager) {
      check(failures, openspec.installManager === options.expectManager,
        `tools.openspec.installManager is ${options.expectManager} (${openspec.installManager})`);
    } else {
      console.log(`info tools.openspec.installManager = ${openspec.installManager}`);
    }
  } finally {
    stopServer(child);
  }

  if (failures.length > 0) {
    console.error(`\nSmoke test failed: ${failures.length} check(s)`);
    process.exit(1);
  }
  console.log('\nSmoke test passed');
  process.exit(0);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.stack : error);
  process.exit(1);
});
