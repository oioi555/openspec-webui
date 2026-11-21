# Tasks

## 1. Preparation

- [x] 1.1 After the other OpenSpec 2.x changes are archived, list the long requirements with `openspec validate --specs --strict --json`, and generate MODIFIED skeletons (the full current block) for each one into `specs/<capability>/spec.md` with a scratch script. Verify that the skeleton count equals the warning count.

## 2. Rewrite in batches

- [x] 2.1 Batch A: activity-bar, change-browsing, change-other-files, cli-runtime, client-project-binding, command-preferences. Shorten or split, then do the meaning check. Verify with `openspec validate split-long-spec-requirements --strict` showing no warning for these specs.
- [x] 2.2 Batch B: command-shortcuts, context-copy, explorer-item, explorer-pane, live-refresh, multi-project-sessions. Use the same procedure and verification.
- [x] 2.3 Batch C: openspec-cli-invocation, project-context, project-registry, project-selector-ui, project-version-status, runes-state-management. Use the same procedure and verification.
- [x] 2.4 Batch D: search, settings-view, shadcn-integration, shared-ui-parts, spec-browsing, store-discovery. Use the same procedure and verification.
- [x] 2.5 Batch E: store-relationships, tabbed-viewer, task-tracking, theme-management, tool-compatibility-reference, tool-integration-detection. Use the same procedure and verification.
- [x] 2.6 Batch F: tool-reference-maintenance, ui-localization, validation, versions-page. Use the same procedure and verification.

## 3. Verification

- [x] 3.1 Run `openspec validate split-long-spec-requirements --strict` and verify that it is valid with no warnings. Then archive into a scratch copy of the repository, and verify that `openspec validate --specs --strict` passes for all specs there.

## Notes

- Length check: `openspec validate` does not apply the 500-character rule to delta specs. Each batch was therefore checked with a scratch script that measures the statement (header to first `#### Scenario:`). The script was calibrated on main specs, where it reports the same 95 warnings as the CLI. Final result: 115 requirements, none over 500 characters.
- Meaning check: an independent reviewer compared the old and new clauses of all 95 requirements. It found nothing LOST or WEAKENED. Fixed:
  - client-project-binding: rebinding to the current project changes no refCount, which matches `handleProjectBind`. The "when the target differs" condition is restored to the statement (Haiku verify).
  - command-shortcuts: the visibility conditions apply per command.
  - shared-ui-parts: the stronger-elevation exception is restored to the statement.
- Accepted:
  - theme-management states "SHALL NOT define" legacy aliases, which matches the old intent and the code.
  - Split requirements keep their original scenarios, because a MODIFIED block cannot drop scenarios.
- Trial archive into a scratch copy: `openspec validate --specs --strict` reports 42 passed, 0 failed.
