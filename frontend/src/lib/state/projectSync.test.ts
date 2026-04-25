import assert from 'node:assert/strict';
import { test } from 'node:test';

import {
  handleProjectBoundMessage,
  handleProjectContextMessage,
  reinitializeProjectScopedState,
} from './projectSync';

function createActions(options: {
  overlay?: string | null;
  currentActiveProjectId?: string | null;
  announcedActiveProjectId?: string | null;
  messageType?: 'project:bound' | 'connection:init';
  shouldIgnoreRefreshUntilBound?: boolean;
} = {}) {
  const calls: string[] = [];

  return {
    calls,
    actions: {
      overlay: options.overlay ?? null,
      closeOverlay: () => {
        calls.push('closeOverlay');
      },
      prepareProjectScopedRefresh: () => {
        calls.push('prepareProjectScopedRefresh');
      },
      clearProjectScopedSearchState: () => {
        calls.push('clearProjectScopedSearchState');
      },
      resetTabsToDashboard: () => {
        calls.push('resetTabsToDashboard');
      },
      initializeData: async () => {
        calls.push('initializeData');
      },
      refreshCommandAvailability: async () => {
        calls.push('refreshCommandAvailability');
      },
      currentActiveProjectId: options.currentActiveProjectId ?? null,
      announcedActiveProjectId: options.announcedActiveProjectId ?? null,
      shouldIgnoreRefreshUntilBound: options.shouldIgnoreRefreshUntilBound,
      messageType: options.messageType ?? 'project:bound',
    },
  };
}

test('project bound reinitialization closes the selector, resets tabs to Dashboard, and refreshes availability', async () => {
  const { actions, calls } = createActions({
    overlay: 'project-selector',
    messageType: 'project:bound',
  });

  await reinitializeProjectScopedState(actions);

  assert.deepEqual(calls, [
    'closeOverlay',
    'prepareProjectScopedRefresh',
    'clearProjectScopedSearchState',
    'resetTabsToDashboard',
    'initializeData',
    'refreshCommandAvailability',
  ]);
});

test('connection:init reinitializes project-scoped state when the active project changed during reconnect', async () => {
  const { actions, calls } = createActions({
    messageType: 'connection:init',
    currentActiveProjectId: 'project-a',
    announcedActiveProjectId: 'project-b',
  });

  const reinitialized = await handleProjectContextMessage(actions);

  assert.equal(reinitialized, true);
  assert.deepEqual(calls, [
    'prepareProjectScopedRefresh',
    'clearProjectScopedSearchState',
    'resetTabsToDashboard',
    'initializeData',
    'refreshCommandAvailability',
  ]);
});

test('connection:init ignores reconnect messages when the active project is already in sync', async () => {
  const { actions, calls } = createActions({
    messageType: 'connection:init',
    currentActiveProjectId: 'project-a',
    announcedActiveProjectId: 'project-a',
  });

  const reinitialized = await handleProjectContextMessage(actions);

  assert.equal(reinitialized, false);
  assert.deepEqual(calls, []);
});

test('connection:init skips reinitialization while waiting for project:bound after restore bind', async () => {
  const { actions, calls } = createActions({
    messageType: 'connection:init',
    currentActiveProjectId: 'project-a',
    announcedActiveProjectId: 'project-b',
    shouldIgnoreRefreshUntilBound: true,
  });

  const reinitialized = await handleProjectContextMessage(actions);

  assert.equal(reinitialized, false);
  assert.deepEqual(calls, []);
});

test('project:bound completes pending bind only after project-scoped refresh finishes', async () => {
  const calls: string[] = [];

  await handleProjectBoundMessage({
    overlay: 'project-selector',
    activeProjectId: 'project-a',
    wasIgnoringRefreshUntilBound: true,
    stopIgnoringRefreshUntilBound: () => {
      calls.push('stopIgnoringRefreshUntilBound');
    },
    applyProjectBound: () => {
      calls.push('applyProjectBound');
    },
    completeProjectBound: () => {
      calls.push('completeProjectBound');
    },
    closeOverlay: () => {
      calls.push('closeOverlay');
    },
    prepareProjectScopedRefresh: () => {
      calls.push('prepareProjectScopedRefresh');
    },
    clearProjectScopedSearchState: () => {
      calls.push('clearProjectScopedSearchState');
    },
    resetTabsToDashboard: () => {
      calls.push('resetTabsToDashboard');
    },
    initializeData: async () => {
      calls.push('initializeData');
    },
    refreshCommandAvailability: async () => {
      calls.push('refreshCommandAvailability');
    },
  });

  assert.deepEqual(calls, [
    'applyProjectBound',
    'stopIgnoringRefreshUntilBound',
    'closeOverlay',
    'prepareProjectScopedRefresh',
    'clearProjectScopedSearchState',
    'resetTabsToDashboard',
    'initializeData',
    'refreshCommandAvailability',
    'completeProjectBound',
  ]);
});

test('project:bound still completes pending bind when refresh fails', async () => {
  const calls: string[] = [];

  await assert.rejects(() =>
    handleProjectBoundMessage({
      overlay: null,
      activeProjectId: 'project-a',
      applyProjectBound: () => {
        calls.push('applyProjectBound');
      },
      completeProjectBound: () => {
        calls.push('completeProjectBound');
      },
      closeOverlay: () => {
        calls.push('closeOverlay');
      },
      prepareProjectScopedRefresh: () => {
        calls.push('prepareProjectScopedRefresh');
      },
      clearProjectScopedSearchState: () => {
        calls.push('clearProjectScopedSearchState');
      },
      resetTabsToDashboard: () => {
        calls.push('resetTabsToDashboard');
      },
      initializeData: async () => {
        calls.push('initializeData');
        throw new Error('refresh failed');
      },
      refreshCommandAvailability: async () => {
        calls.push('refreshCommandAvailability');
      },
    })
  );

  assert.deepEqual(calls, [
    'applyProjectBound',
    'prepareProjectScopedRefresh',
    'clearProjectScopedSearchState',
    'resetTabsToDashboard',
    'initializeData',
    'completeProjectBound',
  ]);
});
