## MODIFIED Requirements

### Requirement: Tools section is read-only with guidance and detected integrations
The Settings sidebar SHALL present the section previously labeled `Workflow` under the short label `Tools`, with a more descriptive in-page heading permitted. The Tools section SHALL be read-only: it SHALL explain how OpenSpec installs per-tool commands and skills, SHALL link to the official supported-tools documentation at `https://github.com/Fission-AI/OpenSpec/blob/main/docs/supported-tools.md` via the shared documentation URL constant, SHALL link to the `openspec init` CLI reference at `https://github.com/Fission-AI/OpenSpec/blob/main/docs/cli.md#openspec-init` via a shared documentation URL constant, rendering both documentation links together in the same docs-link paragraph, SHALL explain that per-repository tool integrations are added or removed by re-running `openspec init`, SHALL list the integrations detected for the active repository (tool name, Commands/Skills delivery, example invocation, detection source), SHALL provide a refresh control that re-runs detection, and SHALL NOT contain any selection or format-fixing setting. The section SHALL describe detected content as "OpenSpec integrations configured for this repository" and SHALL NOT describe detected tools as "installed tools".

The Tools section SHALL also make the scope of the displayed integrations unambiguous by surfacing the active repository path. When an active project is selected, the section SHALL expose a copyable command block containing `openspec init <active-repository-path>` so the operator can re-run init against the current repository from a terminal without retyping the path. The copyable command block SHALL render below the detected-integration list (the integration list is the primary content of the section; the init command is a supplement for changing it), SHALL embed the active repository path in the command (with the full path available via the element title attribute when the visible command is truncated), SHALL reuse the same code-plus-copy-button affordance used by the Versions section's per-tool update command, SHALL use the shared copy-command helper, and SHALL preserve the `openspec init` token in English in every locale. Copying the command SHALL place it on the clipboard only; the section SHALL NOT execute `openspec init` from the browser. When no project is active, the section SHALL render an empty-state message in place of the copyable command block, and SHALL keep the supported-tools documentation link, refresh control, and existing read-only constraints visible.

#### Scenario: Tools section shows explanation and documentation link
- **WHEN** the operator opens the Tools section in Settings
- **THEN** the section explains the integration mechanism
- **AND** links to the official supported-tools documentation using the shared URL constant
- **AND** links to the `openspec init` CLI reference using the shared URL constant
- **AND** both documentation links render together in the same docs-link paragraph

#### Scenario: Tools section shows init guidance
- **WHEN** the operator opens the Tools section in Settings
- **THEN** the section explains that re-running `openspec init` adds or removes per-repository tool integrations

#### Scenario: Tools section lists detected integrations
- **WHEN** the active repository has detected integrations
- **THEN** the section lists each detected integration with tool name, Commands/Skills delivery, example invocation, and detection source

#### Scenario: Tools section refresh re-runs detection
- **WHEN** the operator activates the refresh control in the Tools section
- **THEN** the system re-runs repository detection
- **AND** the detected integrations list updates to reflect the current repository state

#### Scenario: Tools section avoids installed-tools wording
- **WHEN** the Tools section renders its content
- **THEN** the copy refers to "OpenSpec integrations configured for this repository"
- **AND** does not describe detected tools as "installed tools"

#### Scenario: Tools section has no selection settings
- **WHEN** the operator views the Tools section
- **THEN** no command-format selection, global fixing, or per-command format-fixing control is rendered

#### Scenario: Tools section shows the active repository path
- **WHEN** an active project is selected while the operator views the Tools section
- **THEN** the section surfaces the active repository path inside the copyable init command block below the detected-integration list
- **AND** the full path is available via the element title attribute when the visible command is truncated

#### Scenario: Tools section exposes a copyable init command for the active repository
- **WHEN** an active project is selected while the operator views the Tools section
- **THEN** the section renders a command block containing `openspec init <active-repository-path>`
- **AND** the block uses the same code-plus-copy-button affordance as the Versions section update command
- **AND** activating the copy control places the command on the clipboard only and does not execute it

#### Scenario: Tools section keeps init token in English
- **WHEN** the Tools section renders the copyable init command block under a non-English active locale
- **THEN** the `openspec init` token remains in English
- **AND** only the surrounding label and copy-button aria text are localized

#### Scenario: Tools section empty state when no active project
- **WHEN** no project is active while the operator views the Tools section
- **THEN** the section renders an empty-state message in place of the path display and copyable command block
- **AND** the supported-tools documentation link and refresh control remain visible
- **AND** the read-only constraints are preserved
