import assert from 'node:assert/strict';
import { test } from 'node:test';

import * as docs from './openspecDocs';
import {
  OPENSPEC_DOCS_URLS,
  OPENSPEC_INIT_DOCS_URL,
  OPENSPEC_INSTALL_DOCS_URL,
  OPENSPEC_MULTI_LANGUAGE_DOCS_URL,
  OPENSPEC_SETUP_DOCS_URL,
  OPENSPEC_STORES_GUIDE_URL,
  OPENSPEC_STORE_CLI_REFERENCE_URL,
  OPENSPEC_SUPPORTED_TOOLS_DOCS_URL,
} from './openspecDocs';

const exportedUrls = Object.entries(docs)
  .filter(([name, value]) => name.endsWith('_URL') && typeof value === 'string')
  .map(([, value]) => value as string);

test('every documentation link targets the official openspec.dev docs site', () => {
  assert.ok(exportedUrls.length > 0);
  for (const url of exportedUrls) {
    assert.match(url, /^https:\/\/openspec\.dev\/docs\/[a-z0-9-]+(#[a-z0-9-]+)?$/, url);
  }
  assert.deepEqual([...OPENSPEC_DOCS_URLS].sort(), [...exportedUrls].sort());
});

test('no documentation link targets the retired /opsx reference', () => {
  for (const url of exportedUrls) {
    assert.equal(url.includes('docs/opsx.md'), false, url);
    assert.equal(/opsx/i.test(url), false, url);
  }
  assert.equal('OPENSPEC_OPSX_REFERENCE_DOCS_URL' in docs, false);
});

test('documentation links map to the current pages', () => {
  assert.equal(OPENSPEC_INSTALL_DOCS_URL, 'https://openspec.dev/docs/installation');
  assert.equal(OPENSPEC_SETUP_DOCS_URL, 'https://openspec.dev/docs/setup');
  assert.equal(OPENSPEC_INIT_DOCS_URL, 'https://openspec.dev/docs/cli#openspec-init');
  assert.equal(OPENSPEC_SUPPORTED_TOOLS_DOCS_URL, 'https://openspec.dev/docs/supported-tools');
  assert.equal(OPENSPEC_MULTI_LANGUAGE_DOCS_URL, 'https://openspec.dev/docs/cli#openspec-init');
  assert.equal(OPENSPEC_STORES_GUIDE_URL, 'https://openspec.dev/docs/stores');
  assert.equal(OPENSPEC_STORE_CLI_REFERENCE_URL, 'https://openspec.dev/docs/cli#openspec-store');
});
