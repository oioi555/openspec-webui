# Design

## Context

See `proposal.md` for motivation. Verified against OpenSpec 2.1.1 (`openspec init --scope project --tools claude,cursor,codex,kimi`). That command produced:

```
.agents/skills/.openspec-target   -> "claude own-files\ncodex\ncursor\nkimi\n"
.agents/skills/openspec-*/SKILL.md
.claude/skills/openspec-*         -> symlink ../../.agents/skills/openspec-*
```

The current detector reported only `Shared .agents / Codex` with target `legacy`.

Upstream 2.1 finds global skills (`src/core/global-skills.ts` `readGlobalSkills`) by checking `<dir>/<openspec-skill>/SKILL.md` in `~/.agents/skills` (universal) and in each non-universal agent's `globalSkillsDir`, taken from Vercel `skills` `getSupportedAgents()`. It treats the home folder as having no project skills. A project keeps repo skills when `openspec/config.yaml` has `skillsScope: project` or when repo-local OpenSpec skills exist.

## Goals / Non-Goals

**Goals:**
- Detect project-scope 2.x layouts: links and the multi-line marker.
- Detect global installs so the 2.1 default produces command shortcuts.
- Keep 1.x repositories behaving exactly as before.

**Non-Goals:**
- Re-pinning `openspec-tools.json` to 2.1.1, or adding or retiring tools such as `amazon-q`, `minimax-code`, `rovodev`, and `zcode`.
- Detecting AI tool executables, or reading `~/.agents/.skill-lock.json` / `skills-lock.json` as evidence.
- Writing anything to the home folder.

## Decisions

### Link-aware enumeration

`listSubdirs()` keeps directory entries, plus symbolic-link entries whose `stat()` (which follows the link) is a directory. `findSkillFiles()` already requires `SKILL.md` inside the folder, so a dangling link or a link to an empty folder is never evidence. Source paths stay the link's repo-relative path (`.claude/skills/openspec-propose/SKILL.md`), not the resolved target.

### Multi-line marker → `sharedSkillTargets`

`resolveSharedSkillTargets()` returns `{ targets: string[], ownFiles: string[] }`:
- Each non-blank trimmed line is split on whitespace. The first token is the tool id.
- A second token `own-files` puts the tool in `ownFiles`.
- Unknown ids are dropped.

The legacy `sharedSkillTarget` is derived for compatibility:
- A single target in the old set (`agents|codex|zed|antigravity|amp|gsd`) keeps its value.
- Several targets → `multi`. This is a new union member, guarded on the client.
- No known target → `legacy`.

`sharedSkillTargets` is emitted only for `multi` or a single target outside the 1.x set. A 1.x single-value marker (e.g. `codex`) omits it, so the client keeps today's `sharedSkillTarget`-based forms (Codex-led trees keep both `/` and `$`).

Candidate forms for the shared tree come from the targets that read `.agents/skills` (the tools not in `ownFiles`), each mapped to its documented skill form through the pinned official dataset's `skills.invocation`: `codex` → `$`, `kimi` → `/skill:`, `codeassistant` → prompt form, everything else → `/openspec-`. Labels use the official tool names. `own-files` tools are handled by their own skills folder (e.g. `.claude/skills`), which the link fix now detects. This avoids listing Claude Code twice.

Alternative considered: treat each marker line as its own integration row in the API. Rejected because it would duplicate the same `.agents/skills` inventory several times. Instead there is one integration row with a target list, and the frontend splits it into labelled candidates as it does for `codex`/`legacy` today.

### Global scan

`detectToolIntegrations(projectRoot, { homeDir, claudeConfigDir, ... })` adds a global pass after the project pass.

- **Universal:** `<home>/.agents/skills`. The marker is not read, because global installs have none. Its evidence is reported like the legacy ambiguous shared tree: slash and Codex dollar forms. Kimi's `/skill:` form is not offered globally, since nothing on disk says Kimi is used.
- **Tool-specific global folders:** a code-owned table `GLOBAL_SKILL_DIRS`, keyed by detected OpenSpec tool id and taken from Vercel `skills@1.9.0` `globalSkillsDir`. It covers only non-universal agents that OpenSpec ships: claude (`$CLAUDE_CONFIG_DIR/skills`, falling back to `~/.claude/skills`), crush (`~/.config/crush/skills`), devin (`~/.config/devin/skills`), lingma, qoder, qwen, trae, kiro, junie, roocode, continue, codebuddy, and the rest of the table. Maintenance moves into the tool-reference workflow in the follow-up change.
- **Home-folder guard:** global evidence gets `scope: "global"` and `~/`-prefixed display sources. When `projectRoot` resolves (via `realpath`) to the home folder, the global pass is skipped, matching upstream `isHomeFolder`.

Project and global rows can coexist, because agents load both. The frontend groups candidates by final command text, so `/openspec-propose` from project Claude and global Claude collapses into one choice.

Alternative considered: use global evidence only when the project has none. Rejected because a repository that keeps project skills for Copilot while the developer uses Claude globally would hide the Claude form.

### Dependency seams and privacy

`homeDir` defaults to `os.homedir()`, and `claudeConfigDir` defaults to `process.env.CLAUDE_CONFIG_DIR`. Tests inject temporary directories. The API returns `~/`-relative sources, never the absolute home path. That data stays on localhost anyway, but it keeps screenshots clean.

### Settings

- Each integration shows a `Project` or `Global` badge.
- The zero-detection warning appears only when both scopes are empty.
- When only global evidence exists, a short note says the skills come from the machine-wide install, and the `openspec init` command block stays available.

## Risks / Trade-offs

- [Global table drifts from the `skills` package] → Snapshot the table with its source version, and cover it with a test that each entry maps to a detected tool id. The follow-up change moves it into tool-reference maintenance.
- [Home scan cost on every availability request] → It runs a bounded number of `readdir` calls (about 20 folders), and failures degrade to no evidence.
- [`multi` added to the `sharedSkillTarget` union] → Older clients treat unknown values via `isSharedSkillTarget` → `legacy`. This is additive.
