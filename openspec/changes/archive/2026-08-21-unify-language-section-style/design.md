# Design: unify-language-section-style

## Context

The Language section (`SettingsView.svelte` L443-502) still has the original layout introduced by `support-v1-10-language-and-zed`. The other sections were unified by the earlier `unify-settings-section-styles` change:

- Docs link: left column of the SectionHeader, `Info` icon + docs_intro + `<a class="inline-flex items-center gap-1 underline hover:text-foreground">` + `ExternalLink class="h-3.5 w-3.5"`
- Label-plus-control rows: the Validation section's `flex items-start justify-between gap-4` pattern
- Tooltip: `$lib/components/ui/tooltip` (already used by ActivityBar: `Tooltip.Root / Trigger / Content`)

Constraint: adding new explanation text would require translating it into 7 locales, so the redesign must reuse existing i18n labels only.

## Goals / Non-Goals

**Goals**

- Align the Language section header and docs link with the conventions of the other sections
- Reduce vertical length: remove two description `<p>` elements and the independence Callout, and fold the three artifact-language sentences into a tooltip
- Achieve this with zero new i18n labels

**Non-Goals**

- Changing locale selector behavior or localeStore logic (unchanged)
- Changing the artifact-language command example (caption + command box + Copy) (unchanged)
- Touching other sections (general / tools / commands / validation / versions)

## Decisions

### Decision 1: SectionHeader composition

Current: the `SectionHeader` contains only the h2.
After: add a docs link `<p>` below the h2 (same structure as the Tools section):

```svelte
<SectionHeader>
  <h2 ...>{t(m.settings_section_language)}</h2>
  <p class="flex flex-wrap items-center gap-2 mt-1 text-sm text-muted-foreground">
    <Info class="h-5 w-5 shrink-0 text-info" />
    {t(m.docs_intro)}
    <a href={OPENSPEC_MULTI_LANGUAGE_DOCS_URL} target="_blank" rel="noopener noreferrer"
       class="inline-flex items-center gap-1 underline hover:text-foreground">
      {t(m.settings_language_docs)}
      <ExternalLink class="h-3.5 w-3.5" />
    </a>
  </p>
</SectionHeader>
```

- With a single link, no `·` separator is needed
- Remove the old body `<a>` (L475-483)
- docs_intro label: use the same label the Tools / Commands sections use (confirm `m.docs_intro` exists at implementation time; otherwise use the corresponding label)

**Alternative considered**: keep the docs link in the artifact block (proposal option C) → rejected by the user. Header placement is decided.

### Decision 2: WebUI display-language block = label + right-aligned selector row

Current: h3 + description p + Select (own full-width row) + Callout.
After: a label-plus-control row with a one-line description beneath:

```svelte
<div>
  <div class="flex items-center justify-between gap-4">
    <h3 class="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
      {t(m.settings_language_display_heading)}
    </h3>
    <Select.Root ...>
      <Select.Trigger class="w-full sm:w-64" aria-label={...}>...</Select.Trigger>
      ...
    </Select.Root>
  </div>
  <p class="mt-1 text-sm text-muted-foreground">{t(m.settings_language_description)}</p>
</div>
```

- Reuse the existing h3 label `settings_language_display_heading` and the one-line description `settings_language_description` (restored after the first cut left the block too sparse)
- Delete the Callout (`settings_language_independence`)
- Keep the Select trigger width `w-full sm:w-64` (full width below sm)
- No border around this row (do not put it into the Validation-style bordered list; a border around a single control would be excessive)

**Alternative considered**: place it inside a bordered list (`divide-y ... border`) → rejected as excessive for a single control.

### Decision 3: Artifact-language block = h3 + one-line description + `?` tooltip + command example

Add a `CircleHelp` icon (lucide, new import) to the h3 row. Keep the first sentence visible as a one-line body description and fold the remaining two sentences into the tooltip:

```svelte
<div>
  <div class="flex items-center gap-1.5">
    <h3 class="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
      {t(m.settings_language_artifact_heading)}
    </h3>
    <Tooltip.Root>
      <Tooltip.Trigger class="text-muted-foreground hover:text-foreground" aria-label={t(m.settings_language_artifact_heading)}>
        <CircleHelp class="h-4 w-4" />
      </Tooltip.Trigger>
      <Tooltip.Content class="max-w-xs">
        <div class="space-y-1 text-xs">
          <p>{t(m.settings_language_existing_project)}</p>
          <p>{t(m.settings_language_structural_keywords)}</p>
        </div>
      </Tooltip.Content>
    </Tooltip.Root>
  </div>
  <p class="mt-1 text-sm text-muted-foreground">{t(m.settings_language_artifact_description)}</p>
</div>
```

- Inside the tooltip use `space-y-1` + `text-xs` for tight spacing (per the user's instruction to keep the copied sentences as-is but tighten them). The first sentence (`artifact_description`) stays visible in the body to avoid the block reading as too sparse, so the tooltip carries only the two detail sentences
- The command example block (caption + `rounded-sm border bg-background` box + Copy) is unchanged
- Keep the `border-t border-border pt-5` separator between sub-blocks (visual separation of the two concerns)

**Alternative considered**: fold all three sentences into the tooltip → implemented first, but the body became too sparse; rejected after user feedback. Popover / Dialog → rejected as excessive for two sentences.

### Decision 4: i18n label handling

- Reused: `settings_language_display_heading`, `settings_language_description`, `settings_language_artifact_heading`, `settings_language_artifact_description`, `settings_language_existing_project`, `settings_language_structural_keywords`, `settings_language_docs`, docs_intro
- Removed in this change: `settings_language_independence` — deleted from all 7 locale message files and from the locale parity test key list, since the Callout it described was removed. The independence statement is superseded by the two labeled sub-blocks plus tooltip guidance.
  - The old spec requirement "clearly state that changing the WebUI display language does not edit..." as an always-visible statement is replaced by the two labeled sub-blocks plus tooltip guidance (see the delta spec)

## Risks / Trade-offs

- [Tooltips assume hover, reducing discoverability] → Indicated by the `?` icon plus aria-label. The spec treats help as nice-to-have, so this is acceptable
- [The independence note is no longer always visible] → The two labeled sub-blocks make the separation explicit, and the tooltip's first sentence states that artifact language is configured per project, avoiding any implication of synchronization
- [Removing text may break string-match assertions in settingsTab.test.ts] → Update those assertions to the new structure (Tooltip / right-aligned row / header docs link)
- [Build error if Tooltip is not imported] → Add `$lib/components/ui/tooltip` and `CircleHelp` to the imports. Verified by typecheck

## Migration Plan

This is a single-component markup change with no release-time migration. Rollback is a git revert.

## Open Questions

(none)
