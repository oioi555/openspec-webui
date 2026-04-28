import assert from 'node:assert/strict';
import { test } from 'node:test';

import {
  getPlanningContextNotice,
  getPlanningContextDisplayState,
  isInvalidPlanningContext,
  isParsedPlanningContext,
} from './projectPlanningContext';
import { FIXED_LABELS } from './uiText';

test('getPlanningContextNotice returns warning for migration-needed state', () => {
  assert.deepEqual(
    getPlanningContextNotice({
      migrationState: 'migration-needed',
      planningContext: {
        source: { path: '/tmp/config.yaml', type: 'config' },
        status: 'parsed',
        aiContext: '',
        artifactRules: [],
        workflowSchema: '',
      },
    }),
    {
    variant: 'warning',
    title: FIXED_LABELS.dashboard.migrationNeeded,
    }
  );
});

test('getPlanningContextNotice returns info for legacy-present state', () => {
  assert.deepEqual(
    getPlanningContextNotice({
      migrationState: 'legacy-present',
      planningContext: {
        source: { path: '/tmp/config.yaml', type: 'config' },
        status: 'parsed',
        aiContext: 'ctx',
        artifactRules: [],
        workflowSchema: 'default',
      },
    }),
    {
    variant: 'info',
    title: FIXED_LABELS.dashboard.legacyDetected,
    }
  );
});

test('getPlanningContextNotice returns null variant for config-only state', () => {
  assert.deepEqual(
    getPlanningContextNotice({
      migrationState: 'config-only',
      planningContext: {
        source: { path: '/tmp/config.yaml', type: 'config' },
        status: 'parsed',
        aiContext: 'ctx',
        artifactRules: [],
        workflowSchema: 'default',
      },
    }),
    {
    variant: null,
    title: '',
    }
  );
});

test('getPlanningContextNotice returns error for invalid planning context', () => {
  assert.deepEqual(
    getPlanningContextNotice({
      migrationState: 'config-only',
      planningContext: {
        source: { path: '/tmp/config.yaml', type: 'config' },
        status: 'invalid',
        rawConfig: 'context: broken',
        parseErrors: ['Unexpected scalar'],
      },
    }),
    {
      variant: 'error',
      title: FIXED_LABELS.dashboard.invalidConfig,
    }
  );
});

test('planning context type guards discriminate parsed and invalid states', () => {
  const parsed = {
    source: { path: '/tmp/config.yaml', type: 'config' as const },
    status: 'parsed' as const,
    aiContext: 'ctx',
    artifactRules: [],
    workflowSchema: 'default',
  };
  const invalid = {
    source: { path: '/tmp/config.yaml', type: 'config' as const },
    status: 'invalid' as const,
    rawConfig: 'context: broken',
    parseErrors: ['Unexpected scalar'],
  };

  assert.equal(isParsedPlanningContext(parsed), true);
  assert.equal(isInvalidPlanningContext(parsed), false);
  assert.equal(isParsedPlanningContext(invalid), false);
  assert.equal(isInvalidPlanningContext(invalid), true);
});

test('getPlanningContextDisplayState returns invalid fallback payload for malformed config', () => {
  const state = getPlanningContextDisplayState({
    migrationState: 'config-only',
    planningContext: {
      source: { path: '/tmp/config.yaml', type: 'config' },
      status: 'invalid',
      rawConfig: 'context: "Broken "quote" content"\n',
      parseErrors: ['Unexpected scalar at node end at line 1, column 19'],
    },
  });

  assert.equal(state.kind, 'invalid');
  assert.equal(state.notice.variant, 'error');
  assert.equal(state.sourcePath, '/tmp/config.yaml');
  assert.equal(state.rawConfig, 'context: "Broken "quote" content"\n');
  assert.deepEqual(state.parseErrors, ['Unexpected scalar at node end at line 1, column 19']);
});
