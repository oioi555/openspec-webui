## 1. Spec and copy plan

- [x] 1.1 Update the `project-selector-ui` delta spec to add empty-state onboarding guidance and add-project prerequisite messaging
- [x] 1.2 Add a `ui-localization` delta spec requirement for localizing the new onboarding guidance and error copy

## 2. Empty state and dialog guidance

- [x] 2.1 Update `frontend/src/lib/components/layout/EmptyProjectState.svelte` to explain the `openspec init` prerequisite and link to setup documentation
- [x] 2.2 Update `frontend/src/lib/components/layout/AddProjectDialog.svelte` with a concise init hint and clearer missing-`openspec/` error guidance

## 3. Multilingual copy

- [x] 3.1 Add new English source strings for the onboarding guidance in `frontend/messages/en.json`
- [x] 3.2 Translate the new onboarding strings in `frontend/messages/ja.json`, `frontend/messages/pt-BR.json`, `frontend/messages/es.json`, `frontend/messages/zh-CN.json`, `frontend/messages/fr.json`, and `frontend/messages/de.json`
- [x] 3.3 Regenerate and verify Paraglide output with `npm run i18n:compile`

## 4. Validation

- [x] 4.1 Run the targeted test/build checks and confirm the empty state, add-project hint, and translated guidance render correctly

## 5. Shared docs links follow-up

- [x] 5.1 Move OpenSpec documentation URL constants into a neutral shared frontend module and update onboarding surfaces to use it
- [x] 5.2 Update `frontend/src/lib/components/layout/SettingsModal.svelte` to reuse the shared OpenSpec docs URL constants
- [x] 5.3 Extend the change artifacts and regression tests to cover the shared docs URL reuse across onboarding and settings surfaces

## 6. Activity bar toggle fix (discovered during implementation)

- [x] 6.1 Extract explorer visibility and preset-toggle logic into `activityBarController.ts` with pure testable functions
- [x] 6.2 Fix the Activity Bar bottom control to stay inert when no project is active (no longer opens project selector)
- [x] 6.3 Make section-icon toggle responsive-aware: close drawer in narrow layout, collapse pane in wide layout
- [x] 6.4 Update the no-project bottom control tooltip to show the app name instead of a selector label
- [x] 6.5 Add `activityBarController.test.ts` covering explorer visibility and preset-toggle decisions
- [x] 6.6 Update `activity-bar`, `project-context`, and `tabbed-viewer` delta specs to reflect the corrected toggle semantics
