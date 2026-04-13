#!/usr/bin/env node

import {
  buildBootstrapEnv,
  ensureLocalBins,
  extractWrapperProjectArg,
  resolveLocalBin,
  spawnInRepo,
  waitForExit,
  withFlag,
} from './dev-utils.mjs';

ensureLocalBins(['tsx', 'vite']);

const { forwardedArgs, projectArg } = extractWrapperProjectArg(process.argv.slice(2));
const serverArgs = withFlag(forwardedArgs, '--no-open');
const serverEnv = buildBootstrapEnv(projectArg);

console.log('Building frontend with source maps before starting debug watchers...');
const initialFrontendBuild = spawnInRepo(resolveLocalBin('vite'), ['build', '--config', 'frontend/vite.config.ts'], {
  env: {
    ...process.env,
    OPENSPEC_WEBUI_SOURCEMAP: '1',
  },
});
const initialBuildResult = await waitForExit(initialFrontendBuild, 'vite build');

if (initialBuildResult.code !== 0) {
  process.exit(initialBuildResult.code);
}

console.log('Debug mode: app URL http://127.0.0.1:3001, Node inspector ws://127.0.0.1:9229');

const children = [
  {
    label: 'frontend build watch',
    child: spawnInRepo(resolveLocalBin('vite'), ['build', '--watch', '--config', 'frontend/vite.config.ts'], {
      env: {
        ...process.env,
        OPENSPEC_WEBUI_SOURCEMAP: '1',
      },
    }),
  },
  {
    label: 'debug server',
    child: spawnInRepo(
      process.execPath,
      ['--watch', '--inspect=127.0.0.1:9229', '--import', 'tsx', 'src/cli/index.ts', ...serverArgs],
      {
        env: serverEnv,
      }
    ),
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
