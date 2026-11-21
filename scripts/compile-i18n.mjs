#!/usr/bin/env node

import { pathToFileURL } from 'node:url';

import { ensureLocalBins, spawnLocalBin, waitForExit } from './dev-utils.mjs';

const compileArgs = [
  'compile',
  '--project',
  './frontend/project.inlang',
  '--outdir',
  './frontend/src/lib/paraglide',
  '--strategy',
  'custom-openspec-locale',
  'preferredLanguage',
  'baseLocale',
  '--emit-ts-declarations',
  '--no-emit-git-ignore',
  '--no-emit-prettier-ignore',
  '--no-emit-readme',
];

export async function compileI18n() {
  ensureLocalBins(['paraglide-js']);

  const child = spawnLocalBin('paraglide-js', compileArgs);
  const result = await waitForExit(child, 'paraglide-js compile');
  return result.code;
}

const isMain = process.argv[1] ? import.meta.url === pathToFileURL(process.argv[1]).href : false;

if (isMain) {
  process.exit(await compileI18n());
}
