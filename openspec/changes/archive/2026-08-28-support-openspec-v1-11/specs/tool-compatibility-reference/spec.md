## MODIFIED Requirements

### Requirement: Explain the shared `.agents/skills` relationship
The compatibility view SHALL identify `.agents/skills` as a shared repository path that OpenSpec can generate through the `agents`, `codex`, `zed`, and `antigravity` targets. It SHALL distinguish their invocation contracts: `agents`, `zed`, and Antigravity-owned skills render slash-style `/openspec-*` references, while Codex requires the explicit `codex` target and `$openspec-*` references. It SHALL explain that a Codex-led tree can also serve slash-style clients, while selecting only `agents` does not constitute a Codex setup merely because the physical path is the same. It SHALL also explain that current Antigravity releases place skills under `.agents/skills` and commands under `.agents/workflows`, while `.agent` is a legacy read-compatible location rather than the current generated root.

The compact target summary SHALL NOT repeat a list of researched or confirmed clients because the searchable rows below provide that information. Those rows SHALL distinguish other access modes and describe them as sourced research findings. The presentation SHALL NOT claim that the WebUI maintainers tested every client, that an executable is installed or configured, or that every OpenSpec workflow was validated.

The initial project-path candidate dataset SHALL include at least OpenCode, Codex, Cursor, Zed, Antigravity, Grok Build, Gemini CLI, GitHub Copilot, Kimi Code CLI, Qwen Code, Kilo Code, and Pi. Those records SHALL retain their research provenance independently of OpenSpec's official definition table.

#### Scenario: Show target-specific invocation contracts
- **WHEN** the operator views the Shared Agent Skills summary
- **THEN** it shows that `agents`, `zed`, and Antigravity-owned skills use slash-style references in `.agents/skills`
- **AND** separately shows that `codex` renders dollar-style references into the same physical skills path
- **AND** shows that Antigravity commands use `.agents/workflows`

#### Scenario: Explain the Codex target rule
- **WHEN** the operator intends to use Codex together with other `.agents/skills` clients
- **THEN** the dialog says to select the `codex` OpenSpec target explicitly
- **AND** explains that the Codex-led tree can serve slash-style clients but an `agents`-only tree is not a Codex setup

#### Scenario: Explain current and legacy Antigravity roots
- **WHEN** the operator inspects the Antigravity definition or shared-root explanation
- **THEN** the reference identifies `.agents` as the current generated root
- **AND** identifies `.agent` only as a legacy layout retained for read compatibility

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
