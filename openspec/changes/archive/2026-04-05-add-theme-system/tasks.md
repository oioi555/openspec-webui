## 1. CSS 変数と @theme の定義

- [x] 1.1 `app.css` の `@theme` ブロックにセマンティックカラートークンを定義（`--color-bg`, `--color-surface`, `--color-on-bg`, `--color-on-surface`, `--color-border`, `--color-brand` 等）
- [x] 1.2 `:root` にライトテーマの色値を定義
- [x] 1.3 `[data-theme="dark"]` にダークテーマの色値を定義
- [x] 1.4 `@media (prefers-color-scheme: dark)` フォールバックを定義（System モード用）

## 2. themeStore の実装

- [x] 2.1 `stores/theme.ts` を作成（Svelte writable store、theme: 'light' | 'dark' | 'system'）
- [x] 2.2 localStorage の `openspec-theme` キーへの読み書きロジックを実装
- [x] 2.3 `<html>` 要素の `data-theme` 属性を更新するロジックを実装
- [x] 2.4 `prefers-color-scheme` の change イベントリスナーを実装（System モード時）
- [x] 2.5 `App.svelte` の `onMount` で themeStore を初期化

- [x] 2.3 `<html>` element data-theme attribute update logic
- [x] 2.4 prefers-color-scheme change event listener (System mode)

## 3. app.css color replacement

- [x] 3.1 Replace all hardcoded colors in .markdown-body with semantic colors
- [x] 3.2 Replace .diff-added, .diff-modified, .diff-removed colors with semantic colors
- [x] 3.3 Replace .suggestion-mode colors with semantic colors

## 4. Component color replacement

- [x] 4.1 App.svelte hardcoded colors replaced
- [x] 4.2 Navigation.svelte hardcoded colors replaced
- [x] 4.3 Modal.svelte hardcoded colors replaced
- [x] 4.4 Dashboard.svelte hardcoded colors replaced
- [x] 4.5 CommandSettingsModal.svelte hardcoded colors replaced
- [x] 4.6 SpecsList.svelte, SpecViewer.svelte hardcoded colors replaced
- [x] 4.7 ChangesList.svelte, ChangeViewer.svelte hardcoded colors replaced
- [x] 4.8 ActiveChangesList.svelte hardcoded colors replaced
- [x] 4.9 SuggestionPanel.svelte, SuggestionPopover.svelte hardcoded colors replaced
- [x] 4.10 TaskList.svelte, TaskProgress.svelte hardcoded colors replaced
- [x] 4.11 CommandShortcutBar.svelte hardcoded colors replaced
- [x] 4.12 Toast.svelte, MarkdownRenderer.svelte, HtmlRenderer.svelte hardcoded colors replaced

## 5. Theme selection UI in settings

- [x] 5.1 Added Appearance section to CommandSettingsModal (Light / Dark / System radio buttons)
- [x] 5.2 Two-way binding between themeStore and radio buttons

## 6. 検証

- [x] 6.1 フロントエンドビルドが成功することを確認
- [x] 6.2 ライトテーマで全ページが正しく表示されることを目視確認
- [x] 6.3 ダークテーマで全ページが移行前と同じ見た目であることを確認
- [x] 6.4 System モードで OS 設定変更に追従することを確認
- [x] 6.5 localStorage にテーマ設定が永続化されることを確認
- [x] 6.6 型チェックが通ることを確認

## 7. 検証結果への対応

- [x] 7.1 `theme-management/spec.md` の System モードシナリオを実装に合わせて明確化
- [x] 7.2 `design.md` に初回テーマ適用と status / feedback token の設計判断を追記
- [x] 7.3 `frontend/index.html` で保存済みテーマを同期適用し、初回表示のテーマずれを防止
- [x] 7.4 `app.css` に status / feedback / overlay / code 用の追加セマンティックトークンを定義
- [x] 7.5 残存する固定色クラスをフロントエンド全体からセマンティックトークンへ置換
- [x] 7.6 `themeStore` の自動テストを追加（初期値・永続化・`data-theme`・listener cleanup）
- [x] 7.7 `npm test`、`npm run typecheck`、`npm run build` が通ることを確認
