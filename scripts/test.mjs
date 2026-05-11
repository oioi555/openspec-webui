#!/usr/bin/env node

import { compileI18n } from './compile-i18n.mjs';
import { ensureLocalBins, spawnInRepo, waitForExit } from './dev-utils.mjs';

const testFiles = [
  'src/parser/changes.test.ts',
  'src/parser/index.test.ts',
  'src/parser/project.test.ts',
  'src/server/project-registry.test.ts',
  'src/server/server.integration.test.ts',
  'src/server/version-status.test.ts',
  'src/cli/program.test.ts',
  'scripts/dev-args.test.mjs',
  'frontend/src/lib/state/theme.test.ts',
  'frontend/src/lib/state/uiPreferences.test.ts',
  'frontend/src/lib/state/projectSync.test.ts',
  'frontend/src/lib/state/searchCore.test.ts',
  'frontend/src/lib/state/validationCore.test.ts',
  'frontend/src/lib/state/projectsCore.test.ts',
  'frontend/src/lib/state/commandPreferencesCore.test.ts',
  'frontend/src/lib/state/localeCore.test.ts',
  'frontend/src/lib/state/versionStatusCore.test.ts',
  'frontend/src/lib/locale.test.ts',
  'frontend/src/lib/markdown.test.ts',
  'frontend/src/lib/utils.test.ts',
  'frontend/src/lib/contextCopy.test.ts',
  'frontend/src/lib/commandShortcuts.test.ts',
  'frontend/src/lib/projectPlanningContext.test.ts',
  'frontend/src/lib/components/layout/activityBarController.test.ts',
  'frontend/src/lib/components/layout/AddProjectDialog.test.ts',
  'frontend/src/lib/components/layout/settingsTab.test.ts',
  'frontend/src/lib/components/layout/searchPanel.test.ts',
  'frontend/src/lib/components/layout/validationPanel.test.ts',
  'scripts/dev-utils.test.mjs',
];

ensureLocalBins(['tsx']);

const compileExitCode = await compileI18n();
if (compileExitCode !== 0) {
  process.exit(compileExitCode);
}

const child = spawnInRepo(process.execPath, ['--import', 'tsx', '--test', ...testFiles]);
const result = await waitForExit(child, 'node --import tsx --test');
process.exit(result.code);
