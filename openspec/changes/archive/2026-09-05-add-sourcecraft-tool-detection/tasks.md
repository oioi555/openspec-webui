## 1. Invocation Form Contract

- [x] 1.1 Add the `skill-prompt` invocation-form id to the synchronized server and frontend contracts, API parsing, and server example generation; verify contract-completeness and serialization tests accept the new form while rejecting unknown forms.
- [x] 1.2 Extend declarative invocation rendering with a trailing literal and change-argument connector, then render `use the openspec-<skill> skill` and ` for <change-name>` for `skill-prompt`; verify command shortcut unit tests cover workspace and change-scoped output and preserve all existing form outputs.

## 2. SourceCraft Detection And Availability

- [x] 2.1 Add `codeassistant` to the code-owned detector allowlist so its command and skill signatures resolve from the pinned v1.12.0 definition; verify detector tests cover command-only, skill-only, dual-delivery, workflow inventories, examples, source paths, and empty-directory non-detection.
- [x] 2.2 Expose SourceCraft through command availability and supported tool options without adding SourceCraft-specific response fields; verify API and server integration tests report its inventories and prefer `opsx-dash` when Commands are available.
- [x] 2.3 Generate installed-only grouped SourceCraft choices with Commands-first behavior and `skill-prompt` fallback; verify frontend tool-choice tests cover command-backed `/opsx-*`, skill-only natural-language prompts, change names, grouping, and absence of synthetic candidates.

## 3. Verification

- [x] 3.1 Run the focused detector, API, command shortcut, and tool-choice test files and verify all SourceCraft scenarios pass without changing existing tool behavior.
- [x] 3.2 Run `npm test`, `npm run typecheck`, and `npm run build`; verify the full test suite, TypeScript/Svelte checks, and production build complete successfully.
- [x] 3.3 Run `openspec validate add-sourcecraft-tool-detection --strict`; verify the completed implementation remains consistent with this Change.
