import assert from 'node:assert/strict';
import { test } from 'node:test';

import {
  OPENSPEC_INSTALL_DOCS_URL,
  OPENSPEC_STORES_GUIDE_URL,
  OPENSPEC_STORE_CLI_REFERENCE_URL,
} from './openspecDocs';

test('OPENSPEC_STORES_GUIDE_URL points to the official stores-beta user guide', () => {
  assert.equal(
    OPENSPEC_STORES_GUIDE_URL,
    'https://github.com/Fission-AI/OpenSpec/blob/main/docs/stores-beta/user-guide.md',
  );
});

test('OPENSPEC_STORE_CLI_REFERENCE_URL points to the official CLI stores section', () => {
  assert.equal(
    OPENSPEC_STORE_CLI_REFERENCE_URL,
    'https://github.com/Fission-AI/OpenSpec/blob/main/docs/cli.md#stores-standalone-openspec-repos',
  );
});

test('existing documentation URLs are unchanged', () => {
  assert.equal(OPENSPEC_INSTALL_DOCS_URL, 'https://github.com/Fission-AI/OpenSpec#quick-start');
});
