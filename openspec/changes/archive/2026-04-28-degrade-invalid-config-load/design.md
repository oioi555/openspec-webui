## Context

現在の parser は `src/parser/project.ts` で `openspec/config.yaml` を `yaml.parse()` し、例外が発生すると `ParseResult.data = null` を返します。さらに `src/parser/index.ts` は project / specs / changes のどれか 1 つでも `data = null` なら OpenSpec 全体を `data = null` にするため、`config.yaml` のみが壊れているケースでも Dashboard、specs、changes の閲覧全体が止まります。

一方で live refresh にはすでに「再 parse に失敗したら以前の data を保持する」という degraded 的な挙動があり、初回 activation だけが極端に厳格です。この不整合の結果、viewer は診断のために必要な raw `config.yaml` すら表示できず、operator は外部エディタで勘に頼って修正するしかありません。

今回の change は availability を改善するものですが、viewer が YAML を勝手に修復して OpenSpec 本体と異なる planning context を見せるのは避ける必要があります。そのため、壊れた `config.yaml` は「解釈済み」ではなく「invalid planning context」として扱い、raw text と parse diagnostics を露出する方針を取ります。

## Goals / Non-Goals

**Goals:**
- malformed `config.yaml` でも project activation と `/api/project` を成功させ、viewer 全体を利用可能にする。
- `planningContext` に parsed / invalid の状態差を持たせ、UI が invalid config を明示できるようにする。
- invalid 時は structured planning data を捏造せず、raw `config.yaml` と parse errors を表示する。
- `config.yaml` の修正後は既存の live refresh で parsed 状態へ戻れるようにする。

**Non-Goals:**
- YAML を自動 escape / rewrite して viewer 独自に解釈すること。
- `config.yaml` 編集 UI や自動修正ボタンを追加すること。
- OpenSpec CLI / OSPX 側の config 解釈を変更すること。
- specs / changes parser の fault tolerance まで今回まとめて拡張すること。

## Decisions

### 1. `planningContext` を status 付きの discriminated model に拡張する
`PlanningContext` と API 型を `status: 'parsed' | 'invalid'` を持つ形へ拡張します。

- `parsed` のときは既存の `aiContext` / `artifactRules` / `workflowSchema` を返す
- `invalid` のときは少なくとも `source`, `rawConfig`, `parseErrors` を返す
- project description は invalid 時は folder 名ベースの project identity を維持しつつ、誤った `context:` 由来 description は生成しない

これにより UI は「空の valid config」と「壊れた config」を区別できます。

**Alternatives considered:**
- 既存 shape のまま空文字列だけ返す → invalid 状態を識別できず、silent failure になるため却下。
- project 全体に別 field を増やして planningContext 自体は据え置く → 利用側で分岐が散りやすいため却下。

### 2. `parseProject()` は malformed YAML でも degraded `Project` を返す
`src/parser/project.ts` は `readFile(configPath)` 自体が成功した場合、YAML parse failure を fatal にせず degraded project を返します。

- `legacyProjectDoc` の読み込みは YAML parse 成否から分離する
- `migrationState` は invalid 専用状態を追加するか、少なくとも invalid notice を出せる計算へ更新する
- errors / warnings には parse diagnostics を積むが、`data` は返す

これで `src/parser/index.ts` は project parser failure ではなく project parser degradation として扱えます。

**Alternatives considered:**
- `parseOpenSpec()` 側だけでエラーを握りつぶす → raw config や legacy doc を返す材料が不足し、project parser の責務が曖昧になるため却下。

### 3. viewer は invalid config を「診断可能な状態」として表示する
Dashboard の planning-context ブロックは `planningContext.status` を見て分岐します。

- `parsed`: 既存どおり `AI Context` / `Artifact Rules` / `Workflow Schema`
- `invalid`: error callout、parse error list、planning source notice、raw `config.yaml`、必要なら legacy `project.md`

invalid 時は「OpenSpec planning uses config.yaml」という主文は維持しつつ、「現在は parse 不能なので structured planning view を表示できない」と明示します。

**Alternatives considered:**
- activation 時だけ silent fallback し、UI は従来どおり空表示にする → 問題が見えず、修正導線にならないため却下。
- raw `config.yaml` だけ見せて structured UI を全削除する → valid 時の可読性まで下がるため却下。

### 4. activation と live refresh は invalid config を fatal error にしない
`project-registry` / live refresh は malformed `config.yaml` を「project data はあるが planningContext が invalid」として扱います。

- 初回 activation は `ACTIVATION_FAILED` にしない
- `config.yaml` 変更時の refresh は last-known-good 固定ではなく invalid 状態へ遷移できる
- truly fatal なのは openspec path 不正、read failure、watcher setup failure など project 全体を返せないケースに限定する

これで初回 load と live refresh の fault tolerance を揃えられます。

**Alternatives considered:**
- live refresh と同じく invalid 時は前回正常値を保持する → current file が壊れている事実を UI が隠してしまうため却下。

## Risks / Trade-offs

- **型変更の波及** → `src/shared/types.ts` と `frontend/src/lib/types/api.ts` を先に揃え、Dashboard 周辺だけで status 分岐を完結させる。
- **invalid 状態と migration notice の競合** → invalid を優先し、migration / legacy notice は parsed 状態にだけ適用する。
- **search が raw invalid config を含むかどうかの曖昧さ** → compatibility content は raw config を含めて維持し、project search の後退を避ける。
- **YAML parser エラー文面の揺れ** → parser の生メッセージを保持しつつ、UI では固定タイトル + details 展開にする。

## Migration Plan

1. shared / frontend API types に invalid planning context 形を追加する。
2. `parseProject()` を degraded return 化し、`parseOpenSpec()` が invalid project を通過させるようにする。
3. Dashboard / planning-context notice を invalid 対応に更新する。
4. project-registry / server integration / parser / live refresh テストを追加し、activation と refresh の両方で invalid config を検証する。
5. `openspec status --change "degrade-invalid-config-load"` が apply-ready になることを確認する。

## Open Questions

- `migrationState` に `invalid-config` を追加するか、`planningContext.status` だけで UI 分岐するか。
- invalid 時の `content` に raw config 全文を含めるか、error summary + raw config の両方を含めるか。
