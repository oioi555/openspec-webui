#!/usr/bin/env node

import {
  buildBootstrapEnv,
  ensureLocalBins,
  extractWrapperProjectArg,
  spawnInRepo,
  waitForExit,
} from './dev-utils.mjs';

ensureLocalBins(['tsx']);

const { forwardedArgs, projectArg } = extractWrapperProjectArg(process.argv.slice(2));
const serverEnv = buildBootstrapEnv(projectArg);
const child = spawnInRepo(process.execPath, ['--watch', '--import', 'tsx', 'src/cli/index.ts', ...forwardedArgs], {
  env: serverEnv,
});
const result = await waitForExit(child, 'node');
process.exit(result.code);
