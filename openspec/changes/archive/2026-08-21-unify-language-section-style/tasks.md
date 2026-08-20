# Tasks: unify-language-section-style

## 1. Add docs link to the SectionHeader

- [x] 1.1 In the Language section `SectionHeader` of `SettingsView.svelte`, add a docs link `<p>` directly below the h2 (`Info` icon + docs_intro label + `<a>` pointing to the `settings_language_docs` label + `ExternalLink`, classes `flex flex-wrap items-center gap-2 mt-1 text-sm text-muted-foreground`, `<a>` uses `inline-flex items-center gap-1 underline hover:text-foreground`) and verify it matches the Tools section structure
- [x] 1.2 Remove the old body docs link `<a>` (the standalone link to OPENSPEC_MULTI_LANGUAGE_DOCS_URL) and verify only the header link remains

## 2. Convert the WebUI display-language block to a label + right-aligned selector row

- [x] 2.1 Restructure the display-language block (h3 + description `<p>` + Select + Callout) into a single `flex items-center justify-between gap-4` row (h3 left, `Select.Root` right, trigger width `w-full sm:w-64` kept) and verify the `data-settings-section="language"` anchor and Select behavior (`setLocale`) are preserved
- [x] 2.2 Remove the `settings_language_description` description `<p>` and the `settings_language_independence` Callout

## 3. Convert the artifact-language block to a tooltip composition

- [x] 3.1 Add `$lib/components/ui/tooltip` and the lucide `CircleHelp` icon to the imports
- [x] 3.2 Restructure the artifact-language h3 row as `flex items-center gap-1.5` with a `CircleHelp` tooltip (`Tooltip.Root / Trigger / Content`, Content uses `max-w-xs` + `space-y-1 text-xs` showing the existing three sentences `settings_language_artifact_description` / `settings_language_existing_project` / `settings_language_structural_keywords`)
- [x] 3.3 Remove the two body description `<p>` elements and verify the command example block (caption + command box + Copy button) and the `border-t` separator between sub-blocks are unchanged

## 4. Restore one-line descriptions (post-review adjustment)

- [x] 4.1 Restore `settings_language_description` as a one-line body description (`mt-1 text-sm text-muted-foreground`) below the display-language label-plus-selector row
- [x] 4.2 Restore `settings_language_artifact_description` as a one-line body description below the artifact-language heading row, and reduce the tooltip content to the two detail sentences (`settings_language_existing_project` / `settings_language_structural_keywords`)
- [x] 4.3 Re-run `npm test` and `npm run typecheck` and update `settingsTab.test.ts` assertions if the restored descriptions or tooltip changes affect them; verify `settings_language_description` is used again and only `settings_language_independence` remains unused

## 5. Verification

- [x] 5.1 Visually verify the Language section in the dev server
