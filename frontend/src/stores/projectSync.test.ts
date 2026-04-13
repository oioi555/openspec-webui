import assert from 'node:assert/strict';
import { test } from 'node:test';

import {
  handleProjectContextMessage,
  reinitializeProjectScopedState,
} from './projectSync';

function createActions(options: {
  overlay?: string | null;
  currentActiveProjectId?: string | null;
  announcedActiveProjectId?: string | null;
  messageType?: 'project:switched' | 'connection:init';
} = {}) {
  const calls: string[] = [];

  return {
    calls,
    actions: {
      overlay: options.overlay ?? null,
      closeOverlay: () => {
        calls.push('closeOverlay');
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
      messageType: options.messageType ?? 'project:switched',
    },
  };
}

test('project switch reinitialization closes the selector, resets tabs to Dashboard, and refreshes availability', async () => {
  const { actions, calls } = createActions({
    overlay: 'project-selector',
    messageType: 'project:switched',
  });

  await reinitializeProjectScopedState(actions);

  assert.deepEqual(calls, [
    'closeOverlay',
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
