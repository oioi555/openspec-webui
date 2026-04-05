# runes-state-management Specification

## Purpose
Defines the Svelte 5 runes patterns used for shared reactive state, derived values, side effects, props, and rune-enabled store modules.

## Requirements
### Requirement: Module-level reactive state via runes
The system SHALL use Svelte 5 `$state` rune for all shared reactive state, declared at module scope in `.svelte.ts` files. All state that was previously a `writable()` store SHALL become a `$state` variable. Components that import these variables SHALL receive reactive updates automatically.

#### Scenario: State change propagates to importing component
- **WHEN** a `$state` variable in a `.svelte.ts` store module is updated
- **THEN** all components importing that variable re-render with the new value

#### Scenario: Initial state matches previous writable default
- **WHEN** the application starts
- **THEN** each `$state` variable initializes to the same default value that the previous `writable()` used

### Requirement: Derived state via $derived rune
The system SHALL use `$derived` for all computed reactive values that were previously `$:` reactive declarations or `derived()` stores. The derived expression SHALL automatically recalculate when its dependencies change.

#### Scenario: Derived value updates on dependency change
- **WHEN** a dependency of a `$derived` expression changes
- **THEN** the derived value recalculates synchronously before the next render

### Requirement: Side effects via $effect rune
The system SHALL use `$effect` for all side-effect logic that was previously `onMount`, reactive statements with side effects, or manual subscription setup. The `$effect` SHALL return a cleanup function when teardown is needed.

#### Scenario: Effect runs on mount with cleanup on destroy
- **WHEN** a component containing an `$effect` mounts
- **THEN** the effect body executes
- **AND** when the component destroys, the returned cleanup function executes

### Requirement: Component props via $props rune
All Svelte components SHALL use `$props()` rune instead of `export let` for declaring props. The destructured props SHALL maintain the same names and types as the previous `export let` declarations.

#### Scenario: Component receives props via $props
- **WHEN** a parent passes props to a child component using `$props()`
- **THEN** the child receives the same values as with the previous `export let` pattern

#### Scenario: Default prop values are preserved
- **WHEN** a parent does not pass an optional prop
- **THEN** the child component uses the same default value as before the migration

### Requirement: Store files use .svelte.ts extension
All shared reactive state modules SHALL use the `.svelte.ts` file extension instead of `.ts`. This is required because Svelte 5 runes (`$state`, `$derived`, `$effect`) are only processed in `.svelte` or `.svelte.ts`/`.svelte.js` files.

#### Scenario: Store module with runes is importable
- **WHEN** a `.svelte.ts` store file exports a `$state` variable
- **THEN** `.svelte` components can import and reactively bind to that variable
