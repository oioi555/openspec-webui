import assert from 'node:assert/strict';
import { test } from 'node:test';

import { createArtifactValidationScheduler, isRelevantArtifactRefresh } from './validationAutoRunCore';

type RelevantRefreshMessage = Parameters<typeof isRelevantArtifactRefresh>[0];

// ---------------------------------------------------------------------------
// Unit tests for the artifact-change auto-run scheduler and refresh filter.
// These tests do not mount Svelte components and do not use fake timers;
// debounce behavior is verified via synchronous assertion on testable helpers.
// ---------------------------------------------------------------------------

// --- Helpers ---

function makeCause(type: string, path: string): NonNullable<RelevantRefreshMessage['cause']> {
  return {
    type: type as NonNullable<RelevantRefreshMessage['cause']>['type'],
    path,
  };
}

function makeMessage(entity: string, cause?: RelevantRefreshMessage['cause'] | null): RelevantRefreshMessage {
  return {
    entity: entity as RelevantRefreshMessage['entity'],
    cause: cause ?? undefined,
  };
}

// --- isRelevantArtifactRefresh ---

test('isRelevantArtifactRefresh returns false for null/undefined/missing cause', () => {
  assert.equal(isRelevantArtifactRefresh(makeMessage('specs', undefined as any)), false);
  assert.equal(isRelevantArtifactRefresh(makeMessage('changes', null as any)), false);
  assert.equal(isRelevantArtifactRefresh({ entity: 'specs' }), false);
});

test('isRelevantArtifactRefresh returns false for non-md paths', () => {
  assert.equal(isRelevantArtifactRefresh(makeMessage('specs', makeCause('change', '/specs/foo.ts'))), false);
  assert.equal(isRelevantArtifactRefresh(makeMessage('changes', makeCause('add', '/changes/bar.json'))), false);
});

test('isRelevantArtifactRefresh accepts only add/change/unlink event types', () => {
  assert.equal(isRelevantArtifactRefresh(makeMessage('specs', makeCause('add', '/specs/foo.md'))), true);
  assert.equal(isRelevantArtifactRefresh(makeMessage('specs', makeCause('change', '/specs/foo.md'))), true);
  assert.equal(isRelevantArtifactRefresh(makeMessage('specs', makeCause('unlink', '/specs/foo.md'))), true);
  assert.equal(isRelevantArtifactRefresh(makeMessage('specs', makeCause('rename', '/specs/foo.md'))), false);
  assert.equal(isRelevantArtifactRefresh(makeMessage('specs', makeCause('unknown', '/specs/foo.md'))), false);
});

test('isRelevantArtifactRefresh requires /specs/ or /changes/ path segment', () => {
  // Paths with a leading slash before specs/changes are valid
  assert.equal(isRelevantArtifactRefresh(makeMessage('specs', makeCause('add', '/specs/foo.md'))), true);
  assert.equal(isRelevantArtifactRefresh(makeMessage('specs', makeCause('add', 'project/specs/foo.md'))), true);
  // Paths without /specs/ or /changes/ segment are rejected
  assert.equal(isRelevantArtifactRefresh(makeMessage('specs', makeCause('add', '/other/foo.md'))), false);
  assert.equal(isRelevantArtifactRefresh(makeMessage('specs', makeCause('add', 'specs/foo.md'))), false, 'needs leading / before specs/');
});

test('isRelevantArtifactRefresh rejects changes under /changes/archive/', () => {
  assert.equal(isRelevantArtifactRefresh(makeMessage('changes', makeCause('add', '/changes/archive/foo.md'))), false);
  assert.equal(isRelevantArtifactRefresh(makeMessage('changes', makeCause('change', '/changes/archive/foo.md'))), false);
  assert.equal(isRelevantArtifactRefresh(makeMessage('changes', makeCause('unlink', '/changes/archive/foo.md'))), false);
});

test('isRelevantArtifactRefresh accepts changes outside archive', () => {
  assert.equal(isRelevantArtifactRefresh(makeMessage('changes', makeCause('add', '/changes/auto-validate/foo.md'))), true);
  assert.equal(isRelevantArtifactRefresh(makeMessage('changes', makeCause('change', '/changes/add-feature/proposal.md'))), true);
  assert.equal(isRelevantArtifactRefresh(makeMessage('changes', makeCause('unlink', '/changes/remove-feature/design.md'))), true);
});

test('isRelevantArtifactRefresh rejects events not related to specs or changes entity', () => {
  assert.equal(isRelevantArtifactRefresh(makeMessage('project', makeCause('change', '/specs/foo.md'))), false);
  assert.equal(isRelevantArtifactRefresh(makeMessage('stats', makeCause('change', '/changes/foo/proposal.md'))), false);
  assert.equal(isRelevantArtifactRefresh(makeMessage('unknown', makeCause('add', '/specs/foo.md'))), false);
});

test('isRelevantArtifactRefresh normalizes backslash path separators', () => {
  assert.equal(isRelevantArtifactRefresh(makeMessage('specs', makeCause('change', '\\specs\\foo.md'))), true);
  assert.equal(isRelevantArtifactRefresh(makeMessage('changes', makeCause('add', 'C:\\projects\\changes\\foo\\proposal.md'))), true);
  assert.equal(isRelevantArtifactRefresh(makeMessage('changes', makeCause('add', 'C:\\projects\\changes\\archive\\foo.md'))), false);
});

// --- createArtifactValidationScheduler ---

test('scheduler schedule() returns false when no project is active', () => {
  const scheduler = createArtifactValidationScheduler({
    getProjectId: () => null,
    isAutoRunEnabled: () => true,
    isValidationLoading: () => false,
    refreshValidation: () => {},
  });

  assert.equal(scheduler.handleRefreshMessage(makeMessage('specs', makeCause('add', '/specs/foo.md'))), false);
});

test('scheduler schedule() returns false when auto-run is disabled', () => {
  const scheduler = createArtifactValidationScheduler({
    getProjectId: () => 'project-a',
    isAutoRunEnabled: () => false,
    isValidationLoading: () => false,
    refreshValidation: () => {},
  });

  assert.equal(scheduler.handleRefreshMessage(makeMessage('specs', makeCause('add', '/specs/foo.md'))), false);
});

test('scheduler schedule() returns false for irrelevant messages', () => {
  const scheduler = createArtifactValidationScheduler({
    getProjectId: () => 'project-a',
    isAutoRunEnabled: () => true,
    isValidationLoading: () => false,
    refreshValidation: () => {},
  });

  assert.equal(scheduler.handleRefreshMessage(makeMessage('project', makeCause('change', '/specs/foo.md'))), false);
  assert.equal(scheduler.handleRefreshMessage(makeMessage('changes', makeCause('rename', '/changes/foo/proposal.md'))), false);
});

test('scheduler schedule() returns true and debounces within the same project', () => {
  let refreshCalled = false;
  const setTimeoutFn = (callback: () => void, _delay: number) => {
    // Store callback but don't execute - we'll test debounce via cancel
    scheduledCallbacks.push(callback);
    return 123 as unknown as ReturnType<typeof setTimeout>;
  };
  const clearTimeoutFn = (_handle: ReturnType<typeof setTimeout>) => {
    cleared = true;
  };
  const scheduledCallbacks: Array<() => void> = [];
  let cleared = false;

  const scheduler = createArtifactValidationScheduler({
    getProjectId: () => 'project-a',
    isAutoRunEnabled: () => true,
    isValidationLoading: () => false,
    refreshValidation: () => { refreshCalled = true; },
    setTimeoutFn,
    clearTimeoutFn,
  });

  // First message schedules
  assert.equal(scheduler.handleRefreshMessage(makeMessage('specs', makeCause('add', '/specs/foo.md'))), true);

  // Second message within debounce window resets the timer (cancels previous)
  cleared = false;
  assert.equal(scheduler.handleRefreshMessage(makeMessage('changes', makeCause('change', '/changes/bar/proposal.md'))), true);
  assert.equal(cleared, true, 'Previous debounce timer should be cleared on new schedule');
});

test('scheduler cancels pending work when project changes via syncProject', () => {
  let projectId: string | null = 'project-a';
  let refreshCalled = false;
  let clearCalled = false;

  const setTimeoutFn = (callback: () => void, _delay: number) => {
    return 456 as unknown as ReturnType<typeof setTimeout>;
  };
  const clearTimeoutFn = (_handle: ReturnType<typeof setTimeout>) => {
    clearCalled = true;
  };

  const scheduler = createArtifactValidationScheduler({
    getProjectId: () => projectId,
    isAutoRunEnabled: () => true,
    isValidationLoading: () => false,
    refreshValidation: () => { refreshCalled = true; },
    setTimeoutFn,
    clearTimeoutFn,
  });

  // Schedule with project-a
  scheduler.handleRefreshMessage(makeMessage('specs', makeCause('add', '/specs/foo.md')));

  // Switch project
  projectId = 'project-b';
  assert.equal(scheduler.syncProject(), true, 'syncProject should detect project change');
  assert.equal(clearCalled, true, 'pending timer should be cleared on project switch');
});

test('scheduler does not refresh when validation is already loading, retries after debounce', () => {
  let validationLoading = false;
  let refreshCalled = false;
  let flushTriggered = false;

  const setTimeoutFn = (callback: () => void, _delay: number) => {
    if (_delay > 0 && !flushTriggered) {
      flushTriggered = true;
      // Simulate debounce expiry - will retry because loading
      validationLoading = true;
      callback();
    } else if (_delay > 0 && flushTriggered) {
      // Second retry - loading cleared
      validationLoading = false;
      callback();
    }
    return 789 as unknown as ReturnType<typeof setTimeout>;
  };
  const clearTimeoutFn = () => {};

  const scheduler = createArtifactValidationScheduler({
    getProjectId: () => 'project-a',
    isAutoRunEnabled: () => true,
    isValidationLoading: () => validationLoading,
    refreshValidation: () => { refreshCalled = true; },
    setTimeoutFn,
    clearTimeoutFn,
  });

  scheduler.handleRefreshMessage(makeMessage('specs', makeCause('add', '/specs/foo.md')));
  assert.equal(flushTriggered, true, 'flush should have been reached');
  assert.equal(refreshCalled, true, 'refresh should eventually be called after loading clears');
});

test('scheduler handleRefreshMessage returns false for irrelevant messages without side effects', () => {
  let refreshCalled = false;
  const scheduler = createArtifactValidationScheduler({
    getProjectId: () => 'project-a',
    isAutoRunEnabled: () => true,
    isValidationLoading: () => false,
    refreshValidation: () => { refreshCalled = true; },
  });

  assert.equal(scheduler.handleRefreshMessage(makeMessage('specs', makeCause('rename', '/specs/foo.md'))), false);
  assert.equal(refreshCalled, false, 'refresh should not be called for irrelevant messages');

  assert.equal(scheduler.handleRefreshMessage(makeMessage('changes', makeCause('add', '/changes/archive/done/proposal.md'))), false);
  assert.equal(refreshCalled, false, 'refresh should not be called for archived changes');
});
