## Why

ExplorerPane の Archive・Specs・Active Changes の情報表示は、従来の長い補助テキストよりもコンパクトなメタデータ表示のほうが実用的だったため、UI を更新した。一方で change artifact には古い SpecViewer サブタイトル表現（"Updated YYYY-MM-DD" の文言）が残っており、現行実装の compact metadata style（Calendar icon + formatted date）と不一致がある。さらに verification で、change の `lastModified` が `changes/<name>/specs/` 配下の spec delta 更新を拾わないこと、`formatDate` が不正入力で throw しうること、対応テストが不足していることが判明した。

## What Changes

- **ExplorerPane / ChangeViewer 表示**: Active Changes・Archive・Specs の 2 行目を Calendar / FileText / CircleCheckBig の compact metadata style に統一し、Archive 名から日付プレフィックスを除去する
- **SpecViewer サブタイトル**: 固定文言ではなく、他ビューと揃えた compact metadata style（Calendar icon + formatted date）で最終更新日を表示する
- **バックエンド lastModified**: `Spec` / `Change` の `lastModified` を API で提供し、Change の計算には proposal/tasks/design などの root ファイルに加えて `changes/<name>/specs/` 配下の spec delta ファイルも含める
- **日付フォーマット安全化**: `formatDate` は null / undefined / malformed input に対して空文字を返し、例外を投げない
- **テスト補強**: `formatDate` の正常系・異常系、parser の change `lastModified` 計算（spec delta 影響含む）を node:test + tsx で追加する

## Capabilities

### New Capabilities

（なし）

### Modified Capabilities

- `explorer-pane`: Active Changes・Archive・Specs の metadata 行を compact 表示へ更新
- `spec-browsing`: SpecViewer のヘッダー補助情報を compact date metadata 表示へ更新

## Impact

- `src/shared/types.ts`: `Spec`・`Change` 型の `lastModified`
- `src/parser/specs.ts`: spec/design mtime ベースの `lastModified`
- `src/parser/changes.ts`: spec delta を含む change `lastModified` 計算
- `src/server/routes/api.ts`: `/api/specs`・`/api/changes` の `lastModified`
- `frontend/src/lib/api.ts`: フロントエンド API 型の `lastModified`
- `frontend/src/lib/utils.ts`: `formatChangeName`・安全な `formatDate`
- `frontend/src/components/layout/ExplorerPane.svelte`: compact metadata 表示
- `frontend/src/components/ChangeViewer.svelte`: compact metadata 表示
- `frontend/src/components/SpecViewer.svelte`: compact date subtitle 表示
- `frontend/src/lib/utils.test.ts`: `formatDate` テスト追加
- `src/parser/changes.test.ts`: change `lastModified` テスト追加
