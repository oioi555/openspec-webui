import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { test } from 'node:test';

import { ApiError } from '../../api';
import {
  OPENSPEC_COMMANDS_DOCS_URL,
  OPENSPEC_INSTALL_DOCS_URL,
  OPENSPEC_OPSX_REFERENCE_DOCS_URL,
  OPENSPEC_SETUP_DOCS_URL,
  OPENSPEC_SUPPORTED_TOOLS_DOCS_URL,
  OPENSPEC_WORKFLOWS_DOCS_URL,
} from '../../openspecDocs';
import {
  shouldShowProjectInitGuidance,
} from '../../projectOnboarding';

test('invalid-project init guidance only appears for missing OpenSpec initialization errors', () => {

  const missingInitError = new ApiError({
    status: 400,
    code: 'INVALID_PROJECT_PATH',
    message: 'OpenSpec project not found at /tmp/demo',
    metadata: { path: '/tmp/demo', openspecPath: '/tmp/demo/openspec' },
  });
  const missingPathError = new ApiError({
    status: 400,
    code: 'INVALID_PROJECT_PATH',
    message: 'Project root does not exist or is not a directory: /tmp/missing',
    metadata: { path: '/tmp/missing' },
  });

  assert.equal(
    shouldShowProjectInitGuidance(missingInitError, missingInitError.message),
    true,
    'guidance should show when the INVALID_PROJECT_PATH error means openspec init is missing'
  );
  assert.equal(
    shouldShowProjectInitGuidance(missingPathError, missingPathError.message),
    false,
    'guidance should stay hidden for missing-path or non-directory INVALID_PROJECT_PATH errors'
  );
  assert.equal(
    shouldShowProjectInitGuidance(null, 'OpenSpec project not found at /tmp/demo'),
    true,
    'guidance should still show when only the missing-init message string is available'
  );
  assert.equal(
    shouldShowProjectInitGuidance(null, 'Project root does not exist or is not a directory: /tmp/missing'),
    false,
    'guidance should stay hidden when only a missing-path or non-directory message string is available'
  );
});

test('project onboarding components share docs links and keep onboarding actions wired', async () => {
  const addProjectDialogSource = await readFile(new URL('./AddProjectDialog.svelte', import.meta.url), 'utf8');
  const emptyProjectStateSource = await readFile(new URL('./EmptyProjectState.svelte', import.meta.url), 'utf8');
  const settingsModalSource = await readFile(new URL('./SettingsModal.svelte', import.meta.url), 'utf8');

  assert.equal(OPENSPEC_INSTALL_DOCS_URL, 'https://github.com/Fission-AI/OpenSpec#quick-start');
  assert.equal(OPENSPEC_SETUP_DOCS_URL, 'https://github.com/Fission-AI/OpenSpec/blob/main/docs/cli.md#setup-commands');
  assert.equal(OPENSPEC_OPSX_REFERENCE_DOCS_URL, 'https://github.com/Fission-AI/OpenSpec/blob/main/docs/opsx.md');
  assert.equal(OPENSPEC_SUPPORTED_TOOLS_DOCS_URL, 'https://github.com/Fission-AI/OpenSpec/blob/main/docs/supported-tools.md');
  assert.equal(OPENSPEC_COMMANDS_DOCS_URL, 'https://github.com/Fission-AI/OpenSpec/blob/main/docs/commands.md');
  assert.equal(OPENSPEC_WORKFLOWS_DOCS_URL, 'https://github.com/Fission-AI/OpenSpec/blob/main/docs/workflows.md');

  for (const source of [addProjectDialogSource, emptyProjectStateSource]) {
    assert.match(source, /OPENSPEC_INSTALL_DOCS_URL/);
    assert.match(source, /OPENSPEC_SETUP_DOCS_URL/);
    assert.match(source, /t\(m\.docs_intro\)/);
  }

  for (const source of [settingsModalSource]) {
    assert.match(source, /OPENSPEC_OPSX_REFERENCE_DOCS_URL/);
    assert.match(source, /OPENSPEC_SUPPORTED_TOOLS_DOCS_URL/);
    assert.match(source, /OPENSPEC_COMMANDS_DOCS_URL/);
    assert.match(source, /OPENSPEC_WORKFLOWS_DOCS_URL/);
    assert.match(source, /t\(m\.docs_intro\)/);
  }

  assert.match(addProjectDialogSource, /shouldShowProjectInitGuidance/);
  assert.match(addProjectDialogSource, /t\(m\.add_project_init_hint\)/);
  assert.match(addProjectDialogSource, /t\(m\.add_project_invalid_project_guidance\)/);
  assert.match(addProjectDialogSource, /projectStore\.clearError\(\)/);
  assert.match(emptyProjectStateSource, /t\(m\.empty_project_init_hint\)/);
  assert.match(emptyProjectStateSource, /layoutStore\.openOverlay\('add-project'\)/);
  assert.match(settingsModalSource, /FIXED_LABELS\.settings\.docs\.opsxReference/);
  assert.match(settingsModalSource, /FIXED_LABELS\.settings\.docs\.supportedTools/);
  assert.match(settingsModalSource, /FIXED_LABELS\.settings\.docs\.commands/);
  assert.match(settingsModalSource, /FIXED_LABELS\.settings\.docs\.workflows/);
});
