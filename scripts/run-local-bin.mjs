#!/usr/bin/env node

import { ensureLocalBins, spawnLocalBin, waitForExit } from './dev-utils.mjs';

const [binName, ...args] = process.argv.slice(2);

if (!binName) {
  console.error('Usage: node ./scripts/run-local-bin.mjs <bin> [args...]');
  process.exit(1);
}

ensureLocalBins([binName]);

const child = spawnLocalBin(binName, args);
const result = await waitForExit(child, binName);
process.exit(result.code);
