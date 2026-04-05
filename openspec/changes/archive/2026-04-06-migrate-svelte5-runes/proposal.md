## Why

The frontend uses Svelte 5 (`^5.16.1`) as a dependency but all components and stores are written in Svelte 4 legacy syntax — `writable()` stores, `$:` reactive declarations, `$store` auto-subscription, and `onMount` lifecycle. Svelte 5's Runes API (`$state`, `$derived`, `$effect`, `$props`) provides finer-grained reactivity, better type inference, and a simpler mental model. Migrating now avoids accumulating legacy debt and unlocks Svelte 5's full capabilities before the old syntax is deprecated.

## What Changes

- **BREAKING**: Replace all `writable()` / `readable()` stores with Svelte 5 Runes (`$state`, `$derived`, `$effect`)
- **BREAKING**: Replace `$:` reactive declarations with `$derived` / `$effect`
- **BREAKING**: Replace `$store` auto-subscription syntax with direct rune-based references
- Replace `onMount` / `onDestroy` lifecycle functions with `$effect` cleanup patterns
- Convert component props from `export let` to `$props()` rune
- Migrate custom stores (theme, commandPreferences) from `writable`-based to rune-based patterns
- Update `.svelte` components to use `{@render}` and snippet blocks where applicable
- Ensure all existing tests continue to pass after migration

## Capabilities

### New Capabilities
- `runes-state-management`: New reactive state management pattern using Svelte 5 Runes ($state, $derived, $effect) replacing the legacy writable store pattern

### Modified Capabilities
- `theme-management`: Store implementation changes from writable-based to rune-based, same external behavior
- `command-preferences`: Store implementation changes from writable-based to rune-based, same external behavior
- `live-refresh`: WebSocket subscription pattern changes from store-based to $effect-based, same refresh behavior

## Impact

- **All 19 `.svelte` components** in `frontend/src/components/` — reactive syntax changes
- **5 store files** in `frontend/src/stores/` — full rewrite from `writable` to runes
- **`App.svelte`** — routing, lifecycle, and subscription patterns
- **No backend changes** — this is purely frontend
- **No API changes** — same data layer, same WebSocket protocol
- **Test files** in `frontend/src/stores/theme.test.ts` — may need adjustment for new patterns
- **Dev dependencies** — `svelte` already at `^5.16.1`, no version bump needed
