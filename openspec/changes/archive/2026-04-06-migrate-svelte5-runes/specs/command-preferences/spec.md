## MODIFIED Requirements

### Requirement: Persist AI tool syntax preferences in the browser
The system SHALL let the operator choose between `default` and `Claude Code` command syntax, SHALL interpret `default` as `/opsx-<command>`, SHALL interpret `Claude Code` as `/opsx:<command>`, and SHALL persist the selected AI tool in browser localStorage. The command preferences store SHALL use Svelte 5 `$state` rune for reactive state instead of `writable()`.

#### Scenario: Save the default syntax preference
- **WHEN** the operator selects the `default` AI tool option
- **THEN** the system stores that preference in localStorage
- **AND** generated commands use the `/opsx-<command>` format

#### Scenario: Save the Claude Code syntax preference
- **WHEN** the operator selects the `Claude Code` AI tool option
- **THEN** the system stores that preference in localStorage
- **AND** generated commands use the `/opsx:<command>` format

#### Scenario: Restore the saved AI tool preference
- **WHEN** the operator reloads the application in the same browser
- **THEN** the system restores the last saved AI tool preference from localStorage

#### Scenario: Command preferences state is reactive via runes
- **WHEN** the command preferences store's `$state` value changes
- **THEN** all components reading the preference update automatically without `$store` prefix syntax
