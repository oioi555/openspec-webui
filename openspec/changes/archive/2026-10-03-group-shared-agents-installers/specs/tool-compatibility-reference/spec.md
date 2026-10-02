# Spec Delta

## MODIFIED Requirements

### Requirement: Explain the shared `.agents/skills` relationship
The compatibility view SHALL identify `.agents/skills` as a shared repository path that OpenSpec can generate through any pinned official tool whose skills install into that path. The compact target summary SHALL present every such official tool, grouped by invocation contract: slash-style installers share `/openspec-*` references, while Codex requires the explicit `codex` target and `$openspec-*` references because it cannot invoke skills with `/`. It SHALL explain that installing skills through any of those official targets (including a main tool, not only the generic `agents` target) writes them into shared `.agents/skills`, and that the `.agents`-compatible clients in the research list below can then use them. It SHALL explain that a Codex-led tree can also serve slash-style clients, while selecting only `agents` does not constitute a Codex setup merely because the physical path is the same. The compact target summary SHALL NOT present command or workflow paths, and SHALL NOT present a legacy `.agent` row.

The compact target summary SHALL NOT repeat a list of researched or confirmed clients because the searchable rows below provide that information. Those rows SHALL distinguish other access modes and describe them as sourced research findings. The presentation SHALL NOT claim that the WebUI maintainers tested every client, that an executable is installed or configured, or that every OpenSpec workflow was validated.

The initial project-path candidate dataset SHALL include at least OpenCode, Codex, Cursor, Zed, Antigravity, Grok Build, Gemini CLI, GitHub Copilot, Kimi Code CLI, Qwen Code, Kilo Code, and Pi. Those records SHALL retain their research provenance independently of OpenSpec's official definition table.

#### Scenario: Show target-specific invocation contracts
- **WHEN** the operator views the Shared Agent Skills summary
- **THEN** the compact summary lists every pinned official tool whose skills install into `.agents/skills`, grouped by invocation style
- **AND** slash-style installers share one `/openspec-*` row on `.agents/skills`
- **AND** separately shows that `codex` renders dollar-style `$openspec-*` references into the same physical skills path
- **AND** the compact summary does not show command or workflow paths or a legacy `.agent` row

#### Scenario: Group official shared-path skill installers
- **WHEN** the pinned official catalog includes tools whose skills path is under `.agents/skills`
- **THEN** the compact shared-target summary includes those tools as installers of the shared skills path
- **AND** slash-style tools such as `agents`, `amp`, `antigravity`, `gsd`, and `zed` appear together when the pin records their skills there

#### Scenario: Explain that one installer unlocks shared clients
- **WHEN** the operator views the Shared Agent Skills compact target summary
- **THEN** the summary explains that installing skills through any of those official targets writes them into shared `.agents/skills`
- **AND** that the `.agents`-compatible clients in the research list below can then use them

#### Scenario: Present Codex as the non-slash exception
- **WHEN** the operator views the compact shared-target summary
- **THEN** Codex appears in its own dollar-style row on `.agents/skills`
- **AND** the summary explains that Codex cannot invoke skills with `/`

#### Scenario: Explain the Codex target rule
- **WHEN** the operator intends to use Codex together with other `.agents/skills` clients
- **THEN** the dialog says to select the `codex` OpenSpec target explicitly
- **AND** explains that the Codex-led tree can serve slash-style clients but an `agents`-only tree is not a Codex setup

#### Scenario: Explain current and legacy Antigravity roots
- **WHEN** the operator inspects the Antigravity definition or shared-root explanation
- **THEN** the official definition view shows the pinned snapshot paths for that tool
- **AND** when that pin places Antigravity skills under `.agents/skills`, the compact shared-target summary includes Antigravity among the slash-style installers
- **AND** the compact summary does not show Antigravity workflows or a legacy `.agent` row

#### Scenario: Avoid duplicating compatibility rows in the summary
- **WHEN** the shared target summary is displayed
- **THEN** it does not enumerate confirmed or researched clients
- **AND** the operator can inspect those clients in the searchable rows below

#### Scenario: Include the initial project-path candidate set
- **WHEN** the initial compatibility dataset is loaded
- **THEN** the named initial candidates are listed with their reported `.agents/skills` access mode
- **AND** each finding has source and research-date metadata

#### Scenario: Avoid installed-tool claims
- **WHEN** a client is listed as project-native
- **THEN** the dialog describes path-discovery compatibility
- **AND** does not state that the client executable is installed or currently configured
