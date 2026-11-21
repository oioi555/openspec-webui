# Design

## Context

- The availability API returns integrations with `scope`, and `sharedSkillTargets` when the shared marker lists tools.
- `update-tool-reference-openspec-2-1` adds served `toolNames` and `scopeSupport` (`universal` / `linked` / `project-only`).
- Upstream rules for the commands, from 2.1.1 `init.js`:
  - In global scope, `--tools` adds tools to the machine install.
  - `--scope global` on a project-scope repository moves it. It refuses when a configured tool lacks a global folder, or when Copilot cloud files are set up.
  - `skillsScope: project` in `openspec/config.yaml` records the team's choice.
- The CLI `delivery` value is parsed but not rendered anywhere.

## Goals / Non-Goals

**Goals:** make Settings explain the upstream model, machine-level tool choice and project scope as the exception, and offer only commands that would succeed.

**Non-Goals:** Versions section and update guidance (`update-project-status-openspec-2`); running any command from the WebUI.

## Decisions

- **Group by `scope`.** The groups are a client-side partition of the existing integrations array, so no new detection is needed.
- **`skillsScope` from the server.** `openspec-config.ts` reads `openspec/config.yaml` with the `yaml` package and adds `skillsScope: 'project' | null` to the availability response. Absent, `global`, unknown or malformed values become `null`.
- **Copilot cloud from the server.** The availability response adds `copilotCloud: boolean`, true when `.github/workflows/copilot-setup-steps.yml` or `.github/agents/openspec.agent.md` exists (the files OpenSpec 2.1.1 manages). The repository's Copilot skills evidence cannot tell the IDE tool from the cloud agent, so it is not reused.
- **Commands are offered by predicate.**
  - Add a tool: always offered, copying `openspec init --tools <id> <path>`. OpenSpec 2.1.1 `resolveSkillScope` keeps a repository with its own skills in project scope (before env or global config), so with project rows it is labelled "Add a tool to this repository" and the picker lists every tool. Without project rows it is the machine add, and the picker leaves out `project-only` tools, which would turn the repository into a project install. `--scope global` is not used to add, because it moves the project's skills.
  - `skillsScope: project` is written by `openspec update`, not init, so its absence never means global while project skills exist.
  - Keep in repository: offered when the repository has no project evidence.
  - Move to machine-wide: offered when there is project evidence, every project row's tool is not `project-only`, and `copilotCloud` is false. Otherwise every reason that applies is shown: the project-only tool names and, separately, the Copilot cloud files.
  - Init: offered when nothing is detected.
  - Alternative: always show every command. Rejected, because upstream refuses some of them and the operator would hit errors.
- **Delivery gate.** `openspec config get delivery` is skipped when the CLI major version (from `openspec --version`, memoized per process for 5 minutes) is 2 or later. When the version is unknown, it is still read, which is harmless because nothing renders it.
- **Commands carry the active repository path** (`openspec init --tools <id> <path>`), like the existing init command, so they work from any working directory.
- **Row scope.** A row's tool id comes from the served `toolNames` (name match), a shared `.agents` row maps to its marker targets or `agents`. A row for several tools shows the most restrictive kind.
- **Docs links.** Map each constant to an `openspec.dev/docs/...` page. Pages with no 2.x successor use the closest page: Commands -> `skills`, Workflows -> `profiles`, multi-language -> `cli#openspec-init` (`--language`), stores -> `stores` and `cli#openspec-store`. A unit test asserts that no URL targets `docs/opsx.md`. Reachability is checked by hand in verification.

## Risks / Trade-offs

- [Copilot cloud detection misses a setup] → The move command still states that OpenSpec will refuse when cloud files exist, so the CLI stays the authority.
- [The tool picker grows to about 85 tools] → A search input with the reference dialog's filter (`filterOfficialToolDefinitions`) narrows a native select.
