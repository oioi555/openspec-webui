## Context

The app currently shows an empty state when no projects are registered, but it does not explain the `openspec init` prerequisite or point users to the right setup docs. Since ProjectSelector only lists projects that already have OpenSpec initialized, first-time users can get stuck before they ever reach an actionable project.

The change is mostly UI copy and guidance, but it touches multiple frontend surfaces and translation catalogs:

1. `EmptyProjectState.svelte` — first-screen onboarding surface
2. `AddProjectDialog.svelte` — concise prerequisite reminder and error guidance
3. `SettingsModal.svelte` — existing documentation links in workflow / commands settings
4. `frontend/messages/*.json` — localized guidance strings across all supported locales

## Goals / Non-Goals

**Goals:**
- Make the empty state the primary onboarding entry point
- Explain that repositories must be initialized with `openspec init`
- Link users to setup docs instead of leaving them stranded
- Keep AddProjectDialog brief and action-oriented
- Localize all new guidance copy in the existing i18n pipeline
- Keep OpenSpec documentation URLs centralized so onboarding and settings surfaces cannot drift

**Non-Goals:**
- No automatic CLI execution from the browser
- No change to project registry semantics or selection rules
- No new onboarding wizard or multi-step flow
- No new backend APIs

## Decisions

### Decision 1: EmptyProjectState is the main onboarding surface

**Choice**: Put the most explanatory copy in `EmptyProjectState`, not in ProjectSelector or AddProjectDialog.

**Rationale**: It is the first and largest screen for users with no active project, so it is the best place to teach the setup model once.

**Alternative considered**: Put the guidance only in AddProjectDialog. Rejected because it is narrower and appears later in the flow.

### Decision 2: Use docs links, not an in-app initializer

**Choice**: Link to OpenSpec installation and CLI setup docs instead of trying to run or simulate `openspec init` inside the app.

**Rationale**: `openspec init` is a human/terminal command and setup requires repository context that the browser cannot safely assume.

**Alternative considered**: Add an in-app init wizard. Rejected because it would duplicate CLI behavior and increase scope significantly.

### Decision 3: AddProjectDialog stays concise

**Choice**: Add a short prerequisite hint and clearer error copy in the dialog, but keep the main explanation in the empty state.

**Rationale**: The dialog is a narrower interaction surface; it should reinforce the prerequisite without becoming a tutorial.

**Alternative considered**: Put the full explanation in the dialog. Rejected because the layout is cramped and the empty state already has more room.

### Decision 4: Localize the new guidance strings through existing catalogs

**Choice**: Add new message keys in the existing Paraglide catalogs for all supported locales.

**Rationale**: The app already uses locale catalogs for UI copy, and this guidance is user-facing text that should behave the same way.

**Alternative considered**: Keep the guidance English-only. Rejected because it would undermine the localization work already in place.

### Decision 5: Centralize OpenSpec docs URLs in a neutral helper

**Choice**: Store the OpenSpec documentation URLs in a shared, neutral module instead of keeping onboarding-only constants.

**Rationale**: The same docs links already appear in Settings, so a neutral helper avoids URL drift without coupling Settings to onboarding-specific logic.

**Alternative considered**: Keep docs URLs in `projectOnboarding.ts`. Rejected because Settings also uses the same docs links and should not depend on onboarding naming.

## Risks / Trade-offs

- **[Too much copy in the empty state]** → Keep the explanation short, add links, and avoid a long checklist.
- **[Link rot]** → Prefer stable docs pages such as the README quick-start and CLI setup section.
- **[Docs URL drift across surfaces]** → Keep URLs in one shared module and reuse them from onboarding and Settings.
- **[Translation drift]** → Add the guidance to the same catalog pipeline used by the rest of the app so all locales stay in sync.
- **[User still skips the docs]** → Reinforce the prerequisite again in AddProjectDialog error copy.

## Migration Plan

No data migration is required. This change is additive UI and copy work.

## Open Questions

- Should the empty-state links point to both the README quick-start and the CLI setup section, or only the CLI setup section?
- Should the add-project hint be dismissible, or always visible while the dialog is open?

### Decision 6: Extract activity bar toggle logic into a pure controller

**Choice**: Move explorer visibility and preset-toggle decisions out of the ActivityBar component into `activityBarController.ts` with pure functions that accept explicit context objects instead of reaching into stores directly.

**Rationale**: The toggle logic was tangled with store access and conditional branches for responsive modes, making it hard to reason about and test. Pure functions with explicit inputs are independently testable and keep the Svelte component focused on rendering.

**Alternative considered**: Keep the logic inline in the component. Rejected because the branching was already causing bugs (the no-project state incorrectly opened the project selector).

### Decision 7: Bottom control is inert without an active project

**Choice**: When no project is active, the bottom Activity Bar control shows the app icon as a non-navigational identity marker. It does not open the project selector or toggle the Explorer Pane.

**Rationale**: The empty state already provides a clear add-project button with full onboarding guidance. Having the Activity Bar bottom control also open the project selector was redundant and confusing — users expected it to toggle explorer visibility, not navigate.

**Alternative considered**: Keep opening the project selector. Rejected because it created a misleading interaction pattern where the same control did two different things depending on project state.

### Decision 8: Section toggle is responsive-aware

**Choice**: When the operator clicks the currently active section icon, the explorer surface closes in the current responsive layout: drawer toggle in narrow mode, pane collapse in wide mode.

**Rationale**: The previous implementation only collapsed the pane in wide layout, ignoring the narrow drawer entirely. The fix makes toggle behavior consistent across layouts.

**Alternative considered**: Always collapse the pane. Rejected because in narrow layout the explorer is a drawer overlay, not a collapsible pane.
