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
  assert.match(highlighted, /<a href="https:\/\/example\.com\/example"[^>]*><mark class="search-highlight">Example<\/mark><\/a>/);
});

test('highlightSearchMatches composes with diff highlighting', () => {
  const html = renderMarkdown('## ADDED Requirements');
  const highlighted = highlightSearchMatches(highlightDeltas(html), 'added');

  assert.match(highlighted, /class="diff-added"/);
  assert.match(highlighted, /<mark class="search-highlight">ADDED<\/mark> Requirements/);
});

const LINK_CONTEXT = {
  sourcePath: '/repo/openspec/changes/add-auth/proposal.md',
  specs: [{ name: 'auth', path: '/repo/openspec/specs/auth' }],
  changes: [{ name: 'add-auth', path: '/repo/openspec/changes/add-auth' }],
};

test('renderMarkdown adds slug ids to headings with duplicate suffixes', () => {
  const html = renderMarkdown('### Requirement: User login\n\n### Requirement: User login');

  assert.match(html, /<h3 id="md-requirement-user-login">Requirement: User login<\/h3>/);
  assert.match(html, /<h3 id="md-requirement-user-login-1">/);
});

test('highlightDeltas still decorates delta headings that carry ids', () => {
  const html = highlightDeltas(renderMarkdown('## ADDED Requirements\n\n## REMOVED Requirements'));

  assert.match(html, /<h2 id="md-added-requirements" class="diff-added">ADDED Requirements<\/h2>/);
  assert.match(html, /<h2 id="md-removed-requirements" class="diff-removed">REMOVED Requirements<\/h2>/);
});

test('renderMarkdown opens external links in a new tab', () => {
  const html = renderMarkdown('[Docs](https://example.com/docs)');

  assert.match(html, /<a href="https:\/\/example\.com\/docs" target="_blank" rel="noopener noreferrer" data-md-link="external">Docs<\/a>/);
});

test('renderMarkdown drops the href of unsafe links', () => {
  const html = renderMarkdown('[x](javascript:alert(1))');

  assert.doesNotMatch(html, /javascript:/);
  assert.match(html, /<span class="md-link-disabled">x<\/span>/);
});

test('renderMarkdown keeps raw relative hrefs without a link context', () => {
  assert.match(renderMarkdown('[d](./design.md)'), /<a href="\.\/design\.md">d<\/a>/);
});

test('renderMarkdown rewrites in-app links to WebUI routes', () => {
  const html = renderMarkdown('[spec](../../specs/auth/spec.md) [tasks](./tasks.md) [top](#why)', { links: LINK_CONTEXT });

  assert.match(html, /<a href="\/specs\/auth" data-md-link="spec" data-md-route="\/specs\/auth">spec<\/a>/);
  assert.match(html, /<a href="\/changes\/add-auth" data-md-link="change" data-md-route="\/changes\/add-auth" data-md-change="add-auth" data-md-change-file="tasks\.md">tasks<\/a>/);
  assert.match(html, /<a href="#why" data-md-link="anchor" data-md-fragment="why">top<\/a>/);
});

test('renderMarkdown points local file links at the chosen editor', () => {
  const copyHtml = renderMarkdown('[code](../../../src/a.ts#L3)', { links: LINK_CONTEXT });
  assert.match(copyHtml, /href="file:\/\/\/repo\/src\/a\.ts"/);
  assert.match(copyHtml, /data-md-link="file" data-md-path="\/repo\/src\/a\.ts" data-md-line="3"/);

  const vscodeHtml = renderMarkdown('[code](../../../src/a.ts#L3)', { links: LINK_CONTEXT, openFilesWith: 'vscode' });
  assert.match(vscodeHtml, /href="vscode:\/\/file\/repo\/src\/a\.ts:3"/);
});

test('search highlighting keeps heading ids and link attributes intact', () => {
  const html = highlightSearchMatches(renderMarkdown('## auth notes\n\n[auth](../../specs/auth/spec.md)', { links: LINK_CONTEXT }), 'auth');

  assert.match(html, /<h2 id="md-auth-notes"><mark class="search-highlight">auth<\/mark> notes<\/h2>/);
  assert.match(html, /href="\/specs\/auth"/);
});
