# live-refresh Delta Specification

## MODIFIED Requirements

### Requirement: Watch relevant OpenSpec files and directories
The system SHALL watch the OpenSpec project directory for each active session's project. Each session SHALL have its own independent chokidar watcher. The watcher SHALL treat supported markdown files, `project.md`, `AGENTS.md`, and `config.yaml` as relevant project files. Each watcher SHALL ignore dotfiles, `node_modules`, and other non-markdown non-config files. Unsupported markdown files that do not match `project.md`, `AGENTS.md`, `specs/`, or `changes/` paths SHALL trigger a project-scoped refresh. Each watcher SHALL classify relevant updates as affecting `project`, `specs`, or `changes`. Watchers SHALL be created on session activation and closed when the session's reference count reaches zero.

#### Scenario: Classify unsupported markdown as project refresh
- **WHEN** a file event occurs for a markdown file not under `specs/`, `changes/`, and not named `project.md` or `AGENTS.md`
- **THEN** the watcher classifies the update as affecting `project`

#### Scenario: Classify a config change as project-scoped
- **WHEN** a file event occurs for `config.yaml` in a watched project
- **THEN** the system classifies the update as affecting `project`

#### Scenario: Classify a spec file change
- **WHEN** a file event occurs under `specs/<capability>/` in a watched project
- **THEN** the system classifies the update as affecting `specs`
- **AND** uses the capability directory name as the affected entity ID

#### Scenario: Classify a change directory event
- **WHEN** a directory is added or removed under `changes/` or `changes/archive/` in a watched project
- **THEN** the system classifies the update as affecting `changes`

#### Scenario: Multiple watchers for multiple active projects
- **WHEN** project A and project B both have active sessions with bound clients
- **THEN** both projects have independent chokidar watchers running simultaneously
- **AND** file changes in project A do not trigger events for project B's clients
