## Why

ChangeViewerとSpecViewerでMarkdown文書を読んでいる際、テキストを選択して引用としてコピーしたいユースケースがある。しかし現在、右クリック時のコンテキストメニューはなく、ブラウザ標準のコピーしか使えないため、Change名/Spec名やファイル名などのコンテキスト情報を手動で付与する必要がある。これは `remove-suggestion-feature` で削除されたSuggestion機能の「テキスト蓄積→コンテキスト付き出力」という目的を、はるかにシンプルな形で代替する。

## What Changes

- ChangeViewerとSpecViewerのMarkdownコンテンツ領域にコンテキストメニューを追加する
- コンテキストメニューの項目：
  - **コピー** — 選択テキストのみをクリップボードにコピー
  - **引用付きコピー** — 選択テキストにChange名/Spec名・タブ名をMarkdown形式で付与してコピー
- テキストが選択されていない状態ではメニュー項目を無効化（disabled）する
- クリップボードへの書き込み後にトースト通知で確認を表示する

## Capabilities

### New Capabilities

- `context-copy`: ChangeViewer・SpecViewer内のMarkdownコンテンツに対するコンテキストメニュー経由のコピー機能（プレーンコピーと引用付きコピー）

### Modified Capabilities

- `tabbed-viewer`: ChangeViewerとSpecViewerがコンテキストメニューコンポーネントを使用するよう変更。MarkdownRendererまたはその親ラッパーでの右クリックハンドリングを追加

## Impact

- **修正ファイル**: `ChangeViewer.svelte`（コンテキストメニュー統合）, `SpecViewer.svelte`（同上）
- **依存コンポーネント**: 既存の `$lib/components/ui/context-menu/` コンポーネントを再利用
- **新規パターン**: `window.getSelection()` による選択テキスト取得 + `navigator.clipboard.writeText()` によるコピー（既にプロジェクト内で使用されているパターン）
