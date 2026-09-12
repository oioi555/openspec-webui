## Context

See `proposal.md` for motivation. Four production call sites spawn `openspec` with `execFile` and no `shell`:

- `src/server/version-status.ts` — `openspec --version`
- `src/server/openspec-config.ts` — `openspec config get <key>`
- `src/server/store-discovery.ts` — `openspec store list --json` (already injects `exec`)
- `src/server/routes/api.ts` — `openspec validate …`

`scripts/verify-release.mjs` already uses `*.cmd` plus `shell: true` on `win32` for the packaged WebUI binary. That pattern is the right Windows mechanic; it is not yet applied to OpenSpec CLI launches. `scripts/dev-utils.mjs` appends `.cmd` only for `node_modules/.bin` tools, which does not help a global `openspec` on PATH.

This host is Linux. Node's Windows `CreateProcess` / `PATHEXT` / CVE-2024-27980 `EINVAL` behavior cannot be reproduced here, including under Wine.

## Goals / Non-Goals

**Goals:**

- One spawn helper that every OpenSpec CLI call site uses.
- Windows npm `.cmd` shims launch; POSIX stays a direct `execFile` of `openspec`.
- Linux-runnable unit tests that assert command, argv, `shell`, and rejection by injecting platform and `execFile`.
- Keep existing missing-CLI degradation (`ENOENT` → not installed / unavailable) at each call site.

**Non-Goals:**

- Adding GitHub Actions or a Windows CI matrix (this repo has no workflows today; that is a separate change).
- Replacing `execFile` with `cross-spawn` or a PATHEXT resolver.
- Changing public API payloads, UI copy, or the validation command string shown to operators.
- Making `store-discovery` / config / version tests spawn a real `openspec` process.

## Decisions

1. **Shared helper, not four copy-pasted Windows branches.**
   - Rationale: The bug is identical at every call site. A helper is the only way to keep quoting and rejection in one place.
   - Alternative considered: Patch each `execFile` independently, matching the reporter's local workaround. Rejected because a fifth call site would regress.

2. **Windows: `execFile('openspec.cmd', quotedArgs, { shell: true, … })`. POSIX: unchanged `execFile('openspec', args, { … })`.**
   - Rationale: This is the combination the reporter proved works (`ENOENT` without a shell, `EINVAL` for `.cmd` without a shell, success with `.cmd` + `shell: true`). It matches `verify-release.mjs`.
   - Alternative considered: Resolve PATHEXT and spawn `cmd.exe /d /s /c` ourselves. Same problem, more moving parts.
   - Alternative considered: Depend on `cross-spawn`. Extra dependency for four trusted argv lists.

3. **Reject `"`, `%`, and control characters; quote every other argument in double quotes.**
   - Rationale: `shell: true` concatenates argv for `cmd.exe` (Node `DEP0190`). Double quotes make `& | < > ^ ( )` literal. `"` and `%` still escape a quoted region, so reject them rather than invent an unverifiable escape scheme. Current OpenSpec argv is subcommands, flags, config keys, and integers — none need those characters.
   - Alternative considered: Escape those characters. Rejected because `cmd.exe` quoting is not `CommandLineToArgvW` and is hard to test.

4. **Inject `execFile` and platform into the helper so tests run on Linux.**
   - Rationale: Assert `command === 'openspec.cmd'`, `options.shell === true`, and that rejected argv never calls `exec`. Do not require a Windows VM for the contract.
   - Alternative considered: Only test on `process.platform === 'win32'`. That would leave this maintainer machine with no coverage.

5. **Keep call-site error mapping; do not invent a new CLI-missing code.**
   - Rationale: Version status, Store discovery, command availability, and validation already classify `ENOENT` (and timeouts) themselves. The helper should look like `execFile` plus a pre-shell rejection error.
   - Alternative considered: Centralize ENOENT handling. Out of scope; those products already have specs.

## Risks / Trade-offs

- **[Risk] Linux tests cannot prove Node's real Windows spawn.** → Mitigation: helper tests lock the intended `execFile` arguments; ask the issue reporter to confirm on Windows 11 after the PR; consider a later `windows-latest` workflow.
- **[Risk] `shell: true` plus untrusted argv would be command injection.** → Mitigation: argv is built by this process, not by the browser; reject `"`, `%`, and controls before spawn.
- **[Risk] A Windows-only rejection error is mistaken for “CLI not installed”.** → Mitigation: rejection is a thrown/callback error whose `code` is not `ENOENT`; call sites that only special-case `ENOENT` will surface it as a generic CLI error, which is correct.
- **[Risk] `DEP0190` warning on Windows.** → Mitigation: accepted; quoting plus rejection is the documented answer until Node offers a non-shell `.cmd` spawn.

## Migration Plan

Ship in the next npm release. No data migration. Operators on Windows who currently patch `dist/` after every install can drop those patches once they upgrade. Rollback is a version revert; POSIX behavior is unchanged.

## Open Questions

None. Reporter verification on Windows is a release check, not a design fork.
