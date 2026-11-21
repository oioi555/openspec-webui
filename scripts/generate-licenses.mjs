#!/usr/bin/env node

import { pathToFileURL } from 'node:url';

import { ensureLocalBins, spawnLocalBin, waitForExit } from './dev-utils.mjs';

const licenseArgs = [
  '--input',
  'package.json',
  '--output',
  'ThirdPartyNotices.txt',
  '--overwrite',
  '--eol',
  'lf',
  '--ci',
];

export async function generateLicenses() {
  ensureLocalBins(['generate-license-file']);

  const child = spawnLocalBin('generate-license-file', licenseArgs);
  const result = await waitForExit(child, 'generate-license-file');
  return result.code;
}

const isMain = process.argv[1] ? import.meta.url === pathToFileURL(process.argv[1]).href : false;

if (isMain) {
  process.exit(await generateLicenses());
}
