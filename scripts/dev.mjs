#!/usr/bin/env node

import {
  ensureLocalBins,
  spawnLocalBin,
  spawnInRepo,
  waitForExit,
  withFlag,
} from './dev-utils.mjs';
import { collectServerArgs, resolveDevHost, resolveDevPort } from './dev-args.mjs';

ensureLocalBins(['tsx', 'vite']);

const forwardedArgs = process.argv.slice(2);
const serverArgs = withFlag(collectServerArgs(forwardedArgs), '--no-open');
const devPort = resolveDevPort(forwardedArgs);
const devHost = resolveDevHost(forwardedArgs);

console.log('Building frontend once before starting dev watchers...');
const initialFrontendBuild = spawnLocalBin('vite', ['build', '--config', 'frontend/vite.config.ts']);
const initialBuildResult = await waitForExit(initialFrontendBuild, 'vite build');

if (initialBuildResult.code !== 0) {
  process.exit(initialBuildResult.code);
}

console.log(`Development mode: server serves dist-frontend on http://${devHost}:${devPort}`);
console.log('Frontend source changes trigger rebuilds. Refresh the browser after UI edits.');

const children = [
  {
    label: 'frontend build watch',
    child: spawnLocalBin('vite', ['build', '--watch', '--config', 'frontend/vite.config.ts']),
  },
  {
    label: 'dev server',
    child: spawnInRepo(process.execPath, [
      '--watch',
      '--import',
      'tsx',
      'src/cli/index.ts',
      ...serverArgs,
    ]),
  },
];

let shuttingDown = false;

function shutdown(signal = 'SIGTERM') {
  if (shuttingDown) {
    return;
  }

  shuttingDown = true;
  for (const { child } of children) {
    if (!child.killed) {
      child.kill(signal);
    }
  }
}

process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));

const exits = children.map(({ child, label }) =>
  waitForExit(child, label)
    .then((result) => ({ label, ...result }))
    .catch((error) => ({ label, code: 1, signal: null, error }))
);

const firstExit = await Promise.race(exits);

if ('error' in firstExit) {
  console.error(firstExit.error.message);
}

shutdown();
await Promise.allSettled(exits);

process.exit(firstExit.code);
