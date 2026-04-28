## Why

`openspec-webui` は viewer であるにもかかわらず、`openspec/config.yaml` に YAML 構文エラーがあると project parser 全体が失敗し、プロジェクトを開けなくなります。特にクオート不整合のような軽微でも発生しやすい編集ミスで Dashboard / specs / changes の閲覧まで止まるため、壊れた設定を診断するための画面自体に到達できません。

## What Changes

- `config.yaml` の読み込みを degraded mode 対応に変更し、YAML 構文エラー時もプロジェクト全体のロードを止めずに project identity と supplemental data を返せるようにする。
- project API と shared types に planning-context の parse status / parse errors / raw config text を追加し、viewer が invalid 状態を明示できるようにする。
- Dashboard の planning-context ブロックを更新し、invalid config 時は通常の `AI Context` / `Artifact Rules` / `Workflow Schema` の代わりに error callout と raw `config.yaml` を表示する。
- project activation と `config.yaml` 起点の live refresh では、invalid planning config だけを理由に `ACTIVATION_FAILED` にしないようにし、真に復旧不能な parse / watcher failure のみを fatal として扱う。

## Capabilities

### New Capabilities

（なし）

### Modified Capabilities

- `project-context`: `config.yaml` が parse 不能でも project context を invalid 状態として公開し、Dashboard から raw config と診断情報を確認できるようにする。
- `project-registry`: malformed `config.yaml` を含む project でも activation を継続し、viewer と watcher を利用可能にする。
- `live-refresh`: `config.yaml` が invalid に変化した場合も project refresh を維持し、最後の正常値を固定せず invalid 状態へ遷移できるようにする。

## Impact

- `src/parser/project.ts`
- `src/parser/index.ts`
- `src/shared/types.ts`
- `frontend/src/lib/types/api.ts`
- `frontend/src/lib/views/Dashboard.svelte`
- `frontend/src/lib/projectPlanningContext.ts`
- project activation / live refresh / parser 関連テスト
