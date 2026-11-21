## ADDED Requirements

### Requirement: Global folders come from maintained scope data
Global skill detection SHALL take each tool's global skills folder from the maintained scope support data, not from a hard-coded table. A tool that the data records as universal or project-only SHALL NOT get a tool-specific global folder scan.

#### Scenario: Re-pinned data changes a global folder
- **WHEN** the packaged scope data records a new global folder for a detected tool
- **THEN** global detection scans that folder without a code change

### Requirement: Detect 1.x layouts from a frozen legacy table
Repository detection SHALL keep recognizing OpenSpec 1.x command files, per-tool skill folders and retired tools from a WebUI-owned legacy table frozen at the v1.14.0 definitions. The table SHALL include the command-file signatures, each tool's v1.14.0 skill folder and invocation, and the `amazon-q` skill and prompt folders. Skill detection SHALL use the union of the official and legacy folders. Detection of these layouts SHALL NOT depend on the pinned official snapshot still containing them.

#### Scenario: 1.x Amazon Q repository after the 2.1.1 re-pin
- **WHEN** a repository contains `.amazonq/prompts/opsx-propose.md` and the official snapshot no longer lists `amazon-q`
- **THEN** detection still reports Amazon Q Developer with the `@opsx-*` form

#### Scenario: 1.x tool skill folder after the re-pin
- **WHEN** a repository contains `.cursor/skills/openspec-propose/SKILL.md` and the official snapshot lists Cursor only under `.agents/skills/`
- **THEN** detection still reports Cursor from its `.cursor/skills` folder

#### Scenario: 1.x command files after the re-pin
- **WHEN** a repository contains `.claude/commands/opsx/propose.md` and the official snapshot defines no Commands for Claude Code
- **THEN** detection still reports the Claude Code `/opsx:*` command evidence
