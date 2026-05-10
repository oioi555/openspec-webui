import assert from 'node:assert/strict';
import { test } from 'node:test';

import { highlightDeltas, highlightSearchMatches, renderMarkdown } from './markdown';

test('highlightSearchMatches highlights literal matches case-insensitively while preserving original text', () => {
  const html = renderMarkdown('Hello world\n\nHELLO again');
  const highlighted = highlightSearchMatches(html, 'hello');

  assert.match(highlighted, /<mark class="search-highlight">Hello<\/mark>/);
  assert.match(highlighted, /<mark class="search-highlight">HELLO<\/mark>/);
});

test('highlightSearchMatches leaves metadata-only content unchanged when the query is absent from the markdown body', () => {
  const html = renderMarkdown('This document does not contain the filename match.');
  const highlighted = highlightSearchMatches(html, 'proposal.md');

  assert.equal(highlighted, html);
  assert.doesNotMatch(highlighted, /search-highlight/);
});

test('highlightSearchMatches does not inject marks into tag attributes', () => {
  const html = renderMarkdown('[Example](https://example.com/example)');
  const highlighted = highlightSearchMatches(html, 'example');

  assert.match(highlighted, /href="https:\/\/example\.com\/example"/);
  assert.match(highlighted, /<a href="https:\/\/example\.com\/example"><mark class="search-highlight">Example<\/mark><\/a>/);
});

test('highlightSearchMatches composes with diff highlighting', () => {
  const html = renderMarkdown('## ADDED Requirements');
  const highlighted = highlightSearchMatches(highlightDeltas(html), 'added');

  assert.match(highlighted, /class="diff-added"/);
  assert.match(highlighted, /<mark class="search-highlight">ADDED<\/mark> Requirements/);
});
