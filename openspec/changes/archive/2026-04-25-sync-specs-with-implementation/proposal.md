## Why

仕様（spec）と実装の間に22件の差異が発見された。主な原因は以下の3つ：
1. 実装変更後に spec を更新し忘れた（17件）
2. spec delta 自体が未生成だった（2件）
3. spec delta の同期漏れ（1件）

これにより、spec が実装の真実源ではなくなり、今後の変更で誤った前提に基づくリスクがある。

## What Changes

- 実装に合わせて main spec を更新（spec delta 経由）
- 未生成の spec delta を新規作成して反映
- 同期漏れの spec delta を手動適用
- 設計意図の相違（2件）も実装に合わせて spec を更新

## Capabilities

### New Capabilities

（なし）

### Modified Capabilities

- `activity-bar`: no-project fallback 位置、Explorer toggle 視覚的分離の要件を実装に合わせて更新
- `change-browsing`: （差異なし — スキップ）
- `cli-runtime`: themeStore の型定義、system mode の扱いを実装に合わせて更新
- `client-project-binding`: `project:bound` フィールド名、refCount 更新順を実装に合わせて更新
- `command-preferences`: Settings カテゴリ名、AI tool 形式、visibility controls を実装に合わせて更新
- `command-shortcuts`: skill 形式の追加、core commands の visibility を実装に合わせて更新
- `context-copy`: 選択テキストスコープ、toast 文言を実装に合わせて更新
- `explorer-item`: コンポーネント配置パス、props API を実装に合わせて更新
- `explorer-pane`: project identity 位置、Explorer toggle 位置を実装に合わせて更新
- `item-context-menu`: コンポーネント配置パスを実装に合わせて更新
- `live-refresh`: unsupported markdown の扱いを実装に合わせて更新
- `project-registry`: `project:switched` broadcast の要件を削除（未実装のため）
- `project-selector-ui`: project switch 方式、empty state を実装に合わせて更新
- `runes-state-management`: state wrapper パターンを実装に合わせて更新
- `search`: 検索結果表示項目、initial query サポートを実装に合わせて更新
- `shadcn-integration`: toast の import 方式、Button 使用方針を実装に合わせて更新
- `shared-ui-parts`: コンポーネント配置パス、LoadingState 文言を実装に合わせて更新
- `spec-browsing`: 日付表示形式、空リスト文言を実装に合わせて更新
- `tabbed-viewer`: spec tab icon 色、Cmd+Click 対応、URL 正規化を実装に合わせて更新
- `theme-management`: legacy color alias、hardcoded color の方針を実装に合わせて更新
- `ui-localization`: 未翻訳メッセージの扱いを実装に合わせて更新

## Impact

- `openspec/specs/` 配下の main spec ファイルが多数更新される
- 実装コードへの影響なし（spec を実装に合わせるため）
- 今後の Change 作成時に、更新された spec を前提とした delta が生成される
