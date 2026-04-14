import assert from 'node:assert/strict';
import { test } from 'node:test';

import {
  EMPTY_SELECTION_MESSAGE,
  buildCopySelectionResult,
  buildQuotedCopySelectionResult,
  getChangeViewerContextLabel,
  getSpecViewerContextLabel,
} from './contextCopy';

test('buildQuotedCopySelectionResult formats single-line quoted text', () => {
  assert.deepEqual(
    buildQuotedCopySelectionResult({
      sourceName: 'add-context-menu-copy',
      contextLabel: 'Specification',
      selection: 'Selected line',
    }),
    {
      ok: true,
      text: '> [add-context-menu-copy] Specification\n> Selected line',
    },
  );
});

test('buildQuotedCopySelectionResult formats multiline quoted text', () => {
  assert.deepEqual(
    buildQuotedCopySelectionResult({
      sourceName: 'add-context-menu-copy',
      contextLabel: 'Design',
      selection: 'Line one\nLine two',
    }),
    {
      ok: true,
      text: '> [add-context-menu-copy] Design\n> Line one\n> Line two',
    },
  );
});

test('copy selection helpers report empty selection', () => {
  assert.deepEqual(buildCopySelectionResult(''), {
    ok: false,
    error: EMPTY_SELECTION_MESSAGE,
  });

  assert.deepEqual(
    buildQuotedCopySelectionResult({
      sourceName: 'add-context-menu-copy',
      contextLabel: 'Specification',
      selection: '',
    }),
    {
      ok: false,
      error: EMPTY_SELECTION_MESSAGE,
    },
  );
});

test('getChangeViewerContextLabel prefers spec delta capability', () => {
  assert.equal(
    getChangeViewerContextLabel({
      activeFileName: 'proposal.md',
      deltaCapability: 'context-copy',
    }),
    'context-copy',
  );
});

test('getChangeViewerContextLabel falls back to active file name', () => {
  assert.equal(getChangeViewerContextLabel({ activeFileName: 'design.md' }), 'design.md');
});

test('getSpecViewerContextLabel returns specification and design labels', () => {
  assert.equal(getSpecViewerContextLabel('spec'), 'Specification');
  assert.equal(getSpecViewerContextLabel('design'), 'Design');
});
