#!/usr/bin/env node

import { existsSync } from 'fs';
import { spawn } from 'child_process';
import { dirname, join, resolve } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const binExtension = process.platform === 'win32' ? '.cmd' : '';

export const repoRoot = join(__dirname, '..');

export const localBinPackages = {
  tsc: 'typescript',
  tsx: 'tsx',
  vite: 'vite',
  'svelte-check': 'svelte-check',
};

const optionValueFlags = new Set(['--port', '-p']);

export function resolveLocalBin(binName) {
  return join(repoRoot, 'node_modules', '.bin', `${binName}${binExtension}`);
}

export function listMissingLocalBins(binNames) {
  return binNames.filter((binName) => !existsSync(resolveLocalBin(binName)));
}

export function printMissingDevDependencyHelp(missingBins) {
  const packages = missingBins.map((binName) => localBinPackages[binName] ?? binName).join(', ');

  console.error('Missing local dev dependencies.');
  console.error(`Required tools not found: ${packages}`);
  console.error('');
  console.error('Run the official setup command first:');
  console.error('  npm run setup:dev');
  console.error('');
  console.error('If your shell or CI environment omits devDependencies by default, keep using:');
  console.error('  npm install --include=dev');
}

export function ensureLocalBins(binNames) {
  const missingBins = listMissingLocalBins(binNames);
  if (missingBins.length === 0) {
    return;
  }

  printMissingDevDependencyHelp(missingBins);
  process.exit(1);
}

export function spawnInRepo(command, args, extraOptions = {}) {
  return spawn(command, args, {
    cwd: repoRoot,
    stdio: 'inherit',
    env: process.env,
    ...extraOptions,
  });
}

export function waitForExit(child, label) {
  return new Promise((resolve, reject) => {
    child.on('error', (error) => {
      reject(new Error(`Failed to start ${label}: ${error.message}`));
    });

    child.on('exit', (code, signal) => {
      resolve({ code: code ?? 0, signal });
    });
  });
}

export function extractWrapperProjectArg(args) {
  const forwardedArgs = [];
  let projectArg;

  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];

    if (optionValueFlags.has(arg)) {
      forwardedArgs.push(arg);
      index += 1;
      if (index < args.length) {
        forwardedArgs.push(args[index]);
      }
      continue;
    }

    if (arg.startsWith('--port=')) {
      forwardedArgs.push(arg);
      continue;
    }

    if (!arg.startsWith('-') && projectArg === undefined) {
      projectArg = arg;
      continue;
    }

    forwardedArgs.push(arg);
  }

  return {
    forwardedArgs,
    projectArg,
  };
}

export function buildBootstrapEnv(projectArg, extraEnv = {}) {
  const env = {
    ...process.env,
    ...extraEnv,
  };

  const configuredInitialProject = env.OPENSPEC_INITIAL_PROJECT?.trim();

  if (projectArg !== undefined) {
    env.OPENSPEC_INITIAL_PROJECT = resolve(repoRoot, projectArg);
    return env;
  }

  if (!configuredInitialProject) {
    env.OPENSPEC_INITIAL_PROJECT = repoRoot;
  } else {
    env.OPENSPEC_INITIAL_PROJECT = configuredInitialProject;
  }

  return env;
}

export function withFlag(args, flag) {
  return args.includes(flag) ? args : [...args, flag];
}
