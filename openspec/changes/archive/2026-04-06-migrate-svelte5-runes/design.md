## Context

The project's frontend (19 `.svelte` components, 5 store modules) runs on Svelte 5 (`^5.16.1`) but uses exclusively Svelte 4 legacy syntax:

- **Stores**: All state uses `writable()` from `svelte/store` with `$store` auto-subscription in components
- **Reactivity**: `$:` reactive declarations throughout components
- **Lifecycle**: `onMount` with cleanup return functions
- **Props**: `export let` pattern in child components
- **Custom stores**: `createThemeStore()` and `commandPreferencesStore` implement the `subscribe` pattern manually

Svelte 5 maintains backward compatibility, but the legacy API will eventually be deprecated. The Runes API (`$state`, `$derived`, `$effect`, `$props`) is the recommended approach for all new and existing Svelte 5 code.

## Goals / Non-Goals

**Goals:**
- Migrate all reactive state from `writable()` stores to `$state` / `$derived` runes
- Replace `$:` declarations with `$derived` and `$effect`
- Replace `$store` auto-subscriptions with direct references to rune-based state
- Replace `onMount` / `onDestroy` with `$effect` patterns
- Convert `export let` props to `$props()` rune
- Maintain identical external behavior — no UX changes
- Keep all existing tests passing (or update to match new patterns)

**Non-Goals:**
- No new features or behavior changes
- No routing library introduction (keep manual routing)
- No component architecture redesign
- No TypeScript strict mode or other unrelated improvements
- No snippet/render tag migration unless directly tied to props changes

## Decisions

### Decision 1: Module-level `$state` over `.svelte.ts` stores

**Choice**: Move shared reactive state from `writable()` stores in `.ts` files to module-level `$state` in `.svelte.ts` files.

**Rationale**: Svelte 5 runes only work in `.svelte` or `.svelte.ts`/`.svelte.js` files. The current store files (`stores/index.ts`, `stores/theme.ts`, etc.) must be renamed to `.svelte.ts` to use `$state`. Module-level `$state` in `.svelte.ts` creates a singleton — matching the current `writable()` singleton behavior.

**Alternative considered**: Keep `writable()` stores and only migrate components. Rejected because it leaves the codebase in a hybrid state and defeats the purpose of migrating.

### Decision 2: Export reactive getters for derived state

**Choice**: Export getter functions or `$derived` references for computed values (e.g., `get isLoading()` returning `$state` value).

**Rationale**: Components importing from `.svelte.ts` files need to read reactive state. Svelte 5's `$state` is reactive within the module and importing components. Exporting the `$state` variable directly works for reading reactivity.

### Decision 3: Use `$effect` for lifecycle and subscriptions

**Choice**: Replace `onMount` + cleanup pattern with `$effect` that runs on mount and returns cleanup function. Replace WebSocket subscriptions with `$effect`-based setup.

**Rationale**: `$effect` is the Svelte 5 replacement for both reactive statements with side effects and lifecycle hooks. It automatically tracks dependencies and supports cleanup via returned function.

### Decision 4: Incremental migration — stores first, then components

**Choice**: Migrate store modules first (`.ts` → `.svelte.ts` with runes), then migrate components.

**Rationale**: Components depend on stores. If we migrate stores first and maintain the same export interface, components can be migrated one at a time. During the transition, we can use `svelte/store`'s `subscribe` wrapper if needed for temporary compatibility.

### Decision 5: Keep event handlers as `onclick` (no change)

**Choice**: Keep using `onclick={...}` attribute syntax rather than migrating to `onclick` with `...spread`.

**Rationale**: `onclick` already works in Svelte 5 and is the recommended syntax. No migration needed here — the components already use it.

## Risks / Trade-offs

- **[Risk] Breaking store interface** → Mitigation: Each store module maintains the same exported names and types. Rename files to `.svelte.ts` only after confirming the rune-based API is a drop-in replacement.

- **[Risk] `$state` reactivity not propagating across module boundaries** → Mitigation: Svelte 5's `$state` in `.svelte.ts` modules propagates reactivity to importing `.svelte` components. Test this explicitly with the first migrated store.

- **[Risk] Test file `theme.test.ts` relies on `writable` API** → Mitigation: Review and update test after migrating `theme.ts` to runes. The test uses `get()` from `svelte/store` which won't work with `$state` — need to adapt to direct reads.

- **[Risk] Large diff makes review difficult** → Mitigation: Migrate in logical groups (stores → leaf components → complex components → App.svelte) as separate tasks.

- **[Trade-off] `.svelte.ts` files cannot be imported by non-Svelte code** → Acceptable: All consumers of these stores are Svelte components or other `.svelte.ts` files. No server-side or non-Svelte code imports them.
