#!/usr/bin/env node

import { compileI18n } from './compile-i18n.mjs';
import { ensureLocalBins, spawnInRepo, waitForExit } from './dev-utils.mjs';

const testFiles = [
  'src/parser/changes.test.ts',
  'src/parser/index.test.ts',
  'src/parser/project.test.ts',
  'src/parser/specs.test.ts',
  'src/server/project-registry.test.ts',
  'src/server/server.integration.test.ts',
  'src/server/version-status.test.ts',
  'src/server/version-compare.test.ts',
  'src/server/skill-scanner.test.ts',
  'src/server/project-version-status.test.ts',
  'src/server/store-discovery.test.ts',
  'src/server/routes/api.test.ts',
  'src/server/openspec-config.test.ts',
  'src/server/tool-integration-detection.test.ts',
  'src/server/tool-compatibility-reference.test.ts',
  'src/server/tool-reference-data.test.ts',
  'src/cli/program.test.ts',
  'scripts/dev-args.test.mjs',
  'scripts/tool-reference-maintenance.test.mjs',
  'scripts/tool-reference-skill.test.mjs',
  'frontend/src/lib/state/theme.test.ts',
  'frontend/src/lib/state/uiPreferences.test.ts',
  'frontend/src/lib/state/projectSync.test.ts',
  'frontend/src/lib/state/searchCore.test.ts',
  'frontend/src/lib/state/storeDiscoveryCore.test.ts',
  'frontend/src/lib/state/validationCore.test.ts',
  'frontend/src/lib/state/validationAutoRunCore.test.ts',
  'frontend/src/lib/state/validationPreferencesCore.test.ts',
  'frontend/src/lib/state/projectsCore.test.ts',
  'frontend/src/lib/state/commandPreferencesCore.test.ts',
  'frontend/src/lib/state/localeCore.test.ts',
  'frontend/src/lib/state/versionStatusCore.test.ts',
  'frontend/src/lib/state/versionStatusRefresh.test.ts',
  'frontend/src/lib/state/projectVersionStatusCore.test.ts',
  'frontend/src/lib/state/projectVersionStatusRefresh.test.ts',
  'frontend/src/lib/locale.test.ts',
  'frontend/src/lib/markdown.test.ts',
  'frontend/src/lib/utils.test.ts',
  'frontend/src/lib/contextCopy.test.ts',
  'frontend/src/lib/commandShortcuts.test.ts',
  'frontend/src/lib/commandTypes.test.ts',
  'frontend/src/lib/toolChoices.test.ts',
  'frontend/src/lib/toolCompatibilityReference.test.ts',
  'frontend/src/lib/workflowMetadata.test.ts',
  'frontend/src/lib/api.test.ts',
  'frontend/src/lib/openspecDocs.test.ts',
  'frontend/src/lib/storeHelpers.test.ts',
  'frontend/src/lib/projectPlanningContext.test.ts',
  'frontend/src/lib/components/layout/activityBarController.test.ts',
  'frontend/src/lib/components/layout/AddProjectDialog.test.ts',
  'frontend/src/lib/components/layout/ProjectSelector.test.ts',
  'frontend/src/lib/components/layout/settingsTab.test.ts',
  'frontend/src/lib/components/layout/ToolCompatibilityDialog.test.ts',
  'frontend/src/lib/components/layout/searchPanel.test.ts',
  'frontend/src/lib/components/layout/validationPanel.test.ts',
  'frontend/src/lib/components/shared/CommandShortcutBar.test.ts',
  'frontend/src/lib/components/ui/dropdown-menu/menuNavigation.test.ts',
  'frontend/src/lib/views/dashboard.test.ts',
  'frontend/src/lib/views/dashboardStore.test.ts',
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
