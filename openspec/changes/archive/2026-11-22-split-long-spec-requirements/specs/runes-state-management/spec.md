## MODIFIED Requirements

### Requirement: Module-level reactive state via runes
The system SHALL use the Svelte 5 `$state` rune, at module scope in `.svelte.ts` files, for all shared reactive state. All state that was previously a `writable()` store SHALL become a `$state` variable within a factory function. Each store module SHALL expose state through `createBox` wrapper objects with `.value` getter/setter properties, not raw module-level `$state` exports. Importing components SHALL read state via `.value` and SHALL receive reactive updates automatically.

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
