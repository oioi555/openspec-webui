# Proposal

## Why

Settings 「共有 .agents 調査」の先頭コンパクト表は、公式 OpenSpec ターゲットでスキルを入れると共有 `.agents/skills` にインストールされること、そしてどれか一つをセットアップすれば下の一覧の `.agents` 対応クライアントから使えることを示す表である。現行表は `agents` と `zed` だけを slash 行に残し、ピン済みカタログで同じ `.agents/skills` に書く Amp、Antigravity、GSD を外している。Codex は同じ物理パスでも `/` で呼べない例外である。

## What Changes

- Compact shared-target summary presents every pinned official tool whose skills install into `.agents/skills`.
- Group those tools by invocation: slash-style installers share one `/openspec-*` row; Codex stays a separate `$openspec-*` row because it cannot invoke with `/`.
- Caption explains that installing through any of those official targets (including a main tool, not only generic `agents`) writes skills the research-list `.agents` clients can use.
- Keep command/workflow paths and the legacy `.agent` row out of this summary.
- Derive membership from the unfiltered pinned official definitions so the table stays aligned with the catalog pin.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `tool-compatibility-reference`: Compact shared-target summary groups official catalog tools whose skills install into `.agents/skills` by invocation style, presents Codex as the dollar-style exception, and explains that one of those official setups unlocks the research-list `.agents` clients.

## Impact

- `frontend/src/lib/toolCompatibilityReference.ts` grouping helper and its tests.
- `frontend/src/lib/components/layout/ToolCompatibilityDialog.svelte` compact table and caption.
- `frontend/src/lib/components/layout/ToolCompatibilityDialog.test.ts` source assertions.
- Caption copy in all seven `frontend/messages/*.json` locales and `frontend/src/lib/locale.test.ts`.
- Settings 「共有 .agents 調査」の先頭表に Amp / Antigravity / GSD が slash 群として戻り、Codex は `$` 例外のまま残る。
- Official catalog snapshot, detection, JOIN aliases, Vercel client rows, command chips, package version, `drop-antigravity-from-shared-agents-summary`, and `update-dependencies-2026-10-03` stay out of this change’s product edits. The rejected `drop-antigravity-from-shared-agents-summary` change is superseded and must not be archived.
