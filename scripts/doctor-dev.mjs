#!/usr/bin/env node

import { execFileSync } from 'child_process';
import { listMissingLocalBins, repoRoot } from './dev-utils.mjs';

const requiredBins = ['tsx', 'tsc', 'vite', 'svelte-check'];
const missingBins = listMissingLocalBins(requiredBins);

console.log(`Node.js: ${process.version}`);
console.log(`Wrapper bootstrap project: ${process.env.OPENSPEC_INITIAL_PROJECT?.trim() || repoRoot}`);
console.log('Project bootstrap override: npm run dev -- /path/to/project or OPENSPEC_INITIAL_PROJECT=/path/to/project');
console.log('App URL: http://127.0.0.1:3001');
console.log('Debug inspector: ws://127.0.0.1:9229');

if (missingBins.length > 0) {
  console.log('');
  console.error(`Missing local dev tools: ${missingBins.join(', ')}`);
  console.error('Run: npm run setup:dev');
  process.exit(1);
}

console.log('Local dev dependencies: OK');

try {
  const version = execFileSync('openspec', ['--version'], { encoding: 'utf8' }).trim();
  console.log(`OpenSpec CLI: ${version}`);
} catch {
  console.log('OpenSpec CLI: not found (expanded command availability UI will be disabled)');
}
