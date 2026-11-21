#!/usr/bin/env node

// Pre-publish guards for the tag-triggered release workflow
// (.github/workflows/release.yml). Runnable locally:
//
//   node scripts/release-guard.mjs --tag v1.2.3            # all checks
//   node scripts/release-guard.mjs --tag v1.2.3 --skip-ancestry --skip-registry
//   node scripts/release-guard.mjs --check-npm-cli         # npm >= 11.5.1 only
//   node scripts/release-guard.mjs --check-published       # writes published=true|false
//
// On success it prints the results and, when GITHUB_OUTPUT is set, writes
// `version`, `notes_file`, and `published` (true when the version is already
// on npm, so the workflow can skip publishing on a re-run).

import { appendFileSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';
import { pathToFileURL } from 'node:url';

import { repoRoot } from './dev-utils.mjs';

// npm trusted publishing (OIDC) requires npm CLI 11.5.1 or later.
// https://docs.npmjs.com/trusted-publishers
export const MIN_TRUSTED_PUBLISHING_NPM = '11.5.1';
export const RELEASE_NOTES_DIR = '.github/release-notes';

export function releaseNotesPath(version) {
  return `${RELEASE_NOTES_DIR}/v${version}.md`;
}

function parseSemver(value) {
  const match = /^(\d+)\.(\d+)\.(\d+)(?:-[0-9A-Za-z.-]+)?$/.exec(String(value ?? '').trim());
  return match ? match.slice(1, 4).map(Number) : null;
}

export function compareCore(a, b) {
  const pa = parseSemver(a);
  const pb = parseSemver(b);
  if (!pa || !pb) throw new Error(`Cannot compare versions "${a}" and "${b}"`);
  for (let i = 0; i < 3; i += 1) {
    if (pa[i] !== pb[i]) return pa[i] < pb[i] ? -1 : 1;
  }
  return 0;
}

export function checkNpmCliVersion(npmVersion, min = MIN_TRUSTED_PUBLISHING_NPM) {
  if (compareCore(npmVersion, min) < 0) {
    throw new Error(`npm ${npmVersion} is too old for trusted publishing; need >= ${min}`);
  }
}

export function checkTagMatchesVersion(tag, packageJson, packageLock) {
  if (!/^v\d+\.\d+\.\d+$/.test(tag ?? '')) {
    throw new Error(`Tag "${tag}" is not of the form v<major>.<minor>.<patch>`);
  }
  const expected = `v${packageJson.version}`;
  if (tag !== expected) {
    throw new Error(`Tag "${tag}" does not match package.json version (expected "${expected}")`);
  }
  if (packageLock.version !== packageJson.version || packageLock.packages?.['']?.version !== packageJson.version) {
    throw new Error('package-lock.json version does not match package.json');
  }
  return packageJson.version;
}

export function checkReleaseNotes(content, path) {
  if (content === null) {
    throw new Error(`Release notes file ${path} is missing; commit it in the release commit`);
  }
  if (content.trim().length === 0) {
    throw new Error(`Release notes file ${path} is empty`);
  }
}

function defaultRun(command, args) {
  return spawnSync(command, args, { cwd: repoRoot, encoding: 'utf8', shell: process.platform === 'win32' });
}

export function checkAncestry(ref, mainRef, run = defaultRun) {
  const result = run('git', ['merge-base', '--is-ancestor', `${ref}^{commit}`, mainRef]);
  if (result.status === 1) {
    throw new Error(`${ref} is not on ${mainRef}; push the release commit to main before the tag`);
  }
  if (result.status !== 0) {
    throw new Error(`git merge-base failed: ${(result.stderr || result.stdout || '').trim()}`);
  }
}

// Returns true when name@version already exists on the registry, false on a
// clean 404, and throws on any other failure so a registry outage never looks
// like "not published".
export function isPublished(name, version, run = defaultRun) {
  const result = run('npm', ['view', `${name}@${version}`, 'version', '--json']);
  if (result.status === 0) {
    const out = (result.stdout || '').trim();
    if (!out) return false;
    let parsed;
    try {
      parsed = JSON.parse(out);
    } catch {
      throw new Error(`npm view ${name}@${version} returned unparseable output: ${out.slice(0, 200)}`);
    }
    return Array.isArray(parsed) ? parsed.includes(version) : parsed === version;
  }
  if (/E404/.test(`${result.stdout}\n${result.stderr}`)) return false;
  throw new Error(`npm view ${name}@${version} failed: ${(result.stderr || result.stdout || '').trim()}`);
}

export function parseArgs(argv) {
  const options = { tag: null, mainRef: 'origin/main', ancestry: true, registry: true, npmCliOnly: false, publishedOnly: false };
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === '--tag') options.tag = argv[++i];
    else if (arg === '--main-ref') options.mainRef = argv[++i];
    else if (arg === '--skip-ancestry') options.ancestry = false;
    else if (arg === '--skip-registry') options.registry = false;
    else if (arg === '--check-npm-cli') options.npmCliOnly = true;
    else if (arg === '--check-published') options.publishedOnly = true;
    else throw new Error(`Unknown argument: ${arg}`);
  }
  if (!options.npmCliOnly && !options.publishedOnly && !options.tag) throw new Error('--tag is required');
  return options;
}

function readText(path) {
  try {
    return readFileSync(path, 'utf8');
  } catch (error) {
    if (error.code === 'ENOENT') return null;
    throw error;
  }
}

function main() {
  const options = parseArgs(process.argv.slice(2));

  if (options.npmCliOnly) {
    const result = defaultRun('npm', ['--version']);
    if (result.status !== 0) throw new Error('npm --version failed');
    checkNpmCliVersion(result.stdout.trim());
    console.log(`npm ${result.stdout.trim()} supports trusted publishing`);
    return;
  }

  const packageJson = JSON.parse(readFileSync(join(repoRoot, 'package.json'), 'utf8'));

  if (options.publishedOnly) {
    // Re-checked right before `npm publish` so re-runs (or a manual fallback
    // publish) never attempt to publish an existing version.
    const published = isPublished(packageJson.name, packageJson.version);
    console.log(`${packageJson.name}@${packageJson.version} ${published ? 'is already' : 'is not yet'} on npm`);
    if (process.env.GITHUB_OUTPUT) appendFileSync(process.env.GITHUB_OUTPUT, `published=${published}\n`);
    return;
  }

  const packageLock = JSON.parse(readFileSync(join(repoRoot, 'package-lock.json'), 'utf8'));
  const version = checkTagMatchesVersion(options.tag, packageJson, packageLock);
  console.log(`Tag ${options.tag} matches package.json version ${version}`);

  const notesFile = releaseNotesPath(version);
  checkReleaseNotes(readText(join(repoRoot, notesFile)), notesFile);
  console.log(`Release notes found: ${notesFile}`);

  if (options.ancestry) {
    checkAncestry(options.tag, options.mainRef);
    console.log(`${options.tag} is an ancestor of ${options.mainRef}`);
  }

  let published = false;
  if (options.registry) {
    published = isPublished(packageJson.name, version);
    console.log(published
      ? `${packageJson.name}@${version} is already on npm; publish will be skipped`
      : `${packageJson.name}@${version} is not on npm yet`);
  }

  if (process.env.GITHUB_OUTPUT) {
    appendFileSync(process.env.GITHUB_OUTPUT, `version=${version}\nnotes_file=${notesFile}\npublished=${published}\n`);
  }
}

const isMain = process.argv[1] ? import.meta.url === pathToFileURL(process.argv[1]).href : false;

if (isMain) {
  try {
    main();
  } catch (error) {
    console.error(`release-guard: ${error.message}`);
    process.exit(1);
  }
}
