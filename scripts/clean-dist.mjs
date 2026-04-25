#!/usr/bin/env node

import { rm } from 'node:fs/promises';
import { join } from 'node:path';

import { repoRoot } from './dev-utils.mjs';

const targets = ['dist', 'dist-frontend'].map((entry) => join(repoRoot, entry));

await Promise.all(targets.map((target) => rm(target, { recursive: true, force: true })));
