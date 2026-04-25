# runes-state-management Delta Specification

## MODIFIED Requirements

### Requirement: Module-level reactive state via runes
The system SHALL use Svelte 5 `$state` rune for all shared reactive state, declared at module scope in `.svelte.ts` files. All state that was previously a `writable()` store SHALL become a `$state` variable within a factory function. Each store module SHALL expose its state through wrapper objects with `.value` getter/setter properties (created via a `createBox` helper) rather than raw module-level `$state` exports. Components that import these wrapper objects SHALL access reactive state via `.value` and SHALL receive reactive updates automatically.

#### Scenario: State change propagates to importing component
- **WHEN** a `$state` variable inside a store wrapper is updated via `.value` setter
- **THEN** all components importing that wrapper re-render with the new value

#### Scenario: Initial state matches previous writable default
- **WHEN** the application starts
- **THEN** each `$state` variable initializes to the same default value that the previous `writable()` used

#### Scenario: Components access state via .value getter
- **WHEN** a component imports a store wrapper (e.g. `specs`, `activeChanges`, `project`)
- **THEN** it reads the current value using the `.value` property
- **AND** Svelte's reactivity tracks the dependency through the getter

### Requirement: Store files use .svelte.ts extension
All shared reactive state modules SHALL use the `.svelte.ts` file extension instead of `.ts`. This is required because Svelte 5 runes (`$state`, `$derived`, `$effect`) are only processed in `.svelte` or `.svelte.ts`/`.svelte.js` files.

#### Scenario: Store module with runes is importable
- **WHEN** a `.svelte.ts` store file exports wrapper objects containing `$state` variables
- **THEN** `.svelte` components can import and reactively bind to those wrappers via `.value`
