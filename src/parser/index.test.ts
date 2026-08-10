import assert from 'node:assert/strict';
import { test } from 'node:test';

import type { OpenSpecData } from './index.js';
import { searchOpenSpec } from './index.js';

function createOpenSpecData(): OpenSpecData {
  return {
    project: {
      name: 'Demo Workspace',
      description: 'Demo workspace',
      path: '/workspace/demo/openspec/config.yaml',
      content: '# OpenSpec Planning Context\n\nWorkspace planning context.',
      planningContext: {
        source: {
          path: '/workspace/demo/openspec/config.yaml',
          type: 'config',
        },
        status: 'parsed',
        aiContext: 'Workspace planning context.',
        artifactRules: [],
        workflowSchema: 'spec-driven',
      },
      legacyProjectDoc: null,
      migrationState: 'config-only',
      pointerStoreId: null,
      referenceStoreIds: [],
    },
    specs: [
      {
        name: 'dashboard-change-sorting',
        path: '/workspace/demo/openspec/specs/dashboard-change-sorting',
        specContent: '## Purpose\n\nSort dashboard cards by date.',
        lastModified: null,
      },
      {
        name: 'priority-check',
        path: '/workspace/demo/openspec/specs/priority-check',
        specContent: '## Purpose\n\nPriority search content should win over metadata matches.',
        lastModified: null,
      },
      {
        name: 'network/auth',
        path: '/workspace/demo/openspec/specs/network/auth',
        specContent: '## Purpose\n\nNested auth spec with unique nested body content.',
        lastModified: null,
      },
    ],
    changes: {
      active: [
        {
          name: 'active-search',
          path: '/workspace/demo/openspec/changes/active-search',
          isArchived: false,
          archivedDate: null,
          proposal: '## Why\n\nThis change updates navigation behavior.',
          tasks: [],
          tasksRaw: '- [ ] Follow the navigation plan.',
          taskProgress: {
            done: 0,
            total: 0,
            percentage: 0,
          },
          design: '## Design\n\nScroll search hits into view from the design tab.',
          specDeltas: [
            {
              capability: 'search',
              content: '## MODIFIED Requirements\n\nThe delta search hit should expand automatically.',
              operations: [],
            },
          ],
          lastModified: null,
          files: [
            {
              name: 'proposal',
              path: 'proposal.md',
              absolutePath: '/workspace/demo/openspec/changes/active-search/proposal.md',
              type: 'markdown',
              folder: 'root',
              content: '## Why\n\nThis change updates navigation behavior.',
            },
            {
              name: 'tasks',
              path: 'tasks.md',
              absolutePath: '/workspace/demo/openspec/changes/active-search/tasks.md',
              type: 'markdown',
              folder: 'root',
              content: '- [ ] Follow the navigation plan.',
            },
            {
              name: 'design',
              path: 'design.md',
              absolutePath: '/workspace/demo/openspec/changes/active-search/design.md',
              type: 'markdown',
              folder: 'root',
              content: '## Design\n\nScroll search hits into view from the design tab.',
            },
            {
              name: 'notes',
              path: 'notes/summary.md',
              absolutePath: '/workspace/demo/openspec/changes/active-search/notes/summary.md',
              type: 'markdown',
              folder: 'notes',
              content: '## Notes\n\nAuxiliary notes live here.',
            },
          ],
          fileGroups: [
            {
              name: 'Proposal',
              folder: '',
              files: [
                {
                  name: 'proposal',
                  path: 'proposal.md',
                  absolutePath: '/workspace/demo/openspec/changes/active-search/proposal.md',
                  type: 'markdown',
                  folder: 'root',
                  content: '## Why\n\nThis change updates navigation behavior.',
                },
              ],
              isCore: true,
            },
            {
              name: 'Tasks',
              folder: '',
              files: [
                {
                  name: 'tasks',
                  path: 'tasks.md',
                  absolutePath: '/workspace/demo/openspec/changes/active-search/tasks.md',
                  type: 'markdown',
                  folder: 'root',
                  content: '- [ ] Follow the navigation plan.',
                },
              ],
              isCore: true,
            },
            {
              name: 'Design',
              folder: '',
              files: [
                {
                  name: 'design',
                  path: 'design.md',
                  absolutePath: '/workspace/demo/openspec/changes/active-search/design.md',
                  type: 'markdown',
                  folder: 'root',
                  content: '## Design\n\nScroll search hits into view from the design tab.',
                },
              ],
              isCore: true,
            },
            {
              name: 'Notes',
              folder: 'notes',
              files: [
                {
                  name: 'notes',
                  path: 'notes/summary.md',
                  absolutePath: '/workspace/demo/openspec/changes/active-search/notes/summary.md',
                  type: 'markdown',
                  folder: 'notes',
                  content: '## Notes\n\nAuxiliary notes live here.',
                },
              ],
              isCore: false,
            },
          ],
          otherFiles: [
            {
              name: 'revisions.json',
              path: 'revisions.json',
              absolutePath: '/workspace/demo/openspec/changes/active-search/revisions.json',
              type: 'json',
              content: '{"note":"Search in other files"}',
            },
          ],
          otherFileCount: 1,
        },
      ],
      archived: [],
    },
    stats: {
      totalSpecs: 2,
      activeChanges: 1,
      archivedChanges: 0,
      overallTaskProgress: {
        done: 0,
        total: 0,
        percentage: 0,
      },
    },
  };
}

test('searchOpenSpec returns a spec for metadata name matches', () => {
  const results = searchOpenSpec(createOpenSpecData(), 'dashboard-change-sorting');

  assert.deepEqual(results, [
    {
      type: 'spec',
      name: 'dashboard-change-sorting',
      path: '/workspace/demo/openspec/specs/dashboard-change-sorting',
      excerpt: 'dashboard-change-sorting',
      matchLine: 0,
      matchSource: 'name',
    },
  ]);
});

test('searchOpenSpec returns a change for metadata path matches', () => {
  const results = searchOpenSpec(createOpenSpecData(), 'openspec/changes/active-search/proposal.md');

  assert.deepEqual(results, [
    {
      type: 'change',
      name: 'active-search',
      path: '/workspace/demo/openspec/changes/active-search',
      excerpt: 'openspec/changes/active-search/proposal.md',
      matchLine: 0,
      matchSource: 'path',
    },
  ]);
});

test('searchOpenSpec returns first-hit routing metadata for change design content matches', () => {
  const results = searchOpenSpec(createOpenSpecData(), 'scroll search hits');

  assert.equal(results.length, 1);
  assert.equal(results[0]?.name, 'active-search');
  assert.equal(results[0]?.matchSource, 'content');
  assert.deepEqual(results[0]?.matchLocation, { fileGroupName: 'Design' });
  assert.match(results[0]?.excerpt ?? '', /Scroll search hits into view from the design tab/);
});

test('searchOpenSpec returns first-hit routing metadata for change spec delta content matches', () => {
  const results = searchOpenSpec(createOpenSpecData(), 'delta search hit');

  assert.equal(results.length, 1);
  assert.equal(results[0]?.name, 'active-search');
  assert.equal(results[0]?.matchSource, 'content');
  assert.deepEqual(results[0]?.matchLocation, { specDeltaCapability: 'search' });
});

test('searchOpenSpec preserves metadata-only change matches without body-hit routing metadata', () => {
  const results = searchOpenSpec(createOpenSpecData(), 'notes/summary.md');

  assert.equal(results.length, 1);
  assert.equal(results[0]?.name, 'active-search');
  assert.equal(results[0]?.matchSource, 'path');
  assert.equal(results[0]?.matchLocation, undefined);
});

test('searchOpenSpec returns routing metadata for change other file content matches', () => {
  const results = searchOpenSpec(createOpenSpecData(), 'other files');

  assert.equal(results.length, 1);
  assert.equal(results[0]?.name, 'active-search');
  assert.equal(results[0]?.matchSource, 'content');
  assert.deepEqual(results[0]?.matchLocation, { otherFilePath: 'revisions.json' });
});

test('searchOpenSpec prefers content excerpts and does not duplicate metadata matches', () => {
  const results = searchOpenSpec(createOpenSpecData(), 'priority');

  assert.equal(results.length, 1);
  assert.equal(results[0]?.name, 'priority-check');
  assert.equal(results[0]?.matchSource, 'content');
  assert.match(results[0]?.excerpt ?? '', /Priority search content should win/);
});

test('searchOpenSpec returns a nested spec for body content matches', () => {
  const results = searchOpenSpec(createOpenSpecData(), 'nested auth spec');

  assert.equal(results.length, 1);
  assert.equal(results[0]?.type, 'spec');
  assert.equal(results[0]?.name, 'network/auth');
  assert.equal(results[0]?.matchSource, 'content');
  assert.match(results[0]?.excerpt ?? '', /Nested auth spec/);
});

test('searchOpenSpec returns a nested spec for path metadata matches', () => {
  const results = searchOpenSpec(createOpenSpecData(), 'openspec/specs/network/auth/spec.md');

  assert.equal(results.length, 1);
  assert.equal(results[0]?.type, 'spec');
  assert.equal(results[0]?.name, 'network/auth');
  assert.equal(results[0]?.path, '/workspace/demo/openspec/specs/network/auth');
  assert.equal(results[0]?.matchSource, 'path');
  assert.equal(results[0]?.excerpt, 'openspec/specs/network/auth/spec.md');
});

test('searchOpenSpec returns a nested spec for name metadata matches', () => {
  const results = searchOpenSpec(createOpenSpecData(), 'network/auth');

  assert.equal(results.length, 1);
  assert.equal(results[0]?.type, 'spec');
  assert.equal(results[0]?.name, 'network/auth');
  assert.equal(results[0]?.matchSource, 'name');
});

test('searchOpenSpec does not duplicate a nested spec matching both body and metadata', () => {
  const results = searchOpenSpec(createOpenSpecData(), 'nested');

  // `nested` appears in the nested spec body and in its path metadata, but
  // must be returned exactly once.
  const nestedResults = results.filter((result) => result.name === 'network/auth');
  assert.equal(nestedResults.length, 1);
  assert.equal(nestedResults[0]?.matchSource, 'content');
});
