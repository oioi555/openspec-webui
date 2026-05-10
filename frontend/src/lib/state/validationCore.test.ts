import assert from 'node:assert/strict';
import { test } from 'node:test';

import type { ValidationResult } from '$lib/types/api';

import {
  createDefaultValidationState,
  createValidationController,
  createValidationRequestTracker,
  deriveValidationDashboardSummary,
  deriveValidationItemStatus,
  deriveValidationTargetSummary,
  findValidationItemByTypeAndName,
  shouldResetValidationState,
} from './validationCore';

const dashboardCopy = {
  notRunPrimaryValue: 'Not run',
  notRunDescription: 'Run validation from the panel.',
  runningPrimaryValue: 'Running…',
  runningDescription: 'Checking the latest workspace state.',
  passedPrimaryValue: 'Passed',
  passedDescription: (lastRun: string | null) => lastRun ? `Last run ${lastRun}` : 'All checks passed.',
  failedPrimaryValue: (failedCount: number) => `${failedCount} failed`,
  failedDescription: (failedCount: number, lastRun: string | null) =>
    lastRun ? `${failedCount} items failed • ${lastRun}` : `${failedCount} items failed`,
  unknownPrimaryValue: 'Unknown',
  unknownDescription: (error: string | null) => error ? `Validation unavailable: ${error}` : 'Validation unavailable.',
} as const;

function createValidationResult(status: ValidationResult['status'], runAt: string): ValidationResult {
  const failed = status === 'failed' ? 1 : 0;
  return {
    status,
    items: [],
    failedItems: [],
    issueItems: [],
    summary: {
      totalItems: 0,
      passed: 0,
      failed,
      issueItems: 0,
      statusCounts: {
        passed: 0,
        info: 0,
        warning: 0,
        failed,
      },
      severityCounts: {
        ERROR: 0,
        WARNING: 0,
        INFO: 0,
      },
    },
    runAt,
  };
}

function createValidationSummary(items: ValidationResult['items']): ValidationResult['summary'] {
  const statusCounts = {
    passed: 0,
    info: 0,
    warning: 0,
    failed: 0,
  };
  const severityCounts = {
    ERROR: 0,
    WARNING: 0,
    INFO: 0,
  };

  for (const item of items) {
    statusCounts[item.status] += 1;
    for (const issue of item.issues) {
      severityCounts[issue.level] += 1;
    }
  }

  return {
    totalItems: items.length,
    passed: statusCounts.passed,
    failed: statusCounts.failed,
    issueItems: items.filter((item) => item.issueCount > 0 || item.issues.length > 0).length,
    statusCounts,
    severityCounts,
  };
}

function createValidationItem(overrides: Partial<ValidationResult['failedItems'][number]> = {}) {
  const item = {
    id: 'activity-bar',
    name: 'activity-bar',
    type: 'spec' as const,
    valid: false,
    issueCount: 1,
    issues: [
      {
        level: 'ERROR' as const,
        path: 'file',
        message: 'Missing section',
      },
    ],
    ...overrides,
  };

  return {
    ...item,
    status: overrides.status ?? deriveValidationItemStatus(item),
  };
}

test('default validation state starts empty and idle', () => {
  assert.deepEqual(createDefaultValidationState(), {
    projectId: null,
    loading: false,
    result: null,
    error: null,
    latestRunAt: null,
  });
});

test('validation request tracker invalidates stale responses', () => {
  const tracker = createValidationRequestTracker();

  const first = tracker.beginRequest();
  const second = tracker.beginRequest();

  assert.equal(tracker.isCurrent(first), false);
  assert.equal(tracker.isCurrent(second), true);

  tracker.invalidate();

  assert.equal(tracker.isCurrent(second), false);
});

test('validation state reset is project scoped', () => {
  assert.equal(shouldResetValidationState('project-a', 'project-a'), false);
  assert.equal(shouldResetValidationState('project-a', 'project-b'), true);
  assert.equal(shouldResetValidationState('project-a', null), true);
  assert.equal(shouldResetValidationState(null, 'project-a'), true);
});

test('validation result shape can represent pass and fail runs', () => {
  const passed = createValidationResult('passed', '2026-05-08T00:00:00.000Z');
  const failed = createValidationResult('failed', '2026-05-08T00:01:00.000Z');

  assert.equal(passed.status, 'passed');
  assert.equal(passed.runAt, '2026-05-08T00:00:00.000Z');
  assert.equal(failed.status, 'failed');
  assert.equal(failed.summary.failed, 1);
});

test('validation dashboard summary derives not-run, running, passed, failed, and unknown states', () => {
  const notRun = deriveValidationDashboardSummary(
    {
      loading: false,
      result: null,
      error: null,
      latestRunAt: null,
    },
    { copy: dashboardCopy },
  );

  assert.deepEqual(notRun, {
    state: 'not-run',
    primaryValue: 'Not run',
    description: 'Run validation from the panel.',
    failedCount: 0,
    iconVariant: 'muted',
  });

  const running = deriveValidationDashboardSummary(
    {
      loading: true,
      result: createValidationResult('failed', '2026-05-08T00:00:00.000Z'),
      error: null,
      latestRunAt: '2026-05-08T00:00:00.000Z',
    },
    { copy: dashboardCopy },
  );

  assert.deepEqual(running, {
    state: 'running',
    primaryValue: 'Running…',
    description: 'Checking the latest workspace state.',
    failedCount: 0,
    iconVariant: 'warning',
  });

  const passed = deriveValidationDashboardSummary(
    {
      loading: false,
      result: createValidationResult('passed', '2026-05-08T00:01:00.000Z'),
      error: null,
      latestRunAt: '2026-05-08T00:01:00.000Z',
    },
    {
      copy: dashboardCopy,
      formatLastRun: (value) => value === '2026-05-08T00:01:00.000Z' ? 'May 8' : value,
    },
  );

  assert.deepEqual(passed, {
    state: 'passed',
    primaryValue: 'Passed',
    description: 'Last run May 8',
    failedCount: 0,
    iconVariant: 'success',
  });

  const failed = deriveValidationDashboardSummary(
    {
      loading: false,
      result: {
        ...createValidationResult('failed', '2026-05-08T00:02:00.000Z'),
        summary: {
          totalItems: 7,
          passed: 4,
          failed: 3,
          issueItems: 3,
          statusCounts: {
            passed: 4,
            info: 0,
            warning: 0,
            failed: 3,
          },
          severityCounts: {
            ERROR: 3,
            WARNING: 0,
            INFO: 0,
          },
        },
      },
      error: null,
      latestRunAt: '2026-05-08T00:02:00.000Z',
    },
    {
      copy: dashboardCopy,
      formatLastRun: () => 'just now',
    },
  );

  assert.deepEqual(failed, {
    state: 'failed',
    primaryValue: '3 failed',
    description: '3 items failed • just now',
    failedCount: 3,
    iconVariant: 'danger',
  });

  const unknown = deriveValidationDashboardSummary(
    {
      loading: false,
      result: null,
      error: 'CLI unavailable',
      latestRunAt: null,
    },
    { copy: dashboardCopy },
  );

  assert.deepEqual(unknown, {
    state: 'unknown',
    primaryValue: 'Unknown',
    description: 'Validation unavailable: CLI unavailable',
    failedCount: 0,
    iconVariant: 'warning',
  });
});

test('validation controller handles loading, success, failure, project change, and stale responses', async () => {
  let activeProjectId: string | null = 'project-a';
  let queue: Array<Promise<ValidationResult>> = [];

  const controller = createValidationController({
    getProjectId: () => activeProjectId,
    runValidation: async () => {
      const next = queue.shift();
      if (!next) {
        throw new Error('missing validation response');
      }

      return next;
    },
    getErrorMessage: (cause) => cause instanceof Error ? cause.message : 'Validation failed',
  });

  const passed = createValidationResult('passed', '2026-05-08T00:00:00.000Z');
  queue.push(Promise.resolve(passed));

  const successPromise = controller.refresh();
  assert.equal(controller.state.loading, true);
  await successPromise;
  assert.equal(controller.state.loading, false);
  assert.equal(controller.state.result?.status, 'passed');
  assert.equal(controller.state.latestRunAt, passed.runAt);

  queue.push(Promise.reject(new Error('boom')));
  await controller.refresh();
  assert.equal(controller.state.error, 'boom');
  assert.equal(controller.state.result?.status, 'passed');

  activeProjectId = 'project-b';
  assert.equal(controller.syncProject(), true);
  assert.equal(controller.state.projectId, 'project-b');
  assert.equal(controller.state.result, null);
  assert.equal(controller.state.latestRunAt, null);

  let resolveFirst!: (value: ValidationResult) => void;
  let resolveSecond!: (value: ValidationResult) => void;
  queue = [
    new Promise((resolve) => {
      resolveFirst = resolve;
    }),
    new Promise((resolve) => {
      resolveSecond = resolve;
    }),
  ];

  const firstRefresh = controller.refresh();
  const secondRefresh = controller.refresh();

  const latest = createValidationResult('failed', '2026-05-08T00:01:00.000Z');
  const stale = createValidationResult('passed', '2026-05-08T00:02:00.000Z');

  resolveSecond(latest);
  await secondRefresh;
  if (!controller.state.result) {
    throw new Error('expected latest result');
  }
  const latestResult: ValidationResult = controller.state.result;
  assert.equal(latestResult.status, 'failed');
  assert.equal(controller.state.latestRunAt, latest.runAt);

  resolveFirst(stale);
  await firstRefresh;
  if (!controller.state.result) {
    throw new Error('expected stale-protected result');
  }
  const staleProtectedResult: ValidationResult = controller.state.result;
  assert.equal(staleProtectedResult.status, 'failed');
  assert.equal(controller.state.latestRunAt, latest.runAt);

  activeProjectId = null;
  await controller.refresh();
  assert.equal(controller.state.error, 'No active project selected');
});

test('validation item paths are navigable by name for specs and changes', () => {
  const specItem = createValidationItem();
  const changeItem = createValidationItem({ type: 'change', name: 'add-validation-panel' });
  const unknownItem = createValidationItem({ type: 'unknown', name: '' });

  const specPath = `/specs/${encodeURIComponent(specItem.name)}`;
  const changePath = `/changes/${encodeURIComponent(changeItem.name)}`;

  assert.equal(specPath, '/specs/activity-bar');
  assert.equal(changePath, '/changes/add-validation-panel');
  assert.equal(unknownItem.type === 'spec' || unknownItem.type === 'change', false);
  assert.equal(Boolean(unknownItem.name), false);
});

test('validation item lookup matches type and name for specs and changes', () => {
  const specItem = createValidationItem({ id: 'spec-1', name: 'activity-bar', type: 'spec', valid: false });
  const changeItem = createValidationItem({ id: 'change-1', name: 'add-validation-panel', type: 'change', valid: true, issueCount: 0, issues: [] });
  const result: ValidationResult = {
    status: 'failed',
    items: [specItem, changeItem],
    failedItems: [specItem],
    issueItems: [specItem],
    summary: createValidationSummary([specItem, changeItem]),
    runAt: '2026-05-08T00:03:00.000Z',
  };

  assert.equal(findValidationItemByTypeAndName(result, { type: 'spec', name: 'activity-bar' }), specItem);
  assert.equal(findValidationItemByTypeAndName(result, { type: 'change', name: 'add-validation-panel' }), changeItem);
  assert.equal(findValidationItemByTypeAndName(result, { type: 'change', name: 'activity-bar' }), null);
});

test('validation target summary supports failed, warning, passed, stale, and not-run states', () => {
  const failedSpec = createValidationItem({
    id: 'spec-1',
    name: 'activity-bar',
    type: 'spec',
    valid: false,
    issueCount: 2,
    issues: [
      { level: 'ERROR', path: 'spec.md', message: 'Missing requirement' },
      { level: 'WARNING', path: 'spec.md', message: 'Needs scenario' },
    ],
  });
  const passedChange = createValidationItem({
    id: 'change-1',
    name: 'add-validation-panel',
    type: 'change',
    valid: true,
    issueCount: 0,
    issues: [],
  });
  const warningSpec = createValidationItem({
    id: 'spec-2',
    name: 'signal-parity-rcicombin',
    type: 'spec',
    valid: true,
    issueCount: 1,
    issues: [
      { level: 'WARNING', path: 'overview', message: 'Purpose section is too brief' },
    ],
  });
  const infoSpec = createValidationItem({
    id: 'spec-3',
    name: 'search',
    type: 'spec',
    valid: true,
    issueCount: 1,
    issues: [
      { level: 'INFO', path: 'requirements[0]', message: 'Long requirement' },
    ],
  });
  const result: ValidationResult = {
    status: 'failed',
    items: [failedSpec, passedChange, warningSpec, infoSpec],
    failedItems: [failedSpec],
    issueItems: [failedSpec, warningSpec, infoSpec],
    summary: createValidationSummary([failedSpec, passedChange, warningSpec, infoSpec]),
    runAt: '2026-05-08T00:04:00.000Z',
  };

  assert.deepEqual(
    deriveValidationTargetSummary(
      { result, error: null, latestRunAt: result.runAt },
      { type: 'spec', name: 'activity-bar' },
    ),
    {
      state: 'failed',
      item: failedSpec,
      issueCount: 2,
      issues: failedSpec.issues,
      lastRunAt: '2026-05-08T00:04:00.000Z',
    },
  );

  assert.deepEqual(
    deriveValidationTargetSummary(
      { result, error: null, latestRunAt: result.runAt },
      { type: 'spec', name: 'signal-parity-rcicombin' },
    ),
    {
      state: 'warning',
      item: warningSpec,
      issueCount: 1,
      issues: warningSpec.issues,
      lastRunAt: '2026-05-08T00:04:00.000Z',
    },
  );

  assert.deepEqual(
    deriveValidationTargetSummary(
      { result, error: null, latestRunAt: result.runAt },
      { type: 'change', name: 'add-validation-panel' },
    ),
    {
      state: 'passed',
      item: passedChange,
      issueCount: 0,
      issues: [],
      lastRunAt: '2026-05-08T00:04:00.000Z',
    },
  );

  assert.deepEqual(
    deriveValidationTargetSummary(
      { result, error: null, latestRunAt: result.runAt },
      { type: 'spec', name: 'search' },
    ),
    {
      state: 'info',
      item: infoSpec,
      issueCount: 1,
      issues: infoSpec.issues,
      lastRunAt: '2026-05-08T00:04:00.000Z',
    },
  );

  assert.deepEqual(
    deriveValidationTargetSummary(
      { result, error: null, latestRunAt: result.runAt },
      { type: 'spec', name: 'missing-spec' },
    ),
    {
      state: 'stale',
      item: null,
      issueCount: 0,
      issues: [],
      lastRunAt: '2026-05-08T00:04:00.000Z',
    },
  );

  assert.deepEqual(
    deriveValidationTargetSummary(
      { result: null, error: null, latestRunAt: null },
      { type: 'spec', name: 'activity-bar' },
    ),
    {
      state: 'not-run',
      item: null,
      issueCount: 0,
      issues: [],
      lastRunAt: null,
    },
  );
});

test('deriveValidationItemStatus returns warning when valid=false but only WARNING issues exist', () => {
  assert.equal(
    deriveValidationItemStatus({
      valid: false,
      issues: [{ level: 'WARNING', path: 'requirements[0]', message: 'Needs review' }],
    }),
    'warning',
  );
});

test('deriveValidationItemStatus returns info when valid=false but only INFO issues exist', () => {
  assert.equal(
    deriveValidationItemStatus({
      valid: false,
      issues: [{ level: 'INFO', path: 'overview', message: 'Consider expanding' }],
    }),
    'info',
  );
});

test('deriveValidationItemStatus returns failed when valid=false with no issues', () => {
  assert.equal(
    deriveValidationItemStatus({
      valid: false,
      issues: [],
    }),
    'failed',
  );
});

test('deriveValidationItemStatus returns failed when valid=false and ERROR issues exist', () => {
  assert.equal(
    deriveValidationItemStatus({
      valid: false,
      issues: [
        { level: 'WARNING', path: 'requirements[0]', message: 'Needs review' },
        { level: 'ERROR', path: 'file', message: 'Missing required section' },
      ],
    }),
    'failed',
  );
});

test('deriveValidationItemStatus returns warning when valid=true with only WARNING issues', () => {
  assert.equal(
    deriveValidationItemStatus({
      valid: true,
      issues: [{ level: 'WARNING', path: 'requirements[0]', message: 'Needs review' }],
    }),
    'warning',
  );
});

test('deriveValidationItemStatus returns passed when valid=true with no issues', () => {
  assert.equal(
    deriveValidationItemStatus({
      valid: true,
      issues: [],
    }),
    'passed',
  );
});

test('validation target summary returns unknown when no result is available because validation failed to load', () => {
  assert.deepEqual(
    deriveValidationTargetSummary(
      { result: null, error: 'CLI unavailable', latestRunAt: null },
      { type: 'change', name: 'add-validation-panel' },
    ),
    {
      state: 'unknown',
      item: null,
      issueCount: 0,
      issues: [],
      lastRunAt: null,
    },
  );
});
