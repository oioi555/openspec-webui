# Proposal

## Why

OpenSpec 2.1 changed what "tool setup" means:
- Skills are one shared set. By default, they are installed once per machine (`~/.agents/skills`, plus linked folders for tools that need their own, such as Claude Code).
- Choosing tools is a property of the developer's machine, not of the repository. `openspec init --tools …` adds tools machine-wide, from any project.
- Project scope (`openspec init --scope project`, recorded as `skillsScope: project` in `openspec/config.yaml`) is the exception. It is for three cases:
  - a team that commits its skills;
  - a tool with no global folder (`eve`, `promptscript`);
  - the GitHub Copilot cloud agent.

Settings still presents the 1.x model:
- "OpenSpec integrations configured for this repository";
- "re-run `openspec init` to add or remove integrations";
- a flat tool list;
- the retired `delivery` value;
- documentation links to stale GitHub `docs/*.md` pages, including the retired `/opsx` reference.

## What Changes

- **Tools section in two groups.**
  - "This machine" lists global rows. It explains that these tools are shared by every project on this machine.
  - "This repository" lists project rows. It explains when a team keeps skills in the repository, and shows whether `openspec/config.yaml` records `skillsScope: project`.
- **State-based actions.** Copyable commands follow the state.
  - Add a tool on this machine: `openspec init --tools <id>`.
  - Keep skills in this repository for the team: `openspec init --scope project`.
  - Move a project-scope repository to the machine-wide skills: `openspec init --scope global`. This is offered only when every configured tool supports global skills and Copilot cloud is not configured.
  - Nothing detected: `openspec init`.
- **Scope support per tool.** Rows show the tool's scope support from the tool reference: universal, own global folder, or project only. A project-only tool explains why it stays in the repository.
- **Legacy and multi-target labels.**
  - Integrations whose only evidence is 1.x command files are labelled as 1.x legacy, with an `openspec update` hint.
  - A shared `.agents` integration with several marker targets is labelled with those tool names.
- **Retire `delivery`.** The server stops reading `openspec config get delivery` for 2.x CLIs. The API field stays, deprecated, and is `null`.
- **Current documentation links.** Every link in `openspecDocs.ts` points to the current `openspec.dev/docs` page. The `/opsx` reference link is removed. The Add Project dialog's init hint uses the same wording.
- Out of scope, handled in `update-project-status-openspec-2`: the Versions section's per-project update guidance and the `openspec config profile` follow-up steps.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `settings-view`: Tools section grouped by machine and repository, with state-based commands, per-tool scope support, legacy and multi-target labels, and documentation links.
- `command-shortcuts`: the availability API's `delivery` field is deprecated and `null` for 2.x CLIs.

## Impact

- `frontend/src/lib/components/layout/SettingsView.svelte` (Tools section), `AddProjectDialog.svelte`, `openspecDocs.ts`, 7 locale files.
- `src/server/openspec-config.ts`: delivery gate, plus `skillsScope` (from `openspec/config.yaml`) and `copilotCloud` in the availability response.
- New pure helper `frontend/src/lib/toolsGuidance.ts` for grouping, row labels and command predicates.
- Depends on `update-tool-reference-openspec-2-1` for the served names and scope support.
