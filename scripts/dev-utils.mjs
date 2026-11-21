#!/usr/bin/env node

import { existsSync, readFileSync } from 'fs';
import { spawn } from 'child_process';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

export const repoRoot = join(__dirname, '..');

export const localBinPackages = {
  tsc: 'typescript',
  tsx: 'tsx',
  vite: 'vite',
  'svelte-check': 'svelte-check',
  'paraglide-js': '@inlang/paraglide-js',
  'generate-license-file': 'generate-license-file',
};

/**
 * Resolve a dev tool to the JavaScript entry declared in its package's `bin`
 * field. Running that file with `process.execPath` avoids the
 * `node_modules/.bin/*.cmd` shims, which Node refuses to spawn without a
 * shell on Windows (CVE-2024-27980), and avoids shell quoting entirely.
 * Returns null when the package or its bin entry is missing.
 */
export function resolveLocalBin(binName) {
  const packageName = localBinPackages[binName] ?? binName;
  const packageDir = join(repoRoot, 'node_modules', ...packageName.split('/'));
  let manifest;
  try {
    manifest = JSON.parse(readFileSync(join(packageDir, 'package.json'), 'utf8'));
  } catch {
    return null;
  }
  const bin = typeof manifest.bin === 'string'
    ? (binName === packageName.split('/').pop() ? manifest.bin : null)
    : manifest.bin?.[binName];
  if (typeof bin !== 'string') return null;
  const entry = join(packageDir, bin);
  return existsSync(entry) ? entry : null;
}

export function listMissingLocalBins(binNames) {
  return binNames.filter((binName) => resolveLocalBin(binName) === null);
}

/** Spawn a repo-local dev tool through the current Node binary. */
export function spawnLocalBin(binName, args, extraOptions = {}) {
  const entry = resolveLocalBin(binName);
  if (!entry) throw new Error(`Local bin not found: ${binName}`);
  return spawnInRepo(process.execPath, [entry, ...args], extraOptions);
}

export function printMissingDevDependencyHelp(missingBins) {
  const packages = missingBins.map((binName) => localBinPackages[binName] ?? binName).join(', ');

  console.error('Missing local dev dependencies.');
  console.error(`Required tools not found: ${packages}`);
  console.error('');
  console.error('Install dev dependencies first:');
  console.error('  npm install');
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

export function withFlag(args, flag) {
  return args.includes(flag) ? args : [...args, flag];
}
